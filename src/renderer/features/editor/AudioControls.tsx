import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { toast } from '../../store/useToastStore';

export const AudioControls: React.FC = () => {
    const { clips, selectedClipIds, updateClip } = useProjectStore();

    const selectedClip = clips.find(c => c.id === selectedClipIds[0]);

    if (!selectedClip || selectedClipIds.length !== 1) {
        return (
            <div className="p-4 text-center text-gray-500 text-sm">
                Select a single clip to adjust audio
            </div>
        );
    }

    const handleVolumeChange = (value: number) => {
        updateClip(selectedClip.id, { volume: value });
    };

    const toggleMute = () => {
        updateClip(selectedClip.id, { audioEnabled: !selectedClip.audioEnabled });
        toast.info(selectedClip.audioEnabled ? 'Audio muted' : 'Audio enabled');
    };

    const volumePercent = ((selectedClip.volume || 1) * 100).toFixed(0);

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Audio</h3>
                <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg transition-colors ${
                        selectedClip.audioEnabled
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                    title={selectedClip.audioEnabled ? 'Mute (M)' : 'Unmute (M)'}
                >
                    {selectedClip.audioEnabled ? (
                        <Volume2 className="w-4 h-4" />
                    ) : (
                        <VolumeX className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Volume Slider */}
            <div>
                <label className="block text-xs text-gray-400 mb-2">
                    Volume
                    <span className="float-right text-white font-mono">
                        {volumePercent}%
                    </span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={selectedClip.volume || 1}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    disabled={!selectedClip.audioEnabled}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                    <span>200%</span>
                </div>
            </div>

            {/* Volume Meter Visualization */}
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${
                                selectedClip.audioEnabled
                                    ? selectedClip.volume > 1
                                        ? 'bg-gradient-to-r from-green-500 via-yellow-500 to-red-500'
                                        : 'bg-gradient-to-r from-green-500 to-blue-500'
                                    : 'bg-gray-600'
                            }`}
                            style={{ 
                                width: `${Math.min((selectedClip.volume || 1) * 50, 100)}%` 
                            }}
                        />
                    </div>
                    <span className="text-xs text-gray-400 font-mono w-12 text-right">
                        {selectedClip.audioEnabled ? `${volumePercent}%` : 'MUTED'}
                    </span>
                </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-gray-700">
                <label className="block text-xs text-gray-400 mb-2">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => {
                            updateClip(selectedClip.id, { volume: 0.5, audioEnabled: true });
                            toast.success('Volume: 50%');
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                        50%
                    </button>
                    <button
                        onClick={() => {
                            updateClip(selectedClip.id, { volume: 1.0, audioEnabled: true });
                            toast.success('Volume: 100%');
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                        100%
                    </button>
                    <button
                        onClick={() => {
                            updateClip(selectedClip.id, { volume: 1.5, audioEnabled: true });
                            toast.success('Volume: 150%');
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                        150%
                    </button>
                </div>
            </div>

            {/* Warning for high volume */}
            {selectedClip.volume > 1.5 && (
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-2 text-xs text-yellow-400">
                    ⚠️ High volume may cause distortion
                </div>
            )}
        </div>
    );
};
