import React, { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';

interface TimelinePlayheadProps {
    pixelsPerMs: number;
    onSeek: (time: number) => void;
}

export const TimelinePlayhead: React.FC<TimelinePlayheadProps> = ({
    pixelsPerMs,
    onSeek,
}) => {
    const { currentTime, duration, layoutKeyframes } = useProjectStore();
    const [isDragging, setIsDragging] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const playheadRef = useRef<HTMLDivElement>(null);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDragging(true);
        setShowTooltip(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!playheadRef.current) return;
            
            const container = playheadRef.current.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            let newTime = x / pixelsPerMs;
            newTime = Math.max(0, Math.min(newTime, duration));

            // Snap to keyframes within 500ms
            const snapThreshold = 500;
            const nearbyKeyframe = layoutKeyframes.find(
                kf => Math.abs(kf.time - newTime) < snapThreshold
            );

            if (nearbyKeyframe) {
                newTime = nearbyKeyframe.time;
            }

            // Update immediately for smooth scrubbing
            onSeek(newTime);
            
            if (nearbyKeyframe) {
                newTime = nearbyKeyframe.time;
            }

            onSeek(newTime);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setShowTooltip(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, pixelsPerMs, duration, layoutKeyframes, onSeek]);

    const position = currentTime * pixelsPerMs;

    return (
        <>
            <div
                ref={playheadRef}
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 cursor-ew-resize z-30"
                style={{ left: position }}
                onMouseDown={handleMouseDown}
                onMouseEnter={() => !isDragging && setShowTooltip(true)}
                onMouseLeave={() => !isDragging && setShowTooltip(false)}
            >
                {/* Playhead handle */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-red-600 hover:scale-110 transition-transform" />
                
                {/* Time tooltip */}
                {showTooltip && (
                    <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs font-mono rounded whitespace-nowrap pointer-events-none"
                        style={{ zIndex: 40 }}
                    >
                        {formatTime(currentTime)}
                    </div>
                )}
            </div>

            {/* Playhead shadow/indicator line */}
            <div
                className="absolute top-0 bottom-0 w-px bg-red-300/20 pointer-events-none z-20"
                style={{ left: position }}
            />
        </>
    );
};
