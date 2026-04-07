import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const renameCategorySchema = z.object({
    oldName: z.string().min(1),
    newName: z.string().optional(),
    showInHeader: z.boolean().optional(),
});

export async function GET() {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'HQ_ADMIN' && user.role !== 'STORE_ADMIN')) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    try {
        const categories = await query(`
            SELECT name, show_in_header as "showInHeader", sort_order as "sortOrder"
            FROM portal_categories
            ORDER BY sort_order ASC, name ASC
        `);
        return Response.json({ data: categories });
    } catch (err) {
        return Response.json({ error: 'サーバーエラー' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const parsed = renameCategorySchema.safeParse(body);
        if (!parsed.success) {
            return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { oldName, newName, showInHeader } = parsed.data;

        if (newName !== undefined) {
            // Rename logic
            if (oldName === '未分類') {
                await query(
                    `UPDATE portal_widgets SET category_name = $1 WHERE category_name IS NULL`,
                    [newName]
                );
            } else {
                await query(
                    `UPDATE portal_widgets SET category_name = $1 WHERE category_name = $2`,
                    [newName, oldName]
                );
                // Also update settings table if it exists
                await query(
                    `UPDATE portal_categories SET name = $1 WHERE name = $2`,
                    [newName, oldName]
                );
            }
            await logAudit(user, 'CATEGORY_RENAME', 'portal_widgets', 0, { oldName, newName });
        }

        if (showInHeader !== undefined) {
            // Update settings logic
            if (oldName !== '未分類') {
                // Ensure it exists in portal_categories
                await query(
                    `INSERT INTO portal_categories (name, show_in_header)
                     VALUES ($1, $2)
                     ON CONFLICT (name) DO UPDATE SET show_in_header = EXCLUDED.show_in_header`,
                    [oldName, showInHeader]
                );
            }
            await logAudit(user, 'CATEGORY_TOGGLE_HEADER', 'portal_categories', 0, { name: oldName, showInHeader });
        }

        return Response.json({ message: '更新しました' });
    } catch (err: any) {
        console.error('Category patch error:', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');
        if (!name || name === '未分類') {
            return Response.json({ error: '不正な名前です' }, { status: 400 });
        }

        // Reassign widgets to NULL
        await query(
            `UPDATE portal_widgets SET category_name = NULL WHERE category_name = $1`,
            [name]
        );

        // Delete from categories settings table
        await query(
            `DELETE FROM portal_categories WHERE name = $1`,
            [name]
        );

        await logAudit(user, 'CATEGORY_DELETE', 'portal_categories', 0, { name });

        return Response.json({ message: '削除しました' });
    } catch (err: any) {
        console.error('Category delete error:', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
