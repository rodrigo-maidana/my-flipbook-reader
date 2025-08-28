"use client";

import { useCallback, useEffect, useState } from "react";
import { loadPdfJs, renderPageToBlobURL } from "@/lib/pdf";
import type { PageImage } from "@/types";

type State = {
    pages: PageImage[] | null;
    loading: boolean;
    error: string | null;
};

export function usePdfImages(pdfUrl: string, targetWidth: number) {
    const [state, setState] = useState<State>({
        pages: null,
        loading: false,
        error: null,
    });
    const [url, setUrl] = useState<string>(pdfUrl);

    const load = useCallback(async () => {
        try {
            setState((s) => ({ ...s, loading: true, error: null }));
            const lib = await loadPdfJs();
            const task = lib.getDocument(url);
            const pdf = await task.promise;

            const imgs: PageImage[] = [];
            for (let p = 1; p <= pdf.numPages; p++) {
                const page = await pdf.getPage(p);
                const out = await renderPageToBlobURL(page, targetWidth);
                imgs.push(out);
            }
            setState({ pages: imgs, loading: false, error: null });
        } catch (e) {
            console.error(e);
            setState({
                pages: null,
                loading: false,
                error: "No se pudo cargar el PDF. Verifica la URL o el archivo.",
            });
        }
    }, [targetWidth, url]);

    useEffect(() => {
        load();
    }, [load]);

    const setFile = (f: File | null) => {
        if (!f) return;
        const blobUrl = URL.createObjectURL(f);
        setUrl(blobUrl);
    };

    return { ...state, setUrl, setFile, reload: load };
}
