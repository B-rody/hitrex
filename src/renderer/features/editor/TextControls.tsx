import React, { useState } from 'react';
import { useProjectStore, TextLayer } from '../../store/useProjectStore';
import { Type, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

export const TextControls: React.FC = () => {
    const {
        textLayers,
        selectedTextLayerId,
        currentTime,
        duration,
        addTextLayer,
        updateTextLayer,
        deleteTextLayer,
        selectTextLayer,
    } = useProjectStore();

    const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null);

    const handleAddText = () => {
        const newLayer: TextLayer = {
            id: `text-${Date.now()}`,
            text: 'New Text',
            startTime: currentTime,
            duration: 3000, // 3 seconds default
            x: 0.5,
            y: 0.5,
            fontSize: 48,
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#ffffff',
            backgroundColor: 'transparent',
            bold: false,
            italic: false,
            underline: false,
            align: 'center',
            opacity: 1,
            rotation: 0,
            fadeIn: 300,
            fadeOut: 300,
            enabled: true,
        };
        addTextLayer(newLayer);
    };

    const visibleLayers = textLayers.filter((layer) => {
        const endTime = layer.startTime + layer.duration;
        return currentTime >= layer.startTime && currentTime <= endTime;
    });

    return (
        <div className="flex flex-col gap-4">
            {/* Add Text Button */}
            <button
                onClick={handleAddText}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
                <Plus size={18} />
                Add Text Layer
            </button>

            {/* Text Layers List */}
            <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-400 flex items-center gap-2">
                    <Type size={16} />
                    Text Layers ({textLayers.length})
                </div>

                {textLayers.length === 0 && (
                    <div className="text-sm text-gray-500 p-4 text-center border border-gray-700 rounded-lg">
                        No text layers yet. Click "Add Text Layer" to create one.
                    </div>
                )}

                {textLayers.map((layer) => {
                    const isSelected = layer.id === selectedTextLayerId;
                    const isExpanded = layer.id === expandedLayerId;
                    const isVisible = visibleLayers.includes(layer);

                    return (
                        <div
                            key={layer.id}
                            className={`border rounded-lg transition-colors ${
                                isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800'
                            }`}
                        >
                            {/* Layer Header */}
                            <div
                                className="flex items-center gap-2 p-3 cursor-pointer"
                                onClick={() => selectTextLayer(layer.id)}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateTextLayer(layer.id, { enabled: !layer.enabled });
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    {layer.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>

                                <div className="flex-1 text-sm truncate">
                                    <div className="font-medium text-white">{layer.text || 'Empty Text'}</div>
                                    <div className="text-xs text-gray-400">
                                        {(layer.startTime / 1000).toFixed(1)}s - {((layer.startTime + layer.duration) / 1000).toFixed(1)}s
                                        {isVisible && <span className="ml-2 text-green-400">● Visible</span>}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedLayerId(isExpanded ? null : layer.id);
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTextLayer(layer.id);
                                    }}
                                    className="text-red-400 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Expanded Controls */}
                            {isExpanded && (
                                <div className="border-t border-gray-700 p-3 space-y-3">
                                    {/* Text Content */}
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Text</label>
                                        <input
                                            type="text"
                                            value={layer.text}
                                            onChange={(e) => updateTextLayer(layer.id, { text: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                                            placeholder="Enter text..."
                                        />
                                    </div>

                                    {/* Timing */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Start (s)</label>
                                            <input
                                                type="number"
                                                value={(layer.startTime / 1000).toFixed(2)}
                                                onChange={(e) => updateTextLayer(layer.id, { startTime: parseFloat(e.target.value) * 1000 })}
                                                step="0.1"
                                                min="0"
                                                max={(duration / 1000).toFixed(2)}
                                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Duration (s)</label>
                                            <input
                                                type="number"
                                                value={(layer.duration / 1000).toFixed(2)}
                                                onChange={(e) => updateTextLayer(layer.id, { duration: parseFloat(e.target.value) * 1000 })}
                                                step="0.1"
                                                min="0.1"
                                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Position */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">X Position (%)</label>
                                            <input
                                                type="number"
                                                value={(layer.x * 100).toFixed(0)}
                                                onChange={(e) => updateTextLayer(layer.id, { x: parseFloat(e.target.value) / 100 })}
                                                step="1"
                                                min="0"
                                                max="100"
                                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Y Position (%)</label>
                                            <input
                                                type="number"
                                                value={(layer.y * 100).toFixed(0)}
                                                onChange={(e) => updateTextLayer(layer.id, { y: parseFloat(e.target.value) / 100 })}
                                                step="1"
                                                min="0"
                                                max="100"
                                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Font Size */}
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Font Size: {layer.fontSize}px</label>
                                        <input
                                            type="range"
                                            value={layer.fontSize}
                                            onChange={(e) => updateTextLayer(layer.id, { fontSize: parseInt(e.target.value) })}
                                            min="12"
                                            max="120"
                                            step="1"
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Font Style */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateTextLayer(layer.id, { bold: !layer.bold })}
                                            className={`flex-1 px-3 py-2 rounded text-sm font-bold ${
                                                layer.bold ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                                            }`}
                                        >
                                            Bold
                                        </button>
                                        <button
                                            onClick={() => updateTextLayer(layer.id, { italic: !layer.italic })}
                                            className={`flex-1 px-3 py-2 rounded text-sm italic ${
                                                layer.italic ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                                            }`}
                                        >
                                            Italic
                                        </button>
                                        <button
                                            onClick={() => updateTextLayer(layer.id, { underline: !layer.underline })}
                                            className={`flex-1 px-3 py-2 rounded text-sm underline ${
                                                layer.underline ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                                            }`}
                                        >
                                            Underline
                                        </button>
                                    </div>

                                    {/* Alignment */}
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Text Align</label>
                                        <div className="flex gap-2">
                                            {(['left', 'center', 'right'] as const).map((align) => (
                                                <button
                                                    key={align}
                                                    onClick={() => updateTextLayer(layer.id, { align })}
                                                    className={`flex-1 px-3 py-2 rounded text-sm capitalize ${
                                                        layer.align === align ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                                                    }`}
                                                >
                                                    {align}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Colors */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Text Color</label>
                                            <input
                                                type="color"
                                                value={layer.color}
                                                onChange={(e) => updateTextLayer(layer.id, { color: e.target.value })}
                                                className="w-full h-10 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Background</label>
                                            <input
                                                type="color"
                                                value={layer.backgroundColor === 'transparent' ? '#000000' : layer.backgroundColor}
                                                onChange={(e) => updateTextLayer(layer.id, { backgroundColor: e.target.value })}
                                                className="w-full h-10 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Opacity & Rotation */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Opacity: {(layer.opacity * 100).toFixed(0)}%</label>
                                            <input
                                                type="range"
                                                value={layer.opacity * 100}
                                                onChange={(e) => updateTextLayer(layer.id, { opacity: parseFloat(e.target.value) / 100 })}
                                                min="0"
                                                max="100"
                                                step="1"
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Rotation: {layer.rotation}°</label>
                                            <input
                                                type="range"
                                                value={layer.rotation}
                                                onChange={(e) => updateTextLayer(layer.id, { rotation: parseInt(e.target.value) })}
                                                min="-180"
                                                max="180"
                                                step="1"
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Fade In/Out */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Fade In (ms)</label>
                                            <input
                                                type="number"
                                                value={layer.fadeIn}
                                                onChange={(e) => updateTextLayer(layer.id, { fadeIn: parseInt(e.target.value) })}
                                                step="100"
                                                min="0"
                                                max={layer.duration / 2}
                                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Fade Out (ms)</label>
                                            <input
                                                type="number"
                                                value={layer.fadeOut}
                                                onChange={(e) => updateTextLayer(layer.id, { fadeOut: parseInt(e.target.value) })}
                                                step="100"
                                                min="0"
                                                max={layer.duration / 2}
                                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Quick Presets */}
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Quick Presets</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() =>
                                                    updateTextLayer(layer.id, {
                                                        fontSize: 64,
                                                        bold: true,
                                                        color: '#ffffff',
                                                        backgroundColor: 'transparent',
                                                        align: 'center',
                                                        y: 0.1,
                                                    })
                                                }
                                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                                            >
                                                Title
                                            </button>
                                            <button
                                                onClick={() =>
                                                    updateTextLayer(layer.id, {
                                                        fontSize: 32,
                                                        bold: false,
                                                        color: '#ffffff',
                                                        backgroundColor: '#000000cc',
                                                        align: 'center',
                                                        y: 0.85,
                                                    })
                                                }
                                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                                            >
                                                Subtitle
                                            </button>
                                            <button
                                                onClick={() =>
                                                    updateTextLayer(layer.id, {
                                                        fontSize: 24,
                                                        bold: false,
                                                        color: '#ffffff',
                                                        backgroundColor: '#000000aa',
                                                        align: 'left',
                                                        x: 0.05,
                                                        y: 0.9,
                                                    })
                                                }
                                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                                            >
                                                Lower Third
                                            </button>
                                            <button
                                                onClick={() =>
                                                    updateTextLayer(layer.id, {
                                                        fontSize: 48,
                                                        bold: true,
                                                        color: '#fbbf24',
                                                        backgroundColor: 'transparent',
                                                        align: 'center',
                                                        y: 0.5,
                                                    })
                                                }
                                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                                            >
                                                Callout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
