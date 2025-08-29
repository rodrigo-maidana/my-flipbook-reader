"use client";

import { useEffect, useRef, useState } from "react";
import Flipbook from "@/components/Flipbook";
import type { PageImage } from "@/types";

export default function Page() {
    const [pages, setPages] = useState<PageImage[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);

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
        const updateWidth = () => {
            setContainerWidth(containerRef.current?.clientWidth ?? window.innerWidth);
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        document.addEventListener("fullscreenchange", updateWidth);
        return () => {
            window.removeEventListener("resize", updateWidth);
            document.removeEventListener("fullscreenchange", updateWidth);
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
        <div className="min-h-screen w-screen">
            <main className="mx-auto w-full px-2 pb-16 pt-6">
                <div
                    ref={containerRef}
                    className="mx-auto flex w-full justify-center rounded-2xl border bg-white p-2 shadow-sm"
                >
                    {error && <div className="p-6 text-center text-red-600">{error}</div>}
                    {!pages && !error && (
                        <div className="p-8 text-center text-neutral-500">Cargando páginas…</div>
                    )}
                    {pages && pages.length > 0 && (
                        <Flipbook pages={pages} containerWidth={containerWidth} />
                    )}
                </div>
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={enterFullscreen}
                        className="rounded-full bg-indigo-600 px-5 py-2 text-white shadow hover:bg-indigo-500"
                    >
                        Pantalla completa
                    </button>
                </div>
            </main>
        </div>
    );
}
