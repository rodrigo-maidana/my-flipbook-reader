// src/components/Flipbook.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PageImage } from '@/types';
import styles from './Flipbook.module.css';

const ReactPageFlip = dynamic(() => import('react-pageflip'), { ssr: false }) as unknown as typeof import('react-pageflip').default;

type Props = {
    pages: PageImage[];
    containerWidth?: number;
    containerHeight?: number;
};

interface FlipBookHandle {
    pageFlip(): {
        flipPrev: () => void;
        flipNext: () => void;
        update: (opts: { width?: number; height?: number }) => void;
        getCurrentPageIndex?: () => number;
    };
}

export default function Flipbook({ pages, containerWidth, containerHeight }: Props) {
    const bookRef = useRef<FlipBookHandle | null>(null);
    const [pageIndex, setPageIndex] = useState(0);

    // calculo de tamaño del libro
    const computeSize = useCallback(() => {
        const first = pages[0];
        const ratio = first.height / first.width;

        const screenW =
            containerWidth && containerWidth > 0
                ? containerWidth
                : typeof window !== 'undefined'
                    ? window.innerWidth
                    : first.width * 2;

        const screenH =
            containerHeight && containerHeight > 0
                ? containerHeight
                : typeof window !== 'undefined'
                    ? window.innerHeight
                    : first.height;

        const wByWidth = Math.floor((screenW - 64) / 2);
        const wByHeight = Math.floor((screenH - 32) / ratio);
        const w = Math.max(180, Math.min(wByWidth, wByHeight));
        const h = Math.round(w * ratio);

        return { w, h };
    }, [pages, containerWidth, containerHeight]);

    const [size, setSize] = useState<{ w: number; h: number }>(() => computeSize());

    useEffect(() => {
        setSize(computeSize());
        const onResize = () => setSize(computeSize());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [computeSize]);

    // forzar update de tamaño interno
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            try {
                bookRef.current?.pageFlip().update({ width: size.w, height: size.h });
            } catch { }
        });
        return () => cancelAnimationFrame(id);
    }, [size.w, size.h]);

    // navegacion con teclado
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') bookRef.current?.pageFlip().flipPrev();
            if (e.key === 'ArrowRight') bookRef.current?.pageFlip().flipNext();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // inicializar pageIndex
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            try {
                const api: any = bookRef.current?.pageFlip();
                const cur = api?.getCurrentPageIndex?.() ?? 0;
                setPageIndex(cur);
            } catch { }
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    // logica de aparicion progresiva
    // soporta hasta 10 lineas por lado
    const MAX = 10;

    // lado izquierdo
    const leftCount = Math.max(0, Math.min(MAX, Math.floor((pageIndex - 1) / 2)));

    // lado derecho
    const rightCount = Math.max(0, Math.min(MAX, Math.floor((pages.length - 2 - pageIndex) / 2)));

    // clases s1 a s10
    const sliverClasses = Array.from({ length: MAX }, (_, i) => `s${i + 1}`);

    return (
        <div className={styles.container}>
            <div className={styles.bookWrap} style={{ width: size.w * 2, height: size.h }}>
                {leftCount > 0 && (
                    <div className={`${styles.edge} ${styles.edgeLeft}`} aria-hidden>
                        {sliverClasses.slice(0, leftCount).map((c) => (
                            <span key={`L-${c}`} className={`${styles.sliver} ${styles[c as keyof typeof styles]}`} />
                        ))}
                        <span className={styles.trimLine} />
                    </div>
                )}

                {rightCount > 0 && (
                    <div className={`${styles.edge} ${styles.edgeRight}`} aria-hidden>
                        {sliverClasses.slice(0, rightCount).map((c) => (
                            <span key={`R-${c}`} className={`${styles.sliver} ${styles[c as keyof typeof styles]}`} />
                        ))}
                        <span className={styles.trimLine} />
                    </div>
                )}

                <ReactPageFlip
                    ref={bookRef}
                    width={size.w}
                    height={size.h}
                    showCover
                    usePortrait={false}
                    flippingTime={650}
                    maxShadowOpacity={0.45}
                    className={styles.flipbook}
                    startPage={0}
                    size="fixed"
                    minWidth={120}
                    minHeight={120}
                    style={{}}
                    maxWidth={Number.MAX_SAFE_INTEGER}
                    maxHeight={Number.MAX_SAFE_INTEGER}
                    drawShadow
                    useMouseEvents
                    clickEventForward
                    swipeDistance={28}
                    startZIndex={0}
                    autoSize={false}
                    mobileScrollSupport
                    showPageCorners
                    disableFlipByClick={false}
                    onFlip={(e: any) => setPageIndex(e.data)}
                >
                    {pages.map((p, idx) => (
                        <article key={idx} className={`${styles.page} ${styles.shadow}`}>
                            <img
                                src={p.url}
                                width={p.width}
                                height={p.height}
                                alt={idx === 0 ? 'Portada' : `Página ${idx}`}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                draggable={false}
                            />
                        </article>
                    ))}
                </ReactPageFlip>
            </div>

            <button
                aria-label="Anterior"
                onClick={() => bookRef.current?.pageFlip().flipPrev()}
                className="group absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-black/10 hover:bg-white hover:shadow-xl active:scale-95 backdrop-blur"
            >
                <span className="grid h-10 w-10 place-items-center rounded-full transition-transform group-hover:-translate-x-0.5">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            <button
                aria-label="Siguiente"
                onClick={() => bookRef.current?.pageFlip().flipNext()}
                className="group absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-black/10 hover:bg-white hover:shadow-xl active:scale-95 backdrop-blur"
            >
                <span className="grid h-10 w-10 place-items-center rounded-full transition-transform group-hover:translate-x-0.5">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>
        </div>
    );
}
