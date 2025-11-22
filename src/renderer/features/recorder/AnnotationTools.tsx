import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Eraser, Undo, Redo } from 'lucide-react';

interface DrawingTool {
    type: 'pen';
    color: string;
    size: number;
}

interface DrawingElement {
    id: string;
    type: 'pen' | 'rectangle' | 'circle' | 'text';
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

export const AnnotationTools: React.FC = () => {
    const [tool, setTool] = useState<DrawingTool>({
        type: 'pen',
        color: '#ef4444',
        size: 3
    });

    // Notify main window when tool changes
    useEffect(() => {
        if (window.electronAPI?.overlayChangeTool) {
            window.electronAPI.overlayChangeTool(tool);
        }
    }, [tool]);

    const [drawings, setDrawings] = useState<DrawingElement[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentDrawing, setCurrentDrawing] = useState<DrawingElement | null>(null);
    const [history, setHistory] = useState<DrawingElement[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - CONTROL_EXCLUSION_PX;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw all elements
        drawings.forEach(drawing => {
            ctx.strokeStyle = drawing.color;
            ctx.lineWidth = drawing.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (drawing.type === 'pen' && drawing.points) {
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
        });

        // Draw current drawing
        if (currentDrawing) {
            ctx.strokeStyle = currentDrawing.color;
            ctx.lineWidth = currentDrawing.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (currentDrawing.type === 'pen' && currentDrawing.points) {
                ctx.beginPath();
                currentDrawing.points.forEach((point, i) => {
                    if (i === 0) ctx.moveTo(point.x, point.y);
                    else ctx.lineTo(point.x, point.y);
                });
                ctx.stroke();
            } else if (currentDrawing.type === 'rectangle' && currentDrawing.x !== undefined && currentDrawing.y !== undefined && currentDrawing.width !== undefined && currentDrawing.height !== undefined) {
                ctx.strokeRect(currentDrawing.x, currentDrawing.y, currentDrawing.width, currentDrawing.height);
            } else if (currentDrawing.type === 'circle' && currentDrawing.x !== undefined && currentDrawing.y !== undefined && currentDrawing.width !== undefined) {
                ctx.beginPath();
                ctx.arc(currentDrawing.x, currentDrawing.y, Math.abs(currentDrawing.width) / 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }, [drawings, currentDrawing]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (e.clientY > window.innerHeight - CONTROL_EXCLUSION_PX) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        window.electronAPI?.overlayDrawingEvent?.({ type: 'start', x: e.clientX, y: e.clientY });

        setIsDrawing(true);
        setCurrentDrawing({
            id: Date.now().toString(),
            type: 'pen',
            color: tool.color,
            size: tool.size,
            points: [{ x, y }]
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !currentDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        if (e.clientY > window.innerHeight - CONTROL_EXCLUSION_PX) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        window.electronAPI?.overlayDrawingEvent?.({ type: 'move', x: e.clientX, y: e.clientY });

        setCurrentDrawing({
            ...currentDrawing,
            points: [...(currentDrawing.points || []), { x, y }]
        });
    };

    const handleMouseUp = () => {
        window.electronAPI?.overlayDrawingEvent?.({ type: 'end', x: 0, y: 0 });

        if (isDrawing && currentDrawing) {
            addToHistory([...drawings, currentDrawing]);
            setCurrentDrawing(null);
        }
        setIsDrawing(false);
    };

    const addToHistory = (newDrawings: DrawingElement[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newDrawings);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setDrawings(newDrawings);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setDrawings(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setDrawings(history[historyIndex + 1]);
        }
    };

    const clear = () => {
        addToHistory([]);
    };

    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000'];

    return (
        <>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="fixed z-30 pointer-events-auto"
                style={{
                    cursor: 'crosshair',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: `${CONTROL_EXCLUSION_PX}px`
                }}
            />

            <div className="fixed bottom-8 left-8 bg-surface-900 border border-surface-700 rounded-2xl p-3 shadow-2xl z-50 pointer-events-auto">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 border-r border-surface-700 pr-2">
                        <span className="text-surface-400 text-sm flex items-center gap-1">
                            <Pencil size={16} /> Pen
                        </span>
                    </div>

                    {/* Colors */}
                    <div className="flex gap-1 border-r border-surface-700 pr-2">
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => setTool({ ...tool, color })}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${tool.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>

                    {/* Size */}
                    <div className="flex gap-1 border-r border-surface-700 pr-2">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={tool.size}
                            onChange={(e) => setTool({ ...tool, size: parseInt(e.target.value) })}
                            className="w-20"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 border-r border-surface-700 pr-2">
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Undo"
                        >
                            <Undo size={18} />
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Redo"
                        >
                            <Redo size={18} />
                        </button>
                        <button
                            onClick={clear}
                            className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 transition-colors"
                            title="Clear All"
                        >
                            <Eraser size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
