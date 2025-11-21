import React from 'react';
import { X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
    const shortcuts = [
        {
            category: 'Playback',
            items: [
                { keys: ['Space'], description: 'Play / Pause' },
                { keys: ['J'], description: 'Rewind' },
                { keys: ['K'], description: 'Pause' },
                { keys: ['L'], description: 'Fast Forward' },
                { keys: ['←', '→'], description: 'Frame by frame' },
                { keys: ['I'], description: 'Mark In Point' },
                { keys: ['O'], description: 'Mark Out Point' },
            ],
        },
        {
            category: 'Editing',
            items: [
                { keys: ['S'], description: 'Split clip at playhead' },
                { keys: ['Delete'], description: 'Delete selected clips' },
                { keys: ['Ctrl', 'C'], description: 'Copy selected clips' },
                { keys: ['Ctrl', 'V'], description: 'Paste clips' },
                { keys: ['Ctrl', 'Z'], description: 'Undo' },
                { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
                { keys: ['Ctrl', 'D'], description: 'Duplicate clip' },
            ],
        },
        {
            category: 'Timeline',
            items: [
                { keys: ['+'], description: 'Zoom in timeline' },
                { keys: ['-'], description: 'Zoom out timeline' },
                { keys: ['Shift', 'Z'], description: 'Fit timeline to window' },
                { keys: ['Home'], description: 'Go to start' },
                { keys: ['End'], description: 'Go to end' },
            ],
        },
        {
            category: 'View',
            items: [
                { keys: ['F'], description: 'Fullscreen preview' },
                { keys: ['`'], description: 'Toggle sidebar' },
                { keys: ['?'], description: 'Show this help' },
            ],
        },
        {
            category: 'Webcam',
            items: [
                { keys: ['W'], description: 'Toggle webcam visibility' },
                { keys: ['Alt', '1-9'], description: 'Quick position presets' },
            ],
        },
        {
            category: 'Zoom',
            items: [
                { keys: ['Z'], description: 'Add zoom keyframe' },
                { keys: ['1'], description: 'Reset zoom to 1x' },
                { keys: ['2'], description: 'Zoom to 2x' },
            ],
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <Zap size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                                        <p className="text-sm text-gray-400">Master HitRex like a pro</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {shortcuts.map((section, idx) => (
                                        <div key={idx} className="space-y-3">
                                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide flex items-center gap-2">
                                                <div className="h-px flex-1 bg-gradient-to-r from-blue-600/50 to-transparent" />
                                                {section.category}
                                                <div className="h-px flex-1 bg-gradient-to-l from-blue-600/50 to-transparent" />
                                            </h3>
                                            <div className="space-y-2">
                                                {section.items.map((item, itemIdx) => (
                                                    <div
                                                        key={itemIdx}
                                                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
                                                    >
                                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                                            {item.description}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {item.keys.map((key, keyIdx) => (
                                                                <React.Fragment key={keyIdx}>
                                                                    <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-gray-300 shadow-sm group-hover:border-blue-600/50 group-hover:text-blue-300 transition-colors">
                                                                        {key}
                                                                    </kbd>
                                                                    {keyIdx < item.keys.length - 1 && (
                                                                        <span className="text-gray-600 text-xs">+</span>
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Tip */}
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-lg">
                                    <p className="text-sm text-gray-300">
                                        <span className="font-semibold text-blue-400">💡 Pro Tip:</span> Most shortcuts work even when not focused on a specific element. Press{' '}
                                        <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono mx-1">?</kbd>
                                        anytime to show this panel.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
