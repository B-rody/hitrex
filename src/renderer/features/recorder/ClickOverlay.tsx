import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Click {
    id: string;
    x: number;
    y: number;
    button: string;
    timestamp: number;
}
interface DrawingTool {
    type: 'pen' | 'rectangle' | 'circle' | 'text' | 'eraser' | 'highlight';
    color: string;
    size: number;
}

interface DrawingElement {
    id: string;
    type: 'pen' | 'rectangle' | 'circle' | 'text' | 'highlight';
    color: string;
    size: number;
    points?: { x: number; y: number }[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
}

const CONTROL_EXCLUSION_PX = 140;

export const CaptureOverlay: React.FC = () => {
    const [clicks, setClicks] = useState<Click[]>([]);
    const [annotationMode, setAnnotationMode] = useState(false);
    const [tool, setTool] = useState<DrawingTool>({
        type: 'pen',
        color: '#ef4444',
        size: 3
    });
    const [drawings, setDrawings] = useState<DrawingElement[]>([]);
    const drawingsRef = useRef<DrawingElement[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const isDrawingRef = useRef(false);
    const [currentDrawing, setCurrentDrawing] = useState<DrawingElement | null>(null);
    const currentDrawingRef = useRef<DrawingElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const startPosRef = useRef({ x: 0, y: 0 });
    const toolRef = useRef(tool);

    useEffect(() => {
        drawingsRef.current = drawings;
    }, [drawings]);

    useEffect(() => {
        isDrawingRef.current = isDrawing;
    }, [isDrawing]);

    useEffect(() => {
        currentDrawingRef.current = currentDrawing;
    }, [currentDrawing]);

    useEffect(() => {
        toolRef.current = tool;
    }, [tool]);

    // Listen for click events
    useEffect(() => {
        if (!window.electronAPI) return;

        const unsubscribe = window.electronAPI.on('mouse-click-event', (clickData: unknown) => {
            const data = clickData as { x: number; y: number; button: string; timestamp: number };
            const click: Click = {
                id: `${data.timestamp}-${Math.random()}`,
                x: data.x,
                y: data.y,
                button: data.button,
                timestamp: data.timestamp
            };

            setClicks(prev => [...prev, click]);

            setTimeout(() => {
                setClicks(prev => prev.filter(c => c.id !== click.id));
            }, 1000);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Listen for annotation mode toggle
    useEffect(() => {
        if (!window.electronAPI) return;

        const unsubscribe = window.electronAPI.on('toggle-annotation-mode', (data: unknown) => {
            const { enabled } = data as { enabled: boolean };
            setAnnotationMode(enabled);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Listen for tool changes from overlay
    useEffect(() => {
        if (!window.electronAPI) return;

        const unsubscribe = window.electronAPI.on('annotation-tool-change', (data: unknown) => {
            const newTool = data as DrawingTool;
            setTool(newTool);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Draw on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const renderElement = (drawing: DrawingElement) => {
            ctx.save();
            ctx.strokeStyle = drawing.color;
            ctx.lineWidth = drawing.type === 'highlight' ? drawing.size * 2 : drawing.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (drawing.type === 'highlight') {
                ctx.globalAlpha = 0.5;
            }

            if ((drawing.type === 'pen' || drawing.type === 'highlight') && drawing.points) {
                ctx.beginPath();
                drawing.points.forEach((point, i) => {
                    if (i === 0) ctx.moveTo(point.x, point.y);
                    else ctx.lineTo(point.x, point.y);
                });
                ctx.stroke();
            } else if (drawing.type === 'rectangle' && drawing.x !== undefined && drawing.y !== undefined && drawing.width !== undefined && drawing.height !== undefined) {
                ctx.strokeRect(drawing.x, drawing.y, drawing.width, drawing.height);
            } else if (drawing.type === 'circle' && drawing.x !== undefined && drawing.y !== undefined && drawing.width !== undefined) {
                ctx.beginPath();
                ctx.arc(drawing.x, drawing.y, Math.abs(drawing.width) / 2, 0, Math.PI * 2);
                ctx.stroke();
            } else if (drawing.type === 'text' && drawing.x !== undefined && drawing.y !== undefined && drawing.text) {
                ctx.font = `${drawing.size * 8}px sans-serif`;
                ctx.fillStyle = drawing.color;
                ctx.fillText(drawing.text, drawing.x, drawing.y);
            }
            ctx.restore();
        };

        drawings.forEach(renderElement);
        if (currentDrawing) {
            renderElement(currentDrawing);
        }
    }, [drawings, currentDrawing]);

    // Listen for drawing events from recorder overlay
    useEffect(() => {
        if (!window.electronAPI) return;

        const unsubscribe = window.electronAPI.on('drawing-event', (data: unknown) => {
            if (!annotationMode) return;

            const event = data as { type: 'start' | 'move' | 'end'; x: number; y: number };
            const latestTool = toolRef.current;
            const inControlZone = event.y >= window.innerHeight - CONTROL_EXCLUSION_PX;

            if (inControlZone) {
                if (event.type === 'end') {
                    setIsDrawing(false);
                    setCurrentDrawing(null);
                }
                return;
            }

            if (event.type === 'start') {
                setIsDrawing(true);
                startPosRef.current = { x: event.x, y: event.y };

                let nextDrawing: DrawingElement | null = null;
                if (latestTool.type === 'pen' || latestTool.type === 'highlight') {
                    nextDrawing = {
                        id: Date.now().toString(),
                        type: latestTool.type === 'highlight' ? 'highlight' : 'pen',
                        color: latestTool.color,
                        size: latestTool.size,
                        points: [{ x: event.x, y: event.y }]
                    };
                } else if (latestTool.type === 'rectangle') {
                    nextDrawing = {
                        id: Date.now().toString(),
                        type: 'rectangle',
                        color: latestTool.color,
                        size: latestTool.size,
                        x: event.x,
                        y: event.y,
                        width: 0,
                        height: 0
                    };
                } else if (latestTool.type === 'circle') {
                    nextDrawing = {
                        id: Date.now().toString(),
                        type: 'circle',
                        color: latestTool.color,
                        size: latestTool.size,
                        x: event.x,
                        y: event.y,
                        width: 0
                    };
                }

                if (nextDrawing) {
                    setCurrentDrawing(nextDrawing);
                }
            } else if (event.type === 'move' && isDrawingRef.current && currentDrawingRef.current) {
                const active = currentDrawingRef.current;
                if (active?.type === 'pen' || active?.type === 'highlight') {
                    setCurrentDrawing({
                        ...active,
                        points: [...(active.points || []), { x: event.x, y: event.y }]
                    });
                } else if (active?.type === 'rectangle') {
                    const start = startPosRef.current;
                    setCurrentDrawing({
                        ...active,
                        x: Math.min(start.x, event.x),
                        y: Math.min(start.y, event.y),
                        width: Math.abs(event.x - start.x),
                        height: Math.abs(event.y - start.y)
                    });
                } else if (active?.type === 'circle') {
                    const start = startPosRef.current;
                    const radius = Math.sqrt(
                        Math.pow(event.x - start.x, 2) + Math.pow(event.y - start.y, 2)
                    );
                    setCurrentDrawing({
                        ...active,
                        x: start.x,
                        y: start.y,
                        width: radius * 2
                    });
                }
            } else if (event.type === 'end') {
                if (isDrawingRef.current && currentDrawingRef.current) {
                    const updated = [...drawingsRef.current, currentDrawingRef.current];
                    setDrawings(updated);
                    setCurrentDrawing(null);
                }
                setIsDrawing(false);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [annotationMode]);

    return (
        <>
            {/* Click highlights */}
            <div className="fixed inset-0 pointer-events-none z-10" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
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
                                        ? '#3b82f6'
                                        : click.button === 'right'
                                        ? '#ef4444'
                                        : '#f59e0b',
                                boxShadow: `0 0 20px ${click.button === 'left' ? '#3b82f6' : click.button === 'right' ? '#ef4444' : '#f59e0b'}`,
                            }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Annotation canvas - rendered from IPC events, no direct interaction */}
            {annotationMode && (
                <canvas
                    ref={canvasRef}
                    className="fixed inset-0 z-20 pointer-events-none"
                />
            )}
        </>
    );
};
