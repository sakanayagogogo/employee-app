'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
    id: number;
    employeeNumber: string;
    name: string;
    unionRole: string;
    unionRoleBranch: string | null;
    storeId: number | null;
    storeName: string | null;
}

interface MasterData {
    category: string;
    code: string;
    name: string;
}

export default function AdminOfficersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<MasterData[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const OFFICER_CODES = ['11', '14', '19', '31', '32', '33', '34', '35'];
    const BRANCH_ROLE_CODES = ['11', '14', '19'];
    const CENTRAL_ROLE_CODES = ['31', '32', '33', '34', '35'];

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/users?isOfficer=true').then(r => r.json()),
            fetch('/api/admin/master-data').then(r => r.json()),
            fetch('/api/admin/stores').then(r => r.json()),
        ]).then(([uData, mData, sData]: [any, any, any]) => {
            const allUsers = uData.data || [];
            const allMasters = mData.data || [];
            
            // Normalize and filter users based on officer roles
            setUsers(allUsers.filter((u: User) => {
                const uRole = String(u.unionRole || '');
                const bRole = String(u.unionRoleBranch || '');
                return OFFICER_CODES.includes(uRole) || OFFICER_CODES.includes(bRole);
            }));
            
            setRoles(allMasters);
            setStores(sData.data || []);
            setLoading(false);
        }).catch((err: any) => {
            console.error('Error loading officer data:', err);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-20 text-center animate-pulse">読み込み中...</div>;

    const findOfficers = (roleCode: string, storeId?: number) => {
        const rc = String(roleCode);
        if (storeId) {
            // Branch officers are strictly by store
            return users.filter(u => String(u.unionRoleBranch) === rc && Number(u.storeId) === Number(storeId));
        }
        // Central officers strictly in the dedicated branch officer column
        return users.filter(u => String(u.unionRoleBranch) === rc);
    };

    const branchRoles = roles.filter(r => r.category === 'branch_officer' && BRANCH_ROLE_CODES.includes(r.code))
        .sort((a, b) => BRANCH_ROLE_CODES.indexOf(a.code) - BRANCH_ROLE_CODES.indexOf(b.code));
    const centralRoles = roles.filter(r => r.category === 'branch_officer' && CENTRAL_ROLE_CODES.includes(r.code))
        .sort((a, b) => CENTRAL_ROLE_CODES.indexOf(a.code) - CENTRAL_ROLE_CODES.indexOf(b.code));

    return (
        <div className="space-y-10">
            <div>
                <div className="flex items-center gap-4 mb-2">
                    <Link href="/admin/masters" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        ←
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">支部役員・中央執行委員管理</h1>
                        <p className="text-gray-500 text-sm">各支部および本部の役員任命状況を一覧で確認・管理します。</p>
                    </div>
                </div>
            </div>

            {/* Central Officers Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        中央執行委員
                    </h2>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-4">
                    {/* 主要役職 (2列) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {centralRoles.filter(r => r.code !== '35').map(role => {
                            const officers = findOfficers(role.code);
                            return (
                                <div key={role.code} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">{role.name}</p>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1">
                                            {officers.length > 0 ? (
                                                officers.map(officer => (
                                                    <Link key={officer.id} href={`/admin/users/${officer.id}`} className="group py-1 hover:bg-gray-50 rounded-lg transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-gray-400 font-mono leading-none mb-0.5 tracking-tighter">{officer.employeeNumber}</span>
                                                            <span className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{officer.name}</span>
                                                        </div>
                                                    </Link>
                                                ))
                                            ) : (
                                                <p className="text-base font-bold text-gray-200 italic">未選任</p>
                                            )}
                                        </div>
                                    </div>
                                    <Link 
                                        href={`/admin/users?unionRoleBranch=${role.code}`} 
                                        className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all ml-4 shrink-0"
                                        title="ユーザー検索・任命"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                    {/* 中央執行委員 (1列、エリア別) */}
                    {centralRoles.filter(r => r.code === '35').map(role => {
                        const officers = findOfficers(role.code);
                        const AREA_CODES = ['19', '29', '39', '49', '59', '69'];

                        return (
                            <div key={role.code} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{role.name}</p>
                                    <Link 
                                        href={`/admin/users?unionRoleBranch=${role.code}`} 
                                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-600 transition-all"
                                    >
                                        <span>ユーザー検索・任命</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </Link>
                                </div>

                                <div className="space-y-6">
                                    {/* エリアごとの表示 */}
                                    {AREA_CODES.map(areaCode => {
                                        const areaMembers = officers.filter(o => String(o.unionRole) === areaCode);
                                        const areaMaster = roles.find(r => r.category === 'union_role' && r.code === areaCode);
                                        const areaName = areaMaster ? areaMaster.name : `エリア ${areaCode}`;
                                        
                                        if (areaMembers.length === 0) return null;
                                        
                                        return (
                                            <div key={areaCode} className="space-y-2">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    {areaName}
                                                </h4>
                                                <div className="flex flex-wrap gap-x-8 gap-y-3 pl-3">
                                                    {areaMembers.map(member => (
                                                        <Link key={member.id} href={`/admin/users/${member.id}`} className="group block">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-gray-400 font-mono leading-none mb-1">{member.employeeNumber}</span>
                                                                <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{member.name}</span>
                                                                <span className="text-[9px] text-gray-400 mt-0.5">{member.storeName || '本部'}</span>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* その他・未分類の表示 */}
                                    {(() => {
                                        const otherMembers = officers.filter(o => !AREA_CODES.includes(String(o.unionRole)));
                                        if (otherMembers.length === 0) return null;
                                        return (
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    その他・未分類
                                                </h4>
                                                <div className="flex flex-wrap gap-x-8 gap-y-3 pl-3">
                                                    {otherMembers.map(member => (
                                                        <Link key={member.id} href={`/admin/users/${member.id}`} className="group block">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-gray-400 font-mono leading-none mb-1">{member.employeeNumber}</span>
                                                                <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{member.name}</span>
                                                                <span className="text-[9px] text-gray-400 mt-0.5">{member.storeName || '本部'}</span>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    
                                    {officers.length === 0 && (
                                        <p className="text-sm font-bold text-gray-200 italic py-4">未選任</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Branch Officers Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                        支部役員
                    </h2>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">支部・店舗</th>
                                {branchRoles.map(role => (
                                    <th key={role.code} className="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">{role.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stores.filter(s => s.code !== 'HQ').map(store => (
                                <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{store.name}</td>
                                    {branchRoles.map(role => {
                                        const officers = findOfficers(role.code, store.id);
                                        return (
                                            <td key={role.code} className="px-6 py-4">
                                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                    {officers.length > 0 ? (
                                                        officers.map(officer => (
                                                            <Link key={officer.id} href={`/admin/users/${officer.id}`} className="group block py-1">
                                                                <p className="text-[9px] text-gray-400 font-mono italic leading-none mb-0.5">{officer.employeeNumber}</p>
                                                                <p className="font-black text-gray-800 group-hover:text-emerald-600 transition-colors whitespace-nowrap leading-tight">{officer.name}</p>
                                                            </Link>
                                                        ))
                                                    ) : (
                                                        <Link href={`/admin/users?storeId=${store.id}&unionRoleBranch=${role.code}`} className="text-xs text-gray-300 hover:text-emerald-500 transition-colors italic">
                                                            未選任
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
