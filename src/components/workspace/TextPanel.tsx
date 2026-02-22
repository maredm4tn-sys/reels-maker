"use client";

import { useState, useEffect } from "react";
import { useVideoStore } from "@/store/useVideoStore";
import { Type, AlignCenterVertical, Loader2, X, Trash2, Sparkles, Wand2, History, Maximize2, Save, Clock, Hash } from "lucide-react";
import { Panel } from "./AudioPanel";

export function TextPanel() {
    const textSettings = useVideoStore((state) => state.text);
    const setText = useVideoStore((state) => state.setText);
    const audio = useVideoStore((state) => state.audio);
    const currentFrame = useVideoStore((state) => state.currentFrame);
    const isPlaying = useVideoStore((state) => state.isPlaying);
    const setCurrentFrame = useVideoStore((state) => state.setCurrentFrame);

    const [isTranscribing, setIsTranscribing] = useState(false);
    const [lastSaved, setLastSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
    const [isMaximized, setIsMaximized] = useState(false);

    // --- Logic Functions ---

    const handleSmartSync = () => {
        const rawWords = textSettings.manualText.split(/\s+/).filter(w => w.length > 0);
        if (rawWords.length === 0) return;

        const oldWords = [...textSettings.words];
        const totalDuration = (audio.trimEnd - audio.trimStart) || 15;
        const timePerWord = totalDuration / rawWords.length;

        const newWords = rawWords.map((word, index) => {
            if (oldWords[index]) {
                return { ...oldWords[index], text: word };
            }
            const prevEnd = index > 0 ? (index * timePerWord) : 0;
            return {
                text: word,
                start: parseFloat((audio.trimStart + prevEnd).toFixed(2)),
                end: parseFloat((audio.trimStart + prevEnd + timePerWord).toFixed(2))
            };
        });

        setText({
            words: newWords,
            transcriptVersion: textSettings.transcriptVersion + 1
        });
        setLastSaved(true);
        setTimeout(() => setLastSaved(false), 2000);
    };

    const handleManualSplit = () => {
        if (!textSettings.manualText.trim()) return;
        if (textSettings.words.length > 0) {
            if (!confirm("تنبيه: سيتم إعادة توزيع جميع الكلمات بالتساوي على طول الفيديو ومسح التوقيتات الدقيقة الحالية. هل أنت متأكد؟")) return;
        }

        const rawWords = textSettings.manualText.split(/\s+/).filter(w => w.length > 0);
        if (rawWords.length === 0) return;

        const totalDuration = (audio.trimEnd - audio.trimStart) || 15;
        const timePerWord = totalDuration / rawWords.length;

        const newTimestampedWords = rawWords.map((word, index) => {
            const start = audio.trimStart + (index * timePerWord);
            const end = audio.trimStart + ((index + 1) * timePerWord);
            return {
                text: word,
                start: parseFloat(start.toFixed(2)),
                end: parseFloat(end.toFixed(2))
            }
        });

        setText({
            words: newTimestampedWords,
            transcriptVersion: textSettings.transcriptVersion + 1
        });
        setLastSaved(true);
        setTimeout(() => setLastSaved(false), 2000);
    };

    const updateWordTime = (index: number, field: 'start' | 'end', value: number) => {
        const newWords = [...textSettings.words];
        newWords[index] = { ...newWords[index], [field]: value };
        setText({
            words: newWords,
            transcriptVersion: textSettings.transcriptVersion + 1
        });
    };

    const updateWordText = (index: number, text: string) => {
        const newWords = [...textSettings.words];
        newWords[index] = { ...newWords[index], text };

        const fullText = newWords.map(w => w.text).join(' ');
        setText({
            words: newWords,
            manualText: fullText,
            transcriptVersion: textSettings.transcriptVersion + 1
        });
        setLastSaved(true);
        setTimeout(() => setLastSaved(false), 2000);
    };

    const deleteWord = (index: number) => {
        const newWords = textSettings.words.filter((_, i) => i !== index);
        const fullText = newWords.map(w => w.text).join(' ');
        setText({
            words: newWords,
            manualText: fullText,
            transcriptVersion: textSettings.transcriptVersion + 1
        });
    };

    const handleAutoCaption = async () => {
        if (!audio.sourceUrl) {
            alert("الرجاء إضافة مصدر صوتي لتفريغ النص!");
            return;
        }

        setIsTranscribing(true);
        try {
            const response = await fetch(audio.sourceUrl);
            const blob = await response.blob();
            const file = new File([blob], "audio.mp3", { type: blob.type || "audio/mpeg" });
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                const start = audio.trimStart || 0;
                const end = audio.trimEnd || audio.durationInSeconds || 15;

                const filteredWords = data.words.filter((w: any) =>
                    w.start >= start && w.end <= end
                );

                setText({
                    words: filteredWords,
                    manualText: filteredWords.map((w: any) => w.text).join(' '),
                    transcriptVersion: textSettings.transcriptVersion + 1
                });
            } else {
                alert("خطأ: " + (data.error || "فشل التفريغ"));
            }
        } catch (error) {
            console.error(error);
            alert("فشل الاتصال بالذكاء الاصطناعي.");
        } finally {
            setIsTranscribing(false);
        }
    };

    // --- GAP DETECTION LOGIC ---
    const fillGap = (start: number, end: number, text: string) => {
        const rawWords = text.split(/\s+/).filter(w => w.length > 0);
        if (rawWords.length === 0) return;

        const duration = end - start;
        const timePerWord = duration / rawWords.length;

        const newWords = rawWords.map((w, idx) => ({
            text: w,
            start: parseFloat((start + idx * timePerWord).toFixed(2)),
            end: parseFloat((start + (idx + 1) * timePerWord).toFixed(2)),
        }));

        const merged = [...textSettings.words, ...newWords].sort((a, b) => a.start - b.start);
        setText({
            words: merged,
            manualText: merged.map(w => w.text).join(' '),
            transcriptVersion: textSettings.transcriptVersion + 1
        });
    };

    const getCompositeItems = () => {
        const items: any[] = [];
        const minGap = 0.5;
        const startRange = audio.trimStart || 0;
        const endRange = audio.trimEnd || audio.durationInSeconds || 15;
        const words = textSettings.words;

        let currentTime = startRange;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word.start - currentTime > minGap) {
                items.push({ type: 'gap', start: currentTime, end: word.start });
            }
            items.push({ type: 'word', word, index: i });
            currentTime = word.end;
        }

        if (endRange - currentTime > minGap) {
            items.push({ type: 'gap', start: currentTime, end: endRange });
        }
        return items;
    };

    // Spacebar Play/Pause Logic
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" &&
                document.activeElement?.tagName !== "INPUT" &&
                document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault();
                const playBtn = document.querySelector('[data-testid="play-pause-btn"]') as HTMLButtonElement;
                if (playBtn) playBtn.click();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const totalTrimmedDuration = (audio.trimEnd - audio.trimStart) || 15;
    const progressPercent = ((currentFrame / 30) / totalTrimmedDuration) * 100;

    return (
        <Panel title="النص والكلمات" icon={<Type className="w-4 h-4 text-primary" />}>
            <div className="space-y-4">

                {/* Main Tabs */}
                <div className="flex bg-background rounded-xl p-1 border border-border/40">
                    <button
                        onClick={() => setActiveTab('auto')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold rounded-lg transition-all ${activeTab === 'auto' ? 'bg-primary text-surface shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Sparkles className="w-3 h-3" />
                        تفريغ ذكي
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold rounded-lg transition-all ${activeTab === 'manual' ? 'bg-primary text-surface shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <History className="w-3 h-3" />
                        تعديل ومزامنة
                    </button>
                </div>

                {/* Auto Tab */}
                {activeTab === 'auto' && (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center space-y-4">
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-foreground">استخراج النصوص آلياً</h4>
                            <p className="text-[10px] text-muted-foreground">حول الصوت إلى كلمات مكتوبة مع توقيتاتها بضغطة واحدة.</p>
                        </div>
                        <button
                            onClick={handleAutoCaption}
                            disabled={isTranscribing}
                            className="w-full h-12 flex items-center justify-center gap-3 bg-primary text-surface rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50"
                        >
                            {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            <span className="text-xs font-bold">بدء التحليل الآن</span>
                        </button>
                    </div>
                )}

                {/* Manual Tab */}
                {activeTab === 'manual' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="space-y-3">
                            <div className="bg-background/40 border border-border/60 rounded-2xl p-4 focus-within:border-primary/50 transition-all shadow-inner relative">
                                <textarea
                                    placeholder="اكتب أو انسخ النص الكامل هنا..."
                                    className="w-full h-32 bg-transparent border-none outline-none text-[13px] leading-relaxed resize-none custom-scrollbar"
                                    value={textSettings.manualText}
                                    onChange={(e) => setText({ manualText: e.target.value })}
                                />
                                {lastSaved && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-[9px] font-bold animate-in fade-in zoom-in">
                                        <Save className="w-2.5 h-2.5" />
                                        تم الحفظ
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-2 px-1">
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSmartSync}
                                        className="flex items-center gap-2 bg-primary/95 hover:bg-primary text-surface px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-lg active:scale-95"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        مزامنة ذكية
                                    </button>
                                    <button
                                        onClick={handleManualSplit}
                                        className="flex items-center gap-2 bg-surface border border-border/60 hover:border-primary/40 text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95"
                                    >
                                        إعادة توزيع
                                    </button>
                                </div>
                            </div>
                        </div>

                        {textSettings.words.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-border/20">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <AlignCenterVertical className="w-3 h-3 text-primary" />
                                        مخطط نطق الكلمات
                                    </h3>
                                    <button
                                        onClick={() => setIsMaximized(true)}
                                        className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all group"
                                    >
                                        <Maximize2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                        تعديل في شاشة كاملة
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 p-1 custom-scrollbar">
                                    {textSettings.words.map((word, idx) => (
                                        <div key={`summary-${idx}-${textSettings.transcriptVersion}`} className="group relative flex flex-col bg-surface/40 hover:bg-surface border border-border/40 hover:border-primary/30 rounded-xl p-2 transition-all">
                                            <input
                                                type="text"
                                                defaultValue={word.text}
                                                onBlur={(e) => updateWordText(idx, e.target.value)}
                                                className="bg-transparent border-none outline-none text-[11px] font-bold text-foreground mb-1 w-full"
                                            />
                                            <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 font-mono">
                                                <span>{word.start}s</span>
                                                <button onClick={() => deleteWord(idx)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Styling Controls */}
                <div className="pt-4 border-t border-border/40 space-y-4">
                    <div className="flex items-center justify-between px-1 mb-2">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">موقع النص (Y)</label>
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{textSettings.positionY}%</span>
                    </div>
                    <input
                        type="range"
                        min="10" max="90"
                        value={textSettings.positionY}
                        onChange={(e) => setText({ positionY: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-surface accent-primary rounded-lg appearance-none cursor-pointer"
                    />

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <ColorPicker label="لون النص" value={textSettings.textColor} onChange={(v) => setText({ textColor: v })} />
                        <ColorPicker label="لون الكلمة النشطة" value={textSettings.activeWordColor} onChange={(v) => setText({ activeWordColor: v })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-muted-foreground font-bold mr-1">نوع الخط</label>
                            <select
                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                value={textSettings.fontFamily}
                                onChange={(e) => setText({ fontFamily: e.target.value })}
                            >
                                <option value="cairo">Cairo</option>
                                <option value="tajawal">Tajawal</option>
                                <option value="kufi">Reem Kufi</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-muted-foreground font-bold mr-1">مقاس الخط (px)</label>
                            <input
                                type="number"
                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs font-mono"
                                value={textSettings.fontSize}
                                onChange={(e) => setText({ fontSize: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* FULL SCREEN MODAL EDITOR */}
            {isMaximized && (
                <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300" dir="rtl">
                    {/* Header */}
                    <div className="h-20 border-b border-border/50 px-8 flex items-center justify-between bg-surface/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-l from-foreground to-muted-foreground bg-clip-text text-transparent">تعديل الكلمات بالتفصيل</h2>
                                <p className="text-xs text-muted-foreground">قم بتعديل النصوص والتوقيتات بكل أريحية وبرؤية أوضح</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsMaximized(false)}
                            className="w-12 h-12 rounded-full bg-surface-hover/10 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-all border border-border/40 active:scale-90"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-7xl mx-auto space-y-8">

                            {/* The Audio Sync Controller in Full Screen */}
                            <div className="bg-surface/60 border border-primary/20 rounded-3xl p-6 shadow-2xl backdrop-blur-md sticky top-0 z-50">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    {/* Stats Group */}
                                    <div className="flex items-center gap-6 shrink-0 bg-background/40 px-6 py-3 rounded-2xl border border-border/40">
                                        <StatItem icon={<Hash className="w-4 h-4" />} label="إجمالي الكلمات" value={textSettings.words.length} />
                                        <div className="w-px h-6 bg-border/40" />
                                        <StatItem icon={<Clock className="w-4 h-4" />} label="مدة المقطع" value={`${totalTrimmedDuration.toFixed(1)}ث`} />
                                    </div>

                                    {/* Playback Controls & Timeline */}
                                    <div className="flex-1 w-full flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                const btn = document.querySelector('[data-testid="play-pause-btn"]') as HTMLButtonElement;
                                                if (btn) btn.click();
                                            }}
                                            className="w-14 h-14 rounded-full bg-primary text-surface flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                                        >
                                            {isPlaying ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                            )}
                                        </button>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between text-[11px] font-bold font-mono text-muted-foreground">
                                                <span>{(currentFrame / 30).toFixed(2)}s</span>
                                                <span className="text-primary animate-pulse font-bold tracking-widest">مزامنة صوتية مباشرة</span>
                                                <span>{totalTrimmedDuration.toFixed(2)}s</span>
                                            </div>
                                            <div
                                                className="h-3 bg-background/60 rounded-full relative cursor-pointer group overflow-hidden border border-border/20 shadow-inner"
                                                onClick={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const x = e.clientX - rect.left;
                                                    const percent = x / rect.width;
                                                    const targetFrame = Math.floor(percent * totalTrimmedDuration * 30);
                                                    setCurrentFrame(targetFrame);
                                                }}
                                            >
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-primary/40 transition-all duration-100"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                                <div
                                                    className="absolute inset-y-0 w-1 bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.8)] z-10 transition-all duration-100"
                                                    style={{ left: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* The Word Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                                {getCompositeItems().map((item, idx) => (
                                    item.type === 'word' ? (
                                        <div
                                            key={`full-word-${idx}`}
                                            className="group bg-surface/60 border border-border/60 hover:border-primary/40 rounded-2xl p-4 transition-all hover:shadow-2xl hover:shadow-primary/5 relative"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-muted-foreground/50 font-mono">#{item.index + 1}</span>
                                                    {(item.word.start <= currentFrame / 30 && item.word.end >= currentFrame / 30) && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => deleteWord(item.index)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500/60 hover:text-red-500 bg-red-500/5 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    defaultValue={item.word.text}
                                                    onBlur={(e) => updateWordText(item.index, e.target.value)}
                                                    className="w-full bg-background/50 border border-border/40 rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                />

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] text-muted-foreground mr-1">البداية (ث)</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            defaultValue={item.word.start}
                                                            onBlur={(e) => updateWordTime(item.index, 'start', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-background/50 border border-border/30 rounded-lg px-2 py-1 text-[11px] font-mono text-primary"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] text-muted-foreground mr-1">النهاية (ث)</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            defaultValue={item.word.end}
                                                            onBlur={(e) => updateWordTime(item.index, 'end', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-background/50 border border-border/30 rounded-lg px-2 py-1 text-[11px] font-mono text-primary"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <GapCard key={`gap-${idx}`} start={item.start} end={item.end} onFill={fillGap} />
                                    )
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="h-24 border-t border-border/50 px-8 flex items-center justify-center bg-surface/50 backdrop-blur-md">
                        <button
                            onClick={() => setIsMaximized(false)}
                            className="flex items-center gap-3 bg-primary text-surface px-12 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            حفظ كافة التعديلات والعودة للعمل
                        </button>
                    </div>
                </div>
            )}
        </Panel>
    );
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div className="bg-surface/50 p-2 rounded-xl border border-border/40">
            <label className="text-[9px] text-muted-foreground mb-1 block font-bold">{label}</label>
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg border border-white/10 relative overflow-hidden" style={{ backgroundColor: value }}>
                    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <span className="text-[9px] font-mono opacity-50 uppercase">{value}</span>
            </div>
        </div>
    );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="text-primary opacity-60">{icon}</div>
            <span className="text-[10px] text-muted-foreground">{label}:</span>
            <span className="text-xs font-bold font-mono">{value}</span>
        </div>
    );
}

function GapCard({ start, end, onFill }: { start: number, end: number, onFill: (s: number, e: number, t: string) => void }) {
    const [text, setText] = useState('');
    const [customStart, setCustomStart] = useState(start);
    const [customEnd, setCustomEnd] = useState(end);

    // Fixed: Using separate selectors to avoid infinite loop
    const setCurrentFrame = useVideoStore(state => state.setCurrentFrame);
    const currentFrame = useVideoStore(state => state.currentFrame);

    const currentTime = parseFloat((currentFrame / 30).toFixed(2));

    return (
        <div className="bg-red-500/5 border border-dashed border-red-500/20 hover:border-red-500/40 rounded-2xl p-4 transition-all relative overflow-hidden group/gap">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-tighter">منطقة مفقودة ({(end - start).toFixed(1)}ث)</span>
                </div>
                <button
                    onClick={() => setCurrentFrame(Math.floor(start * 30))}
                    className="p-1 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md text-[9px] font-bold transition-all"
                >
                    سماع المنطقة
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[8px] text-red-500/60 font-bold uppercase">يبدأ النص عند</label>
                        <button
                            onClick={() => setCustomStart(currentTime)}
                            className="text-[8px] bg-red-500/10 hover:bg-red-500/30 text-red-500 px-1 rounded transition-all"
                        >
                            خد الوقت الحالي
                        </button>
                    </div>
                    <input
                        type="number" step="0.1"
                        value={customStart}
                        onChange={(e) => setCustomStart(parseFloat(e.target.value) || start)}
                        className="w-full bg-background/60 border border-red-500/10 rounded-lg px-2 py-1 text-[10px] font-mono text-red-500 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[8px] text-red-500/60 font-bold uppercase">ينتهي النص عند</label>
                        <button
                            onClick={() => setCustomEnd(currentTime)}
                            className="text-[8px] bg-red-500/10 hover:bg-red-500/30 text-red-500 px-1 rounded transition-all"
                        >
                            خد الوقت الحالي
                        </button>
                    </div>
                    <input
                        type="number" step="0.1"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(parseFloat(e.target.value) || end)}
                        className="w-full bg-background/60 border border-red-500/10 rounded-lg px-2 py-1 text-[10px] font-mono text-red-500 outline-none"
                    />
                </div>
            </div>

            <textarea
                placeholder="اكتب الجملة المفقودة هنا..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-20 bg-background/40 border border-red-500/10 rounded-xl p-2 text-xs focus:ring-1 focus:ring-red-500/30 outline-none resize-none placeholder:text-red-500/20"
            />

            <button
                disabled={!text.trim()}
                onClick={() => {
                    onFill(customStart, customEnd, text);
                    setText('');
                }}
                className="w-full mt-2 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
                <Wand2 className="w-3 h-3" />
                توزيع ذكي (من {customStart}ث إلى {customEnd}ث)
            </button>
        </div>
    );
}
