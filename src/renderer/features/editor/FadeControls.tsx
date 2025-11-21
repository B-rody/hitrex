import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { toast } from '../../store/useToastStore';

export const FadeControls: React.FC = () => {
    const { clips, selectedClipIds, updateClip } = useProjectStore();

    const selectedClip = clips.find(c => c.id === selectedClipIds[0]);

    if (!selectedClip || selectedClipIds.length !== 1) {
        return (
            <div className="p-4 text-center text-gray-500 text-sm">
                Select a single clip to adjust fades
            </div>
        );
    }

    const handleFadeInChange = (value: number) => {
        const fadeIn = Math.min(value, selectedClip.duration / 2);
        updateClip(selectedClip.id, { fadeIn });
    };

    const handleFadeOutChange = (value: number) => {
        const fadeOut = Math.min(value, selectedClip.duration / 2);
        updateClip(selectedClip.id, { fadeOut });
    };

    const handleOpacityChange = (value: number) => {
        updateClip(selectedClip.id, { opacity: value });
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-white mb-3">Fade & Opacity</h3>

            {/* Fade In */}
            <div>
                <label className="block text-xs text-gray-400 mb-2">
                    Fade In
                    <span className="float-right text-white font-mono">
                        {((selectedClip.fadeIn || 0) / 1000).toFixed(1)}s
                    </span>
                </label>
                <input
                    type="range"
                    min="0"
                    max={selectedClip.duration / 2}
                    step="100"
                    value={selectedClip.fadeIn || 0}
                    onChange={(e) => handleFadeInChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>

            {/* Fade Out */}
            <div>
                <label className="block text-xs text-gray-400 mb-2">
                    Fade Out
                    <span className="float-right text-white font-mono">
                        {((selectedClip.fadeOut || 0) / 1000).toFixed(1)}s
                    </span>
                </label>
                <input
                    type="range"
                    min="0"
                    max={selectedClip.duration / 2}
                    step="100"
                    value={selectedClip.fadeOut || 0}
                    onChange={(e) => handleFadeOutChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>

            {/* Opacity */}
            <div>
                <label className="block text-xs text-gray-400 mb-2">
                    Opacity
                    <span className="float-right text-white font-mono">
                        {((selectedClip.opacity || 1) * 100).toFixed(0)}%
                    </span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedClip.opacity || 1}
                    onChange={(e) => handleOpacityChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>

            {/* Quick presets */}
            <div className="pt-2 border-t border-gray-700">
                <label className="block text-xs text-gray-400 mb-2">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => {
                            updateClip(selectedClip.id, { fadeIn: 500, fadeOut: 500 });
                            toast.success('Applied 0.5s fades');
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                        0.5s Fade
                    </button>
                    <button
                        onClick={() => {
                            updateClip(selectedClip.id, { fadeIn: 1000, fadeOut: 1000 });
                            toast.success('Applied 1s fades');
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                        1s Fade
                    </button>
                    <button
                        onClick={() => {
                            updateClip(selectedClip.id, { fadeIn: 0, fadeOut: 0, opacity: 1 });
                            toast.success('Reset fades');
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => {
                            updateClip(selectedClip.id, { fadeIn: 2000, fadeOut: 2000 });
                            toast.success('Applied 2s fades');
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                        2s Fade
                    </button>
                </div>
            </div>
        </div>
    );
};
