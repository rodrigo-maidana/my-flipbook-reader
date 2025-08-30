// src/components/Flipbook.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PageImage } from '@/types';

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
    };
}

export default function Flipbook({ pages, containerWidth, containerHeight }: Props) {
    const bookRef = useRef<FlipBookHandle | null>(null);

    // Respeta el ajuste del sistema operativo
    const [reduceMotion, setReduceMotion] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (!mq) return;
        setReduceMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
        mq.addEventListener?.('change', onChange);
        return () => mq.removeEventListener?.('change', onChange);
    }, []);

    const computeSize = useCallback(() => {
        const first = pages[0];
        const ratio = first.height / first.width;

        // Medidas “seguras” para evitar negativos/valores raros
        const safeW =
            containerWidth && containerWidth > 0
                ? containerWidth
                : typeof window !== 'undefined'
                    ? window.innerWidth
                    : first.width * 2;

        const safeH =
            containerHeight && containerHeight > 0
                ? containerHeight
                : typeof window !== 'undefined'
                    ? window.innerHeight
                    : first.height;

        const screenW = Math.max(200, safeW);
        const screenH = Math.max(200, safeH);

        // Doble página: ancho total del libro = 2 * w
        const wByWidth = Math.floor((screenW - 64) / 2); // margen para flechas
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

    useEffect(() => {
        const id = requestAnimationFrame(() => {
            try {
                bookRef.current?.pageFlip().update({ width: size.w, height: size.h });
            } catch { }
        });
        return () => cancelAnimationFrame(id);
    }, [size.w, size.h]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') bookRef.current?.pageFlip().flipPrev();
            if (e.key === 'ArrowRight') bookRef.current?.pageFlip().flipNext();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="relative flex h-full w-full items-center justify-center">
            <ReactPageFlip
                ref={bookRef}
                width={size.w}
                height={size.h}
                showCover
                usePortrait={false}
                flippingTime={reduceMotion ? 0 : 650}
                maxShadowOpacity={0.45}
                className="flipbook"
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
            >
                {pages.map((p, idx) => (
                    <article key={idx} className="page shadow">
                        <img
                            src={p.url}
                            width={p.width}
                            height={p.height}
                            alt={idx === 0 ? 'Portada' : `Página ${idx}`}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            loading={idx < 2 ? 'eager' : 'lazy'}
                            decoding="async"
                            draggable={false}
                        />
                    </article>
                ))}
            </ReactPageFlip>

            {/* Flechas laterales */}
            <button
                aria-label="Anterior"
                title="Anterior"
                onClick={() => bookRef.current?.pageFlip().flipPrev()}
                className={`
          group absolute left-3 top-1/2 -translate-y-1/2 z-20
          rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-black/10
          hover:bg-white hover:shadow-xl active:scale-95 backdrop-blur
        `}
            >
                <span
                    className={`
            grid h-10 w-10 place-items-center rounded-full
            transition-transform group-hover:-translate-x-0.5
          `}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            <button
                aria-label="Siguiente"
                title="Siguiente"
                onClick={() => bookRef.current?.pageFlip().flipNext()}
                className={`
          group absolute right-3 top-1/2 -translate-y-1/2 z-20
          rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-black/10
          hover:bg-white hover:shadow-xl active:scale-95 backdrop-blur
        `}
            >
                <span
                    className={`
            grid h-10 w-10 place-items-center rounded-full
            transition-transform group-hover:translate-x-0.5
          `}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            <style jsx>{`
        .flipbook .page {
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
        }
        .flipbook .page:after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(120% 100% at 50% 50%, rgba(0, 0, 0, 0.08) 0%, transparent 55%);
          opacity: 0.07;
        }
        .shadow {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
        }
      `}</style>
        </div>
    );
}
