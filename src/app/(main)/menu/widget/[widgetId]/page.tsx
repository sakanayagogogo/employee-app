'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface WidgetData {
    id: number;
    type: string;
    title: string;
    configJson: Record<string, unknown>;
    expiresAt: string | null;
    userResponse: Record<string, unknown> | null;
}

function DynamicFormRenderer({ widget, onRespond }: { widget: WidgetData; onRespond: () => void }) {
    const config = widget.configJson as any;
    const fields = config.fields || [];
    const deadline = config.deadline ? new Date(config.deadline) : null;
    const isDeadlinePassed = deadline ? deadline < new Date() : false;

    const hasResponded = !!widget.userResponse;
    const [responses, setResponses] = useState<Record<string, any>>(widget.userResponse || {});
    const [submitting, setSubmitting] = useState(false);

    if (hasResponded) {
        return (
            <div className="text-center py-10 bg-green-50 rounded-2xl border border-green-100 mt-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-green-800 font-bold mb-1">回答ありがとうございました</p>
                <p className="text-sm text-green-600">このフォームへの回答は記録されました</p>
            </div>
        );
    }

    const handleChange = (fieldId: string, value: any) => {
        setResponses(prev => ({ ...prev, [fieldId]: value }));
    };

    const submit = async () => {
        setSubmitting(true);
        await fetch(`/api/menu/widget/${widget.id}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responseJson: responses }),
        });
        onRespond();
        setSubmitting(false);
    };

    const isReadyToSubmit = !isDeadlinePassed && fields.every((f: any) => !f.required || (responses[f.id] !== undefined && responses[f.id] !== ''));

    return (
        <div className="space-y-6 mt-4">
            <div className="space-y-6">
                {fields.map((field: any) => {
                    const value = responses[field.id] || '';
                    return (
                        <div key={field.id} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-3">
                            <label className="block text-base font-bold text-zinc-800">
                                {field.label}
                                {field.required && <span className="ml-2 text-xs text-red-500 font-bold">必須</span>}
                            </label>

                            {field.type === 'text' && (
                                <input type="text" value={value} onChange={e => handleChange(field.id, e.target.value)}
                                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-shadow" placeholder="入力してください..." />
                            )}
                            {field.type === 'textarea' && (
                                <textarea value={value} onChange={e => handleChange(field.id, e.target.value)} rows={4}
                                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-shadow" placeholder="入力してください..." />
                            )}
                            {field.type === 'radio' && (
                                <div className="space-y-2">
                                    {(field.options || []).map((opt: string) => (
                                        <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 border border-zinc-200 rounded-xl hover:bg-white transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                                            <input type="radio" name={`radio-${field.id}`} value={opt} checked={value === opt}
                                                onChange={e => handleChange(field.id, e.target.value)} className="w-5 h-5 accent-orange-600" />
                                            <span className="text-base font-medium text-zinc-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {field.type === 'checkbox' && (
                                <div className="space-y-2">
                                    {(field.options || []).map((opt: string) => {
                                        const checkedList = Array.isArray(value) ? value : [];
                                        return (
                                            <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 border border-zinc-200 rounded-xl hover:bg-white transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                                                <input type="checkbox" value={opt} checked={checkedList.includes(opt)}
                                                    onChange={e => {
                                                        const newVal = e.target.checked ? [...checkedList, opt] : checkedList.filter((v: string) => v !== opt);
                                                        handleChange(field.id, newVal);
                                                    }} className="w-5 h-5 accent-orange-600 rounded" />
                                                <span className="text-base font-medium text-zinc-700">{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                            {field.type === 'attendance_buttons' && (
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => handleChange(field.id, '欠席')}
                                        className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${value === '欠席' ? 'bg-red-50 border-red-500 text-red-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-red-300'}`}>欠席</button>
                                    <button type="button" onClick={() => handleChange(field.id, '出席')}
                                        className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${value === '出席' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300'}`}>出席</button>
                                </div>
                            )}
                            {field.type === 'date' && (
                                <input type="date" value={value} onChange={e => handleChange(field.id, e.target.value)}
                                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-shadow" />
                            )}
                            {field.type === 'select' && (
                                <select value={value} onChange={e => handleChange(field.id, e.target.value)}
                                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-shadow bg-white appearance-none">
                                    <option value="">選択してください</option>
                                    {(field.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            )}
                            {field.type === 'file' && (
                                <div className="space-y-3">
                                    <label className="cursor-pointer block w-full p-6 border-2 border-dashed border-zinc-200 rounded-2xl text-center bg-white hover:border-orange-500 hover:bg-orange-50 transition-all group">
                                        <input type="file" className="hidden" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.readAsDataURL(file);
                                                reader.onload = () => handleChange(field.id, { name: file.name, data: reader.result });
                                            }
                                        }} />
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <svg className="w-6 h-6 text-zinc-400 group-hover:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-500">{value?.name || '添付ファイルを選択'}</p>
                                            <p className="text-[10px] text-zinc-400 mt-1">証明書類などの画像・PDF</p>
                                        </div>
                                    </label>
                                    {value?.data && (
                                        <div className="text-[10px] text-zinc-400 flex items-center gap-1 px-2">
                                            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            アップロード準備完了
                                        </div>
                                    )}
                                </div>
                            )}
                            {field.type === 'number' && (
                                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-zinc-100 w-fit">
                                    <button
                                        type="button"
                                        onClick={() => handleChange(field.id, Math.max(field.min ?? 0, (parseInt(value) || 0) - 1))}
                                        disabled={(parseInt(value) || 0) <= (field.min ?? 0)}
                                        className="w-12 h-12 rounded-xl bg-zinc-50 text-zinc-600 flex items-center justify-center hover:bg-zinc-100 active:scale-95 transition-all text-xl font-bold disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                        －
                                    </button>
                                    <div className="w-16 text-center">
                                        <span className="text-2xl font-black text-zinc-900">{value || (field.min ?? 0)}</span>
                                        <span className="ml-1 text-xs font-bold text-zinc-400">枚</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleChange(field.id, Math.min(field.max ?? 100, (parseInt(value) || 0) + 1))}
                                        disabled={(parseInt(value) || 0) >= (field.max ?? 100)}
                                        className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 active:scale-95 transition-all text-xl font-bold disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                        ＋
                                    </button>
                                </div>
                            )}
                            {field.type === 'checklist_item' && (
                                <label className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                                    <input type="checkbox" checked={value === true} onChange={e => handleChange(field.id, e.target.checked)}
                                        className="w-6 h-6 rounded-md border-2 border-zinc-300 checked:bg-orange-500 checked:border-orange-500 appearance-none flex items-center justify-center relative [&:checked]:after:content-['✓'] [&:checked]:after:text-white [&:checked]:after:absolute [&:checked]:after:font-bold" />
                                    <span className={`text-base font-medium ${value ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>完了にする</span>
                                </label>
                            )}
                        </div>
                    );
                })}
            </div>
            {isDeadlinePassed && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-bold">回答期限が終了しているため、登録できません。</p>
                </div>
            )}

            {fields.length > 0 && (
                <button onClick={submit} disabled={submitting || !isReadyToSubmit}
                    className="w-full py-4 mt-8 bg-blue-600 text-white rounded-xl text-base font-bold disabled:opacity-40 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                    {submitting ? '送信中...' : isDeadlinePassed ? '回答期限終了' : '送信する'}
                </button>
            )}
        </div>
    );
}

export default function SingleMenuWidgetPage({ params }: { params: Promise<{ widgetId: string }> }) {
    const { widgetId } = use(params);
    const [widget, setWidget] = useState<WidgetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            const res = await fetch(`/api/menu/widget/${widgetId}`);
            const data = await res.json();
            if (data.error) setError(data.error);
            else setWidget(data.data.widget);
        } catch (e) {
            setError('データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [widgetId]);

    if (loading) return (
        <div className="w-full space-y-6 mt-4 p-4">
            <div className="h-10 w-32 bg-zinc-200 rounded animate-pulse" />
            <div className="h-64 bg-zinc-200 rounded-3xl animate-pulse" />
        </div>
    );

    if (error || !widget) return (
        <div className="w-full p-4 mt-8">
            <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col items-center">
                <svg className="w-12 h-12 mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-bold">{error || 'ウィジェットが見つかりません'}</p>
                <Link href={`/home`} className="mt-4 px-4 py-2 bg-white text-zinc-600 rounded-lg shadow-sm border border-zinc-200 text-sm font-medium hover:bg-zinc-50">
                    ホームに戻る
                </Link>
            </div>
        </div>
    );

    const typeThemes: Record<string, { bg: string, text: string, icon: string, label: string }> = {
        SURVEY: {
            bg: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-700',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
            label: 'アンケート'
        },
        ATTENDANCE: {
            bg: 'bg-teal-50 text-teal-700', text: 'text-teal-700',
            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            label: '出欠確認'
        },
        CHECKLIST: {
            bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            label: 'チェックリスト'
        },
        BOARD: {
            bg: 'bg-rose-50 text-rose-700', text: 'text-rose-700',
            icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
            label: '掲示板'
        },
        FORM: {
            bg: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-700',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            label: '申請フォーム'
        },
    };

    const theme = typeThemes[widget.type] || { bg: 'bg-zinc-100 text-zinc-600', text: 'text-zinc-600', icon: '', label: 'その他' };

    return (
        <div className="w-full space-y-6 pb-20 mt-4 lg:mt-0 px-4">
            <div className="flex items-center gap-4">
                <Link href={`/home`} className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${theme.bg}`}>
                            {theme.label}
                        </span>
                        {widget.expiresAt && (
                            <span className="text-xs text-zinc-500 font-medium">
                                〆 {new Date(widget.expiresAt).toLocaleDateString('ja-JP')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-zinc-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-full blur-2xl transform translate-x-10 -translate-y-10 pointer-events-none"></div>

                {typeof widget.configJson.image === 'string' && widget.configJson.image && (
                    <div className="-mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6 h-48 bg-zinc-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={widget.configJson.image} alt="Header" className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="relative z-10">
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tight leading-snug">{widget.title}</h1>

                    {widget.type === 'ATTENDANCE' && !!((widget.configJson as any).eventDate || (widget.configJson as any).deadline) && (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(widget.configJson as any).eventDate && (
                                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                    <p className="text-xs font-bold text-zinc-500 mb-1 uppercase tracking-wider">開催日</p>
                                    <p className="text-lg font-black text-zinc-800">{String((widget.configJson as any).eventDate)}</p>
                                </div>
                            )}
                            {(widget.configJson as any).deadline && (
                                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                    <p className="text-xs font-bold text-zinc-500 mb-1 uppercase tracking-wider">登録期限</p>
                                    <p className={`text-lg font-black ${new Date(String((widget.configJson as any).deadline)) < new Date() ? 'text-red-600' : 'text-zinc-800'}`}>
                                        {new Date(String((widget.configJson as any).deadline)).toLocaleString('ja-JP', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {typeof widget.configJson.description === 'string' && widget.configJson.description && (
                        <p className="mt-6 text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed bg-blue-50/30 p-4 rounded-2xl border border-blue-100/30">{widget.configJson.description}</p>
                    )}

                    <div className="mt-8">
                        <DynamicFormRenderer widget={widget} onRespond={load} />
                    </div>
                </div>
            </div>

            <div className="text-center">
                <Link href={`/home`} className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    ホームに戻る
                </Link>
            </div>
        </div>
    );
}
