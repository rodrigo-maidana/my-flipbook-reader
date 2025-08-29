"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { PageImage } from "@/types";

const ReactPageFlip = dynamic(() => import("react-pageflip"), { ssr: false }) as unknown as typeof import("react-pageflip").default;

type Props = {
    pages: PageImage[];
    containerWidth?: number;
    containerHeight?: number;
};

interface FlipBookHandle {
    pageFlip(): {
        flipPrev: () => void;
        flipNext: () => void;
    };
}

export default function Flipbook({ pages, containerWidth, containerHeight }: Props) {
    const bookRef = useRef<FlipBookHandle | null>(null);

    const computeSize = useCallback(() => {
        const first = pages[0];
        const ratio = first.height / first.width; // height / width of a single page
        const screenW = containerWidth && containerWidth > 0 ? containerWidth : typeof window !== "undefined" ? window.innerWidth : first.width * 2;
        const screenH = containerHeight && containerHeight > 0 ? containerHeight : typeof window !== "undefined" ? window.innerHeight : first.height;
        const wByWidth = Math.floor(screenW / 2);
        const wByHeight = Math.floor(screenH / ratio);
        const w = Math.min(wByWidth, wByHeight);
        const h = Math.round(w * ratio);
        return { w, h };
    }, [pages, containerWidth, containerHeight]);

    const [size, setSize] = useState<{ w: number; h: number }>(() => computeSize());

    useEffect(() => {
        setSize(computeSize());
        const onResize = () => {
            setSize(computeSize());
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [computeSize]);

    return (
        <div className="flex h-full w-full flex-col items-center justify-start">
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
                minWidth={120}
                minHeight={120}
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
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
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