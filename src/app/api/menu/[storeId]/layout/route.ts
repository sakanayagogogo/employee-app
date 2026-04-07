import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessStore } from '@/lib/rbac';

type Params = { params: Promise<{ storeId: string }> };

const layoutSchema = z.object({
    layoutJson: z.array(z.unknown()),
});

export async function POST(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { storeId } = await params;
    const storeIdInt = parseInt(storeId);

    const isAdminRole = user.role === 'STORE_ADMIN' || user.role === 'HQ_ADMIN';
    if (!isAdminRole || !canAccessStore(user.role, user.storeId, storeIdInt)) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = layoutSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    await query(
        `INSERT INTO portal_layouts (store_id, layout_json, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (store_id) DO UPDATE SET layout_json = EXCLUDED.layout_json, updated_at = NOW()`,
        [storeIdInt, JSON.stringify(parsed.data.layoutJson)]
    );

    return Response.json({ message: '保存しました' });
}
