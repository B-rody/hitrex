import React, { useEffect, useRef, useState } from 'react';

interface AudioLevelMeterProps {
    stream: MediaStream | null;
    label: string;
}

export const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({ stream, label }) => {
    const [level, setLevel] = useState(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        if (!stream) {
            setLevel(0);
            return;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
            if (!analyserRef.current) return;
            
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            const normalizedLevel = Math.min(100, (average / 255) * 100);
            setLevel(normalizedLevel);

            animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            source.disconnect();
            audioContext.close();
        };
    }, [stream]);

    const getLevelColor = () => {
        if (level < 30) return 'bg-green-500';
        if (level < 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-surface-400 whitespace-nowrap">{label}</span>
            <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-75 ${getLevelColor()}`}
                    style={{ width: `${level}%` }}
                />
            </div>
        </div>
    );
};
