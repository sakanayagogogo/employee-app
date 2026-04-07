import type { UserRole } from '@/types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
    GENERAL: 0,
    STORE_ADMIN: 1,
    HQ_ADMIN: 2,
};

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export function isAdmin(role: UserRole): boolean {
    return role === 'STORE_ADMIN' || role === 'HQ_ADMIN';
}

export function isHQAdmin(role: UserRole): boolean {
    return role === 'HQ_ADMIN';
}

/**
 * 役員区分（union_role）コードから、担当エリアの店舗グループID（group_id）を判定します。
 * '19' -> 1 (第一エリア)
 * '29' -> 2 (第二エリア)
 * '39' -> 3 (第三エリア)
 * '49' -> 4 (第四エリア)
 * '59' -> 5 (第五エリア)
 * '69' -> 6 (本社エリア)
 */
export function getAreaGroupId(unionRole?: string | null): number | null {
    if (!unionRole) return null;
    const AREA_CODES: Record<string, number> = {
        '19': 1,
        '29': 2,
        '39': 3,
        '49': 4,
        '59': 5,
        '69': 6,
    };
    return AREA_CODES[unionRole] || null;
}

export function canAccessStore(
    userRole: UserRole,
    userStoreId: number | null,
    targetStoreId: number,
    userUnionRole?: string | null,
    targetStoreGroupId?: number | null
): boolean {
    if (userRole === 'HQ_ADMIN') return true;
    
    // 自身が所属する店舗はアクセス可能
    if (userStoreId === targetStoreId) return true;

    // 執行委員（エリア担当）の場合、自身が担当するエリアグループならアクセス可能
    const areaGroupId = getAreaGroupId(userUnionRole);
    if (areaGroupId && targetStoreGroupId === areaGroupId) return true;

    return false;
}
