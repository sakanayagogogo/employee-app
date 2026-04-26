'use client';
import { useEffect, useRef, useState } from 'react';
import { getProxyUrl } from '@/lib/image';

interface PdfThumbnailProps {
    url: string;
    className?: string;
}

export default function PdfThumbnail({ url, className = "" }: PdfThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const loadPdf = async () => {
            try {
                // 1. ライブラリを読み込み
                const pdfjsModule = await import('pdfjs-dist');
                // ESMとCommonJSの両方に対応
                const pdfjsLib = (pdfjsModule as any).default || pdfjsModule;
                
                // 2. ワーカーの設定（安定したCDNを使用）
                const PDFJS_VERSION = '4.0.379';
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

                // 3. ドキュメント読み込み
                const loadingTask = pdfjsLib.getDocument({
                    url: getProxyUrl(url),
                    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
                    cMapPacked: true,
                });
                
                const pdf = await loadingTask.promise;
                
                if (!isMounted) return;
                const page = await pdf.getPage(1);
                
                // 4. レンダリング
                const viewport = page.getViewport({ scale: 1.2 });
                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderTask = page.render({
                    canvasContext: context,
                    viewport: viewport
                });
                
                await renderTask.promise;
                
                if (isMounted) setLoading(false);
            } catch (err) {
                console.error('PDF Thumbnail error:', err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        loadPdf();
        return () => { isMounted = false; };
    }, [url]);

    return (
        <div className={`relative overflow-hidden bg-white flex items-center justify-center ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 z-10">
                    <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-1.5" />
                    <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest">Generating...</span>
                </div>
            )}
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-200 p-2">
                    <span className="text-xl mb-1">📄</span>
                    <span className="text-[8px] font-bold uppercase tracking-tight text-center">Preview Error</span>
                </div>
            ) : (
                <canvas ref={canvasRef} className={`w-full h-full object-contain shadow-sm transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`} />
            )}
        </div>
    );
}
