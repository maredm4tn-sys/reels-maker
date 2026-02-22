import { create } from 'zustand';
import { WordTimestamp } from '@/types';

// --- Types ---
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video';
export type ExportQuality = '480p' | '720p' | '1080p' | '2K' | '4K';

export interface VisualSettings {
    backgroundType: BackgroundType;
    backgroundColor: string;
    backgroundGradient: string;
    backgroundMediaUrl: string | null;
    blurAmount: number;
    aspectRatio: 'portrait' | 'landscape';
}

export interface AudioSettings {
    sourceUrl: string | null;
    sourceType: 'youtube' | 'upload' | null;
    volume: number;
    durationInSeconds: number;
    trimStart: number;
    trimEnd: number;
}

export interface TextSettings {
    fontFamily: string;
    fontSize: number;
    textColor: string;
    activeWordColor: string;
    positionY: number;
    words: WordTimestamp[];
    manualText: string;
    transcriptVersion: number;
}

export interface ExportSettings {
    quality: ExportQuality;
    format: 'mp4';
}

// --- Store ---
interface VideoState {
    visuals: VisualSettings;
    audio: AudioSettings;
    text: TextSettings;
    currentFrame: number;
    isPlaying: boolean;
    exportOptions: ExportSettings;

    // Actions
    setVisuals: (visuals: Partial<VisualSettings>) => void;
    setAudio: (audio: Partial<AudioSettings>) => void;
    setText: (text: Partial<TextSettings>) => void;
    setExportOptions: (options: Partial<ExportSettings>) => void;
    setCurrentFrame: (frame: number) => void;
    setIsPlaying: (playing: boolean) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
    visuals: {
        backgroundType: 'solid',
        backgroundColor: '#050810',
        backgroundGradient: 'linear-gradient(to right, #000000, #434343)',
        backgroundMediaUrl: null,
        blurAmount: 0,
        aspectRatio: 'portrait',
    },
    audio: {
        sourceUrl: null,
        sourceType: null,
        volume: 100,
        durationInSeconds: 15, // Default fallback
        trimStart: 0,
        trimEnd: 15,
    },
    text: {
        fontFamily: 'cairo',
        fontSize: 24,
        textColor: '#ffffff',
        activeWordColor: '#eab308', // primary gold
        positionY: 50, // 50% from top
        words: [],
        manualText: '',
        transcriptVersion: 0,
    },
    currentFrame: 0,
    isPlaying: false,
    exportOptions: {
        quality: '1080p',
        format: 'mp4',
    },

    setVisuals: (newVisuals) => set((state) => ({ visuals: { ...state.visuals, ...newVisuals } })),
    setAudio: (newAudio) => set((state) => {
        const duration = newAudio.durationInSeconds;
        const safeDuration = (duration && !isNaN(duration) && isFinite(duration)) ? duration : state.audio.durationInSeconds;

        const updatedAudio = {
            ...state.audio,
            ...newAudio,
            durationInSeconds: safeDuration
        };

        // If duration changed significantly and trimEnd is at default/old duration, update it
        if (newAudio.durationInSeconds && !isNaN(newAudio.durationInSeconds)) {
            if (state.audio.trimEnd === state.audio.durationInSeconds || state.audio.trimEnd === 15) {
                updatedAudio.trimEnd = newAudio.durationInSeconds;
            }
        }
        return { audio: updatedAudio };
    }),
    setText: (newText) => set((state) => ({ text: { ...state.text, ...newText } })),
    setExportOptions: (newOptions) => set((state) => ({
        exportOptions: { ...state.exportOptions, ...newOptions }
    })),
    setCurrentFrame: (frame) => set({ currentFrame: frame }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
}));
