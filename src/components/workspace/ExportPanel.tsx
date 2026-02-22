"use client";

import { useState, useEffect } from "react";
import { useVideoStore } from "@/store/useVideoStore";
import { Download, CheckCircle2, AlertCircle, Loader2, Terminal } from "lucide-react";
import { Panel } from "./AudioPanel";

export function ExportPanel() {
    const exportOptions = useVideoStore((state) => state.exportOptions);
    const setExportOptions = useVideoStore((state) => state.setExportOptions);

    const [isRendering, setIsRendering] = useState(false);
    const [progress, setProgress] = useState(0);
    const [renderStatus, setRenderStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
    const [isSnapshotting, setIsSnapshotting] = useState(false);

    // Get full state to send to renderer
    const visuals = useVideoStore((state) => state.visuals);
    const audio = useVideoStore((state) => state.audio);
    const text = useVideoStore((state) => state.text);
    const currentFrame = useVideoStore((state) => state.currentFrame);

    // Simulate rendering progress bar visually while server processes
    useEffect(() => {
        if (isRendering && renderStatus === 'processing') {
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 95) return 95;
                    const increment = prev < 50 ? Math.random() * 8 : Math.random() * 3;
                    return Math.min(prev + increment, 95);
                });
            }, 500);

            return () => clearInterval(interval);
        }
    }, [isRendering, renderStatus]);

    const handleExport = async () => {
        // 0. Pre-export validation for server-side rendering
        if (audio.sourceUrl?.startsWith('blob:') || visuals.backgroundMediaUrl?.startsWith('blob:')) {
            alert("⚠️ تنبيه: بعض الملفات (الصوت أو الخلفية) مخزنة محلياً فقط ولم ترفع للسيرفر بعد. يرجى إعادة رفعها أو التأكد من اكتمال الرفع لتتمكن من تصدير الـ MP4.");
            return;
        }

        setRenderStatus('processing');
        setIsRendering(true);
        setProgress(0);
        setDownloadUrl(null);

        try {
            const res = await fetch('/api/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visuals, audio, text, exportOptions })
            });

            const data = await res.json();

            if (data.success) {
                setProgress(100);
                setRenderStatus('success');
                setDownloadUrl(data.downloadUrl);
            } else {
                setRenderStatus('error');
                console.error("Render failed:", data.error);
                if (!data.error?.toLowerCase().includes("ffmpeg")) {
                    alert(data.error || "حدث خطأ غير متوقع أثناء التصدير.");
                }
            }
        } catch (e) {
            console.error(e);
            setRenderStatus('error');
            alert("فشل الاتصال بخادم التصدير.");
        } finally {
            setIsRendering(false);
        }
    };

    const handleSnapshot = async () => {
        setIsSnapshotting(true);
        setSnapshotUrl(null);
        try {
            const res = await fetch('/api/thumbnail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visuals, audio, text, frame: currentFrame })
            });
            const data = await res.json();
            if (data.success) {
                setSnapshotUrl(data.imageUrl);
            } else {
                console.error("Snapshot failed:", data.error);
                alert(data.error || "فشل إنشاء لقطة المعاينة.");
            }
        } catch (e) {
            console.error(e);
            alert("فشل الاتصال بخادم المعاينة.");
        } finally {
            setIsSnapshotting(false);
        }
    };

    const resetExport = () => {
        setRenderStatus('idle');
        setProgress(0);
        setDownloadUrl(null);
    };

    const handleDownload = () => {
        if (downloadUrl) {
            window.open(downloadUrl, '_blank');
        }
    };

    return (
        <Panel title="إعدادات التصدير" icon={<Download className="w-4 h-4 text-primary" />}>
            <div className="space-y-5">

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

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleSnapshot}
                                disabled={isSnapshotting}
                                className="w-full bg-surface border border-border hover:border-primary/50 text-gray-300 py-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSnapshotting ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                ) : (
                                    <Download className="w-4 h-4 text-primary" />
                                )}
                                التقاط صورة معاينة
                            </button>
                            <button
                                onClick={handleExport}
                                className="w-full bg-primary/90 hover:bg-primary text-surface py-3 rounded-lg font-bold text-xs transition-all shadow-[0_4px_14px_0_rgba(234,179,8,0.39)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                تصدير فيديو MP4
                            </button>
                        </div>

                        {snapshotUrl && (
                            <div className="mt-4 p-2 bg-surface rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-500">
                                <p className="text-[10px] text-primary font-bold mb-2 text-center">لقطة المعاينة (جودة عالية)</p>
                                <img src={snapshotUrl} alt="Video Snapshot" className="w-full aspect-[9/16] rounded-md border border-border shadow-lg mb-2" />
                                <button
                                    onClick={() => window.open(snapshotUrl, '_blank')}
                                    className="w-full text-[10px] text-muted-foreground hover:text-white underline transition-colors"
                                >
                                    فتح الصورة في نافذة جديدة
                                </button>
                            </div>
                        )}
                    </>
                )}

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
                                    <h3 className="text-sm font-bold text-primary mb-1">جاري معالجة الفيديو الحقيقي...</h3>
                                    <p className="text-xs text-muted-foreground w-48 text-balance">
                                        يرجى الانتظار، نقوم الآن بعملية Rendering باستخدام Remotion Engine.
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
                                    <h3 className="text-sm font-bold text-green-500 mb-1">اكتمل التصدير بنجاح!</h3>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        تم إنشاء ملف الـ MP4 بنجاح. يمكنك الآن تحميله على جهازك.
                                    </p>
                                </div>
                                <div className="w-full flex flex-col gap-2 mt-4">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full px-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        تحميل الفيديو الآن
                                    </button>
                                    <button
                                        onClick={resetExport}
                                        className="w-full px-4 bg-surface border border-border text-gray-400 hover:text-white font-bold py-2 rounded-md text-sm transition-colors"
                                    >
                                        رجوع للإعدادات
                                    </button>
                                </div>
                            </>
                        )}

                        {renderStatus === 'error' && (
                            <div className="w-full flex flex-col items-center">
                                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-bold text-red-500 mb-2">حدث خطأ أثناء التصدير</h3>

                                <div className="bg-red-500/5 p-4 rounded-lg border border-red-500/20 mb-4 text-right" dir="rtl">
                                    <p className="text-[11px] text-gray-300 leading-relaxed mb-3">
                                        المشكلة الأكثر شيوعاً هي عدم وجود أداة <b>ffmpeg</b> على جهازك.
                                        لقد قمت بتجهيز نص برمجى (script) ليقوم بتحميلها لك تلقائياً.
                                    </p>

                                    <div className="bg-black/40 p-2 rounded border border-border/50 font-mono flex items-center gap-2 group cursor-pointer"
                                        onClick={() => {
                                            navigator.clipboard.writeText('powershell -ExecutionPolicy Bypass -File .\\setup-ffmpeg.ps1');
                                            alert("تم نسخ الكود! افتح الـ Terminal والصقه هناك.");
                                        }}>
                                        <Terminal className="w-3 h-3 text-primary shrink-0" />
                                        <code className="text-[9px] text-primary truncate overflow-hidden text-left" dir="ltr">
                                            powershell -ExecutionPolicy Bypass -File .\setup-ffmpeg.ps1
                                        </code>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground mt-2">
                                        انسخ الكود أعلاه وشغله في الـ Terminal (الشاشة السوداء) ثم أعد محاولة التصدير.
                                    </p>
                                </div>

                                <button
                                    onClick={resetExport}
                                    className="text-xs text-gray-400 hover:text-white underline decoration-dotted"
                                >
                                    الرجوع وحاول مرة أخرى
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Panel>
    );
}
