"use client";
import { AbsoluteFill, useVideoConfig, useCurrentFrame, Sequence, Audio } from "remotion";
import React from "react";
import { BackgroundType } from "@/store/useVideoStore";

import { WordTimestamp } from "@/types";

export interface ReelsCompositionProps {
    visuals: {
        backgroundType: BackgroundType;
        backgroundColor: string;
        backgroundGradient: string;
        backgroundMediaUrl: string | null;
        blurAmount: number;
        aspectRatio: 'portrait' | 'landscape';
    };
    audio: {
        sourceUrl: string | null;
        volume: number;
        trimStart: number;
        trimEnd: number;
    };
    text: {
        fontFamily: string;
        fontSize: number;
        textColor: string;
        activeWordColor: string;
        positionY: number;
    };
    // Future: Add transcription words array here
    words?: WordTimestamp[];
    transcriptVersion?: number;
}

const WordSpan: React.FC<{ text: string, isActive: boolean, activeColor: string, inactiveColor: string }> = React.memo(({ text, isActive, activeColor, inactiveColor }) => {
    return (
        <span
            style={{
                color: isActive ? activeColor : inactiveColor,
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.1s ease',
            }}
        >
            {text}
        </span>
    );
});

export const ReelsComposition: React.FC<ReelsCompositionProps> = ({ visuals, audio, text, words = [], transcriptVersion = 0 }) => {
    const { fps, durationInFrames, width, height } = useVideoConfig();
    const frame = useCurrentFrame();

    // We calculate current time but OFFSET by the trimStart so the logic thinks 
    // we are at the correct absolute position in the audio file for words.
    const currentTimeInSeconds = (frame / fps) + (audio.trimStart || 0);

    const getBackgroundStyle = () => {
        switch (visuals.backgroundType) {
            case 'solid':
                return { backgroundColor: visuals.backgroundColor };
            case 'gradient':
                return { background: visuals.backgroundGradient };
            default:
                // Handled by Img/Video elements below
                return { backgroundColor: '#000' };
        }
    };

    // --- Word Chunking Logic ---
    const wordsPerChunk = 5; // Display up to 5 words at a time

    // Group words into chunks
    const chunks = React.useMemo(() => {
        const result: WordTimestamp[][] = [];
        for (let i = 0; i < words.length; i += wordsPerChunk) {
            result.push(words.slice(i, i + wordsPerChunk));
        }
        return result;
    }, [words]);

    // Determine which chunk should be visible based on current time
    const activeChunk = React.useMemo(() => {
        if (chunks.length === 0) return null;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const nextChunk = chunks[i + 1];

            const start = chunk[0].start;
            // The chunk stays visible until the NEXT chunk starts, 
            // or if it's the last chunk, it stays for 2 seconds after it ends.
            const end = nextChunk ? nextChunk[0].start : chunk[chunk.length - 1].end + 2;

            if (currentTimeInSeconds >= start && currentTimeInSeconds < end) {
                return chunk;
            }
        }

        // Sneak peek: if we are within 1 second of the first word, show the first chunk early
        if (chunks[0] && currentTimeInSeconds >= chunks[0][0].start - 1 && currentTimeInSeconds < chunks[0][0].start) {
            return chunks[0];
        }

        return null;
    }, [chunks, currentTimeInSeconds]);

    return (
        <AbsoluteFill style={getBackgroundStyle()}>

            {/* Background Media */}
            {(visuals.backgroundType === 'image' || visuals.backgroundType === 'video') && visuals.backgroundMediaUrl && (
                <AbsoluteFill>
                    <img
                        src={visuals.backgroundMediaUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: visuals.blurAmount > 0 ? `blur(${visuals.blurAmount}px)` : 'none'
                        }}
                    />
                </AbsoluteFill>
            )}

            {/* Solid/Gradient Blur Fallback (if they somehow have blur on a solid) */}
            {visuals.blurAmount > 0 && visuals.backgroundType !== 'image' && (
                <AbsoluteFill style={{ backdropFilter: `blur(${visuals.blurAmount}px)` }} />
            )}

            {/* Audio Track */}
            {audio.sourceUrl && (
                <Sequence from={0} durationInFrames={durationInFrames}>
                    <Audio
                        src={audio.sourceUrl}
                        volume={audio.volume / 100}
                        startFrom={Math.floor((audio.trimStart || 0) * fps)}
                        endAt={Math.floor((audio.trimEnd || 1000) * fps)}
                    />
                </Sequence>
            )}

            {/* Captions Text */}
            {activeChunk ? (
                <AbsoluteFill
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        top: `${text.positionY}%`,
                        bottom: `auto`,
                        transform: 'translateY(-50%)',
                        height: 'auto',
                        width: '100%',
                        padding: '0 40px'
                    }}
                >
                    <div style={{
                        fontFamily: `var(--font-${text.fontFamily}), sans-serif`,
                        fontSize: `${text.fontSize}px`,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        textShadow: '0px 4px 10px rgba(0,0,0,0.8)',
                        direction: 'rtl',
                        lineHeight: 1.5,
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '16px', // Increased gap for better breathing room
                        rowGap: '20px'
                    }}>
                        {activeChunk.map((word, i) => {
                            // Check if this word is currently being spoken
                            const isActive = currentTimeInSeconds >= word.start && currentTimeInSeconds <= word.end;
                            // Unique key combining index and transcriptVersion to ensure stable focus if needed, 
                            // but here it's for rendering stability.
                            const wordKey = `word-${i}-${transcriptVersion}`;

                            return (
                                <div key={wordKey} style={{ margin: '0 4px' }}>
                                    <WordSpan
                                        text={word.text}
                                        isActive={isActive}
                                        activeColor={text.activeWordColor}
                                        inactiveColor={text.textColor}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </AbsoluteFill>
            ) : words.length === 0 ? (
                <AbsoluteFill
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        top: `${text.positionY}%`,
                        bottom: `auto`,
                        transform: 'translateY(-50%)',
                        height: 'auto',
                        width: '100%',
                        padding: '0 40px'
                    }}
                >
                    <div style={{
                        fontFamily: `var(--font-${text.fontFamily}), sans-serif`,
                        fontSize: `${text.fontSize}px`,
                        color: text.textColor,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        textShadow: '0px 4px 10px rgba(0,0,0,0.8)',
                        direction: 'rtl',
                        lineHeight: 1.5
                    }}>
                        <span style={{ color: text.activeWordColor }}>أضف</span> الصوت للحصول على نص
                    </div>
                </AbsoluteFill>
            ) : null}

        </AbsoluteFill>
    );
};
