import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecordingBorderProps {
    isRecording: boolean;
}

export const RecordingBorder: React.FC<RecordingBorderProps> = ({ isRecording }) => {
    return (
        <AnimatePresence>
            {isRecording && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed pointer-events-none z-[9999]"
                    style={{
                        width: '100vw',
                        height: '100vh',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        position: 'fixed',
                        inset: 0,
                    }}
                >
                    {/* Top border */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />

                    {/* Right border */}
                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-red-500 animate-pulse" />

                    {/* Bottom border */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />

                    {/* Left border */}
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500 animate-pulse" />

                    {/* Recording indicator in top-left corner */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-white text-xs font-semibold uppercase tracking-wider">Recording</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
