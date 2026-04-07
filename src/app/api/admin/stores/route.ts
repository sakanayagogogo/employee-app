import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin, getAreaGroupId } from '@/lib/rbac';

const storeSchema = z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20),
    groupId: z.number().int().nullable().optional(),
    address: z.string().nullish(),
    isActive: z.boolean().default(true),
});

export async function GET() {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const areaGroupId = getAreaGroupId(user.unionRole);
    let stores;

    if (user.role === 'HQ_ADMIN') {
        stores = await query<Record<string, unknown>>(
            `SELECT s.id, s.name, s.code, s.address, s.is_active, s.group_id as "groupId", sg.name as "groupName",
                    s.created_at, s.updated_at
             FROM stores s
             LEFT JOIN store_groups sg ON sg.id = s.group_id
             ORDER BY sg.sort_order ASC, s.code ASC`
        );
    } else if (areaGroupId) {
        stores = await query<Record<string, unknown>>(
            `SELECT s.id, s.name, s.code, s.address, s.is_active, s.group_id as "groupId", sg.name as "groupName",
                    s.created_at, s.updated_at
             FROM stores s
             JOIN store_groups sg ON sg.id = s.group_id
             WHERE s.group_id = $1
             ORDER BY sg.sort_order ASC, s.code ASC`,
            [areaGroupId]
        );
    } else {
        // 普通のSTORE_ADMIN（自店舗のみ）
        stores = await query<Record<string, unknown>>(
            `SELECT s.id, s.name, s.code, s.address, s.is_active, s.group_id as "groupId", sg.name as "groupName",
                    s.created_at, s.updated_at
             FROM stores s
             LEFT JOIN store_groups sg ON sg.id = s.group_id
             WHERE s.id = $1
             ORDER BY sg.sort_order ASC, s.code ASC`,
            [user.storeId]
        );
    }

    return Response.json({
        data: stores.map((s) => ({
            id: s.id, name: s.name, code: s.code, address: s.address,
            groupId: s.groupId, groupName: s.groupName,
            isActive: s.is_active, createdAt: s.created_at, updatedAt: s.updated_at,
        })),
    });
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    const body = await request.json();
    const parsed = storeSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const store = await queryOne<{ id: number }>(
        `INSERT INTO stores (name, code, group_id, address, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [parsed.data.name, parsed.data.code, parsed.data.groupId ?? null, parsed.data.address ?? null, parsed.data.isActive]
    );

    // Removed legacy portal/layout creation as they were dropped in migration 006.

    return Response.json({ data: { id: store?.id } }, { status: 201 });
}
