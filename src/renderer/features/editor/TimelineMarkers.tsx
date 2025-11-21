import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface TimelineMarker {
    id: string;
    time: number;
    label: string;
    color: string;
}

export const TimelineMarkers: React.FC<{ pixelsPerMs: number }> = ({ pixelsPerMs }) => {
    const { currentTime } = useProjectStore();
    const [markers, setMarkers] = useState<TimelineMarker[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const addMarker = () => {
        const newMarker: TimelineMarker = {
            id: Math.random().toString(36).substring(7),
            time: currentTime,
            label: 'Marker',
            color: '#3b82f6',
        };
        setMarkers([...markers, newMarker]);
        setEditingId(newMarker.id);
    };

    const updateMarkerLabel = (id: string, label: string) => {
        setMarkers(markers.map((m) => (m.id === id ? { ...m, label } : m)));
    };

    const deleteMarker = (id: string) => {
        setMarkers(markers.filter((m) => m.id !== id));
    };

    const markerColors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // yellow
        '#ef4444', // red
        '#8b5cf6', // purple
        '#ec4899', // pink
    ];

    return (
        <>
            {/* Add Marker Button */}
            <div className="absolute -top-8 right-4 z-10">
                <button
                    onClick={addMarker}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors flex items-center gap-1"
                    title="Add Marker (M)"
                >
                    <Plus size={12} />
                    Marker
                </button>
            </div>

            {/* Markers */}
            {markers.map((marker) => (
                <motion.div
                    key={marker.id}
                    initial={{ scale: 0, y: -10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, y: -10 }}
                    className="absolute -top-6 z-20 group"
                    style={{
                        left: marker.time * pixelsPerMs,
                        transform: 'translateX(-50%)',
                    }}
                >
                    {/* Marker Flag */}
                    <div
                        className="cursor-pointer"
                        style={{ color: marker.color }}
                    >
                        <Bookmark size={16} fill="currentColor" />
                    </div>

                    {/* Vertical Line */}
                    <div
                        className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-screen opacity-30"
                        style={{ backgroundColor: marker.color }}
                    />

                    {/* Label Popup */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 min-w-[120px]">
                            {editingId === marker.id ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={marker.label}
                                    onChange={(e) => updateMarkerLabel(marker.id, e.target.value)}
                                    onBlur={() => setEditingId(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white"
                                />
                            ) : (
                                <div
                                    onClick={() => setEditingId(marker.id)}
                                    className="text-xs text-white cursor-text hover:bg-gray-800 px-2 py-1 rounded"
                                >
                                    {marker.label}
                                </div>
                            )}
                            <div className="flex items-center gap-1 mt-2">
                                {markerColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setMarkers(markers.map((m) => (m.id === marker.id ? { ...m, color } : m)))}
                                        className="w-4 h-4 rounded-full border-2 hover:scale-110 transition-transform"
                                        style={{
                                            backgroundColor: color,
                                            borderColor: marker.color === color ? 'white' : 'transparent',
                                        }}
                                    />
                                ))}
                                <button
                                    onClick={() => deleteMarker(marker.id)}
                                    className="ml-auto text-xs text-red-400 hover:text-red-300 px-2"
                                >
                                    Del
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </>
    );
};
