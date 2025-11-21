import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, type ToastType, type Toast } from '../store/useToastStore';

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} className="text-green-400" />;
            case 'error':
                return <XCircle size={20} className="text-red-400" />;
            case 'warning':
                return <AlertCircle size={20} className="text-yellow-400" />;
            case 'info':
                return <Info size={20} className="text-blue-400" />;
        }
    };

    const getColorClasses = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'border-green-600/50 bg-green-600/10';
            case 'error':
                return 'border-red-600/50 bg-red-600/10';
            case 'warning':
                return 'border-yellow-600/50 bg-yellow-600/10';
            case 'info':
                return 'border-blue-600/50 bg-blue-600/10';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast: Toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 300, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 300, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`pointer-events-auto bg-gray-900 border rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md ${getColorClasses(
                            toast.type
                        )}`}
                    >
                        <div className="flex items-start gap-3">
                            {getIcon(toast.type)}
                            <p className="flex-1 text-sm text-white">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 hover:bg-gray-800 rounded transition-colors"
                            >
                                <X size={16} className="text-gray-400" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
