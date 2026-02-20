import { AbsoluteFill, useVideoConfig, useCurrentFrame, Sequence, Audio, Img } from "remotion";
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
    };
    audio: {
        sourceUrl: string | null;
        volume: number;
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
}

export const ReelsComposition: React.FC<ReelsCompositionProps> = ({ visuals, audio, text, words = [] }) => {
    const { fps, durationInFrames, width, height } = useVideoConfig();
    const frame = useCurrentFrame();
    const currentTimeInSeconds = frame / fps;

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

    return (
        <AbsoluteFill style={getBackgroundStyle()}>

            {/* Background Media */}
            {(visuals.backgroundType === 'image' || visuals.backgroundType === 'video') && visuals.backgroundMediaUrl && (
                <AbsoluteFill>
                    <Img
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
                    {/* For now, we assume the sourceUrl is an actual audio file link for testing */}
                    <Audio src={audio.sourceUrl} volume={audio.volume / 100} />
                </Sequence>
            )}

            {/* Captions Text */}
            {words.length > 0 ? (
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
                        gap: '8px'
                    }}>
                        {words.map((word, i) => {
                            // Check if this word is currently being spoken
                            const isActive = currentTimeInSeconds >= word.start && currentTimeInSeconds <= word.end;
                            return (
                                <span
                                    key={i}
                                    style={{
                                        color: isActive ? text.activeWordColor : text.textColor,
                                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                >
                                    {word.text}
                                </span>
                            );
                        })}
                    </div>
                </AbsoluteFill>
            ) : (
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
            )}

        </AbsoluteFill>
    );
};
