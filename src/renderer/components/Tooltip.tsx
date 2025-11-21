import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    content: string;
    children: React.ReactElement;
    delay?: number;
    position?: 'top' | 'bottom' | 'left' | 'right';
    shortcut?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    delay = 500,
    position = 'top',
    shortcut,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const timeoutRef = useRef<NodeJS.Timeout>();
    const elementRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            if (elementRef.current) {
                const rect = elementRef.current.getBoundingClientRect();
                
                let x = rect.left + rect.width / 2;
                let y = rect.top;
                
                switch (position) {
                    case 'top':
                        y = rect.top - 8;
                        break;
                    case 'bottom':
                        y = rect.bottom + 8;
                        break;
                    case 'left':
                        x = rect.left - 8;
                        y = rect.top + rect.height / 2;
                        break;
                    case 'right':
                        x = rect.right + 8;
                        y = rect.top + rect.height / 2;
                        break;
                }
                
                setCoords({ x, y });
                setIsVisible(true);
            }
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const getTransform = () => {
        switch (position) {
            case 'top':
                return 'translate(-50%, -100%)';
            case 'bottom':
                return 'translate(-50%, 0%)';
            case 'left':
                return 'translate(-100%, -50%)';
            case 'right':
                return 'translate(0%, -50%)';
            default:
                return 'translate(-50%, -100%)';
        }
    };

    return (
        <>
            <div
                ref={elementRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                className="inline-block"
            >
                {children}
            </div>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-[9999] pointer-events-none"
                        style={{
                            left: coords.x,
                            top: coords.y,
                            transform: getTransform(),
                        }}
                    >
                        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl px-3 py-2 max-w-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white whitespace-nowrap">{content}</span>
                                {shortcut && (
                                    <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs font-mono text-gray-400">
                                        {shortcut}
                                    </kbd>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
