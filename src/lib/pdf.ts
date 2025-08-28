// Carga perezosa de pdf.js usando el build legacy (evita módulo ESM del worker)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pdfjs: any = null;

export async function loadPdfJs() {
    if (_pdfjs) return _pdfjs;

    // Import legacy build para compatibilidad amplia
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lib: any = await import("pdfjs-dist/legacy/build/pdf");

    // Apuntar al worker auto-hosteado en /public
    lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

    _pdfjs = lib;
    return lib;
}

export async function renderPageToBlobURL(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    page: any,
    targetWidth: number
): Promise<{ url: string; width: number; height: number }> {
    const viewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / viewport.width;
    const scaled = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = Math.floor(scaled.width);
    canvas.height = Math.floor(scaled.height);

    await page.render({ canvasContext: ctx!, viewport: scaled }).promise;

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob!);
            resolve({ url, width: canvas.width, height: canvas.height });
        }, "image/png");
    });
}
