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

    // Página actual => decide cuántas "líneas" (slivers) mostrar a cada lado
    const [pageIndex, setPageIndex] = useState(0);

    // Reglas de tamaño del libro
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

    // Forzar update de tamaño interno
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            try {
                bookRef.current?.pageFlip().update({ width: size.w, height: size.h });
            } catch { }
        });
        return () => cancelAnimationFrame(id);
    }, [size.w, size.h]);

    // Navegación con teclado
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') bookRef.current?.pageFlip().flipPrev();
            if (e.key === 'ArrowRight') bookRef.current?.pageFlip().flipNext();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Inicializa pageIndex por si arranca en otra página
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

    // ---------- LÓGICA DE APARICIÓN PROGRESIVA ----------
    // Máximo de líneas
    const MAX = 4;

    // Lado izquierdo (profundidad desde el inicio con cover):
    // 0 (cover y 2–3), 1 (4–5), 2 (6–7), 3 (8–9), 4 (10–11 en adelante)
    const leftCount = Math.max(0, Math.min(MAX, Math.floor((pageIndex - 1) / 2)));

    // Lado derecho: simétrico hacia el final (considera la contratapa sola)
    // 0 en última vista (N-2,N-1) y última página (N-1),
    // 1 en (N-4,N-3), ... hasta llegar a 4 y mantener.
    const rightCount = Math.max(0, Math.min(MAX, Math.floor((pages.length - 2 - pageIndex) / 2)));

    // Render auxiliar de slivers según cantidad
    const sliverClasses = ['s1', 's2', 's3', 's4'];

    return (
        <div className="relative flex h-full w-full items-center justify-center">
            {/* Wrapper del libro + borde de “hojas” */}
            <div className="book-wrap relative" style={{ width: size.w * 2, height: size.h, overflow: 'visible' }}>
                {/* Grosor escalonado dinámico */}
                {leftCount > 0 && (
                    <div className="edge edge-left" aria-hidden>
                        {sliverClasses.slice(0, leftCount).map((c) => (
                            <span key={`L-${c}`} className={`sliver ${c}`} />
                        ))}
                        <span className="trim-line" />
                    </div>
                )}

                {rightCount > 0 && (
                    <div className="edge edge-right" aria-hidden>
                        {sliverClasses.slice(0, rightCount).map((c) => (
                            <span key={`R-${c}`} className={`sliver ${c}`} />
                        ))}
                        <span className="trim-line" />
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
                    onFlip={(e: any) => setPageIndex(e.data)}   // ← actualiza el índice
                >
                    {pages.map((p, idx) => (
                        <article key={idx} className="page shadow">
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

            {/* Flechas laterales */}
            <button
                aria-label="Anterior"
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
        /* Páginas */
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

        /* El flipbook va por encima del “grosor” */
        .book-wrap :global(.flipbook) { position: relative; z-index: 2; }

        /* --- Grosor escalonado (más alto hacia el centro) --- */
        .edge {
          position: absolute;
          z-index: 1;                 /* debajo del libro */
          top: 6px;
          bottom: 6px;
          width: 24px;                /* ancho del bloque de hojas */
          pointer-events: none;
        }
        .edge-left  { left:  -18px; border-radius: 12px 0 0 12px; }
        .edge-right { right: -18px; border-radius: 0 12px 12px 0; }

        /* Barras */
        .sliver {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          border-radius: inherit;
          background: linear-gradient(#c1c6cd, #aab0b8);
          border-left: 1px solid #9ea4ad;
          border-right: 1px solid #ffffff;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.45);
        }
        .s1 { height: 102%; }
        .s2 { height: 101%; }
        .s3 { height: 100%; }
        .s4 { height:  99%; }

        /* Posiciones: la más alta pegada al libro (centro) */
        .edge-right .s1 { left:  7px; }
        .edge-right .s2 { left: 11px; }
        .edge-right .s3 { left: 15px; }
        .edge-right .s4 { left: 19px; }

        .edge-left  .s1 { right: 7px; }
        .edge-left  .s2 { right: 11px; }
        .edge-left  .s3 { right: 15px; }
        .edge-left  .s4 { right: 19px; }

        .edge-right .trim-line { left: 0;  background: linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.18)); }
        .edge-left  .trim-line { right: 0; background: linear-gradient(to left,  rgba(0,0,0,0.35), rgba(0,0,0,0.18)); }
      `}</style>
        </div>
    );
}
