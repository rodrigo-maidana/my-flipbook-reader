"use client";

type Props = {
    onPickFile: (file: File | null) => void;
    onFullscreen: () => void;
};

export default function Toolbar({ onPickFile, onFullscreen }: Props) {
    return (
        <header className="sticky top-0 z-10 w-full border-b bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
                <div className="font-semibold tracking-wide">Flipbook PDF</div>
                <div className="ml-auto flex items-center gap-2 text-sm">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 hover:bg-neutral-50">
                        <span>Subir PDF</span>
                        <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                        />
                    </label>
                    <button
                        onClick={onFullscreen}
                        className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-white text-sm md:text-base shadow hover:bg-indigo-500"
                    >
                        <span className="text-lg">⛶</span>
                        <span>Pantalla completa</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
