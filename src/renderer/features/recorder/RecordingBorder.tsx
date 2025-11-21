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
                    className="pointer-events-none fixed inset-0 w-screen h-screen z-[9999]"
                    style={{
                        border: '4px solid rgb(239, 68, 68)',
                        boxSizing: 'border-box'
                    }}
                >
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
