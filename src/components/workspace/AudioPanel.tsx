"use client";

import { useVideoStore } from "@/store/useVideoStore";
import { Music, Upload, Link as LinkIcon, FileAudio, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import getBlobDuration from "get-blob-duration";

export function AudioPanel() {
    const audio = useVideoStore((state) => state.audio);
    const setAudio = useVideoStore((state) => state.setAudio);

    const [urlInput, setUrlInput] = useState("");
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle'); // New state for upload status
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (urlInput.trim()) {
            setAudio({ sourceUrl: urlInput, sourceType: 'youtube', volume: 100, durationInSeconds: 60 });
            setUrlInput("");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadStatus('uploading');
            try {
                // 1. Upload to server
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await fetch('/api/upload-audio', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();

                if (!uploadData.success) {
                    throw new Error(uploadData.error || "Failed to upload");
                }

                // 2. Get duration
                let duration = 15;
                try {
                    duration = await getBlobDuration(file);
                } catch (e) {
                    console.error("Could not get duration", e);
                }

                setAudio({
                    sourceUrl: uploadData.url,
                    sourceType: 'upload',
                    volume: 100,
                    durationInSeconds: duration
                });
                setUploadStatus('success');
                setTimeout(() => setUploadStatus('idle'), 3000);
            } catch (err) {
                console.error(err);
                setUploadStatus('idle');
                alert("تعذر رفع الملف الصوتي. يرجى المحاولة مرة أخرى.");
            }
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // Helper to abbreviate long blob URLs for UI display
    const getDisplayUrl = (url: string | null) => {
        if (!url) return "";
        if (url.startsWith('blob:')) return "ملف صوتي محلي";
        return url;
    };

    return (
        <Panel title="إعدادات المحتوى والصوت" icon={<Music className="w-4 h-4 text-primary" />}>
            <div className="space-y-4">

                {/* URL Input Form */}
                <form onSubmit={handleUrlSubmit} className="flex gap-2 relative">
                    <input
                        type="text"
                        placeholder="أدخل رابط YouTube..."
                        className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <button type="submit" className="bg-surface border border-border p-2 rounded-md hover:text-primary transition-colors">
                        <LinkIcon className="w-4 h-4" />
                    </button>
                </form>

                <div className="relative flex items-center py-2 h-4">
                    <div className="flex-grow border-t border-border/40"></div>
                    <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs">أو</span>
                    <div className="flex-grow border-t border-border/40"></div>
                </div>

                {/* Hidden File Input */}
                <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />

                {/* Upload Button */}
                <button
                    onClick={handleUploadClick}
                    disabled={uploadStatus === 'uploading'}
                    className={`w-full h-16 rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center bg-background/50 hover:bg-background/80 hover:border-primary/50 transition-colors cursor-pointer group ${uploadStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''} ${uploadStatus === 'success' ? 'border-green-500/50 bg-green-500/5' : ''}`}
                >
                    {uploadStatus === 'uploading' ? (
                        <div className="flex flex-col items-center animate-pulse">
                            <Loader2 className="w-5 h-5 text-primary animate-spin mb-1" />
                            <p className="text-[10px] text-primary">جاري الرفع للسيرفر...</p>
                        </div>
                    ) : uploadStatus === 'success' ? (
                        <div className="flex flex-col items-center">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
                            <p className="text-[10px] text-green-500 font-bold">تم الرفع بنجاح!</p>
                        </div>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-primary mb-1 transition-colors" />
                            <p className="text-xs text-muted-foreground group-hover:text-gray-300 transition-colors">رفع ملف صوتي من جهازك</p>
                        </>
                    )}
                </button>

                {/* Active Source Banner */}
                {audio.sourceUrl && (
                    <div className="bg-primary/10 p-3 rounded-md border border-primary/20 flex flex-col gap-2 mt-4">
                        <p className="text-xs text-primary/80 mb-1">المصدر الحالي:</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                            {audio.sourceUrl.startsWith('blob:') ? <FileAudio className="w-4 h-4 text-primary" /> : <LinkIcon className="w-4 h-4 text-muted-foreground" />}
                            <span className="truncate" dir="ltr">{getDisplayUrl(audio.sourceUrl)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">مستوى الصوت:</span>
                            <input
                                type="range"
                                min="0" max="100"
                                value={audio.volume}
                                onChange={(e) => setAudio({ volume: parseInt(e.target.value) })}
                                className="flex-1 h-1 bg-surface accent-primary rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs w-8 text-center">{audio.volume}%</span>
                        </div>
                    </div>
                )}

            </div>
        </Panel>
    );
}

// Extracting Panel Wrapper to a separate reusable spot
export function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-md">
            <div className="p-4 border-b border-border flex items-center gap-2 bg-surface/50">
                {icon}
                <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}
