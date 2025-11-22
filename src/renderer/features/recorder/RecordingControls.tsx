import React from 'react';
import { Square, Pause, Play, Mic, MicOff, RotateCcw, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '../../components/Tooltip';

interface RecordingControlsProps {
    isRecording: boolean;
    isPaused: boolean;
    isMuted: boolean;
    micLevel?: number;
    recordingTime: number;
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
    onToggleMute: () => void;
    onRestart: () => void;
    onCancel: () => void;
    onToggleAnnotations?: () => void;
    showAnnotations?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
    isRecording,
    isPaused,
    isMuted,
    micLevel = 0,
    recordingTime,
    onStop,
    onPause,
    onResume,
    onToggleMute,
    onRestart,
    onCancel,
    onToggleAnnotations,
    showAnnotations = false,
}) => {
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleMouseEnter = () => {
        if (showAnnotations) return;
        if (window.electronAPI?.overlaySetIgnoreMouseEvents) {
            window.electronAPI.overlaySetIgnoreMouseEvents(false);
        }
    };

    const handleMouseLeave = () => {
        if (showAnnotations) return;
        if (window.electronAPI?.overlaySetIgnoreMouseEvents) {
            window.electronAPI.overlaySetIgnoreMouseEvents(true);
        }
    };

    return (
        <AnimatePresence>
            {isRecording && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="bg-surface-900/90 backdrop-blur-xl border border-surface-700 rounded-full shadow-2xl px-4 py-2 flex items-center gap-3">
                        <div className="flex items-center gap-3 pl-2">
                            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`} />
                            <span className="font-mono text-lg font-semibold text-white min-w-[60px]">
                                {formatTime(recordingTime)}
                            </span>
                        </div>

                        <div className="h-6 w-px bg-surface-700" />

                        <div className="flex items-center gap-1">
                            <Tooltip content="Restart Recording">
                                <button
                                    onClick={onRestart}
                                    className="p-2 hover:bg-surface-700 rounded-full transition-colors text-surface-400 hover:text-white"
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </Tooltip>

                            <Tooltip content={isPaused ? "Resume" : "Pause"}>
                                <button
                                    onClick={isPaused ? onResume : onPause}
                                    className="p-2 hover:bg-surface-700 rounded-full transition-colors text-white"
                                >
                                    {isPaused ? (
                                        <Play size={20} className="fill-current" />
                                    ) : (
                                        <Pause size={20} className="fill-current" />
                                    )}
                                </button>
                            </Tooltip>

                            {onToggleAnnotations && (
                                <Tooltip content="Drawing Tools">
                                    <button
                                        onClick={onToggleAnnotations}
                                        className={`p-2 rounded-full transition-colors ${
                                            showAnnotations
                                                ? 'bg-brand-500 text-white hover:bg-brand-600'
                                                : 'hover:bg-surface-700 text-surface-400 hover:text-white'
                                        }`}
                                    >
                                        <Pencil size={20} />
                                    </button>
                                </Tooltip>
                            )}

                            <Tooltip content={isMuted ? "Unmute" : "Mute"}>
                                <button
                                    onClick={onToggleMute}
                                    className={`relative p-2 hover:bg-surface-700 rounded-full transition-colors overflow-hidden ${isMuted ? 'text-red-400' : 'text-white'}`}
                                >
                                    {/* Audio level indicator background */}
                                    <div 
                                        className="absolute inset-0 bg-brand-500 transition-all duration-75 rounded-full"
                                        style={{ 
                                            opacity: !isMuted ? 0.2 + (micLevel / 100) * 0.6 : 0,
                                            transform: `scaleY(${!isMuted ? micLevel / 100 : 0})`,
                                            transformOrigin: 'bottom'
                                        }}
                                    />
                                    <div className="relative z-10">
                                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                    </div>
                                </button>
                            </Tooltip>

                            <Tooltip content="Cancel Recording">
                                <button
                                    onClick={onCancel}
                                    className="p-2 hover:bg-surface-700 rounded-full transition-colors text-surface-400 hover:text-red-400"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="h-6 w-px bg-surface-700" />

                        <button
                            onClick={onStop}
                            className="px-4 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <Square size={16} className="fill-current" />
                            Stop
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
