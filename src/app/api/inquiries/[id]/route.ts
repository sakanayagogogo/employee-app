import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;
    const inquiryId = parseInt(id);

    const inquiry = await queryOne<Record<string, unknown>>(
        `SELECT i.id, i.title, i.destination, i.category, i.status,
            i.author_id, u.name as author_name,
            i.store_id, s.name as store_name, s.group_id as store_group_id,
            sg.name as store_group_name,
            i.assignee_id, au.name as assignee_name,
            i.recipient_id, ru.name as recipient_name, ru.employee_number as recipient_employee_number,
            i.created_at, i.updated_at
     FROM inquiries i
     JOIN users u ON u.id = i.author_id
     LEFT JOIN stores s ON s.id = i.store_id
     LEFT JOIN store_groups sg ON sg.id = s.group_id
     LEFT JOIN users au ON au.id = i.assignee_id
     LEFT JOIN users ru ON ru.id = i.recipient_id
     WHERE i.id = $1`,
        [inquiryId]
    );

    if (!inquiry) return Response.json({ error: '相談が見つかりません' }, { status: 404 });

    // Check visibility: author, recipient, admins
    const userId = parseInt(user.sub);
    const isAuthorOrRecipient = inquiry.author_id === userId || inquiry.recipient_id === userId;
    if (user.role === 'GENERAL' && !isAuthorOrRecipient) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }
    if (user.role === 'STORE_ADMIN') {
        const { canAccessStore } = await import('@/lib/rbac');
        if (!canAccessStore(user.role, user.storeId, inquiry.store_id as number, user.unionRole, inquiry.store_group_id as number) && !isAuthorOrRecipient) {
            return Response.json({ error: '権限がありません' }, { status: 403 });
        }
    }

    const messages = await query<Record<string, unknown>>(
        `SELECT m.id, m.inquiry_id, m.author_id, u.name as author_name, u.role as author_role,
            m.body, m.created_at
     FROM inquiry_messages m
     JOIN users u ON u.id = m.author_id
     WHERE m.inquiry_id = $1
     ORDER BY m.created_at ASC`,
        [inquiryId]
    );

    return Response.json({
        data: {
            id: inquiry.id, title: inquiry.title, destination: inquiry.destination,
            category: inquiry.category, status: inquiry.status,
            authorId: inquiry.author_id, authorName: inquiry.author_name,
            storeId: inquiry.store_id, storeName: inquiry.store_name,
            storeGroupName: inquiry.store_group_name,
            assigneeId: inquiry.assignee_id, assigneeName: inquiry.assignee_name,
            recipientId: inquiry.recipient_id, recipientName: inquiry.recipient_name,
            recipientEmployeeNumber: inquiry.recipient_employee_number,
            createdAt: inquiry.created_at, updatedAt: inquiry.updated_at,
            messages: messages.map((m) => ({
                id: m.id, inquiryId: m.inquiry_id, authorId: m.author_id,
                authorName: m.author_name, authorRole: m.author_role,
                body: m.body, createdAt: m.created_at,
            })),
        },
    });
}

export async function DELETE(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;
    const inquiryId = parseInt(id);

    // Get the inquiry to check the author
    const inquiry = await queryOne<{ author_id: number }>(
        'SELECT author_id FROM inquiries WHERE id = $1',
        [inquiryId]
    );

    if (!inquiry) return Response.json({ error: '相談が見つかりません' }, { status: 404 });

    // Allow if admin or if user is the author
    const isUserAdmin = isAdmin(user.role);
    const isAuthor = inquiry.author_id === parseInt(user.sub);

    if (!isUserAdmin && !isAuthor) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    try {
        await query('DELETE FROM inquiries WHERE id = $1', [inquiryId]);
        return Response.json({ success: true });
    } catch (e) {
        console.error(e);
        return Response.json({ error: '削除に失敗しました' }, { status: 500 });
    }
}
