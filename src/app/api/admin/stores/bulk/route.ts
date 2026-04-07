import { z } from 'zod';
import { transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const bulkStoreSchema = z.array(z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(100),
    groupSortOrder: z.number().int().nullish(),
    isActive: z.boolean().default(true),
}));

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    try {
        const body = await request.json();
        const parsed = bulkStoreSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: 'データ形式が正しくありません' }, { status: 400 });

        const stores = parsed.data;
        
        const result = await transaction(async (client) => {
            // 1. Get all groups to match by sort_order
            const groupRes = await client.query('SELECT id, sort_order FROM store_groups');
            const groupMap = new Map(groupRes.rows.map(g => [g.sort_order, g.id]));

            const createdIds: number[] = [];
            for (const s of stores) {
                let groupId = null;
                if (s.groupSortOrder !== null && s.groupSortOrder !== undefined) {
                    groupId = groupMap.get(s.groupSortOrder) || null;
                }

                const res = await client.query(
                    `INSERT INTO stores (name, code, group_id, is_active) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (code) DO UPDATE SET 
                        name = EXCLUDED.name,
                        group_id = EXCLUDED.group_id,
                        is_active = EXCLUDED.is_active,
                        updated_at = NOW()
                     RETURNING id`,
                    [s.name, s.code, groupId, s.isActive]
                );
                createdIds.push(res.rows[0].id);
            }
            return createdIds;
        });

        await logAudit(user, 'STORE_BULK_UPLOAD', 'stores', undefined, { count: stores.length });

        return Response.json({ message: `${stores.length}件の店舗をインポートしました`, count: stores.length });
    } catch (err: any) {
        console.error('[stores bulk POST]', err);
        return Response.json({ error: 'インポート中にエラーが発生しました。店舗コードの重複などを確認してください。' }, { status: 500 });
    }
}
