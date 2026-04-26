'use client';
import { useEffect, useRef, useState } from 'react';
import { getProxyUrl } from '@/lib/image';

// pdfjsの型定義が不十分な場合を考慮
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

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
                // 動的インポート
                const pdfjsLib = await import('pdfjs-dist');
                // ワーカーの設定
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

                const loadingTask = pdfjsLib.getDocument(getProxyUrl(url));
                const pdf = await loadingTask.promise;
                
                if (!isMounted) return;
                const page = await pdf.getPage(1);
                
                // プレビュー用に解像度を調整
                const viewport = page.getViewport({ scale: 1.0 });
                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;

                // 表示サイズに合わせてキャンバスのピクセルサイズを設定
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                if (isMounted) {
                    setLoading(false);
                }
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
        <div className={`relative overflow-hidden bg-white ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50">
                    <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-2" />
                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">PREVIEWING</span>
                </div>
            )}
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-300 p-4">
                    <span className="text-3xl mb-2">📄</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-center">Preview not available</span>
                </div>
            ) : (
                <canvas ref={canvasRef} className="w-full h-full object-contain shadow-sm" />
            )}
        </div>
    );
}
