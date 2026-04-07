'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface AggregatedResponse {
    id: number;
    userId: number;
    employeeName: string;
    employeeNumber: string;
    responseJson: Record<string, any>;
    updatedAt: string;
}

interface WidgetData {
    widget: {
        id: number;
        type: string;
        title: string;
        configJson: Record<string, any>;
    };
    responses: AggregatedResponse[];
}

export default function WidgetResponsesPage({ params }: { params: Promise<{ widgetId: string }> }) {
    const { widgetId } = use(params);
    const [data, setData] = useState<WidgetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/menu/widget/${widgetId}/responses`);
                const json = await res.json();
                if (json.error) {
                    setError(json.error);
                } else if (json.data) {
                    setData(json.data);
                }
            } catch (e) {
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [widgetId]);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-1/4 bg-zinc-200 rounded"></div>
                <div className="h-32 bg-white rounded-2xl border border-zinc-200"></div>
                <div className="h-64 bg-white rounded-2xl border border-zinc-200"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                {error || 'ウィジェットが見つかりません'}
            </div>
        );
    }

    const { widget, responses } = data;

    const renderSurveyResponses = () => {
        const cfg = widget.configJson as { type: string; question: string; options?: string[] };

        if (cfg.type === 'text') {
            return (
                <div className="space-y-3">
                    {responses.map(r => (
                        <div key={r.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-zinc-900">{r.employeeName} <span className="text-zinc-500 font-normal text-sm">({r.employeeNumber})</span></span>
                                <span className="text-xs text-zinc-400">{new Date(r.updatedAt).toLocaleString('ja-JP')}</span>
                            </div>
                            <p className="text-zinc-700 whitespace-pre-wrap">{r.responseJson.answer}</p>
                        </div>
                    ))}
                </div>
            );
        }

        // Multiple or Single Choice aggregation
        const counts: Record<string, number> = {};
        cfg.options?.forEach(opt => counts[opt] = 0);

        responses.forEach(r => {
            const choice = r.responseJson.choice;
            if (Array.isArray(choice)) {
                choice.forEach(c => { if (counts[c] !== undefined) counts[c]++; });
            } else if (typeof choice === 'string') {
                if (counts[choice] !== undefined) counts[choice]++;
            }
        });

        return (
            <div className="space-y-6">
                <div className="bg-white border text-sm border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-100/50 text-zinc-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 border-b border-zinc-200">選択肢</th>
                                <th className="px-4 py-3 border-b border-zinc-200 w-32">回答数</th>
                                <th className="px-4 py-3 border-b border-zinc-200 w-48">割合</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-zinc-800">
                            {cfg.options?.map(opt => {
                                const count = counts[opt] || 0;
                                const pct = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
                                return (
                                    <tr key={opt}>
                                        <td className="px-4 py-3">{opt}</td>
                                        <td className="px-4 py-3 font-medium">{count}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-xs text-zinc-500 w-8">{pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8">
                    <h4 className="font-medium text-zinc-800 mb-3">回答者一覧</h4>
                    <div className="space-y-2">
                        {responses.map(r => (
                            <div key={r.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-sm">
                                <div>
                                    <span className="font-semibold text-zinc-900">{r.employeeName}</span>
                                    <span className="text-zinc-500 ml-2">({r.employeeNumber})</span>
                                </div>
                                <span className="text-zinc-700 font-medium">
                                    {Array.isArray(r.responseJson.choice) ? r.responseJson.choice.join(', ') : r.responseJson.choice}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderAttendanceResponses = () => {
        const counts = { '参加': 0, '不参加': 0, '未定': 0 };
        responses.forEach(r => {
            const att = r.responseJson.attendance as keyof typeof counts;
            if (counts[att] !== undefined) counts[att]++;
        });

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(counts).map(([label, count]) => (
                        <div key={label} className="bg-white border border-zinc-200 rounded-xl p-4 text-center shadow-sm">
                            <p className="text-zinc-500 text-sm font-medium mb-1">{label}</p>
                            <p className="text-2xl font-bold text-zinc-900">{count}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white border text-sm border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-100/50 text-zinc-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 border-b border-zinc-200">社員名</th>
                                <th className="px-4 py-3 border-b border-zinc-200">社員番号</th>
                                <th className="px-4 py-3 border-b border-zinc-200">回答</th>
                                <th className="px-4 py-3 border-b border-zinc-200">回答日時</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-zinc-800">
                            {responses.map(r => (
                                <tr key={r.id}>
                                    <td className="px-4 py-3 font-medium">{r.employeeName}</td>
                                    <td className="px-4 py-3 text-zinc-500">{r.employeeNumber}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium
                                             ${r.responseJson.attendance === '参加' ? 'bg-emerald-100 text-emerald-700' :
                                                r.responseJson.attendance === '不参加' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-zinc-100 text-zinc-600'}`
                                        }>
                                            {String(r.responseJson.attendance)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(r.updatedAt).toLocaleString('ja-JP')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderChecklistResponses = () => {
        const cfg = widget.configJson as { items: { id: string; label: string }[] };

        // Item check aggregation
        const itemChecks: Record<string, number> = {};
        cfg.items.forEach(i => itemChecks[i.id] = 0);

        responses.forEach(r => {
            const checked = r.responseJson.checked as string[];
            if (Array.isArray(checked)) {
                checked.forEach(id => { if (itemChecks[id] !== undefined) itemChecks[id]++; });
            }
        });

        return (
            <div className="space-y-6">
                {/* Aggregation */}
                <div className="bg-white border text-sm border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-100/50 text-zinc-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 border-b border-zinc-200">チェック項目</th>
                                <th className="px-4 py-3 border-b border-zinc-200 w-32">チェック数</th>
                                <th className="px-4 py-3 border-b border-zinc-200 w-48">割合</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-zinc-800">
                            {cfg.items.map(item => {
                                const count = itemChecks[item.id] || 0;
                                const pct = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
                                return (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">{item.label}</td>
                                        <td className="px-4 py-3 font-medium">{count} / {responses.length}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-xs text-zinc-500 w-8">{pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Individual Details */}
                <div className="bg-white border text-sm border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-100/50 text-zinc-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 border-b border-zinc-200">社員名</th>
                                <th className="px-4 py-3 border-b border-zinc-200">完了率</th>
                                <th className="px-4 py-3 border-b border-zinc-200">詳細</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-zinc-800">
                            {responses.map(r => {
                                const checked = (r.responseJson.checked as string[]) || [];
                                const pct = Math.round((checked.length / cfg.items.length) * 100);
                                return (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-zinc-900">{r.employeeName}</div>
                                            <div className="text-xs text-zinc-500 pr-2">{r.employeeNumber}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium ${pct === 100 ? 'text-emerald-600' : 'text-zinc-700'}`}>{pct}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs leading-relaxed text-zinc-600">
                                            {cfg.items.map(i => (
                                                <span key={i.id} className={`inline-block mr-2 mb-1 px-2 py-0.5 rounded ${checked.includes(i.id) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-zinc-100 text-zinc-400 opacity-50'}`}>
                                                    {checked.includes(i.id) ? '✓ ' : ''}{i.label}
                                                </span>
                                            ))}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderBoardResponses = () => {
        return (
            <div className="space-y-4">
                {responses.map(r => (
                    <div key={r.id} className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center text-sm font-bold">
                                    {r.employeeName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-zinc-900 text-sm">{r.employeeName}</p>
                                    <p className="text-zinc-500 text-xs">{r.employeeNumber}</p>
                                </div>
                            </div>
                            <span className="text-xs text-zinc-400">{new Date(r.responseJson.postedAt || r.updatedAt).toLocaleString('ja-JP')}</span>
                        </div>
                        <p className="text-zinc-800 text-sm whitespace-pre-wrap mt-2 pl-11">{r.responseJson.message}</p>
                    </div>
                ))}
            </div>
        );
    }

    const typeLabels: Record<string, string> = { SURVEY: 'アンケート', ATTENDANCE: '出欠', CHECKLIST: 'チェックリスト', BOARD: '掲示板' };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/admin/menu`} className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">回答確認</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">タイルの回答結果を集計表示します。</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-4">
                    <span className="text-xs font-bold px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full">{typeLabels[widget.type]}</span>
                    <h2 className="text-lg font-bold text-zinc-900">{widget.title}</h2>
                    <span className="ml-auto text-sm text-zinc-500 font-medium">計 {responses.length} 件の回答</span>
                </div>

                {responses.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p>まだ回答がありません</p>
                    </div>
                ) : (
                    <div>
                        {widget.type === 'SURVEY' && renderSurveyResponses()}
                        {widget.type === 'ATTENDANCE' && renderAttendanceResponses()}
                        {widget.type === 'CHECKLIST' && renderChecklistResponses()}
                        {widget.type === 'BOARD' && renderBoardResponses()}
                    </div>
                )}
            </div>
        </div>
    );
}
