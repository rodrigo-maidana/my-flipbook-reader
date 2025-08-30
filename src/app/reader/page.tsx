// src/app/reader/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Flipbook from '@/components/Flipbook';
import type { PageImage } from '@/types';

export default function Page() {
    const [pages, setPages] = useState<PageImage[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const urls = Array.from({ length: 38 }, (_, i) => `/images/Mesa-${String(i + 1).padStart(2, '0')}.png`);
        Promise.all(
            urls.map(
                (url) =>
                    new Promise<PageImage>((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
                        img.onerror = () => reject(new Error(`No se pudo cargar ${url}`));
                        img.src = url;
                    })
            )
        )
            .then(setPages)
            .catch((e) => {
                console.error(e);
                setError('No se pudieron cargar las imágenes.');
            });
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = Math.round(entry.contentRect?.width ?? el.clientWidth);
                const height = Math.round(entry.contentRect?.height ?? el.clientHeight);
                setContainerWidth(width);
                setContainerHeight(height);
            }
        });

        ro.observe(el);
        const bump = () => {
            setContainerWidth(el.clientWidth);
            setContainerHeight(el.clientHeight);
        };
        window.addEventListener('orientationchange', bump);
        bump();
        return () => {
            ro.disconnect();
            window.removeEventListener('orientationchange', bump);
        };
    }, []);

    const toggleFullscreen = () => {
        const el = containerRef.current as any;
        if (!el) return;
        const doc: any = document;

        if (doc.fullscreenElement === el || doc.webkitFullscreenElement === el) {
            if (doc.exitFullscreen) doc.exitFullscreen();
            else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
            return;
        }
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    };

    useEffect(() => {
        const handler = () => {
            const el = containerRef.current as any;
            const fsEl = (document as any).fullscreenElement || (document as any).webkitFullscreenElement;
            setIsFullscreen(fsEl === el);
        };
        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler);
        handler();
        return () => {
            document.removeEventListener('fullscreenchange', handler);
            document.removeEventListener('webkitfullscreenchange', handler);
        };
    }, []);

    const remountKey = `${containerWidth}x${containerHeight}`;

    return (
        <div
            ref={containerRef}
            // fondo blanco a pantalla completa
            className="relative flex h-[100dvh] w-[100dvw] items-center justify-center bg-white text-black"
        >
            {/* Stage full-bleed sin sombra ni borde */}
            <div className="relative mx-auto flex h-full w-full items-center justify-center p-4">
                <div className="book-stage absolute inset-0 flex items-center justify-center">
                    {error && <div className="p-6 text-center text-red-600">{error}</div>}
                    {!pages && !error && (
                        <div className="rounded-lg bg-neutral-100 px-6 py-3 text-neutral-600 shadow-inner">Cargando páginas…</div>
                    )}

                    {pages && pages.length > 0 && (
                        <Flipbook
                            key={remountKey}
                            pages={pages}
                            // clampeo para evitar negativos en pantallas muy pequeñas
                            containerWidth={Math.max(120, containerWidth - 32)}
                            containerHeight={Math.max(120, containerHeight - 32)}
                        />
                    )}

                    {/* spine opcional, muy sutil (puedes borrar este div si no lo querés) */}
                    <div
                        aria-hidden
                        className={`
            pointer-events-none absolute inset-y-8 left-1/2 w-16 -translate-x-1/2
            rounded-[999px] bg-gradient-to-r from-black/0 via-black/5 to-black/0
            blur-md opacity-40
          `}
                    />
                </div>
            </div>

            {/* Botón de fullscreen (simple, sin esquinas redondeadas) */}
            <div
                className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
                style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
            >
                <button
                    onClick={toggleFullscreen}
                    aria-pressed={isFullscreen}
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                    className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-white text-black border border-neutral-300 shadow-md hover:shadow-lg active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 rounded-none transition"
                >
                    {/* Icono */}
                    {isFullscreen ? (
                        // Icono "minimizar"
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6-18h4a2 2 0 0 1 2 2v4m0 6v4a2 2 0 0 1-2 2h-4"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            />
                        </svg>
                    ) : (
                        // Icono "expandir"
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M9 3H5a2 2 0 0 0-2 2v4M15 21h4a2 2 0 0 0 2-2v-4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            />
                        </svg>
                    )}

                    <span className="text-sm font-medium">
                        {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                    </span>
                </button>
            </div>
        </div>
    );
}
