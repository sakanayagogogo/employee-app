import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin, getAreaGroupId } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

const groupSchema = z.object({
    name: z.string().min(1).max(100),
    sortOrder: z.number().int().default(0),
});

async function ensureSchema() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS store_groups (
                id            SERIAL PRIMARY KEY,
                name          VARCHAR(100) NOT NULL,
                sort_order    INTEGER      NOT NULL DEFAULT 0,
                created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
        `);
    } catch (e) { console.error('ensureSchema table error', e); }
    
    try {
        const cols = await query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'stores' AND column_name = 'group_id'
        `);
        if (cols.length === 0) {
            await query(`
                ALTER TABLE stores ADD COLUMN group_id INTEGER REFERENCES store_groups(id) ON DELETE SET NULL;
                CREATE INDEX idx_stores_group_id ON stores(group_id);
            `);
        }
    } catch (e) { console.error('ensureSchema columns error', e); }

    try {
        // Enums need care. IF NOT EXISTS is only in newer PG for ADD VALUE.
        // Also cannot be in many transaction blocks.
        await query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'target_type' AND e.enumlabel = 'STORE_GROUP') THEN
                    ALTER TYPE target_type ADD VALUE 'STORE_GROUP';
                END IF;
            END $$;
        `);
    } catch (e) { console.error('ensureSchema enum error', e); }
}

export async function GET() {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    try {
        await ensureSchema();
        const areaGroupId = getAreaGroupId(user.unionRole);
        let groups;
        
        if (user.role === 'HQ_ADMIN') {
            groups = await query(
                `SELECT id, name, sort_order as "sortOrder" FROM store_groups ORDER BY sort_order ASC, name ASC`
            );
        } else if (areaGroupId) {
            groups = await query(
                `SELECT id, name, sort_order as "sortOrder" FROM store_groups WHERE id = $1 ORDER BY sort_order ASC, name ASC`,
                [areaGroupId]
            );
        } else {
            // 普通のSTORE_ADMIN（自店舗のグループのみ）
            groups = await query(
                `SELECT sg.id, sg.name, sg.sort_order as "sortOrder" 
                 FROM store_groups sg
                 JOIN stores s ON s.group_id = sg.id
                 WHERE s.id = $1
                 ORDER BY sg.sort_order ASC, sg.name ASC`,
                [user.storeId]
            );
        }
        
        return Response.json({ data: groups });
    } catch (err: any) {
        console.error('[store-groups GET]', err);
        return Response.json({ error: `サーバーエラー: ${err.message}` }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    try {
        await ensureSchema();
        const body = await request.json();
        const parsed = groupSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

        const result = await queryOne<{ id: number }>(
            `INSERT INTO store_groups (name, sort_order) VALUES ($1, $2) RETURNING id`,
            [parsed.data.name, parsed.data.sortOrder]
        );

        await logAudit(user, 'STORE_GROUP_CREATE', 'store_groups', result?.id, { name: parsed.data.name });

        return Response.json({ data: result }, { status: 201 });
    } catch (err: any) {
        console.error('[store-groups POST]', err);
        return Response.json({ error: `サーバーエラー: ${err.message}` }, { status: 500 });
    }
}
