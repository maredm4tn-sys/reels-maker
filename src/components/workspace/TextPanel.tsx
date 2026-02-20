"use client";

import { useState } from "react";
import { useVideoStore } from "@/store/useVideoStore";
import { Type, AlignCenterVertical, Loader2 } from "lucide-react";
import { Panel } from "./AudioPanel";

export function TextPanel() {
    const textSettings = useVideoStore((state) => state.text);
    const setText = useVideoStore((state) => state.setText);
    const audio = useVideoStore((state) => state.audio);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const handleAutoCaption = async () => {
        if (!audio.sourceUrl) {
            alert("الرجاء إضافة مصدر صوتي لتفريغ النص! (جرب زر 'إضافة صوت تجريبي' في لوحة الصوت)");
            return;
        }

        setIsTranscribing(true);
        try {
            const res = await fetch('/api/transcribe', {
                method: 'POST',
                body: JSON.stringify({ audioUrl: audio.sourceUrl })
            });
            const data = await res.json();

            if (data.success) {
                setText({ words: data.words });
            }
        } catch (error) {
            console.error(error);
            alert("حدث خطأ أثناء التفريغ.");
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <Panel title="تفريغ النص وإعداداته" icon={<Type className="w-4 h-4 text-primary" />}>
            <div className="space-y-4">

                {/* Auto Captioning Toggle */}
                <button
                    onClick={handleAutoCaption}
                    disabled={isTranscribing}
                    className="w-full flex items-center justify-between bg-primary/5 border border-primary/20 p-3 rounded-lg mb-4 hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                    <span className="text-sm text-primary font-bold">تفريغ تلقائي للكلمات</span>
                    {isTranscribing ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : textSettings.words.length > 0 ? (
                        <span className="text-[10px] bg-primary text-surface px-2 py-1 rounded font-bold">تم التفريغ</span>
                    ) : (
                        <div className="w-10 h-5 bg-primary/40 rounded-full relative">
                            <div className="absolute right-1 top-1 w-3 h-3 bg-surface rounded-full shadow-sm"></div>
                        </div>
                    )}
                </button>

                {/* Font Family */}
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">نوع الخط</label>
                    <select
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none appearance-none cursor-pointer"
                        value={textSettings.fontFamily}
                        onChange={(e) => setText({ fontFamily: e.target.value })}
                    >
                        <option value="cairo">Cairo (افتراضي)</option>
                        <option value="tajawal">Tajawal</option>
                        <option value="kufi">Kufi</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Colors */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">لون النص الأساسي</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={textSettings.textColor}
                                onChange={(e) => setText({ textColor: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0"
                            />
                            <span className="text-xs font-mono text-gray-400">{textSettings.textColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">لون الكلمة النشطة</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={textSettings.activeWordColor}
                                onChange={(e) => setText({ activeWordColor: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0"
                            />
                            <span className="text-xs font-mono text-gray-400">{textSettings.activeWordColor}</span>
                        </div>
                    </div>
                </div>

                {/* Font Size & Position */}
                <div className="space-y-4 pt-3 border-t border-border/40">
                    <div className="flex items-center gap-3">
                        <Type className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="range"
                            min="12" max="72"
                            value={textSettings.fontSize}
                            onChange={(e) => setText({ fontSize: parseInt(e.target.value) })}
                            className="flex-1 h-1 bg-surface accent-primary rounded-lg appearance-none cursor-pointer border border-border/30"
                        />
                        <span className="text-xs w-8 text-center">{textSettings.fontSize}px</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <AlignCenterVertical className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="range"
                            min="10" max="90"
                            value={textSettings.positionY}
                            onChange={(e) => setText({ positionY: parseInt(e.target.value) })}
                            className="flex-1 h-1 bg-surface accent-primary rounded-lg appearance-none cursor-pointer border border-border/30"
                        />
                        <span className="text-xs w-8 text-center">Y:{textSettings.positionY}%</span>
                    </div>
                </div>

            </div>
        </Panel>
    );
}
