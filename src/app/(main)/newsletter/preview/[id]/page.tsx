'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import PdfViewer from '@/components/announcements/PdfViewer';

interface Announcement {
    id: number;
    title: string;
    attachments?: { name: string; url: string }[];
}

export default function NewsletterPdfPreview({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [ann, setAnn] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/announcements/${id}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.data) {
                    setAnn(d.data);
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-900 text-zinc-500">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="font-bold tracking-widest text-sm">PDF読み込み中...</p>
                </div>
            </div>
        );
    }

    if (!ann) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-900 text-zinc-400">
                <p>お知らせが見つかりません</p>
                <button onClick={() => router.back()} className="mt-6 px-6 py-3 bg-zinc-800 rounded-xl text-zinc-200 font-bold hover:bg-zinc-700 transition-colors">戻る</button>
            </div>
        );
    }

    const pdf = ann.attachments?.find(f => f.url.toLowerCase().endsWith('.pdf'));

    if (!pdf) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-900 text-zinc-400">
                <p>PDFが見つかりません</p>
                <button onClick={() => router.back()} className="mt-6 px-6 py-3 bg-zinc-800 rounded-xl text-zinc-200 font-bold hover:bg-zinc-700 transition-colors">戻る</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-900">
            {/* Header */}
            <div className="h-14 bg-zinc-900 flex items-center px-2 sm:px-4 justify-between shrink-0 border-b border-zinc-800 safe-pt shadow-md relative z-10">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors py-2 px-2 rounded-lg hover:bg-zinc-800 active:bg-zinc-800"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-bold text-sm">戻る</span>
                </button>
                <div className="flex-1 px-4 truncate text-center">
                    <span className="text-xs sm:text-sm font-bold text-zinc-100 truncate">{ann.title}</span>
                </div>
                <div className="w-16"></div> {/* Spacer for centering */}
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 w-full relative bg-zinc-900 safe-pb overflow-y-auto hide-scrollbar px-2 sm:px-6">
                <PdfViewer url={pdf.url} />
            </div>
        </div>
    );
}
