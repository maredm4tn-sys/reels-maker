"use client";

import { useRef, useEffect } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { useVideoStore } from "@/store/useVideoStore";
import { ReelsComposition } from "@/remotion/ReelsComposition";
import { Loader2, Music, Video, FileVideo, Scissors, Clock, Play, Pause } from "lucide-react";

export function PreviewCanvas() {
    const visuals = useVideoStore((state) => state.visuals);
    const audio = useVideoStore((state) => state.audio);
    const textSettings = useVideoStore((state) => state.text);
    const currentFrame = useVideoStore((state) => state.currentFrame);
    const isPlaying = useVideoStore((state) => state.isPlaying);
    const setCurrentFrame = useVideoStore((state) => state.setCurrentFrame);
    const setIsPlaying = useVideoStore((state) => state.setIsPlaying);
    const setAudio = useVideoStore((state) => state.setAudio);
    const playerRef = useRef<PlayerRef>(null);

    const isUpdatingFromPlayer = useRef(false);
    const lastStoreUpdateFrame = useRef(-1);

    // Sync store frame back to player if changed externally (e.g. from timeline)
    useEffect(() => {
        if (playerRef.current) {
            // If the change came from the player itself, ignore it to prevent loop
            if (isUpdatingFromPlayer.current) {
                isUpdatingFromPlayer.current = false;
                return;
            }

            const playerFrame = playerRef.current.getCurrentFrame();
            // Only seek if it's a significant jump (manual seek)
            if (Math.abs(playerFrame - currentFrame) > 1) {
                playerRef.current.seekTo(currentFrame);
            }
        }
    }, [currentFrame]);

    // Sync playback state between store and player
    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;

        if (isPlaying) {
            if (!player.isPlaying()) player.play();
        } else {
            if (player.isPlaying()) player.pause();
        }
    }, [isPlaying]);

    // Handle frame updates and playback state from the player to the store
    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;

        const onFrameUpdate = (e: CustomEvent<{ frame: number }>) => {
            const frame = e.detail.frame;
            const state = useVideoStore.getState();

            // Mark this update as internal so the "Store -> Player" effect ignores it
            isUpdatingFromPlayer.current = true;

            // Decoupled Playhead Logic:
            // If playing: only update store every 10 frames (~300ms) to save CPU/Audio bandwidth.
            // If paused/seeking: update store immediately for precision.
            if (!state.isPlaying || Math.abs(frame - lastStoreUpdateFrame.current) >= 10) {
                setCurrentFrame(frame);
                lastStoreUpdateFrame.current = frame;
            }
        };

        const onPlay = () => setIsPlaying(true);
        const onPause = () => {
            setIsPlaying(false);
            if (playerRef.current) {
                isUpdatingFromPlayer.current = true;
                setCurrentFrame(playerRef.current.getCurrentFrame());
            }
        };

        // @ts-ignore
        player.addEventListener('frameupdate', onFrameUpdate);
        // @ts-ignore
        player.addEventListener('play', onPlay);
        // @ts-ignore
        player.addEventListener('pause', onPause);

        return () => {
            // @ts-ignore
            player.removeEventListener('frameupdate', onFrameUpdate);
            // @ts-ignore
            player.removeEventListener('play', onPlay);
            // @ts-ignore
            player.removeEventListener('pause', onPause);
        };
    }, [setCurrentFrame, setIsPlaying]);

    // Calculate duration in frames (Trimmed Seconds * 30 FPS).
    const rawTrimmedDuration = (audio.trimEnd || 15) - (audio.trimStart || 0);
    const trimmedDuration = isNaN(rawTrimmedDuration) ? 15 : Math.max(0.5, rawTrimmedDuration);
    const frames = Math.floor(trimmedDuration * 30) || 450; // Fallback to 15s if NaN or 0

    // -- Timeline Logic --
    const totalDuration = audio.durationInSeconds || 15;
    const fps = 30;
    const currentTime = currentFrame / fps;

    const getPercent = (time: number) => (time / totalDuration) * 100;

    const updateTrim = (type: 'start' | 'end', rawVal: string | number) => {
        let val = typeof rawVal === 'string' ? parseFloat(rawVal) : rawVal;
        if (isNaN(val)) return;
        val = Math.round(val * 10) / 10;

        const state = useVideoStore.getState();
        if (type === 'start') {
            const safeStart = Math.max(0, Math.min(val, audio.trimEnd - 0.5));
            setAudio({ trimStart: safeStart });
        } else {
            const safeEnd = Math.max(audio.trimStart + 0.5, Math.min(val, totalDuration));
            setAudio({ trimEnd: safeEnd });
        }
    };

    const setMarkAtCurrent = (type: 'start' | 'end') => {
        const currentSeconds = Math.round((currentFrame / fps) * 10) / 10;
        updateTrim(type, currentSeconds);
    };

    const formatShort = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleScrubberClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        setCurrentFrame(Math.floor(percent * totalDuration * fps));
    };


    // Dynamic Dimensions Calculation
    const isPortrait = visuals.aspectRatio === 'portrait';
    const compWidth = isPortrait ? 1080 : 1920;
    const compHeight = isPortrait ? 1920 : 1080;
    const aspectClass = isPortrait ? 'aspect-[9/16] max-w-[320px]' : 'aspect-[16/9] max-w-[500px]';

    return (
        <div className="flex flex-col h-full bg-background/40 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-xl sticky top-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <FileVideo className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground">معاينة الفيديو</h2>
                        <p className="text-[10px] text-muted-foreground">{isPortrait ? 'أبعاد 1080x1920 (9:16)' : 'أبعاد 1920x1080 (16:9)'}</p>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative group min-h-0">
                {/* Dynamic Aspect Ratio Container */}
                <div className={`relative w-full ${aspectClass} rounded-lg border border-border/40 shadow-2xl flex flex-col items-center justify-center overflow-hidden bg-black/20 transition-all duration-500`}>

                    <div dir="ltr" className="w-full h-full">
                        <Player
                            component={ReelsComposition}
                            ref={playerRef}
                            inputProps={{
                                visuals: visuals,
                                audio: audio,
                                text: textSettings,
                                words: textSettings.words,
                                transcriptVersion: textSettings.transcriptVersion
                            }}
                            durationInFrames={Math.max(30, Math.min(18000, frames))}
                            compositionWidth={compWidth}
                            compositionHeight={compHeight}
                            fps={30}
                            style={{
                                width: '100%',
                                height: '100%'
                            }}
                            controls
                            autoPlay
                            loop
                        />
                    </div>

                    {/* Empty State placeholder overlay if no bg selected AND no audio */}
                    {!visuals.backgroundMediaUrl && visuals.backgroundType !== 'solid' && visuals.backgroundType !== 'gradient' && !audio.sourceUrl && (
                        <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center space-y-4 text-center p-6">
                            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center border border-border/50">
                                <Video className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">ابدأ الإبداع</h3>
                                <p className="text-xs text-muted-foreground mt-1">ارفع ملفاً صوتياً أو اختر خلفية لعرض المعاينة</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Compact Timeline Section */}
            {audio.sourceUrl && (
                <div className="mt-6 flex flex-col gap-4">

                    {/* Compact Scrubber Bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-1">
                            <span>{formatShort(currentTime)}</span>
                            <span>{formatShort(totalDuration)}</span>
                        </div>
                        <div
                            className="h-2 w-full bg-surface/40 rounded-full relative cursor-pointer group"
                            onClick={handleScrubberClick}
                        >
                            {/* Trimmed range highlight */}
                            <div
                                className="absolute top-0 bottom-0 bg-primary/20 rounded-full"
                                style={{
                                    left: `${getPercent(audio.trimStart)}%`,
                                    width: `${getPercent(audio.trimEnd - audio.trimStart)}%`
                                }}
                            />
                            {/* Playhead */}
                            <div
                                className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10 shadow-[0_0_8px_rgba(234,179,8,0.5)] rounded-full transition-all duration-75"
                                style={{ left: `${getPercent(currentTime)}%`, transform: 'translateX(-50%)' }}
                            />
                        </div>
                    </div>

                    {/* Trim Controls Grid */}
                    <div className="grid grid-cols-2 gap-3" dir="rtl">
                        {/* Start Point */}
                        <div className="bg-surface/50 p-2 rounded-xl border border-border/40 flex flex-col gap-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] text-muted-foreground font-medium">البداية</span>
                                <span className="text-[10px] text-primary font-mono">{audio.trimStart.toFixed(1)}ث</span>
                            </div>
                            <div className="flex gap-1.5">
                                <input
                                    type="number" step="0.1"
                                    value={audio.trimStart}
                                    onChange={(e) => updateTrim('start', e.target.value)}
                                    className="w-full bg-background border border-border/60 rounded-lg px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
                                />
                                <button
                                    onClick={() => setMarkAtCurrent('start')}
                                    className="shrink-0 aspect-square w-8 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-all active:scale-90"
                                    title="تحديد عند اللحظة الحالية"
                                >
                                    <Scissors className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* End Point */}
                        <div className="bg-surface/50 p-2 rounded-xl border border-border/40 flex flex-col gap-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] text-muted-foreground font-medium">النهاية</span>
                                <span className="text-[10px] text-primary font-mono">{audio.trimEnd.toFixed(1)}ث</span>
                            </div>
                            <div className="flex gap-1.5">
                                <input
                                    type="number" step="0.1"
                                    value={audio.trimEnd}
                                    onChange={(e) => updateTrim('end', e.target.value)}
                                    className="w-full bg-background border border-border/60 rounded-lg px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
                                />
                                <button
                                    onClick={() => setMarkAtCurrent('end')}
                                    className="shrink-0 aspect-square w-8 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-all active:scale-90"
                                    title="تحديد عند اللحظة الحالية"
                                >
                                    <Scissors className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 opacity-70">
                        <div className="flex items-center gap-1.5 font-mono">
                            <Clock className="w-3 h-3 text-primary/60" />
                            <span>المدة: {(audio.trimEnd - audio.trimStart).toFixed(1)} ثانية</span>
                        </div>
                        <button
                            data-testid="play-pause-btn"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex items-center gap-1 bg-surface-hover/20 px-3 py-1 rounded-full border border-border/40 hover:text-primary transition-colors"
                        >
                            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span>{isPlaying ? 'إيقاف' : 'تشغيل'}</span>
                        </button>
                    </div>

                </div>
            )}

            {/* Quick Status Bar */}
            <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                <div className="flex items-center gap-3">
                    <Music className={`w-4 h-4 ${audio.sourceUrl ? 'text-primary' : 'text-muted-foreground opacity-30'}`} />
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {audio.sourceUrl ? 'تم تحميل الملف الصوتي' : 'لا يوجد صوت'}
                    </span>
                </div>
                <div className="px-2 py-0.5 bg-surface border border-border rounded text-[9px] font-mono text-gray-400">
                    FPS: 30
                </div>
            </div>
        </div>
    );
}
