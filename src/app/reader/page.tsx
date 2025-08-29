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

    useEffect(() => {
        const updateSize = () => {
            setContainerWidth(containerRef.current?.clientWidth ?? window.innerWidth);
            setContainerHeight(containerRef.current?.clientHeight ?? window.innerHeight);
        };
        updateSize();
        window.addEventListener("resize", updateSize);
        document.addEventListener("fullscreenchange", updateSize);
        return () => {
            window.removeEventListener("resize", updateSize);
            document.removeEventListener("fullscreenchange", updateSize);
        };
    }, []);

    const enterFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        if (el.requestFullscreen) {
            el.requestFullscreen();
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative flex h-screen w-screen flex-col items-center justify-start overflow-y-auto"
        >
            {error && <div className="p-6 text-center text-red-600">{error}</div>}
            {!pages && !error && <div className="p-8 text-center text-neutral-500">Cargando páginas…</div>}
            {pages && pages.length > 0 && (
                <Flipbook
                    pages={pages}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                />
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
