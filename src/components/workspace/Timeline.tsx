"use client";

import { useVideoStore } from "@/store/useVideoStore";
import { Scissors, Clock, Play, Pause } from "lucide-react";
import { useRef, useCallback } from "react";

export function Timeline() {
    const isPlaying = useVideoStore((state) => state.isPlaying);
    const setIsPlaying = useVideoStore((state) => state.setIsPlaying);
    const audio = useVideoStore((state) => state.audio);
    const setAudio = useVideoStore((state) => state.setAudio);
    const videoFrame = useVideoStore((state) => state.currentFrame);
    const setCurrentFrame = useVideoStore((state) => state.setCurrentFrame);

    const timelineRef = useRef<HTMLDivElement>(null);

    const totalDuration = audio.durationInSeconds || 15;
    const fps = 30;
    const currentTime = videoFrame / fps;

    // Convert time to percentage of total duration
    const getPercent = (time: number) => (time / totalDuration) * 100;

    // Handle Scrubber Seek
    const handleSeek = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const targetFrame = Math.floor(percent * totalDuration * fps);
        setCurrentFrame(targetFrame);
    }, [totalDuration, setCurrentFrame]);

    // Handle Trimming with Sanitization
    const updateTrim = (type: 'start' | 'end', rawVal: string | number) => {
        let val = typeof rawVal === 'string' ? parseFloat(rawVal) : rawVal;

        // Handle NaN or empty input
        if (isNaN(val)) return;

        // Force 1 decimal precision
        val = Math.round(val * 10) / 10;

        if (type === 'start') {
            const safeStart = Math.max(0, Math.min(val, audio.trimEnd - 0.5));
            setAudio({ trimStart: safeStart });
        } else {
            const safeEnd = Math.max(audio.trimStart + 0.5, Math.min(val, totalDuration));
            setAudio({ trimEnd: safeEnd });
        }
    };

    const setMarkAtCurrent = (type: 'start' | 'end') => {
        const currentSeconds = Math.round((videoFrame / fps) * 10) / 10;
        updateTrim(type, currentSeconds);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    const formatShort = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-xl flex flex-col h-48">

            {/* Timeline Header */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-surface/50 px-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-surface transition-all active:scale-95 shadow-lg group"
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-primary">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-sm font-mono font-bold">{formatTime(currentTime)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest flex gap-3 mt-0.5">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div> {totalDuration.toFixed(1)}ث</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500/40"></div> {(audio.trimEnd - audio.trimStart).toFixed(1)}ث</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-[10px] text-muted-foreground mr-2">تحكم بنقاط البداية والنهاية للمقطع</div>
                    <button className="p-1.5 text-gray-400 hover:text-primary transition-colors hover:bg-surface-hover/20 rounded">
                        <Scissors className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Timeline Tracks Area */}
            <div className="flex-1 bg-[#050810] relative p-6 flex flex-col gap-4 overflow-hidden">

                {/* Visual Time Ruler (Dashes) */}
                <div className="absolute top-0 left-6 right-6 h-2 flex justify-between opacity-10 pointer-events-none">
                    {Array.from({ length: 11 }).map((_, i) => (
                        <div key={i} className="w-px h-full bg-white"></div>
                    ))}
                </div>

                {/* Main Interactive Track */}
                <div
                    ref={timelineRef}
                    onClick={handleSeek}
                    className="relative w-full h-16 bg-surface/30 rounded-lg border border-border/40 cursor-pointer overflow-hidden group"
                >
                    {/* Trimming Background Overlay (Darken out-of-range areas) */}
                    <div
                        className="absolute top-0 bottom-0 bg-background/60 z-10"
                        style={{ left: 0, width: `${getPercent(audio.trimStart)}%` }}
                    />
                    <div
                        className="absolute top-0 bottom-0 bg-background/60 z-10"
                        style={{ left: `${getPercent(audio.trimEnd)}%`, right: 0 }}
                    />

                    {/* Active Track (Highligthed Area) */}
                    <div
                        className="absolute top-0 bottom-0 bg-primary/10 border-x border-primary/30 z-0"
                        style={{
                            left: `${getPercent(audio.trimStart)}%`,
                            width: `${getPercent(audio.trimEnd - audio.trimStart)}%`
                        }}
                    >
                        {/* Fake Waveform dots - deterministic to avoid hydration mismatch */}
                        <div className="w-full h-full flex items-center justify-around px-2 opacity-20">
                            {Array.from({ length: 40 }).map((_, i) => {
                                // Deterministic heights based on index instead of Math.random()
                                const h = 20 + ((i * 13) % 65);
                                return (
                                    <div key={i} className="w-0.5 bg-primary rounded-full" style={{ height: `${h}%` }}></div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Playhead (Scrubber) */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-30 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-75 pointer-events-none"
                        style={{ left: `${getPercent(currentTime)}%` }}
                    >
                        <div className="absolute -top-1 -left-1.5 border-[6px] border-transparent border-t-yellow-400 w-0 h-0"></div>
                    </div>

                    {/* Input Sliders for Trimming (Overlays) */}
                    {/* These are simple range inputs hidden but allowing control */}
                    <input
                        type="range"
                        min="0"
                        max={totalDuration}
                        step="0.1"
                        value={audio.trimStart}
                        onChange={(e) => updateTrim('start', parseFloat(e.target.value))}
                        className="absolute -top-10 left-0 w-full opacity-0 cursor-pointer pointer-events-none"
                    />
                </div>

                {/* Trimming Controls Below Track */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-6">
                        {/* Start Point */}
                        <div className="flex flex-col gap-1.5 p-2 bg-surface/40 rounded-lg border border-border/30">
                            <div className="flex justify-between items-center w-full">
                                <span className="text-muted-foreground">نقطة البداية</span>
                                <span className="text-primary/60 ml-2 font-bold">{formatShort(audio.trimStart)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number" step="0.1"
                                    value={audio.trimStart}
                                    onChange={(e) => updateTrim('start', e.target.value)}
                                    className="bg-[#0A0F1A] border border-border rounded px-2 py-1 w-24 text-primary focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                <button
                                    onClick={() => setMarkAtCurrent('start')}
                                    className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded hover:bg-primary/20 active:scale-95 transition-all text-[9px] font-bold"
                                >
                                    تحديد هنا
                                </button>
                            </div>
                        </div>

                        {/* End Point */}
                        <div className="flex flex-col gap-1.5 p-2 bg-surface/40 rounded-lg border border-border/30">
                            <div className="flex justify-between items-center w-full">
                                <span className="text-muted-foreground">نقطة النهاية</span>
                                <span className="text-primary/60 ml-2 font-bold">{formatShort(audio.trimEnd)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number" step="0.1"
                                    value={audio.trimEnd}
                                    onChange={(e) => updateTrim('end', e.target.value)}
                                    className="bg-[#0A0F1A] border border-border rounded px-2 py-1 w-24 text-primary focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                <button
                                    onClick={() => setMarkAtCurrent('end')}
                                    className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded hover:bg-primary/20 active:scale-95 transition-all text-[9px] font-bold"
                                >
                                    تحديد هنا
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-muted-foreground bg-surface/50 px-4 py-2 rounded-xl border border-border/40 max-w-[200px] leading-relaxed text-center">
                        نصيحة: قف بالمؤشر عند اللحظة المناسبة واضغط "تحديد هنا" لتعديل سريع
                    </div>
                </div>

            </div>
        </div>
    );
}
