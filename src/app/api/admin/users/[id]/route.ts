import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin, canAccessStore } from '@/lib/rbac';
import { hashPassword } from '@/lib/password';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

const patchUserSchema = z.object({
    name: z.string().min(1, '氏名を入力してください').max(100, '氏名は100文字以内で入力してください').optional(),
    email: z.string().email('正しいメールアドレスを入力してください').nullable().optional().or(z.literal('')).transform(v => (!v ? null : v)),
    role: z.enum(['GENERAL', 'STORE_ADMIN', 'HQ_ADMIN']).optional(),
    storeId: z.number().int().nullable().optional(),
    employmentType: z.string().optional(),
    unionRole: z.string().optional(),
    unionRoleBranch: z.string().nullable().optional().or(z.literal('')).transform(v => (!v || v === '0' || v === '00' ? null : v)),
    jobTitle: z.string().max(50, '職務は50文字以内で入力してください').nullable().optional().or(z.literal('')).transform(v => (!v ? null : v)),
    birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '生年月日の形式（YYYY-MM-DD）が正しくありません').nullable().optional().or(z.literal('')).transform(v => (!v ? null : v)),
    isActive: z.boolean().optional(),
    password: z.string().min(4, 'パスワードは4文字以上で入力してください').nullable().optional().or(z.literal('')).transform(v => (!v ? null : v)),
    mustChangePw: z.boolean().optional(),
});

export async function GET(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    const targetId = parseInt(id);

    const row = await queryOne<Record<string, unknown>>(
        `SELECT u.id, u.employee_number, u.name, u.email, u.role, u.store_id, s.group_id as store_group_id,
                u.employment_type, u.union_role, u.union_role_branch, u.job_title, u.birthday, u.is_active, u.must_change_pw,
                u.last_login_at, u.created_at, u.updated_at,
                (COALESCE(mj.is_non_union, FALSE) OR COALESCE(me.is_non_union, FALSE) OR COALESCE(mu.is_non_union, FALSE) OR COALESCE(mb.is_non_union, FALSE)) as is_non_union
         FROM users u
         LEFT JOIN stores s ON s.id = u.store_id
         LEFT JOIN master_data mj ON mj.category = 'job_title' AND mj.code = u.job_title
         LEFT JOIN master_data me ON me.category = 'employment_type' AND me.code = u.employment_type
         LEFT JOIN master_data mu ON mu.category = 'union_role' AND mu.code = u.union_role
         LEFT JOIN master_data mb ON mb.category = 'branch_officer' AND mb.code = u.union_role_branch
         WHERE u.id = $1`,
        [targetId]
    );

    if (!row) return Response.json({ error: 'ユーザーが見つかりません' }, { status: 404 });

    // Check if the admin can access this store's users
    if (
        user.role !== 'HQ_ADMIN' && 
        row.store_id !== null &&
        !canAccessStore(user.role, user.storeId, Number(row.store_id), user.unionRole, row.store_group_id ? Number(row.store_group_id) : null)
    ) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }
    if (user.role !== 'HQ_ADMIN' && row.store_id === null) {
        // Only HQ_ADMIN can view HQ users (store_id IS NULL)
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    return Response.json({ 
        data: {
            id: row.id,
            employeeNumber: row.employee_number,
            name: row.name,
            email: row.email,
            role: row.role,
            storeId: row.store_id,
            employmentType: row.employment_type,
            unionRole: row.union_role,
            unionRoleBranch: row.union_role_branch,
            jobTitle: row.job_title,
            isNonUnion: row.is_non_union,
            birthday: row.birthday instanceof Date ? (() => { const d = row.birthday; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : null,
            isActive: row.is_active,
            mustChangePw: row.must_change_pw,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }
    });
}

export async function PATCH(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    const targetId = parseInt(id);

    const target = await queryOne<{ id: number; store_id: number | null; role: string; group_id: number | null }>(
        `SELECT u.id, u.store_id, u.role, s.group_id FROM users u LEFT JOIN stores s ON s.id = u.store_id WHERE u.id = $1`,
        [targetId]
    );
    if (!target) return Response.json({ error: 'ユーザーが見つかりません' }, { status: 404 });

    // Check if the admin can access this store's users
    if (
        user.role !== 'HQ_ADMIN' && 
        target.store_id !== null &&
        !canAccessStore(user.role, user.storeId, target.store_id, user.unionRole, target.group_id)
    ) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }
    if (user.role !== 'HQ_ADMIN' && target.store_id === null) {
        // Only HQ_ADMIN can edit HQ users (store_id IS NULL)
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = patchUserSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const updates: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;
    const d = parsed.data;

    if (d.name !== undefined) { updates.push(`name = $${idx++}`); vals.push(d.name); }
    if (d.email !== undefined) { updates.push(`email = $${idx++}`); vals.push(d.email ?? null); }
    if (d.role !== undefined) {
        if (user.role !== 'HQ_ADMIN' && d.role === 'HQ_ADMIN') {
            return Response.json({ error: '権限がありません' }, { status: 403 });
        }
        updates.push(`role = $${idx++}`); vals.push(d.role);
    }
    if (d.storeId !== undefined) { updates.push(`store_id = $${idx++}`); vals.push(d.storeId); }
    if (d.employmentType !== undefined) { updates.push(`employment_type = $${idx++}`); vals.push(d.employmentType); }
    if (d.unionRole !== undefined) { updates.push(`union_role = $${idx++}`); vals.push(d.unionRole); }
    if (d.unionRoleBranch !== undefined) { updates.push(`union_role_branch = $${idx++}`); vals.push(d.unionRoleBranch); }
    if (d.jobTitle !== undefined) { updates.push(`job_title = $${idx++}`); vals.push(d.jobTitle ?? null); }
    if (d.birthday !== undefined) { updates.push(`birthday = $${idx++}`); vals.push(d.birthday ?? null); }
    if (d.isActive !== undefined) { updates.push(`is_active = $${idx++}`); vals.push(d.isActive); }
    if (d.mustChangePw !== undefined) { updates.push(`must_change_pw = $${idx++}`); vals.push(d.mustChangePw); }
    if (d.password) {
        const hash = await hashPassword(d.password);
        updates.push(`password_hash = $${idx++}`); vals.push(hash);
    }

    if (updates.length === 0) return Response.json({ error: '更新するフィールドがありません' }, { status: 400 });

    updates.push(`updated_at = NOW()`);
    vals.push(targetId);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, vals);

    await logAudit(user, 'USER_UPDATE', 'users', targetId, { fields: Object.keys(d) });
    return Response.json({ message: '更新しました' });
}

export async function DELETE(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    const targetId = parseInt(id);

    // Cannot delete yourself
    if (targetId === parseInt(user.sub)) {
        return Response.json({ error: '自分自身を削除することはできません' }, { status: 400 });
    }

    try {
        const target = await queryOne('SELECT id FROM users WHERE id = $1', [targetId]);
        if (!target) return Response.json({ error: 'ユーザーが見つかりません' }, { status: 404 });

        await query('DELETE FROM users WHERE id = $1', [targetId]);
        await logAudit(user, 'USER_DELETE', 'users', targetId);

        return Response.json({ message: '削除しました' });
    } catch (e: any) {
        console.error('[admin/users/delete] Error:', e);
        if (e.code === '23503') {
            return Response.json({ error: 'このユーザーに関連するデータがあるため削除できません。代わりに「停止中」に設定してください。' }, { status: 400 });
        }
        return Response.json({ error: '削除中にエラーが発生しました' }, { status: 500 });
    }
}
