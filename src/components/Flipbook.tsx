"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { PageImage } from "@/types";

const ReactPageFlip = dynamic(() => import("react-pageflip"), { ssr: false }) as unknown as typeof import("react-pageflip").default;

type Props = {
    pages: PageImage[];
};

interface FlipBookHandle {
    pageFlip(): {
        flipPrev: () => void;
        flipNext: () => void;
    };
}

export default function Flipbook({ pages }: Props) {
    const bookRef = useRef<FlipBookHandle | null>(null);
    const [size, setSize] = useState<{ w: number; h: number }>(() => {
        const first = pages[0];
        const ratio = first.height / first.width;
        const w = Math.min(900, first.width);
        return { w, h: Math.round(w * ratio) };
    });

    useEffect(() => {
        const onResize = () => {
            const first = pages[0];
            const ratio = first.height / first.width;
            const maxW = Math.min(first.width, Math.floor(window.innerWidth * 0.9));
            const w = Math.min(900, Math.max(420, maxW));
            setSize({ w, h: Math.round(w * ratio) });
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [pages]);

    return (
        <div className="flex w-full justify-center">
            <div className="max-w-full py-3">
                <ReactPageFlip
                    ref={bookRef}
                    width={size.w}
                    height={size.h}
                    showCover
                    usePortrait={false}
                    flippingTime={700}
                    maxShadowOpacity={0.5}
                    className="flipbook"
                    style={{}}
                    startPage={0}
                    size="fixed"
                    minWidth={320}
                    minHeight={240}
                    maxWidth={900}
                    maxHeight={1200}
                    drawShadow={true}
                    useMouseEvents={true}
                    clickEventForward={true}
                    swipeDistance={30}
                    startZIndex={0}
                    autoSize={false}
                    mobileScrollSupport={true}
                    showPageCorners={true}
                    disableFlipByClick={false}
                >
                    {pages.map((p, idx) => (
                        <article key={idx} className="page shadow">
                            <img
                                src={p.url}
                                width={p.width}
                                height={p.height}
                                alt={idx === 0 ? "Portada" : `Página ${idx}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        </article>
                    ))}
                </ReactPageFlip>

                <div className="mt-4 flex items-center justify-center gap-4">
                    <button
                        className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-white shadow hover:bg-indigo-500"
                        onClick={() => bookRef.current?.pageFlip().flipPrev()}
                    >
                        ◀︎ <span className="hidden sm:inline">Anterior</span>
                    </button>
                    <button
                        className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-white shadow hover:bg-indigo-500"
                        onClick={() => bookRef.current?.pageFlip().flipNext()}
                    >
                        <span className="hidden sm:inline">Siguiente</span> ▶︎
                    </button>
                </div>
            </div>

            <style jsx>{`
        .flipbook .page {
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
        }
        .shadow {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
        }
      `}</style>
        </div>
    );
}