'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getProxyUrl } from '@/lib/image';

export const isImage = (url?: string) => {
    if (!url) return false;
    // プロキシURLの場合も考慮（url=... の部分をチェック）
    const targetUrl = url.includes('url=') ? decodeURIComponent(url.split('url=')[1]) : url;
    return /\.(jpg|jpeg|png|gif|webp|heic|svg)(\?|#|$)/i.test(targetUrl) || targetUrl.startsWith('data:image/');
};

interface TimelineGalleryProps {
    images: string[];
    annId: number;
    isModal?: boolean;
}

export default function TimelineGallery({ images, annId, isModal = false }: TimelineGalleryProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    const checkOverflow = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 10);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        checkOverflow();
        // Check again after a short delay since images/layout might take a moment to settle
        const timer = setTimeout(checkOverflow, 400);
        window.addEventListener('resize', checkOverflow);
        return () => {
            window.removeEventListener('resize', checkOverflow);
            clearTimeout(timer);
        };
    }, [images]);

    const handleScroll = () => {
        checkOverflow();
    };

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = scrollRef.current.clientWidth * 0.8;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    if (images.length === 0) return null;

    if (images.length === 1) {
        const url = images[0];
        const content = (
            <div className={`${isModal ? 'rounded-2xl' : 'mx-4 rounded-xl'} bg-white/50 overflow-hidden border border-gray-100 mb-4 group relative shadow-sm`}>
                <img 
                    src={getProxyUrl(url)} 
                    alt="" 
                    className={`w-full ${isModal ? 'h-auto max-h-[65vh] object-contain' : 'h-56 object-cover'} transition-transform duration-700 group-hover:scale-105`} 
                />
                {!isModal && (
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                )}
            </div>
        );

        if (isModal) return <a href={getProxyUrl(url)} target="_blank" rel="noopener noreferrer" className="cursor-zoom-in block outline-none">{content}</a>;
        return <Link href={`/announcements/${annId}`} className="block outline-none">{content}</Link>;
    }

    return (
        <div className={`relative group/gallery mb-4 w-full overflow-hidden select-none`}>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`flex flex-row flex-nowrap overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 ${isModal ? 'px-0' : 'px-4 pb-1'}`}
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {images.map((url, i) => (
                    <div 
                        key={i} 
                        className={`flex-none snap-center rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm relative group
                            ${isModal ? 'w-[92%] sm:w-[500px] h-[350px] sm:h-[500px]' : 'w-[290px] h-52'}
                        `}
                    >
                        {isModal ? (
                            <a href={getProxyUrl(url)} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-zoom-in outline-none">
                                <img src={getProxyUrl(url)} alt="" className="w-full h-full object-contain" />
                            </a>
                        ) : (
                            <Link href={`/announcements/${annId}`} className="block w-full h-full outline-none">
                                <img src={getProxyUrl(url)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                            </Link>
                        )}
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold tracking-wider z-10 shadow-lg">
                            {i + 1} / {images.length}
                        </div>
                    </div>
                ))}
                {/* Spacer at the end for better snapping/padding */}
                {!isModal && <div className="flex-none w-4 opacity-0" />}
            </div>

            {/* Navigation Arrows */}
            {showLeft && (
                <button
                    onClick={() => scroll('left')}
                    className={`absolute ${isModal ? 'left-4' : 'left-8'} top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 backdrop-blur shadow-2xl flex items-center justify-center text-gray-800 hover:bg-white hover:scale-110 active:scale-95 transition-all z-20 border border-gray-100/50`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
            )}
            {showRight && (
                <button
                    onClick={() => scroll('right')}
                    className={`absolute ${isModal ? 'right-4' : 'right-8'} top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 backdrop-blur shadow-2xl flex items-center justify-center text-gray-800 hover:bg-white hover:scale-110 active:scale-95 transition-all z-20 border border-gray-100/50`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
            )}
        </div>
    );
}
