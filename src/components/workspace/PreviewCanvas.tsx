"use client";

import { useVideoStore } from "@/store/useVideoStore";
import { FileVideo } from "lucide-react";
import { Player } from "@remotion/player";
import { ReelsComposition } from "@/remotion/ReelsComposition";

export function PreviewCanvas() {
    const visuals = useVideoStore((state) => state.visuals);
    const audio = useVideoStore((state) => state.audio);
    const textSettings = useVideoStore((state) => state.text);

    return (
        <div className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col h-full shadow-xl">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface/50">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse"></span>
                    معاينة الفيديو (Remotion)
                </h2>
                <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">9:16</span>
            </div>

            {/* The Canvas Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#050810] relative overflow-hidden">

                {/* We use aspect-ratio container to hold the player */}
                <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-lg border border-border/40 shadow-2xl flex flex-col items-center justify-center overflow-hidden">

                    <Player
                        component={ReelsComposition}
                        inputProps={{
                            visuals: visuals,
                            audio: audio,
                            text: textSettings,
                            words: [] // Placeholder for AI transcript
                        }}
                        durationInFrames={300} // 10 seconds @ 30fps
                        compositionWidth={1080}
                        compositionHeight={1920}
                        fps={30}
                        style={{
                            width: '100%',
                            height: '100%'
                        }}
                        controls
                        autoPlay
                        loop
                    />

                    {/* Empty State placeholder overlay if no bg selected AND no audio */}
                    {!visuals.backgroundMediaUrl && visuals.backgroundType !== 'solid' && visuals.backgroundType !== 'gradient' && !audio.sourceUrl && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 opacity-70 bg-black/50 backdrop-blur-sm pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-surface/40 flex items-center justify-center border border-border/50 mb-4 shadow-lg">
                                <FileVideo className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-xs text-white font-bold text-center px-8 shadow-sm">
                                سيتم عرض الفيديو هنا
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
