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
                // 1. pdf.js を CDN から動的にスクリプトタグで読み込む (より確実な方法)
                if (!(window as any).pdfjsLib) {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                    document.head.appendChild(script);
                    await new Promise((resolve) => script.onload = resolve);
                }

                const pdfjsLib = (window as any).pdfjsLib;
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

                // 2. ドキュメント読み込み
                const loadingTask = pdfjsLib.getDocument({
                    url: getProxyUrl(url),
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                    cMapPacked: true,
                });
                
                const pdf = await loadingTask.promise;
                
                if (!isMounted) return;
                const page = await pdf.getPage(1);
                
                // 3. レンダリング
                const viewport = page.getViewport({ scale: 1.0 });
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
                
                if (isMounted) {
                    setLoading(false);
                    setError(false);
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
        <div className={`relative overflow-hidden bg-white flex items-center justify-center ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 z-10">
                    <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                </div>
            )}
            
            <canvas 
                ref={canvasRef} 
                className={`w-full h-full object-contain shadow-sm transition-opacity duration-300 ${loading || error ? 'opacity-0' : 'opacity-100'}`} 
            />

            {error && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-2 text-center">
                    <span className="text-xl mb-1">📄</span>
                    <span className="text-[9px] font-bold uppercase tracking-tight leading-tight">PREVIEW ERROR</span>
                    <p className="text-[7px] mt-1 opacity-50">PDF loading failed</p>
                </div>
            )}
        </div>
    );
}
