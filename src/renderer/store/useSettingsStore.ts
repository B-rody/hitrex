import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
    aiProvider: 'openai' | 'local';
    openaiApiKey: string;
    localModelPath: string;
    setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            aiProvider: 'openai',
            openaiApiKey: '',
            localModelPath: '',
            setSettings: (settings) => set((state) => ({ ...state, ...settings })),
        }),
        {
            name: 'hitrex-settings',
        }
    )
);
