import React, { useEffect, useState } from 'react';

interface CountdownProps {
    onComplete: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ onComplete }) => {
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count === 0) {
            onComplete();
            return;
        }

        const timer = setTimeout(() => {
            setCount(count - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [count, onComplete]);

    if (count === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center">
                <div className="text-9xl font-bold text-white animate-pulse">
                    {count}
                </div>
                <div className="text-2xl text-white/70 mt-4">
                    Recording starts in...
                </div>
            </div>
        </div>
    );
};
