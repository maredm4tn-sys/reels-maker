"use client";

import { useState, useEffect } from "react";
import { useVideoStore } from "@/store/useVideoStore";
import { Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Panel } from "./AudioPanel";

export function ExportPanel() {
    const exportOptions = useVideoStore((state) => state.exportOptions);
    const setExportOptions = useVideoStore((state) => state.setExportOptions);

    const [isRendering, setIsRendering] = useState(false);
    const [progress, setProgress] = useState(0);
    const [renderStatus, setRenderStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // Get full state to send to renderer
    const visuals = useVideoStore((state) => state.visuals);
    const audio = useVideoStore((state) => state.audio);
    const text = useVideoStore((state) => state.text);

    // Simulate rendering progress bar visually while server processes
    useEffect(() => {
        if (isRendering && renderStatus === 'processing') {
            const interval = setInterval(() => {
                setProgress((prev) => {
                    // Stop at 95% and wait for server to finish
                    if (prev >= 95) return 95;
                    const increment = prev < 50 ? Math.random() * 8 : Math.random() * 3;
                    return Math.min(prev + increment, 95);
                });
            }, 500);

            return () => clearInterval(interval);
        }
    }, [isRendering, renderStatus]);

    const handleExport = async () => {
        setRenderStatus('processing');
        setIsRendering(true);
        setProgress(0);
        setDownloadUrl(null);

        try {
            // 1. Send all state to our backend API to render
            const res = await fetch('/api/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visuals, audio, text, exportOptions })
            });

            const data = await res.json();

            if (data.success) {
                // 2. Setup the final success UI
                setProgress(100);
                setRenderStatus('success');
                setDownloadUrl(data.downloadUrl);
            } else {
                setRenderStatus('error');
            }

        } catch (e) {
            console.error(e);
            setRenderStatus('error');
        } finally {
            setIsRendering(false);
        }
    };

    const resetExport = () => {
        setRenderStatus('idle');
        setProgress(0);
        setDownloadUrl(null);
    };

    return (
        <Panel title="إعدادات التصدير" icon={<Download className="w-4 h-4 text-primary" />}>
            <div className="space-y-5">

                {/* Render Settings (Hide during processing) */}
                {renderStatus === 'idle' && (
                    <>
                        <div>
                            <label className="text-xs text-muted-foreground mb-2 block">جودة الفيديو</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['480p', '720p', '1080p', '2K', '4K'] as const).map(quality => (
                                    <button
                                        key={quality}
                                        onClick={() => setExportOptions({ quality })}
                                        className={`py-1.5 text-xs rounded transition-colors ${exportOptions.quality === quality
                                            ? "bg-primary text-surface font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                                            : "bg-surface border border-border text-gray-400 hover:bg-surface-hover/20"
                                            }`}
                                    >
                                        {quality} {quality === '1080p' && <span className="block text-[9px] opacity-80">(موصى به)</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleExport}
                            className="w-full bg-primary/90 hover:bg-primary text-surface py-3 rounded-lg font-bold text-sm transition-all shadow-[0_4px_14px_0_rgba(234,179,8,0.39)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            تصدير الفيديو (MP4)
                        </button>
                    </>
                )}

                {/* Rendering State Overlay/Section */}
                {renderStatus !== 'idle' && (
                    <div className="bg-background/80 border border-border p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-4 py-8">

                        {renderStatus === 'processing' && (
                            <>
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg className="animate-spin text-primary w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="absolute text-xs font-bold text-gray-200">{Math.round(progress)}%</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-primary mb-1">جاري معالجة الفيديو...</h3>
                                    <p className="text-xs text-muted-foreground w-48 text-balance">
                                        يرجى عدم إغلاق هذه الصفحة حتى تكتمل عملية التصدير بجودة {exportOptions.quality}
                                    </p>
                                </div>
                            </>
                        )}

                        {renderStatus === 'success' && (
                            <>
                                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-green-500 mb-1">تم إنشاء الفيديو بنجاح!</h3>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        الفيديو جاهز الآن للتحميل والمشاركة
                                    </p>
                                </div>
                                <div className="w-full flex gap-2">
                                    {downloadUrl ? (
                                        <a
                                            href={downloadUrl}
                                            download="reels-video.mp4"
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={() => {
                                                setTimeout(resetExport, 1000);
                                            }}
                                            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-md text-sm font-bold transition-colors flex justify-center items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            تحميل الفيديو
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="flex-1 bg-green-600/50 text-white/50 py-2 rounded-md text-sm font-bold cursor-not-allowed"
                                        >
                                            تحميل الفيديو
                                        </button>
                                    )}
                                    <button
                                        onClick={resetExport}
                                        className="px-4 bg-surface border border-border text-gray-400 py-2 rounded-md text-sm hover:text-white transition-colors"
                                    >
                                        إغلاق
                                    </button>
                                </div>
                            </>
                        )}

                        {renderStatus === 'error' && (
                            <>
                                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-2">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-bold text-red-500 mb-1">حدث خطأ أثناء التصدير</h3>
                                <button
                                    onClick={resetExport}
                                    className="mt-2 text-xs text-gray-400 underline hover:text-white"
                                >
                                    حاول مرة أخرى
                                </button>
                            </>
                        )}

                    </div>
                )}
            </div>
        </Panel>
    );
}
