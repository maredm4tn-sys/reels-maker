"use client";

import { useVideoStore } from "@/store/useVideoStore";
import { Music, Upload, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

export function AudioPanel() {
    const audio = useVideoStore((state) => state.audio);
    const setAudio = useVideoStore((state) => state.setAudio);

    const [urlInput, setUrlInput] = useState("");

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (urlInput.trim()) {
            setAudio({ sourceUrl: urlInput, sourceType: 'youtube' });
            setUrlInput(""); // Clear after dummy submit
        }
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

                {/* Upload Button */}
                <button
                    onClick={() => alert("سيتم فتح نافذة رفع الملفات قريباً")}
                    className="w-full h-16 rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center bg-background/50 hover:bg-background/80 hover:border-primary/50 transition-colors cursor-pointer group"
                >
                    <Upload className="w-4 h-4 text-gray-400 group-hover:text-primary mb-1 transition-colors" />
                    <p className="text-xs text-muted-foreground group-hover:text-gray-300 transition-colors">رفع ملف صوتي من جهازك</p>
                </button>

                {/* Active Source Banner */}
                {audio.sourceUrl && (
                    <div className="bg-primary/10 p-3 rounded-md border border-primary/20 flex flex-col gap-2 mt-4">
                        <p className="text-xs text-primary/80 mb-1">المصدر الحالي:</p>
                        <p className="text-sm font-medium text-gray-200 truncate" dir="ltr">{audio.sourceUrl}</p>
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
