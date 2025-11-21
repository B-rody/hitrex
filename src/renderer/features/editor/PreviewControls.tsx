import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { Tooltip } from '../../components/Tooltip';

export const PreviewControls: React.FC = () => {
    const [isMuted, setIsMuted] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [volume, setVolume] = React.useState(100);

    const toggleMute = () => setIsMuted(!isMuted);
    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 flex items-center gap-4 z-30 shadow-2xl">
            {/* Volume Control */}
            <div className="flex items-center gap-2">
                <Tooltip content={isMuted ? 'Unmute' : 'Mute'} shortcut="M">
                    <button
                        onClick={toggleMute}
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                </Tooltip>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                        setVolume(Number(e.target.value));
                        if (Number(e.target.value) > 0) setIsMuted(false);
                    }}
                    className="w-20"
                />
                <span className="text-xs text-gray-400 w-8">{isMuted ? 0 : volume}%</span>
            </div>

            <div className="h-6 w-px bg-gray-700" />

            {/* Fullscreen Toggle */}
            <Tooltip content={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} shortcut="F">
                <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </Tooltip>
        </div>
    );
};
