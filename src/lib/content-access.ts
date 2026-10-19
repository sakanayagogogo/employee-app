import { queryOne } from '@/lib/db';
import { canAccessStore } from '@/lib/rbac';
import type { JWTPayload } from '@/types';

export async function canViewAnnouncement(user: JWTPayload, announcementId: number): Promise<boolean> {
    const announcement = await queryOne<{ author_id: number; is_published: boolean; start_at: string | null; end_at: string | null }>(
        `SELECT author_id, is_published, start_at, end_at FROM announcements WHERE id = $1`,
        [announcementId]
    );
    if (!announcement) return false;
    if (user.role === 'HQ_ADMIN') return true;

    const userId = Number.parseInt(user.sub, 10);
    if (user.role === 'STORE_ADMIN' && announcement.author_id === userId) return true;
    if (!announcement.is_published) return false;

    const now = Date.now();
    if (announcement.start_at && new Date(announcement.start_at).getTime() > now) return false;
    if (announcement.end_at && new Date(announcement.end_at).getTime() < now) return false;

    const match = await queryOne<{ allowed: boolean }>(
        `SELECT EXISTS (
            SELECT 1 FROM announcement_targets
            WHERE announcement_id = $1 AND (
                target_type = 'ALL'
                OR (target_type = 'USER' AND target_value = $2)
                OR (target_type = 'STORE' AND target_value = $3)
                OR (target_type = 'STORE_GROUP' AND target_value = $4)
                OR (target_type = 'EMPLOYMENT_TYPE' AND target_value = $5)
                OR (target_type = 'UNION_ROLE' AND target_value = $6)
            )
        ) AS allowed`,
        [
            announcementId,
            String(user.sub),
            String(user.storeId ?? ''),
            String(user.groupId ?? ''),
            String(user.employmentType ?? ''),
            String(user.unionRole ?? ''),
        ]
    );
    return match?.allowed === true;
}

export async function canManageAnnouncement(user: JWTPayload, announcementId: number): Promise<boolean> {
    if (user.role === 'HQ_ADMIN') return true;
    if (user.role !== 'STORE_ADMIN') return false;
    const row = await queryOne<{ allowed: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM announcements WHERE id = $1 AND author_id = $2) AS allowed`,
        [announcementId, Number.parseInt(user.sub, 10)]
    );
    return row?.allowed === true;
}

export function storeAdminTargetsAreValid(
    user: JWTPayload,
    targets: Array<{ targetType: string; targetValue?: string | null }>
): boolean {
    return user.role !== 'STORE_ADMIN' || (
        user.storeId !== null &&
        targets.length === 1 &&
        targets[0].targetType === 'STORE' &&
        targets[0].targetValue === String(user.storeId)
    );
}

export async function getAccessibleWidget(
    user: JWTPayload,
    widgetId: number,
    options: { manage?: boolean; publishedOnly?: boolean } = {}
) {
    const widget = await queryOne<{
        id: number;
        store_id: number | null;
        is_published: boolean;
        type: string;
        title: string;
        category_name: string | null;
        config_json: Record<string, unknown>;
        expires_at: string | null;
        show_in_header: boolean;
    }>(
        `SELECT id, store_id, is_published, type, title, category_name,
                config_json, expires_at, show_in_header
         FROM portal_widgets WHERE id = $1`,
        [widgetId]
    );
    if (!widget) return null;
    if (options.publishedOnly && !widget.is_published) return null;
    if (user.role === 'HQ_ADMIN') return widget;
    if (options.manage && user.role !== 'STORE_ADMIN') return null;
    if (widget.store_id === null) return options.manage ? null : widget;
    return user.storeId === widget.store_id ? widget : null;
}

export async function canAccessInquiry(user: JWTPayload, inquiryId: number): Promise<boolean> {
    const inquiry = await queryOne<{
        author_id: number;
        recipient_id: number | null;
        store_id: number | null;
        store_group_id: number | null;
    }>(
        `SELECT i.author_id, i.recipient_id, i.store_id, s.group_id AS store_group_id
         FROM inquiries i LEFT JOIN stores s ON s.id = i.store_id
         WHERE i.id = $1`,
        [inquiryId]
    );
    if (!inquiry) return false;
    if (user.role === 'HQ_ADMIN') return true;

    const userId = Number.parseInt(user.sub, 10);
    if (inquiry.author_id === userId || inquiry.recipient_id === userId) return true;
    if (user.role !== 'STORE_ADMIN' || inquiry.store_id === null) return false;
    return canAccessStore(
        user.role,
        user.storeId,
        inquiry.store_id,
        user.unionRole,
        inquiry.store_group_id
    );
}
