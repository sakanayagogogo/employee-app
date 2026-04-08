import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query, queryOne, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { sendInquiryPush } from '@/lib/push';

const createSchema = z.object({
    title: z.string().min(1).max(200),
    destination: z.enum(['STORE', 'HEADQUARTERS']),
    category: z.enum(['労務', '業務', '教育', '人間関係', '設備', 'その他']),
    message: z.string().min(1),
    recipientId: z.number().int().positive().optional(),
});

const listSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(),
    limit: z.coerce.number().default(50),
    offset: z.coerce.number().default(0),
});

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const params = listSchema.parse({
        status: sp.get('status') ?? undefined,
        limit: sp.get('limit') ?? 50,
        offset: sp.get('offset') ?? 0,
    });

    const vals: any[] = [parseInt(user.sub)];
    let whereClause = 'WHERE 1=1';

    if (params.status) {
        vals.push(params.status);
        whereClause += ` AND i.status = $${vals.length}`;
    }

    // GENERAL sees own inquiries + inquiries directed to them
    // STORE_ADMIN sees own store's + area inquiries + received inquiries
    // HQ_ADMIN sees all
    if (user.role === 'GENERAL') {
        whereClause += ` AND (i.author_id = $1 OR i.recipient_id = $1)`;
    } else if (user.role === 'STORE_ADMIN') {
        const { getAreaGroupId } = await import('@/lib/rbac');
        const areaGroupId = getAreaGroupId(user.unionRole);
        
        if (areaGroupId) {
            vals.push(user.storeId ?? -1);
            vals.push(areaGroupId);
            whereClause += ` AND (i.store_id = $${vals.length - 1} OR EXISTS (SELECT 1 FROM stores s2 WHERE s2.id = i.store_id AND s2.group_id = $${vals.length}) OR i.author_id = $1 OR i.recipient_id = $1)`;
        } else {
            vals.push(user.storeId);
            whereClause += ` AND (i.store_id = $${vals.length} OR i.author_id = $1 OR i.recipient_id = $1)`;
        }
    }

    vals.push(params.limit);
    vals.push(params.offset);
    const limitIdx = vals.length - 1;

    const rows = await query<{
        id: number; title: string; category: string; destination: string;
        status: string; author_id: number; author_name: string;
        store_id: number | null; store_name: string | null; 
        store_group_name: string | null; assignee_name: string | null;
        recipient_id: number | null; recipient_name: string | null;
        recipient_employee_number: string | null;
        created_at: string; updated_at: string;
        is_read: boolean;
    }>(
        `SELECT i.id, i.title, i.category, i.destination, i.status, i.author_id,
            u.name AS author_name, i.store_id, s.name AS store_name,
            sg.name AS store_group_name,
            a.name AS assignee_name,
            i.recipient_id, ru.name AS recipient_name, ru.employee_number AS recipient_employee_number,
            i.created_at, i.updated_at,
            /* An inquiry is considered read if no new messages exist from OTHERS since last read */
            NOT EXISTS (
                SELECT 1 FROM inquiry_messages m 
                LEFT JOIN inquiry_reads r ON r.inquiry_id = i.id AND r.user_id = $1
                WHERE m.inquiry_id = i.id 
                AND m.author_id != $1
                AND (r.last_read_at IS NULL OR m.created_at > r.last_read_at)
            ) AS is_read
        FROM inquiries i
        JOIN users u ON u.id = i.author_id
        LEFT JOIN stores s ON s.id = i.store_id
        LEFT JOIN store_groups sg ON sg.id = s.group_id
        LEFT JOIN users a ON a.id = i.assignee_id
        LEFT JOIN users ru ON ru.id = i.recipient_id
        ${whereClause}
        ORDER BY i.updated_at DESC LIMIT $${limitIdx} OFFSET $${limitIdx + 1}`,
        vals
    );

    return Response.json({
        data: rows.map(r => ({
            id: r.id, title: r.title, category: r.category,
            destination: r.destination, status: r.status,
            authorId: r.author_id, authorName: r.author_name,
            storeName: r.store_name, storeGroupName: r.store_group_name,
            assigneeName: r.assignee_name,
            recipientId: r.recipient_id, recipientName: r.recipient_name,
            recipientEmployeeNumber: r.recipient_employee_number,
            createdAt: r.created_at, updatedAt: r.updated_at,
            isRead: r.is_read
        }))
    });
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: '不正なリクエストです' }, { status: 400 });
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { title, destination, category, message, recipientId } = parsed.data;

    // Only admins can specify a recipient
    if (recipientId && !isAdmin(user.role)) {
        return Response.json({ error: '宛先の指定は管理者のみ可能です' }, { status: 403 });
    }

    // Validate recipient exists if specified
    if (recipientId) {
        const recipient = await queryOne<{ id: number }>('SELECT id FROM users WHERE id = $1 AND is_active = TRUE', [recipientId]);
        if (!recipient) {
            return Response.json({ error: '指定されたユーザーが見つかりません' }, { status: 400 });
        }
    }

    const inqId = await transaction(async (client) => {
        const inqResult = await client.query(
            `INSERT INTO inquiries (title, destination, category, author_id, store_id, status, recipient_id)
             VALUES ($1, $2, $3, $4, $5, 'OPEN', $6) RETURNING id`,
            [title, destination, category, parseInt(user.sub), user.storeId, recipientId ?? null]
        );
        const id = inqResult.rows[0].id;

        await client.query(
            `INSERT INTO inquiry_messages (inquiry_id, author_id, body) VALUES ($1, $2, $3)`,
            [id, parseInt(user.sub), message]
        );
        return id;
    });

    // Send push notification
    try {
        let recipientIds: number[] = [];

        // If a specific recipient is set, notify only that user
        if (recipientId) {
            recipientIds = [recipientId];
        } else if (destination === 'HEADQUARTERS') {
            // Notify HQ admins
            const admins = await query<{ id: number }>(`SELECT id FROM users WHERE role = 'HQ_ADMIN' AND is_active = TRUE AND id != $1`, [parseInt(user.sub)]);
            recipientIds = admins.map(a => a.id);
        } else if (destination === 'STORE' && user.storeId) {
            // Notify store admins of the same store + HQ admins
            const admins = await query<{ id: number }>(
                `SELECT id FROM users WHERE is_active = TRUE AND id != $1 AND (role = 'HQ_ADMIN' OR (role = 'STORE_ADMIN' AND store_id = $2))`,
                [parseInt(user.sub), user.storeId]
            );
            recipientIds = admins.map(a => a.id);
        }
        if (recipientIds.length > 0) {
            sendInquiryPush(recipientIds, inqId, title, false).catch(err => {
                console.error('[Push] Failed to send inquiry push:', err);
            });
        }
    } catch (e) {
        console.error('[Push] Error preparing inquiry push:', e);
    }

    return Response.json({ data: { id: inqId } }, { status: 201 });
}
