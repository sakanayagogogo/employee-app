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
                // 1. ライブラリを動的インポート
                const pdfjsModule = await import('pdfjs-dist');
                const pdfjsLib = (pdfjsModule as any).default || pdfjsModule;
                
                // 2. ワーカーの設定（バージョン不一致を避けるため、動的に取得）
                // ※バージョン番号を固定せず、ライブラリ自身のプロパティから取得
                const version = pdfjsLib.version;
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

                // 3. ドキュメント読み込み
                const loadingTask = pdfjsLib.getDocument({
                    url: getProxyUrl(url),
                    // 日本語フォントなどのために標準のcMapを使用
                    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/cmaps/`,
                    cMapPacked: true,
                });
                
                const pdf = await loadingTask.promise;
                
                if (!isMounted) return;
                const page = await pdf.getPage(1);
                
                // 4. レンダリング設定（高画質化のために scale を調整）
                const viewport = page.getViewport({ scale: 1.5 });
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
                // エラー内容がコンソールに出るため、開発環境であればそこで詳細がわかります
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
            
            <canvas 
                ref={canvasRef} 
                className={`w-full h-full object-contain shadow-sm transition-opacity duration-500 ${loading || error ? 'opacity-0' : 'opacity-100'}`} 
            />

            {error && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-2 text-center">
                    <span className="text-2xl mb-1">📄</span>
                    <span className="text-[9px] font-bold uppercase tracking-tight leading-tight">
                        PREVIEW<br/>ERROR
                    </span>
                    <p className="text-[7px] mt-1 opacity-50">PDF format or CORS issue</p>
                </div>
            )}
        </div>
    );
}
