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
    const [isFullscreen, setIsFullscreen] = useState(false);

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

    // 🔲 Toggle fullscreen (con fallback para Safari)
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

    // Escucha cambios de fullscreen para actualizar la UI
    useEffect(() => {
        const handler = () => {
            const el = containerRef.current as any;
            const fsEl = (document as any).fullscreenElement || (document as any).webkitFullscreenElement;
            setIsFullscreen(fsEl === el);
        };
        document.addEventListener("fullscreenchange", handler);
        // Safari
        document.addEventListener("webkitfullscreenchange", handler);
        handler();
        return () => {
            document.removeEventListener("fullscreenchange", handler);
            document.removeEventListener("webkitfullscreenchange", handler);
        };
    }, []);

    // Plan B: fuerza remount si un navegador no actualiza internamente
    const remountKey = `${containerWidth}x${containerHeight}`;

    return (
        <div
            ref={containerRef}
            // Fondo SIEMPRE blanco + texto negro. Cubrimos viewport con dvh/dvw para móviles.
            className="relative flex h-[100dvh] w-[100dvw] flex-col items-center justify-start overflow-y-auto bg-white text-black"
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
                onClick={toggleFullscreen}
                // z-50 para que nunca quede por detrás del flipbook; foco visible para accesibilidad
                className="fixed bottom-4 left-1/2 -translate-x-1/2 transform rounded-full bg-indigo-600 px-5 py-2 text-white shadow hover:bg-indigo-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 z-50"
                // Respeta el notch en iOS
                style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
                aria-pressed={isFullscreen}
            >
                {isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            </button>
        </div>
    );
}
