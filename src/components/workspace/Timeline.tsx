"use client";

import { useVideoStore } from "@/store/useVideoStore";
import { Play, Pause, Scissors } from "lucide-react";
import { useState } from "react";

export function Timeline() {
    const [isPlaying, setIsPlaying] = useState(false);
    const visuals = useVideoStore((state) => state.visuals);
    const audio = useVideoStore((state) => state.audio);

    return (
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-xl mt-6 lg:col-span-12 flex flex-col h-48">

            {/* Timeline Controls */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-surface/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-surface transition-colors"
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <span className="text-sm font-mono text-gray-300">00:00:15 / 00:01:00</span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-primary transition-colors hover:bg-surface-hover/20 rounded">
                        <Scissors className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Timeline Tracks Area */}
            <div className="flex-1 bg-[#050810] relative overflow-x-auto p-4 flex flex-col gap-3 min-w-[800px]">

                {/* Playhead */}
                <div className="absolute top-0 bottom-0 left-[20%] w-px bg-primary z-20">
                    <div className="absolute -top-1 -left-1.5 border-[6px] border-transparent border-t-primary w-0 h-0"></div>
                </div>

                {/* Video/Visuals Track */}
                <div className="flex items-center gap-4">
                    <div className="w-20 text-xs text-muted-foreground flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> Visuals
                    </div>
                    <div className="flex-1 h-10 bg-surface rounded-md border border-border flex overflow-hidden">
                        {visuals.backgroundType !== 'solid' && visuals.backgroundType !== 'gradient' ? (
                            <div className="h-full bg-blue-900/50 border-r border-blue-500/30 px-2 flex items-center text-[10px] text-blue-200" style={{ width: '100%' }}>
                                Media Track
                            </div>
                        ) : (
                            <div className="h-full bg-gray-800 px-2 flex items-center text-[10px] text-gray-400" style={{ width: '100%' }}>
                                Solid/Gradient Background
                            </div>
                        )}
                    </div>
                </div>

                {/* Audio Track */}
                <div className="flex items-center gap-4">
                    <div className="w-20 text-xs text-muted-foreground flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Audio
                    </div>
                    <div className="flex-1 h-10 bg-surface rounded-md border border-border flex overflow-hidden">
                        {audio.sourceUrl ? (
                            <div className="h-full bg-green-900/40 border-l border-r border-green-500/50 px-2 flex items-center text-[10px] text-green-300" style={{ width: '60%', marginLeft: '10%' }}>
                                {audio.sourceUrl}
                                {/* Fake Audio Waveform */}
                                <div className="absolute top-0 bottom-0 left-0 right-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTEwIDB2MjB0LTIwLTEwaDIweiIgZmlsbD0iIzRmZmZmZiIvPjwvc3ZnPg==')]"></div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50 border border-dashed border-border/50 h-full mx-1 rounded">
                                لا يوجد صوت مضاف
                            </div>
                        )}
                    </div>
                </div>

                {/* Text/Subtitle Track */}
                <div className="flex items-center gap-4">
                    <div className="w-20 text-xs text-muted-foreground flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Text
                    </div>
                    <div className="flex-1 h-8 bg-surface rounded-md border border-border flex items-center px-2">
                        <div className="h-4 bg-yellow-500/20 text-[9px] text-yellow-500 border border-yellow-500/50 rounded flex items-center justify-center px-4" style={{ marginLeft: '10%' }}>
                            نص تجريبي للمقاطع
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
