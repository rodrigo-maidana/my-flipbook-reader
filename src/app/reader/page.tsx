"use client";

import { Suspense, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Flipbook from "@/components/Flipbook";
import { usePdfImages } from "@/hooks/usePdfImages";

function ReaderContent() {
    const params = useSearchParams();
    const pdf = params.get("file") ?? "/cosmogonia_pai_tavytera.pdf";
    const containerRef = useRef<HTMLDivElement | null>(null);

    const targetPageWidth = useMemo(() => {
        if (!containerRef.current) return 900;
        const cw = containerRef.current.clientWidth;
        if (cw > 1200) return 900;
        return Math.max(480, Math.floor(cw * 0.42));
    }, [containerRef.current?.clientWidth]);

    const { pages, loading, error } = usePdfImages(pdf, targetPageWidth);

    const enterFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        if (el.requestFullscreen) {
            el.requestFullscreen();
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center bg-neutral-100 p-2">
            <h1 className="mt-2 text-2xl font-bold">Cosmogonía Paĩ Tavyterã</h1>
            <p className="mb-4 text-sm text-neutral-600">Poner el celular en horizontal para mejor visualización</p>
            <div ref={containerRef} className="flex w-full justify-center">
                {error && <div className="p-6 text-center text-red-600">{error}</div>}
                {loading && <div className="p-8 text-center text-neutral-500">Procesando páginas…</div>}
                {!loading && pages && pages.length > 0 && <Flipbook pages={pages} />}
            </div>
            <button
                onClick={enterFullscreen}
                className="mt-4 flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-white text-lg shadow hover:bg-indigo-500"
            >
                <span className="text-xl">⛶</span>
                Pantalla completa
            </button>
        </div>
    );
}

export default function ReaderPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-neutral-500">Cargando…</div>}>
            <ReaderContent />
        </Suspense>
    );
}