'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Widget {
    id: number;
    type: string;
    title: string;
    configJson: Record<string, unknown>;
    size: 'S' | 'M' | 'L';
    sortOrder: number;
    isPublished: boolean;
    expiresAt: string | null;
}

const widgetTypes = [
    { value: '', label: '選択してください' },
    { value: 'SURVEY', label: 'アンケート' },
    { value: 'ATTENDANCE', label: '出欠確認' },
    { value: 'CHECKLIST', label: 'チェックリスト' },
    { value: 'LINK', label: '外部リンク' },
    { value: 'BOARD', label: '掲示板' },
];

const defaultConfigs: Record<string, Record<string, unknown>> = {
    SURVEY: { type: 'single_choice', question: '質問を入力', options: ['選択肢1', '選択肢2'] },
    ATTENDANCE: { eventName: 'イベント名', eventDate: '', deadline: '' },
    CHECKLIST: { items: [{ id: '1', label: 'チェック項目1' }, { id: '2', label: 'チェック項目2' }] },
    LINK: { url: 'https://', description: '' },
    BOARD: { allowPost: true, description: '' },
};

function PreviewTile({ widget }: { widget: Partial<Widget> }) {
    const typeThemes: Record<string, { bg: string, text: string, icon: string, label: string }> = {
        SURVEY: {
            bg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
            text: 'text-white',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
            label: 'アンケート'
        },
        ATTENDANCE: {
            bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
            text: 'text-white',
            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            label: '出欠確認'
        },
        CHECKLIST: {
            bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
            text: 'text-white',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            label: 'チェックリスト'
        },
        LINK: {
            bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
            text: 'text-white',
            icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
            label: '外部リンク'
        },
        BOARD: {
            bg: 'bg-gradient-to-br from-rose-500 to-pink-600',
            text: 'text-white',
            icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
            label: '掲示板'
        },
    };

    const theme = typeThemes[widget.type || ''] || { bg: 'bg-zinc-300', text: 'text-zinc-600', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: '選択してください' };
    const isLink = widget.type === 'LINK';

    return (
        <div className="bg-gray-100 p-6 rounded-2xl flex items-center justify-center min-h-[280px]">
            <div className={`w-full ${widget.size === 'S' ? 'max-w-[160px]' : widget.size === 'L' ? 'max-w-[640px]' : 'max-w-[320px]'} ${theme.bg} rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[240px] transition-all duration-500`}>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={theme.icon} />
                                </svg>
                            </div>
                            <span className="text-white/90 text-sm font-bold tracking-wider">{theme.label}</span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <h3 className="text-white font-black text-xl leading-tight mb-2 truncate">{widget.title || 'タイトル未設定'}</h3>
                        <div className="flex justify-between items-end mt-4">
                            {widget.expiresAt && !isLink && (
                                <span className="text-white/80 text-xs font-bold bg-black/15 px-3 py-1 rounded-lg backdrop-blur-md">
                                    〆 {new Date(widget.expiresAt).toLocaleDateString('ja-JP')}
                                </span>
                            )}
                            <div className="ml-auto w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    {isLink ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    )}
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface Field {
    id: string;
    type: string;
    label: string;
    required?: boolean;
    options?: string[];
}

// Function to render the mock input visual for builder and live preview
const renderFieldMock = (field: Field) => {
    switch (field.type) {
        case 'text':
            return <input type="text" placeholder="テキストを入力..." className="w-full px-4 py-2 mt-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />;
        case 'textarea':
            return <textarea placeholder="テキストを入力..." className="w-full px-4 py-2 mt-2 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none" rows={2} />;
        case 'radio':
            return (
                <div className="space-y-2 mt-2">
                    {field.options?.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name={`radio-${field.id}`} className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                    ))}
                </div>
            );
        case 'checkbox':
            return (
                <div className="space-y-2 mt-2">
                    {field.options?.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                    ))}
                </div>
            );
        case 'attendance_buttons':
            return (
                <div className="flex gap-4 mt-2">
                    <button type="button" className="flex-1 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold font-sm hover:bg-red-100 transition-colors">欠席</button>
                    <button type="button" className="flex-1 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-bold font-sm hover:bg-emerald-100 transition-colors">出席</button>
                </div>
            );
        case 'url':
            return <input type="url" placeholder="https://" className="w-full px-4 py-2 mt-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
        case 'checklist_item':
            return (
                <label className="flex items-center gap-3 bg-gray-50 p-3 mt-2 rounded-xl border border-gray-200 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300" />
                    <span className="text-sm font-medium text-gray-600">チェック</span>
                </label>
            );
        default: return null;
    }
};
const DraggableFieldListItem = ({
    field,
    index,
    newWidget,
    setNewWidget,
    updateField,
    removeField,
    updateOption,
    removeOption,
    addOption,
}: {
    field: Field;
    index: number;
    newWidget: any;
    setNewWidget: (w: any) => void;
    updateField: (id: string, updates: Partial<Field>) => void;
    removeField: (id: string) => void;
    updateOption: (fieldId: string, optIdx: number, value: string) => void;
    removeOption: (fieldId: string, optIdx: number) => void;
    addOption: (fieldId: string) => void;
}) => {
    const [dragEnabled, setDragEnabled] = useState(false);
    return (
        <div
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm group relative hover:border-blue-300 transition-colors"
            draggable={dragEnabled}
            onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData('application/json', JSON.stringify({ action: 'reorder', index, id: field.id }));
            }}
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (data.action === 'reorder') {
                        const fields = [...((newWidget.configJson?.fields as Field[]) || [])];
                        const sourceIndex = fields.findIndex((f: Field) => f.id === data.id);
                        if (sourceIndex === -1) return;

                        const [movedItem] = fields.splice(sourceIndex, 1);
                        fields.splice(index, 0, movedItem);

                        setNewWidget({
                            ...newWidget,
                            configJson: { ...newWidget.configJson, fields }
                        });
                    } else if (data.type) {
                        const newField = {
                            id: Date.now().toString(),
                            type: data.type,
                            label: `新しい${data.label}`,
                            required: false,
                            options: (data.type === 'radio' || data.type === 'checkbox') ? ['選択肢1', '選択肢2'] : undefined
                        };
                        const fields = [...((newWidget.configJson?.fields as Field[]) || [])];
                        fields.splice(index + 1, 0, newField);

                        setNewWidget({
                            ...newWidget,
                            configJson: { ...newWidget.configJson, fields }
                        });
                    }
                } catch (err) { }
            }}
        >
            <div
                className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 bg-gray-50 rounded-l-xl border-r border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseEnter={() => setDragEnabled(true)}
                onMouseLeave={() => setDragEnabled(false)}
            >
                <svg className="w-5 h-5 mb-1 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" /></svg>
            </div>

            <div className="pl-6">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 w-full">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase tracking-wider shrink-0">{field.type}</span>
                        <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="text-sm font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 bg-transparent focus:bg-white focus:outline-none w-full px-1 py-0.5"
                            placeholder="項目名を入力"
                        />
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-4">
                        <button
                            type="button"
                            onClick={() => updateField(field.id, { required: !field.required })}
                            className={`text-xs px-2 py-1 rounded font-medium transition-colors ${field.required ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                        >
                            必須
                        </button>

                        <button
                            type="button"
                            onClick={() => removeField(field.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {field.options && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2 border border-blue-100">
                        <p className="text-xs font-bold text-blue-800 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            選択肢を編集
                        </p>
                        {field.options.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 bg-white" />
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                                    className="text-xs w-full bg-white border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                                <button type="button" onClick={() => removeOption(field.id, optIdx)} className="text-gray-400 hover:text-red-500 p-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => addOption(field.id)}
                            className="text-xs text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1 mt-1 px-1 py-0.5"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            選択肢を追加
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


export default function EditMenuWidgetPage({ params }: { params: Promise<{ widgetId: string }> }) {
    const { widgetId } = use(params);
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newWidget, setNewWidget] = useState<{
        id?: number;
        type: string;
        title: string;
        size: 'S' | 'M' | 'L';
        isPublished: boolean;
        expiresAt: string;
        configJson: Record<string, unknown>;
        image?: File | null;
        description: string;
        categoryName: string;
        showInHeader: boolean;
    }>({
        type: '',
        title: '',
        size: 'M',
        isPublished: false,
        expiresAt: '',
        configJson: { fields: [] },
        image: null,
        description: '',
        categoryName: '',
        showInHeader: false
    });

    const [draggedItem, setDraggedItem] = useState<{ type: string, label: string } | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/menu/widget/${widgetId}`)
            .then(res => res.json())
            .then(data => {
                if (data.data?.widget) {
                    const w = data.data.widget;
                    setNewWidget({
                        type: w.type,
                        title: w.title,
                        size: w.size || 'M',
                        isPublished: w.isPublished || false,
                        expiresAt: w.expiresAt ? w.expiresAt.substring(0, 16) : '',
                        configJson: w.configJson,
                        description: w.configJson?.description || '',
                        categoryName: w.categoryName || '',
                        showInHeader: w.showInHeader || false,
                        image: null
                    });
                    if (w.configJson?.image) setExistingImage(w.configJson.image);
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [widgetId]);

    const steps = [
        { num: 1, label: '基本情報' },
        { num: 2, label: '入力フォーム\nワークフロー' },
        { num: 3, label: '利用条件\n公開条件' },
        { num: 4, label: 'オプション機能' },
    ];

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value;
        const initialFields: any[] = [];
        if (type === 'SURVEY') initialFields.push({ id: 'f1', type: 'radio', label: '新しい質問', options: ['選択肢1', '選択肢2'] });
        else if (type === 'ATTENDANCE') initialFields.push({ id: 'f1', type: 'attendance_buttons', label: '出欠ボタン' });

        setNewWidget(prev => ({
            ...prev,
            type,
            configJson: { ...defaultConfigs[type] || {}, fields: initialFields }
        }));
    };

    const handleDragStart = (e: React.DragEvent, item: { type: string, label: string }) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        setDraggedItem(item);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data && data.type) {
                const newField = {
                    id: Date.now().toString(),
                    type: data.type,
                    label: `新しい${data.label}`,
                    required: false,
                    options: (data.type === 'radio' || data.type === 'checkbox') ? ['選択肢1', '選択肢2'] : undefined
                };
                const currentFields = (newWidget.configJson?.fields as any[]) || [];
                setNewWidget({
                    ...newWidget,
                    configJson: { ...newWidget.configJson, fields: [...currentFields, newField] }
                });
            }
        } catch (err) { }
        setDraggedItem(null);
    };

    const updateField = (id: string, updates: any) => {
        const fields = (newWidget.configJson?.fields as any[]) || [];
        const newFields = fields.map(f => f.id === id ? { ...f, ...updates } : f);
        setNewWidget({ ...newWidget, configJson: { ...newWidget.configJson, fields: newFields } });
    };

    const removeField = (id: string) => {
        const fields = (newWidget.configJson?.fields as any[]) || [];
        const newFields = fields.filter(f => f.id !== id);
        setNewWidget({ ...newWidget, configJson: { ...newWidget.configJson, fields: newFields } });
    };

    const addOption = (fieldId: string) => {
        const fields = (newWidget.configJson?.fields as any[]) || [];
        const newFields = fields.map(f => f.id === fieldId ? { ...f, options: [...(f.options || []), `選択肢${(f.options || []).length + 1}`] } : f);
        setNewWidget({ ...newWidget, configJson: { ...newWidget.configJson, fields: newFields } });
    };

    const updateOption = (fieldId: string, optIdx: number, value: string) => {
        const fields = (newWidget.configJson?.fields as any[]) || [];
        const newFields = fields.map(f => f.id === fieldId ? { ...f, options: f.options.map((o: string, i: number) => i === optIdx ? value : o) } : f);
        setNewWidget({ ...newWidget, configJson: { ...newWidget.configJson, fields: newFields } });
    };

    const removeOption = (fieldId: string, optIdx: number) => {
        const fields = (newWidget.configJson?.fields as any[]) || [];
        const newFields = fields.map(f => f.id === fieldId ? { ...f, options: f.options.filter((_: any, i: number) => i !== optIdx) } : f);
        setNewWidget({ ...newWidget, configJson: { ...newWidget.configJson, fields: newFields } });
    };

    const getAvailableComponents = () => {
        switch (newWidget.type) {
            case 'SURVEY': return [
                { type: 'text', label: '1行テキスト', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { type: 'textarea', label: '複数行テキスト', icon: 'M4 6h16M4 12h16M4 18h7' },
                { type: 'radio', label: '単一選択', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                { type: 'checkbox', label: '複数選択', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            ];
            case 'ATTENDANCE': return [
                { type: 'text', label: '1行テキスト', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { type: 'attendance_buttons', label: '出欠ボタン', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            ];
            case 'CHECKLIST': return [
                { type: 'checklist_item', label: 'チェック項目', icon: 'M5 13l4 4L19 7' },
            ];
            case 'LINK': return [
                { type: 'url', label: 'URL入力', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
            ];
            default: return [
                { type: 'text', label: '1行テキスト', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
            ];
        }
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (!newWidget.type) return setError('タイルの種類を選択してください');
            if (!newWidget.title) return setError('タイルタイトルを入力してください');
        }
        setError(null);
        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    const handleSubmit = async () => {
        if (!newWidget.type || !newWidget.title) return;
        setSubmitting(true);
        setError(null);

        try {
            const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });

            // Update configJson with the description and encoded image
            const configWithDesc = {
                ...newWidget.configJson,
                description: newWidget.description,
                image: newWidget.image ? await toBase64(newWidget.image) : undefined
            };

            const payload = {
                ...newWidget,
                configJson: configWithDesc,
                expiresAt: newWidget.expiresAt ? new Date(newWidget.expiresAt).toISOString() : null,
                // remove raw file and description from top-level before sending
                image: undefined,
                description: undefined
            };

            const res = await fetch(`/api/menu/widget/${widgetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '更新に失敗しました');
            }

            router.push(`/admin/menu`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 -mt-6">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="flex items-center justify-between">
                    <div>
                        <Link href={`/admin/menu`} className="text-sm text-gray-500 font-medium hover:text-gray-900 transition-colors flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            メニュー編集に戻る
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900 mt-2">メニューの編集</h1>
                    </div>
                </div>

                {/* Stepper */}
                <div className="w-full">
                    <div className="flex items-center w-full relative">
                        {steps.map((step, idx) => {
                            const isCurrent = currentStep === step.num;
                            const isPast = currentStep > step.num;

                            return (
                                <div key={step.num} className="flex-1 relative">
                                    <div className={`
                                        relative z-10 flex items-center justify-center p-4 h-16
                                        transition-all duration-300
                                        ${isCurrent ? 'bg-blue-600 text-white shadow-md z-20'
                                            : isPast ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                                : 'bg-white text-gray-400 border border-gray-200'}
                                    `}
                                        style={{
                                            clipPath: idx === 0 ? 'polygon(0 0, 100% 0, calc(100% - 1.5rem) 50%, 100% 100%, 0 100%)'
                                                : idx === steps.length - 1 ? 'polygon(1.5rem 50%, 0 0, 100% 0, 100% 100%, 0 100%, 1.5rem 50%)'
                                                    : 'polygon(1.5rem 50%, 0 0, 100% 0, calc(100% - 1.5rem) 50%, 100% 100%, 0 100%, 1.5rem 50%)',
                                            marginLeft: idx > 0 ? '-1rem' : '0'
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                                ${isCurrent ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'}
                                                ${isPast ? 'bg-blue-200 text-blue-700' : ''}
                                            `}>
                                                {step.num}
                                            </div>
                                            <span className="font-bold text-sm whitespace-pre-line leading-tight hidden sm:block">
                                                {step.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="font-medium text-sm">{error}</p>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left Form */}
                    <div className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        {currentStep === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">基本情報</h2>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                        タイルの種類 (作成後は変更できません)
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">必須</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            disabled={true}
                                            value={newWidget.type}
                                            onChange={handleTypeChange}
                                            className="w-full sm:w-64 appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                                        >
                                            {widgetTypes.map(wt => (
                                                <option key={wt.value} value={wt.value}>{wt.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none sm:right-auto sm:left-56">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">1</span>
                                        タイルタイトル
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">必須</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="例：日報"
                                        value={newWidget.title}
                                        onChange={e => setNewWidget({ ...newWidget, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm placeholder-gray-300"
                                    />
                                    <p className="mt-2 text-xs text-gray-500 font-medium">200文字以内で入力してください。</p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">2</span>
                                        タイルの大きさ
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">必須</span>
                                    </label>
                                    <div className="flex gap-4">
                                        {(['S', 'M', 'L'] as const).map(size => (
                                            <label key={size} className="cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="size"
                                                    className="peer sr-only"
                                                    checked={newWidget.size === size}
                                                    onChange={() => setNewWidget({ ...newWidget, size })}
                                                />
                                                <div className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-bold peer-checked:border-blue-600 peer-checked:text-blue-600 peer-checked:bg-blue-50 transition-colors">
                                                    {size === 'S' ? '小 (1マスの1/2)' : size === 'M' ? '中 (1マス)' : '大 (2マス)'}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">3</span>
                                        分類名（任意）
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="例：基本ツール、申請・報告 など"
                                        value={newWidget.categoryName}
                                        onChange={e => setNewWidget({ ...newWidget, categoryName: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm placeholder-gray-300"
                                    />
                                    <p className="mt-2 text-xs text-gray-500 font-medium">メニューをグループ化して表示する際のタイトルになります。</p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">4</span>
                                        表示オプション
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={newWidget.showInHeader}
                                            onChange={e => setNewWidget({ ...newWidget, showInHeader: e.target.checked })}
                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">サイドバーにショートカットを表示する</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">よく使う機能として画面左側のナビゲーションに配置されます。</p>
                                        </div>
                                    </label>
                                </div>

                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">入力フォームワークフロー</h2>
                                    <p className="text-sm text-gray-600 mt-2">タイルをタップした後に表示される詳細ページの内容を入力してください。</p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                        タイトル画像
                                    </label>
                                    <div className="flex items-center gap-4 mb-4">
                                        <label className="cursor-pointer bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            画像ファイルを選択
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setNewWidget({ ...newWidget, image: file });
                                                }}
                                            />
                                        </label>
                                        {newWidget.image && <span className="text-sm font-medium text-gray-600">{newWidget.image.name}</span>}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                        ページの詳細（全体説明）
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="詳細な説明や注意事項を入力してください..."
                                        value={newWidget.description}
                                        onChange={e => setNewWidget({ ...newWidget, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm resize-none"
                                    />
                                </div>

                                {newWidget.type === 'ATTENDANCE' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                                        <div className="md:col-span-2">
                                            <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-4">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                出欠確認の基本設定
                                            </h3>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-700 mb-1">開催日</label>
                                            <input
                                                type="date"
                                                value={(newWidget.configJson as any).eventDate || ''}
                                                onChange={e => {
                                                    const date = e.target.value;
                                                    let deadline = (newWidget.configJson as any).deadline;
                                                    if (date && !deadline) {
                                                        const d = new Date(date);
                                                        d.setDate(d.getDate() - 7);
                                                        const Y = d.getFullYear();
                                                        const M = String(d.getMonth() + 1).padStart(2, '0');
                                                        const D = String(d.getDate()).padStart(2, '0');
                                                        deadline = `${Y}-${M}-${D}T23:59`;
                                                    }
                                                    setNewWidget({
                                                        ...newWidget,
                                                        configJson: { ...newWidget.configJson, eventDate: date, deadline }
                                                    });
                                                }}
                                                className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-700 mb-1">出欠回答期限</label>
                                            <input
                                                type="datetime-local"
                                                value={(newWidget.configJson?.deadline as string) || ''}
                                                onChange={e => setNewWidget({
                                                    ...newWidget,
                                                    configJson: { ...newWidget.configJson, deadline: e.target.value }
                                                })}
                                                className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Drag and Drop Builder Area */}
                                <div className="space-y-6 pt-4 border-t border-gray-100">

                                    {/* Drop Zone (Form Builder Area) */}
                                    <div
                                        className={`border-2 ${isDragOver ? 'border-blue-500 bg-blue-50 border-dashed' : 'border-gray-200 bg-gray-50 border-solid'} rounded-2xl p-6 transition-all min-h-[300px] flex flex-col`}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={handleDrop}
                                    >
                                        <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center justify-between">
                                            <span>フォーム構築エリア <span className="text-xs font-normal text-gray-500 italic ml-2">下から部品をドラッグしてください</span></span>
                                            <span className="text-xs font-normal text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">
                                                {((newWidget.configJson?.fields as any[]) || []).length} 個の部品
                                            </span>
                                        </h3>

                                        <div className="space-y-4 flex-1">
                                            {((newWidget.configJson?.fields as any[]) || []).length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                                                    <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                    <p className="text-sm font-medium">ここに部品をドラッグしてフォームを作成</p>
                                                </div>
                                            ) : (
                                                ((newWidget.configJson?.fields as Field[]) || []).map((field: Field, index: number) => (
                                                    <DraggableFieldListItem
                                                        key={field.id}
                                                        field={field}
                                                        index={index}
                                                        newWidget={newWidget}
                                                        setNewWidget={setNewWidget}
                                                        updateField={updateField}
                                                        removeField={removeField}
                                                        updateOption={updateOption}
                                                        removeOption={removeOption}
                                                        addOption={addOption}
                                                    />
                                                ))

                                            )}
                                        </div>
                                    </div>

                                    {/* Components Palette (Moved to bottom) */}
                                    <div className="border border-gray-200 rounded-2xl bg-white p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            部品を追加する
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {getAvailableComponents().map((comp, idx) => (
                                                <div
                                                    key={idx}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, comp)}
                                                    className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl flex items-center gap-2 cursor-grab hover:bg-white hover:border-blue-500 hover:shadow-md transition-all active:cursor-grabbing hover:-translate-y-0.5"
                                                >
                                                    <div className="text-blue-600 shrink-0">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={comp.icon} />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{comp.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">利用条件・公開条件</h2>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        有効期限
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newWidget.expiresAt}
                                        onChange={e => setNewWidget({ ...newWidget, expiresAt: e.target.value })}
                                        className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={newWidget.isPublished}
                                            onChange={e => setNewWidget({ ...newWidget, isPublished: e.target.checked })}
                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-bold text-gray-900">作成後、すぐに公開する</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">オプション機能</h2>
                                <p className="text-sm text-gray-600 mb-8">追加のオプションを設定します。準備ができたら「完了して保存」をクリックしてください。</p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-12 flex justify-between items-center pt-6 border-t border-gray-100">
                            {currentStep > 1 ? (
                                <button
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    戻る
                                </button>
                            ) : <div></div>}

                            {currentStep < 4 ? (
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg shadow-gray-200 flex items-center gap-2 hover:bg-gray-800 transition-all hover:translate-x-1"
                                >
                                    次へ
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {submitting ? '保存中...' : '完了して保存'}
                                    {!submitting && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                            )}
                        </div>

                    </div>

                    {/* Right Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-8">
                            <h2 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                                サンプルイメージ
                            </h2>

                            <div className="space-y-4">
                                {currentStep === 1 ? (
                                    <>
                                        <p className="text-xs font-bold text-gray-500">ポータル上での表示イメージ</p>
                                        <PreviewTile widget={newWidget} />
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs font-bold text-gray-500 mb-2">詳細ページの表示イメージ</p>
                                        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                                            {/* ヘッダー画像としてのタイトル画像 */}
                                            {newWidget.image || existingImage ? (
                                                <div className="w-full h-40 bg-gray-100">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={newWidget.image ? URL.createObjectURL(newWidget.image) : existingImage!} alt="Header" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-200">
                                                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}

                                            <div className="p-6 space-y-4">
                                                <h1 className="text-xl font-black text-gray-900">{newWidget.title || 'タイトル未設定'}</h1>
                                                {newWidget.description ? (
                                                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{newWidget.description}</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="h-4 bg-gray-100 rounded-md w-full"></div>
                                                        <div className="h-4 bg-gray-100 rounded-md w-5/6"></div>
                                                        <div className="h-4 bg-gray-100 rounded-md w-4/6"></div>
                                                    </div>
                                                )}

                                                {newWidget.type === 'ATTENDANCE' && !!((newWidget.configJson as any)?.eventDate || (newWidget.configJson as any)?.deadline) && (
                                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2">
                                                        {(newWidget.configJson as any).eventDate && (
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="font-bold text-emerald-800">開催日</span>
                                                                <span className="font-medium text-emerald-700">{String((newWidget.configJson as any).eventDate)}</span>
                                                            </div>
                                                        )}
                                                        {(newWidget.configJson as any).deadline && (
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="font-bold text-emerald-800">回答期限</span>
                                                                <span className="font-medium text-emerald-700">{new Date(String((newWidget.configJson as any).deadline)).toLocaleString('ja-JP')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="pt-2">
                                                    {((newWidget.configJson?.fields as any[]) || []).map((field: any, index: number) => (
                                                        <div key={index} className="mb-6 last:mb-0">
                                                            <label className="block text-sm justify-between w-full font-bold text-gray-800 mb-2">{field.label}</label>
                                                            {renderFieldMock(field)}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-6 border-t border-gray-100">
                                                    <div className="w-full h-12 bg-orange-50 text-orange-600 font-bold rounded-xl flex items-center justify-center border border-orange-100 shadow-sm cursor-not-allowed">
                                                        {newWidget.type === 'SURVEY' ? '回答を入力する' :
                                                            newWidget.type === 'ATTENDANCE' ? '出欠を登録する' :
                                                                newWidget.type === 'CHECKLIST' ? 'チェックリストを保存' :
                                                                    newWidget.type === 'BOARD' ? '掲示板に投稿する' : 'アクションボタン'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
