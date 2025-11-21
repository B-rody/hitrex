import React from 'react';

interface TimelineRulerProps {
    duration: number;
    pixelsPerSecond: number;
    width: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
    duration,
    pixelsPerSecond,
    width,
}) => {
    const totalSeconds = Math.ceil(duration / 1000);
    const markers: { position: number; label: string; isMajor: boolean }[] = [];

    // Create markers every second, with major markers every 5 seconds
    for (let i = 0; i <= totalSeconds; i++) {
        const isMajor = i % 5 === 0;
        markers.push({
            position: i * pixelsPerSecond,
            label: isMajor ? formatTime(i * 1000) : '',
            isMajor,
        });
    }

    function formatTime(ms: number) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    return (
        <div
            className="relative h-6 bg-gray-900 border-b border-gray-800"
            style={{ width }}
        >
            {markers.map((marker, index) => (
                <div
                    key={index}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: marker.position }}
                >
                    {/* Tick mark */}
                    <div
                        className={`${
                            marker.isMajor
                                ? 'h-3 w-px bg-gray-500'
                                : 'h-2 w-px bg-gray-700'
                        }`}
                    />
                    
                    {/* Time label for major markers */}
                    {marker.label && (
                        <span className="absolute top-3 -translate-x-1/2 text-[10px] text-gray-500 font-mono whitespace-nowrap">
                            {marker.label}
                        </span>
                    )}
                </div>
            ))}

            {/* Subtle gradient at edges */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
        </div>
    );
};
