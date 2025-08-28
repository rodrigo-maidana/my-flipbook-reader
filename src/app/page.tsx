"use client";

import { useMemo, useRef } from "react";
import Flipbook from "@/components/Flipbook";
import Toolbar from "@/components/Toolbar";
import { usePdfImages } from "@/hooks/usePdfImages";

/**
 * Por defecto carga /sample.pdf desde /public.
 * Podés subir otro PDF desde la barra superior.
 */
export default function Page() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cálculo del ancho objetivo por página (calidad vs rendimiento)
  const targetPageWidth = useMemo(() => {
    if (!containerRef.current) return 900;
    const cw = containerRef.current.clientWidth;
    if (cw > 1200) return 900;
    return Math.max(480, Math.floor(cw * 0.42));
  }, [containerRef.current?.clientWidth]);

  const { pages, loading, error, setFile } = usePdfImages("/cosmogonia_pai_tavytera.pdf", targetPageWidth);

  const enterFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    }
  };

  return (
    <div className="min-h-screen w-full">
      <Toolbar onPickFile={setFile} onFullscreen={enterFullscreen} />

      <main className="mx-auto max-w-6xl px-2 pb-16 pt-6">
        <div className="mb-4 text-center text-sm text-neutral-600">
          Colocá tu PDF en <code className="rounded bg-neutral-200 px-1">/public/sample.pdf</code> o usá “Subir PDF”.
        </div>

        <div
          ref={containerRef}
          className="mx-auto flex w-full justify-center rounded-2xl border bg-white p-2 shadow-sm"
        >
          {error && <div className="p-6 text-center text-red-600">{error}</div>}
          {loading && <div className="p-8 text-center text-neutral-500">Procesando páginas…</div>}
          {!loading && pages && pages.length > 0 && <Flipbook pages={pages} />}
        </div>
      </main>
    </div>
  );
}