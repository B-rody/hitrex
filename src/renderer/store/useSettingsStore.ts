import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
    aiProvider: 'openai' | 'local';
    openaiApiKey: string;
    localModelPath: string;
    includeTaskbarInRecording: boolean;
    recordingResolution: '720p' | '1080p' | '1440p' | '4K';
    recordingFps: 30 | 60;
    includeSystemAudio: boolean;
    highlightClicks: boolean;
    setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            aiProvider: 'openai',
            openaiApiKey: '',
            localModelPath: '',
            includeTaskbarInRecording: true,
            recordingResolution: '1080p',
            recordingFps: 30,
            includeSystemAudio: true,
            highlightClicks: false,
            setSettings: (settings) => set((state) => ({ ...state, ...settings })),
        }),
        {
            name: 'hitrex-settings',
        }
    )
);
