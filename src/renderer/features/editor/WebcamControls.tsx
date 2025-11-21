import React, { useState } from 'react';
import { useProjectStore, WebcamKeyframe } from '../../store/useProjectStore';
import { Circle, Square, RectangleHorizontal, Eye, EyeOff, Sparkles, Move } from 'lucide-react';

export const WebcamControls: React.FC = () => {
    const { currentTime, webcamKeyframes, addWebcamKeyframe, updateWebcamKeyframe } = useProjectStore();
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Get current or nearest keyframe
    const getCurrentKeyframe = () => {
        if (webcamKeyframes.length === 0) return null;
        
        // Find exact match or nearest before currentTime
        const sorted = [...webcamKeyframes].sort((a, b) => a.time - b.time);
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i].time <= currentTime) return sorted[i];
        }
        return sorted[0];
    };

    const currentKf = getCurrentKeyframe();

    const createKeyframeAtCurrentTime = () => {
        const defaultLayout = {
            x: 0.85,
            y: 0.85,
            width: 240,
            height: 180,
            scale: 1,
            shape: 'rounded' as const,
            borderColor: '#ffffff',
            borderWidth: 2,
            shadow: true,
            visible: true,
        };

        addWebcamKeyframe({
            time: currentTime,
            ...(currentKf || defaultLayout)
        });
    };

    const updateCurrentKeyframe = (updates: Partial<WebcamKeyframe>) => {
        if (!currentKf) {
            createKeyframeAtCurrentTime();
            return;
        }
        updateWebcamKeyframe(currentKf.time, updates);
    };

    // Position presets (9-grid)
    const positionPresets = [
        { name: 'Top Left', x: 0.05, y: 0.05 },
        { name: 'Top Center', x: 0.5, y: 0.05 },
        { name: 'Top Right', x: 0.95, y: 0.05 },
        { name: 'Middle Left', x: 0.05, y: 0.5 },
        { name: 'Center', x: 0.5, y: 0.5 },
        { name: 'Middle Right', x: 0.95, y: 0.5 },
        { name: 'Bottom Left', x: 0.05, y: 0.95 },
        { name: 'Bottom Center', x: 0.5, y: 0.95 },
        { name: 'Bottom Right', x: 0.85, y: 0.85 }, // Default
    ];

    const shapes = [
        { value: 'circle', icon: Circle, label: 'Circle' },
        { value: 'square', icon: Square, label: 'Square' },
        { value: 'rounded', icon: RectangleHorizontal, label: 'Rounded' },
    ];

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">
                    Webcam Controls
                </h3>
                <button
                    onClick={() => updateCurrentKeyframe({ visible: !currentKf?.visible })}
                    className={`p-2 rounded transition-colors ${
                        currentKf?.visible !== false
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={currentKf?.visible !== false ? 'Hide Webcam' : 'Show Webcam'}
                >
                    {currentKf?.visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
            </div>

            {/* Keyframe indicator */}
            {!currentKf && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-xs text-yellow-200">
                    <p className="mb-2">No keyframe at current time. Create one to customize webcam.</p>
                    <button
                        onClick={createKeyframeAtCurrentTime}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-medium transition-colors flex items-center gap-2"
                    >
                        <Sparkles size={14} />
                        Create Keyframe
                    </button>
                </div>
            )}

            {currentKf && (
                <>
                    {/* Shape Selector */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Shape</label>
                        <div className="grid grid-cols-3 gap-2">
                            {shapes.map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => updateCurrentKeyframe({ shape: value as 'circle' | 'square' | 'rounded' })}
                                    className={`p-3 rounded border-2 transition-all flex flex-col items-center gap-1 ${
                                        currentKf.shape === value
                                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                                    }`}
                                >
                                    <Icon size={20} />
                                    <span className="text-xs">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Position Presets */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Position Presets</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {positionPresets.map((preset, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => updateCurrentKeyframe({ x: preset.x, y: preset.y })}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors relative group"
                                    title={preset.name}
                                >
                                    <div className="w-full h-8 bg-gray-900 rounded relative overflow-hidden">
                                        <div
                                            className="absolute w-3 h-3 bg-green-500 rounded-sm"
                                            style={{
                                                left: `${preset.x * 100}%`,
                                                top: `${preset.y * 100}%`,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        />
                                    </div>
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-500 group-hover:text-gray-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/90">
                                        {preset.name.split(' ')[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size Controls */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                Width: {currentKf.width}px
                            </label>
                            <input
                                type="range"
                                min="120"
                                max="640"
                                step="10"
                                value={currentKf.width}
                                onChange={(e) => updateCurrentKeyframe({ width: Number(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                Height: {currentKf.height}px
                            </label>
                            <input
                                type="range"
                                min="90"
                                max="480"
                                step="10"
                                value={currentKf.height}
                                onChange={(e) => updateCurrentKeyframe({ height: Number(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Advanced Options Toggle */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-750 rounded text-sm text-gray-300 transition-colors flex items-center justify-between"
                    >
                        <span>Advanced Styling</span>
                        <svg
                            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Advanced Options */}
                    {showAdvanced && (
                        <div className="space-y-3 pt-2 border-t border-gray-800">
                            {/* Border Color */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Border Color
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={currentKf.borderColor}
                                        onChange={(e) => updateCurrentKeyframe({ borderColor: e.target.value })}
                                        className="w-10 h-10 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={currentKf.borderColor}
                                        onChange={(e) => updateCurrentKeyframe({ borderColor: e.target.value })}
                                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm font-mono"
                                        placeholder="#ffffff"
                                    />
                                </div>
                            </div>

                            {/* Border Width */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Border Width: {currentKf.borderWidth}px
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={currentKf.borderWidth}
                                    onChange={(e) => updateCurrentKeyframe({ borderWidth: Number(e.target.value) })}
                                    className="w-full"
                                />
                            </div>

                            {/* Shadow Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-400">Drop Shadow</label>
                                <button
                                    onClick={() => updateCurrentKeyframe({ shadow: !currentKf.shadow })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        currentKf.shadow ? 'bg-blue-600' : 'bg-gray-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            currentKf.shadow ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Scale */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Scale: {currentKf.scale.toFixed(2)}x
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={currentKf.scale}
                                    onChange={(e) => updateCurrentKeyframe({ scale: Number(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Manual Position */}
                    <div className="pt-2 border-t border-gray-800">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Move size={12} />
                            <span>Drag webcam in preview or use precise controls</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">X Position</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={currentKf.x.toFixed(2)}
                                    onChange={(e) => updateCurrentKeyframe({ x: Number(e.target.value) })}
                                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Y Position</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={currentKf.y.toFixed(2)}
                                    onChange={(e) => updateCurrentKeyframe({ y: Number(e.target.value) })}
                                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
