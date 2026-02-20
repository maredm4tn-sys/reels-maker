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
}

export interface AudioSettings {
    sourceUrl: string | null;
    sourceType: 'youtube' | 'upload' | null;
    volume: number;
}

export interface TextSettings {
    fontFamily: string;
    fontSize: number;
    textColor: string;
    activeWordColor: string;
    positionY: number;
    words: WordTimestamp[];
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
    exportOptions: ExportSettings;

    // Actions
    setVisuals: (visuals: Partial<VisualSettings>) => void;
    setAudio: (audio: Partial<AudioSettings>) => void;
    setText: (text: Partial<TextSettings>) => void;
    setExportOptions: (options: Partial<ExportSettings>) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
    visuals: {
        backgroundType: 'solid',
        backgroundColor: '#050810',
        backgroundGradient: 'linear-gradient(to right, #000000, #434343)',
        backgroundMediaUrl: null,
        blurAmount: 0,
    },
    audio: {
        sourceUrl: null,
        sourceType: null,
        volume: 100,
    },
    text: {
        fontFamily: 'cairo',
        fontSize: 24,
        textColor: '#ffffff',
        activeWordColor: '#eab308', // primary gold
        positionY: 50, // 50% from top
        words: [],
    },
    exportOptions: {
        quality: '1080p',
        format: 'mp4',
    },

    setVisuals: (newVisuals) => set((state) => ({ visuals: { ...state.visuals, ...newVisuals } })),
    setAudio: (newAudio) => set((state) => ({ audio: { ...state.audio, ...newAudio } })),
    setText: (newText) => set((state) => ({ text: { ...state.text, ...newText } })),
    setExportOptions: (newOptions) => set((state) => ({ exportOptions: { ...state.exportOptions, ...newOptions } })),
}));
