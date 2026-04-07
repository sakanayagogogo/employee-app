'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface AuthUser {
    id: number;
    employeeNumber: string;
    name: string;
    email: string | null;
    role: 'GENERAL' | 'STORE_ADMIN' | 'HQ_ADMIN';
    storeId: number | null;
    storeName: string | null;
    groupName: string | null;
    employmentType: string;
    isActive: boolean;
    mustChangePw: boolean;
    avatarUrl?: string | null;
    backgroundUrl?: string | null;
    isNonUnion?: boolean;
}

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    unreadCount: number;
    unreadInquiryCount: number;
    login: (employeeNumber: string, password: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    refreshUnreadCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadInquiryCount, setUnreadInquiryCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        try {
            // Fetch unread announcements count
            const resA = await fetch('/api/announcements/unread-count');
            if (resA.ok) {
                const data = await resA.json();
                setUnreadCount(data.count || 0);
            }

            // Fetch unread inquiries count
            const resI = await fetch('/api/inquiries/unread-count');
            if (resI.ok) {
                const data = await resI.json();
                setUnreadInquiryCount(data.count || 0);
            }
        } catch {
            // Ignore errors for unread count
        }
    }, []);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.data);
                refreshUnreadCount();
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [refreshUnreadCount]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const login = async (employeeNumber: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeNumber, password }),
            });

            let data: { error?: string } = {};
            try {
                data = await res.json();
            } catch (err) {
                console.error('Failed to parse response JSON:', err);
                return { error: `サーバーエラーが発生しました (${res.status})` };
            }

            if (!res.ok) return { error: data.error || `エラーが発生しました (${res.status})` };
            await refresh();
            return {};
        } catch (err) {
            console.error('Login fetch error:', err);
            return { error: '通信エラーが発生しました。ネットワーク接続を確認してください。' };
        }
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setUnreadCount(0);
        setUnreadInquiryCount(0);
    };

    return (
        <AuthContext.Provider value={{ user, loading, unreadCount, unreadInquiryCount, login, logout, refresh, refreshUnreadCount }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
