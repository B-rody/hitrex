import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };
        
        set((state) => ({ toasts: [...state.toasts, newToast] }));
        
        // Auto-remove after duration
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, toast.duration || 3000);
    },
    
    removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
}));

// Helper functions for easy toast creation
export const toast = {
    success: (message: string, duration?: number) => {
        useToastStore.getState().addToast({ type: 'success', message, duration });
    },
    error: (message: string, duration?: number) => {
        useToastStore.getState().addToast({ type: 'error', message, duration });
    },
    warning: (message: string, duration?: number) => {
        useToastStore.getState().addToast({ type: 'warning', message, duration });
    },
    info: (message: string, duration?: number) => {
        useToastStore.getState().addToast({ type: 'info', message, duration });
    },
};
