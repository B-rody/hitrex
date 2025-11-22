import React, { useEffect, useRef, useState } from 'react';
import { Move, Maximize2 } from 'lucide-react';

interface WebcamPreviewProps {
    stream: MediaStream | null;
    annotationsActive?: boolean;
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({ stream, annotationsActive = false }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [position, setPosition] = useState(() => {
        // Default to bottom-right corner with 20px padding
        const defaultWidth = 200;
        const defaultHeight = 150;
        const padding = 20;
        return {
            x: window.innerWidth - defaultWidth - padding,
            y: window.innerHeight - defaultHeight - padding
        };
    });
    const [size, setSize] = useState({ width: 200, height: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            } else if (isResizing) {
                const deltaX = e.clientX - resizeStart.mouseX;
                const deltaY = e.clientY - resizeStart.mouseY;
                const newWidth = Math.max(150, Math.min(400, resizeStart.width + deltaX));
                const newHeight = Math.max(112, Math.min(300, resizeStart.height + deltaY));
                setSize({ width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragOffset, resizeStart]);

    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            width: size.width,
            height: size.height,
            mouseX: e.clientX,
            mouseY: e.clientY
        });
    };

    if (!stream) return null;

    return (
        <div
            className="absolute z-50 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 group pointer-events-auto select-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
            }}
            onMouseEnter={() => {
                if (annotationsActive) return;
                if (window.electronAPI?.overlaySetIgnoreMouseEvents) {
                    window.electronAPI.overlaySetIgnoreMouseEvents(false);
                }
            }}
            onMouseLeave={() => {
                if (annotationsActive) return;
                if (window.electronAPI?.overlaySetIgnoreMouseEvents) {
                    window.electronAPI.overlaySetIgnoreMouseEvents(true);
                }
            }}
        >
            {/* Drag handle */}
            <div
                className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/50 to-transparent cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onMouseDown={handleDragStart}
            >
                <Move size={16} className="text-white" />
            </div>

            {/* Video */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />

            {/* Resize handle */}
            <div
                className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-black/50 to-transparent cursor-nwse-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onMouseDown={handleResizeStart}
            >
                <Maximize2 size={12} className="text-white" />
            </div>

            {/* Size indicator */}
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {size.width}×{size.height}
            </div>
        </div>
    );
};
