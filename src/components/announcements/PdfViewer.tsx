'use client';
import { useEffect, useRef, useState } from 'react';
import { getProxyUrl } from '@/lib/image';

interface PdfViewerProps {
    url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [pdf, setPdf] = useState<any>(null);

    // Load PDF Document
    useEffect(() => {
        let isMounted = true;
        
        const loadPdf = async () => {
            try {
                if (!(window as any).pdfjsLib) {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                    document.head.appendChild(script);
                    await new Promise((resolve) => script.onload = resolve);
                }

                const pdfjsLib = (window as any).pdfjsLib;
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

                const loadingTask = pdfjsLib.getDocument({
                    url: getProxyUrl(url),
                    withCredentials: true,
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                    cMapPacked: true,
                });
                
                const loadedPdf = await loadingTask.promise;
                
                if (isMounted) {
                    setPdf(loadedPdf);
                    setNumPages(loadedPdf.numPages);
                    setLoading(false);
                }
            } catch (err) {
                console.error('PDF Load error:', err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        loadPdf();
        return () => { isMounted = false; };
    }, [url]);

    if (error) {
        return <div className="text-center text-red-400 p-8 font-bold">PDFの読み込みに失敗しました</div>;
    }

    if (loading || !pdf) {
        return (
            <div className="flex flex-col justify-center items-center p-20 gap-4">
                <div className="w-10 h-10 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin"></div>
                <span className="text-zinc-500 font-bold text-sm">ドキュメントを読み込み中...</span>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center gap-4 py-4 bg-transparent">
            {Array.from(new Array(numPages), (_, index) => (
                <PdfPage key={`page_${index + 1}`} pageNumber={index + 1} pdf={pdf} />
            ))}
        </div>
    );
}

function PdfPage({ pageNumber, pdf }: { pageNumber: number, pdf: any }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rendering, setRendering] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let renderTask: any = null;

        const renderPage = async () => {
            try {
                const page = await pdf.getPage(pageNumber);
                if (!isMounted) return;

                // Scale factor 2.0 gives crisp text on most mobile/desktop retina displays
                const scale = 2.0; 
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas) return;
                const context = canvas.getContext('2d', { alpha: false }); // optimize
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                renderTask = page.render({
                    canvasContext: context,
                    viewport: viewport
                });

                await renderTask.promise;
                if (isMounted) setRendering(false);
            } catch (err: any) {
                if (err.name !== 'RenderingCancelledException' && isMounted) {
                    console.error('Page render error', err);
                }
            }
        };

        renderPage();

        return () => {
            isMounted = false;
            if (renderTask) renderTask.cancel();
        };
    }, [pdf, pageNumber]);

    return (
        <div className="relative shadow-[0_10px_30px_rgba(0,0,0,0.4)] bg-white w-full max-w-[1200px] aspect-[1/1.414] rounded-sm sm:rounded-md overflow-hidden">
            {rendering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin mb-2"></div>
                    <span className="text-gray-400 text-xs font-bold">{pageNumber} ページ目を描画中...</span>
                </div>
            )}
            <canvas ref={canvasRef} className={`w-full h-auto block transition-opacity duration-500 ${rendering ? 'opacity-0' : 'opacity-100'}`} />
        </div>
    );
}
