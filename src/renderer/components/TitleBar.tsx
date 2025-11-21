import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
    const handleMinimize = () => {
        if (window.electronAPI?.windowMinimize) {
            window.electronAPI.windowMinimize();
        }
    };

    const handleMaximize = () => {
        if (window.electronAPI?.windowMaximize) {
            window.electronAPI.windowMaximize();
        }
    };

    const handleClose = () => {
        if (window.electronAPI?.windowClose) {
            window.electronAPI.windowClose();
        }
    };

    return (
        <div className="flex items-center justify-end h-10 bg-surface-950 select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
            <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <button
                    onClick={handleMinimize}
                    className="w-12 h-10 flex items-center justify-center hover:bg-surface-800 transition-colors text-surface-400 hover:text-white"
                    aria-label="Minimize"
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-12 h-10 flex items-center justify-center hover:bg-surface-800 transition-colors text-surface-400 hover:text-white"
                    aria-label="Maximize"
                >
                    <Square size={14} />
                </button>
                <button
                    onClick={handleClose}
                    className="w-12 h-10 flex items-center justify-center hover:bg-red-600 transition-colors text-surface-400 hover:text-white"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
