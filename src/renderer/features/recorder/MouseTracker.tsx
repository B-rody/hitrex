import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MouseClick {
  id: string;
  x: number;
  y: number;
  button: 'left' | 'right' | 'middle';
  timestamp: number;
}

interface MouseTrackerProps {
  isRecording: boolean;
  onEvent?: (event: MouseClick) => void;
}

export const MouseTracker: React.FC<MouseTrackerProps> = ({ isRecording, onEvent }) => {
  const [clicks, setClicks] = useState<MouseClick[]>([]);

  useEffect(() => {
    if (!isRecording) return;

    const handleClick = (e: MouseEvent) => {
      const click: MouseClick = {
        id: `${Date.now()}-${Math.random()}`,
        x: e.clientX,
        y: e.clientY,
        button: e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle',
        timestamp: Date.now(),
      };

      setClicks(prev => [...prev, click]);
      onEvent?.(click);

      // Remove click animation after 1 second
      setTimeout(() => {
        setClicks(prev => prev.filter(c => c.id !== click.id));
      }, 1000);
    };

    // Prevent context menu on right click during recording
    const handleContextMenu = (e: MouseEvent) => {
      if (isRecording) {
        e.preventDefault();
      }
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('auxclick', handleClick); // Middle click

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('auxclick', handleClick);
    };
  }, [isRecording, onEvent]);

  if (!isRecording) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {clicks.map(click => (
          <motion.div
            key={click.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute rounded-full border-4"
            style={{
              left: click.x - 20,
              top: click.y - 20,
              width: 40,
              height: 40,
              borderColor:
                click.button === 'left'
                  ? '#3b82f6' // blue
                  : click.button === 'right'
                  ? '#ef4444' // red
                  : '#22c55e', // green
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
