"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { PageImage } from "@/types";

const ReactPageFlip = dynamic(() => import("react-pageflip"), { ssr: false }) as any;

type Props = {
    pages: PageImage[];
};

export default function Flipbook({ pages }: Props) {
    const bookRef = useRef<any>(null);
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
                    flippingTime={700}
                    maxShadowOpacity={0.5}
                    className="flipbook"
                >
                    {pages.map((p, idx) => (
                        <article key={idx} className="page shadow">
                            <img
                                src={p.url}
                                width={p.width}
                                height={p.height}
                                alt={`Página ${idx + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        </article>
                    ))}
                </ReactPageFlip>

                <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                        className="rounded-xl border px-3 py-2 hover:bg-neutral-50"
                        onClick={() => bookRef.current?.pageFlip().flipPrev()}
                    >
                        ◀︎ Anterior
                    </button>
                    <button
                        className="rounded-xl border px-3 py-2 hover:bg-neutral-50"
                        onClick={() => bookRef.current?.pageFlip().flipNext()}
                    >
                        Siguiente ▶︎
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
