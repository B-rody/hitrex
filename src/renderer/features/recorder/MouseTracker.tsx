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
  annotationsActive?: boolean;
  onEvent?: (event: MouseClick) => void;
}

export const MouseTracker: React.FC<MouseTrackerProps> = ({ isRecording, annotationsActive = false, onEvent }) => {
  const [clicks, setClicks] = useState<MouseClick[]>([]);

  useEffect(() => {
    if (!isRecording || annotationsActive) return;

    const handleClick = (e: MouseEvent) => {
      const click: MouseClick = {
        id: `${Date.now()}-${Math.random()}`,
        x: e.clientX,
        y: e.clientY,
        button: e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle',
        timestamp: Date.now(),
      };

      // Show visual feedback in overlay
      setClicks(prev => [...prev, click]);
      onEvent?.(click);

      // Send click event to capture overlay for recording
      if (window.electronAPI?.overlayMouseClick) {
        window.electronAPI.overlayMouseClick({
          x: e.clientX,
          y: e.clientY,
          button: click.button,
          timestamp: Date.now()
        });
      }

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
  }, [isRecording, annotationsActive, onEvent]);

  if (!isRecording || annotationsActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {clicks.map(click => (
          <motion.div
            key={click.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              left: click.x - 25,
              top: click.y - 25,
              width: 50,
              height: 50,
              border: '4px solid',
              borderColor:
                click.button === 'left'
                  ? '#3b82f6' // blue
                  : click.button === 'right'
                  ? '#ef4444' // red
                  : '#22c55e', // green
              boxShadow: `0 0 20px ${click.button === 'left' ? '#3b82f6' : click.button === 'right' ? '#ef4444' : '#22c55e'}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
