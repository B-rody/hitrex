import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
    audioSrc: string;
    width: number;
    height: number;
    pixelsPerSecond: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
    audioSrc,
    width,
    height,
    pixelsPerSecond,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Generate mock waveform (in production, use Web Audio API to analyze actual audio)
        const drawMockWaveform = () => {
            ctx.fillStyle = '#3b82f6';
            ctx.globalAlpha = 0.3;

            const barWidth = 2;
            const gap = 1;
            const numBars = Math.floor(width / (barWidth + gap));

            for (let i = 0; i < numBars; i++) {
                const x = i * (barWidth + gap);
                // Generate pseudo-random heights with smooth transitions
                const baseHeight = Math.sin(i / 10) * 0.5 + 0.5;
                const noise = Math.random() * 0.3;
                const barHeight = (baseHeight + noise) * height * 0.8;
                const y = (height - barHeight) / 2;

                ctx.fillRect(x, y, barWidth, barHeight);
            }

            ctx.globalAlpha = 1;
        };

        drawMockWaveform();
    }, [audioSrc, width, height, pixelsPerSecond]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};
