"use client";

import { useEffect, useRef, useState } from "react";
import Flipbook from "@/components/Flipbook";
import type { PageImage } from "@/types";

export default function Page() {
    const [pages, setPages] = useState<PageImage[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        const urls = Array.from({ length: 38 }, (_, i) => `/images/Mesa-${String(i + 1).padStart(2, "0")}.png`);
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
                setError("No se pudieron cargar las imágenes.");
            });
    }, []);

    // 🧭 Medimos el contenedor con ResizeObserver (robusto en rotación)
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
        window.addEventListener("orientationchange", bump);
        bump(); // primer cálculo

        return () => {
            ro.disconnect();
            window.removeEventListener("orientationchange", bump);
        };
    }, []);

    const enterFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        if (el.requestFullscreen) el.requestFullscreen();
    };

    // Plan B: fuerza remount si un navegador no actualiza internamente
    const remountKey = `${containerWidth}x${containerHeight}`;

    return (
        <div
            ref={containerRef}
            className="relative flex h-screen w-screen flex-col items-center justify-start overflow-y-auto"
        >
            {error && <div className="p-6 text-center text-red-600">{error}</div>}
            {!pages && !error && <div className="p-8 text-center text-neutral-500">Cargando páginas…</div>}

            {pages && pages.length > 0 && (
                <div className="flex-1 flex items-center justify-center w-full">
                    <Flipbook
                        key={remountKey}
                        pages={pages}
                        containerWidth={containerWidth}
                        containerHeight={containerHeight}
                    />
                </div>
            )}

            <button
                onClick={enterFullscreen}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 transform rounded-full bg-indigo-600 px-5 py-2 text-white shadow hover:bg-indigo-500"
            >
                Pantalla completa
            </button>
        </div>
    );
}
