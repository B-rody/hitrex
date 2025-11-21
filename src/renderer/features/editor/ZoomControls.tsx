import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import type { ZoomKeyframe } from '../../store/useProjectStore';
import { ZoomIn, ZoomOut, Target, Sparkles, Crosshair } from 'lucide-react';

export const ZoomControls: React.FC = () => {
    const { currentTime, zoomKeyframes, addZoomKeyframe, updateZoomKeyframe } = useProjectStore();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [focusMode, setFocusMode] = useState<'manual' | 'click'>('manual');

    // Get current zoom keyframe
    const getCurrentKeyframe = () => {
        if (zoomKeyframes.length === 0) return null;
        
        const sorted = [...zoomKeyframes].sort((a, b) => a.time - b.time);
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i].time <= currentTime) return sorted[i];
        }
        return sorted[0];
    };

    const currentKf = getCurrentKeyframe();

    const createKeyframeAtCurrentTime = () => {
        const defaultZoom = {
            scale: 1.0,
            centerX: 0.5,
            centerY: 0.5,
            easing: 'ease-in-out' as const,
        };

        addZoomKeyframe({
            time: currentTime,
            ...(currentKf || defaultZoom)
        });
    };

    const updateCurrentKeyframe = (updates: Partial<ZoomKeyframe>) => {
        if (!currentKf) {
            createKeyframeAtCurrentTime();
            return;
        }
        updateZoomKeyframe(currentKf.time, updates);
    };

    const presetZoomLevels = [
        { label: '1x', value: 1.0 },
        { label: '1.5x', value: 1.5 },
        { label: '2x', value: 2.0 },
        { label: '3x', value: 3.0 },
        { label: '4x', value: 4.0 },
    ];

    const easingOptions: Array<{ value: ZoomKeyframe['easing']; label: string }> = [
        { value: 'linear', label: 'Linear' },
        { value: 'ease-in', label: 'Ease In' },
        { value: 'ease-out', label: 'Ease Out' },
        { value: 'ease-in-out', label: 'Ease In-Out' },
    ];

    const focusPresets = [
        { name: 'Top Left', x: 0.25, y: 0.25 },
        { name: 'Top Center', x: 0.5, y: 0.25 },
        { name: 'Top Right', x: 0.75, y: 0.25 },
        { name: 'Center Left', x: 0.25, y: 0.5 },
        { name: 'Center', x: 0.5, y: 0.5 },
        { name: 'Center Right', x: 0.75, y: 0.5 },
        { name: 'Bottom Left', x: 0.25, y: 0.75 },
        { name: 'Bottom Center', x: 0.5, y: 0.75 },
        { name: 'Bottom Right', x: 0.75, y: 0.75 },
    ];

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
                    <Target size={16} />
                    Screen Zoom
                </h3>
                <button
                    onClick={() => {/* TODO: Auto-zoom */}}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition-colors flex items-center gap-1"
                    title="Auto-detect zoom points"
                >
                    <Sparkles size={12} />
                    Auto
                </button>
            </div>

            {/* Keyframe indicator */}
            {!currentKf && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-xs text-blue-200">
                    <p className="mb-2">No zoom keyframe at current time.</p>
                    <button
                        onClick={createKeyframeAtCurrentTime}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors flex items-center gap-2"
                    >
                        <ZoomIn size={14} />
                        Create Zoom Keyframe
                    </button>
                </div>
            )}

            {currentKf && (
                <>
                    {/* Zoom Level Quick Presets */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Zoom Level</label>
                        <div className="grid grid-cols-5 gap-1.5">
                            {presetZoomLevels.map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => updateCurrentKeyframe({ scale: preset.value })}
                                    className={`py-2 rounded border transition-all text-sm font-medium ${
                                        Math.abs(currentKf.scale - preset.value) < 0.1
                                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fine Zoom Slider */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                            Precise Zoom: {currentKf.scale.toFixed(2)}x
                        </label>
                        <div className="flex items-center gap-3">
                            <ZoomOut size={16} className="text-gray-500" />
                            <input
                                type="range"
                                min="1"
                                max="4"
                                step="0.1"
                                value={currentKf.scale}
                                onChange={(e) => updateCurrentKeyframe({ scale: Number(e.target.value) })}
                                className="flex-1"
                            />
                            <ZoomIn size={16} className="text-gray-500" />
                        </div>
                    </div>

                    {/* Focus Point Selection Mode */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Focus Point</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setFocusMode('manual')}
                                className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                                    focusMode === 'manual'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                Manual
                            </button>
                            <button
                                onClick={() => setFocusMode('click')}
                                className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                                    focusMode === 'click'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                <Crosshair size={12} />
                                Click on Preview
                            </button>
                        </div>

                        {focusMode === 'manual' && (
                            <>
                                {/* Focus Presets Grid */}
                                <div className="grid grid-cols-3 gap-1.5 mb-3">
                                    {focusPresets.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => updateCurrentKeyframe({ centerX: preset.x, centerY: preset.y })}
                                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors relative group"
                                            title={preset.name}
                                        >
                                            <div className="w-full h-8 bg-gray-900 rounded relative overflow-hidden">
                                                {/* Crosshair at focus point */}
                                                <div
                                                    className="absolute"
                                                    style={{
                                                        left: `${preset.x * 100}%`,
                                                        top: `${preset.y * 100}%`,
                                                        transform: 'translate(-50%, -50%)',
                                                    }}
                                                >
                                                    <div className="w-1 h-3 bg-red-500 absolute left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                    <div className="w-3 h-1 bg-red-500 absolute top-1/2 -translate-y-1/2 -translate-x-1/2" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Manual Position Inputs */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Center X</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={currentKf.centerX.toFixed(2)}
                                            onChange={(e) => updateCurrentKeyframe({ centerX: Number(e.target.value) })}
                                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Center Y</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={currentKf.centerY.toFixed(2)}
                                            onChange={(e) => updateCurrentKeyframe({ centerY: Number(e.target.value) })}
                                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {focusMode === 'click' && (
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-xs text-blue-200">
                                Click anywhere on the preview to set the zoom focus point.
                            </div>
                        )}
                    </div>

                    {/* Advanced Options */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-750 rounded text-sm text-gray-300 transition-colors flex items-center justify-between"
                    >
                        <span>Animation Settings</span>
                        <svg
                            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showAdvanced && (
                        <div className="space-y-3 pt-2 border-t border-gray-800">
                            {/* Easing Function */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Easing Function
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {easingOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateCurrentKeyframe({ easing: option.value })}
                                            className={`py-2 px-3 rounded text-xs font-medium transition-colors ${
                                                currentKf.easing === option.value
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-gray-800 rounded p-3 text-xs text-gray-400">
                                <p className="mb-1 font-medium text-gray-300">💡 Tip</p>
                                <p>Create multiple zoom keyframes to animate zoom and pan over time. The zoom will smoothly transition between keyframes.</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
