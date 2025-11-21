import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 24, message }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
                <Loader2 size={size} className="text-blue-500" />
            </motion.div>
            {message && <p className="text-sm text-gray-400">{message}</p>}
        </div>
    );
};

export const ProgressBar: React.FC<{ progress: number; label?: string }> = ({ progress, label }) => {
    return (
        <div className="w-full space-y-2">
            {label && <p className="text-sm text-gray-400">{label}</p>}
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                />
            </div>
            <p className="text-xs text-gray-500 text-right">{progress.toFixed(0)}%</p>
        </div>
    );
};
