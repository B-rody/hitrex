import { create } from 'zustand';

export interface HistoryEntry {
    timestamp: number;
    action: string;
    state: unknown; // Snapshot of relevant state
}

interface UndoRedoState {
    history: HistoryEntry[];
    currentIndex: number;
    maxHistory: number;
    
    // Actions
    pushState: (action: string, state: unknown) => void;
    undo: () => unknown | null;
    redo: () => unknown | null;
    canUndo: () => boolean;
    canRedo: () => boolean;
    clear: () => void;
    getHistory: () => HistoryEntry[];
}

export const useUndoRedoStore = create<UndoRedoState>((set, get) => ({
    history: [],
    currentIndex: -1,
    maxHistory: 50, // Keep last 50 actions

    pushState: (action, state) => {
        const { history, currentIndex, maxHistory } = get();
        
        // Remove any history after current index (if we undid and then made a new action)
        const newHistory = history.slice(0, currentIndex + 1);
        
        // Add new entry
        newHistory.push({
            timestamp: Date.now(),
            action,
            state: JSON.parse(JSON.stringify(state)), // Deep clone
        });
        
        // Limit history size
        const limitedHistory = newHistory.slice(-maxHistory);
        
        set({
            history: limitedHistory,
            currentIndex: limitedHistory.length - 1,
        });
    },

    undo: () => {
        const { history, currentIndex } = get();
        
        if (currentIndex <= 0) return null;
        
        const newIndex = currentIndex - 1;
        set({ currentIndex: newIndex });
        
        return history[newIndex].state;
    },

    redo: () => {
        const { history, currentIndex } = get();
        
        if (currentIndex >= history.length - 1) return null;
        
        const newIndex = currentIndex + 1;
        set({ currentIndex: newIndex });
        
        return history[newIndex].state;
    },

    canUndo: () => {
        const { currentIndex } = get();
        return currentIndex > 0;
    },

    canRedo: () => {
        const { history, currentIndex } = get();
        return currentIndex < history.length - 1;
    },

    clear: () => {
        set({ history: [], currentIndex: -1 });
    },

    getHistory: () => {
        const { history } = get();
        return history;
    },
}));
