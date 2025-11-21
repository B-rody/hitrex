import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { motion } from 'framer-motion';

interface TimelineMiniMapProps {
    width: number;
    height: number;
}

export const TimelineMiniMap: React.FC<TimelineMiniMapProps> = ({ width, height }) => {
    const { clips, duration, currentTime, layoutKeyframes, webcamKeyframes, zoomKeyframes } = useProjectStore();

    const miniMapRef = React.useRef<HTMLDivElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        if (!miniMapRef.current) return;
        const rect = miniMapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / width) * duration;
        useProjectStore.getState().setCurrentTime(time);
    };

    return (
        <div
            ref={miniMapRef}
            className="relative bg-gray-900 border border-gray-800 rounded cursor-pointer overflow-hidden"
            style={{ width, height }}
            onClick={handleClick}
        >
            {/* Clips */}
            {clips.map((clip) => (
                <div
                    key={clip.id}
                    className="absolute top-0 opacity-50"
                    style={{
                        left: `${(clip.startTime / duration) * 100}%`,
                        width: `${(clip.duration / duration) * 100}%`,
                        height: height / 2,
                        backgroundColor: clip.type === 'screen' ? '#7c3aed' : '#10b981',
                    }}
                />
            ))}

            {/* Keyframe Indicators */}
            {[...layoutKeyframes, ...webcamKeyframes, ...zoomKeyframes].map((kf, idx) => (
                <div
                    key={idx}
                    className="absolute top-0 w-px bg-yellow-500 opacity-70"
                    style={{
                        left: `${(kf.time / duration) * 100}%`,
                        height: '100%',
                    }}
                />
            ))}

            {/* Current Time Indicator */}
            <motion.div
                className="absolute top-0 w-1 bg-red-500 shadow-lg shadow-red-500/50"
                style={{
                    left: `${(currentTime / duration) * 100}%`,
                    height: '100%',
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            />

            {/* Viewport Indicator (shows visible timeline area) */}
            <div
                className="absolute top-0 border-2 border-blue-500/50 bg-blue-500/10"
                style={{
                    left: 0,
                    width: '100%', // Would calculate based on zoom level
                    height: '100%',
                }}
            />
        </div>
    );
};
