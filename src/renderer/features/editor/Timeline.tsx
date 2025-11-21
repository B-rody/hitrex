import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProjectStore, LayoutType, Clip } from '../../store/useProjectStore';
import { useUndoRedoStore } from '../editor/UndoRedoSystem';
import { Play, Pause, Scissors, SplitSquareHorizontal, PictureInPicture, Maximize, Monitor } from 'lucide-react';
import { TimelineClip } from './TimelineClip';
import { TimelinePlayhead } from './TimelinePlayhead';
import { TimelineRuler } from './TimelineRuler';
import { TimelineMarkers } from './TimelineMarkers';
import { AudioWaveform } from './AudioWaveform';
import { toast } from '../../store/useToastStore';

export const Timeline: React.FC = () => {
    const {
        currentTime,
        duration,
        isPlaying,
        clips,
        selectedClipIds,
        setIsPlaying,
        setCurrentTime,
        addLayoutKeyframe,
        updateClip,
        deleteClip,
        deleteClipRipple,
        splitClip,
        selectClip,
        deselectAllClips,
    } = useProjectStore();

    const { pushState, undo, redo, canUndo, canRedo } = useUndoRedoStore();

    const timelineRef = useRef<HTMLDivElement>(null);
    const [timelineZoom, setTimelineZoom] = useState(1); // 0.5x to 4x
    const [rippleDelete, setRippleDelete] = useState(true); // Smart delete by default
    const [clipboard, setClipboard] = useState<Clip[]>([]);
    const PIXELS_PER_SECOND = 10 * timelineZoom; // Zoom affects pixel density
    const pixelsPerMs = PIXELS_PER_SECOND / 1000;
    const timelineWidth = (duration / 1000) * PIXELS_PER_SECOND;
    const TRACK_HEIGHT = 48;

    const handlePlayPause = useCallback(() => {
        setIsPlaying(!isPlaying);
    }, [isPlaying, setIsPlaying]);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / pixelsPerMs);
        setCurrentTime(Math.max(0, Math.min(time, duration)));

        // Deselect all clips when clicking timeline background
        if ((e.target as HTMLElement) === timelineRef.current ||
            (e.target as HTMLElement).classList.contains('timeline-background')) {
            deselectAllClips();
        }
    };

    const handleSplitAtPlayhead = useCallback(() => {
        if (selectedClipIds.length !== 1) {
            toast.warning('Please select a single clip to split');
            return;
        }
        const selectedClip = clips.find(c => c.id === selectedClipIds[0]);
        if (!selectedClip) return;

        if (currentTime > selectedClip.startTime && currentTime < selectedClip.startTime + selectedClip.duration) {
            pushState('split', { clips });
            splitClip(selectedClip.id, currentTime);
            toast.success('Clip split successfully');
        } else {
            toast.warning('Playhead is not over the selected clip');
        }
    }, [selectedClipIds, clips, currentTime, pushState, splitClip]);

    const handleDeleteSelected = useCallback(() => {
        if (selectedClipIds.length === 0) {
            toast.warning('No clips selected');
            return;
        }
        pushState('delete', { clips });
        selectedClipIds.forEach(id => {
            if (rippleDelete) {
                deleteClipRipple(id);
            } else {
                deleteClip(id);
            }
        });
        deselectAllClips();
        toast.success(
            rippleDelete
                ? `Deleted ${selectedClipIds.length} clip(s) and closed gaps`
                : `Deleted ${selectedClipIds.length} clip(s)`
        );
    }, [selectedClipIds, clips, rippleDelete, pushState, deleteClipRipple, deleteClip, deselectAllClips]);

    const handleCopy = useCallback(() => {
        if (selectedClipIds.length === 0) {
            toast.warning('No clips selected');
            return;
        }
        const selectedClips = clips.filter(c => selectedClipIds.includes(c.id));
        setClipboard(selectedClips);
        toast.success(`Copied ${selectedClips.length} clip(s)`);
    }, [selectedClipIds, clips]);

    const handlePaste = useCallback(() => {
        if (clipboard.length === 0) {
            toast.warning('Clipboard is empty');
            return;
        }
        pushState('paste', { clips });
        const { addClip } = useProjectStore.getState();

        clipboard.forEach((clip, index) => {
            const newClip = {
                ...clip,
                id: `clip-${Date.now()}-${index}`,
                startTime: currentTime + (index * 100), // Offset by 100ms
            };
            addClip(newClip);
        });
        toast.success(`Pasted ${clipboard.length} clip(s)`);
    }, [clipboard, clips, currentTime, pushState]);

    const handleDuplicate = useCallback(() => {
        if (selectedClipIds.length === 0) {
            toast.warning('No clips selected');
            return;
        }
        pushState('duplicate', { clips });
        const selectedClips = clips.filter(c => selectedClipIds.includes(c.id));
        const { addClip } = useProjectStore.getState();

        selectedClips.forEach((clip, index) => {
            const newClip = {
                ...clip,
                id: `clip-${Date.now()}-${index}`,
                startTime: clip.startTime + clip.duration + 100, // Place after original
            };
            addClip(newClip);
        });
        toast.success(`Duplicated ${selectedClips.length} clip(s)`);
    }, [selectedClipIds, clips, pushState]);

    const addKeyframe = (type: LayoutType) => {
        const existingKeyframe = useProjectStore.getState().layoutKeyframes[0];
        addLayoutKeyframe({
            time: currentTime,
            type,
            properties: existingKeyframe?.properties || {
                camScale: 1,
                camX: 0.85,
                camY: 0.85,
                camWidth: 240,
                camHeight: 180,
                camShape: 'rounded',
                camBorderColor: '#ffffff',
                camBorderWidth: 2,
                camVisible: true,
                screenZoom: 1,
                focusPoint: { x: 0.5, y: 0.5 },
            }
        });
        toast.success(`Added ${type.replace('_', ' ')} layout keyframe`);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handlePlayPause();
            } else if (e.code === 'KeyS' && selectedClipIds.length === 1) {
                e.preventDefault();
                handleSplitAtPlayhead();
            } else if ((e.code === 'Delete' || e.code === 'Backspace') && selectedClipIds.length > 0) {
                e.preventDefault();
                handleDeleteSelected();
            } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
                e.preventDefault();
                setTimelineZoom(Math.min(4, timelineZoom + 0.25));
            } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
                e.preventDefault();
                setTimelineZoom(Math.max(0.5, timelineZoom - 0.25));
            } else if (e.shiftKey && e.code === 'KeyZ') {
                e.preventDefault();
                setTimelineZoom(1);
            } else if (e.shiftKey && e.code === 'KeyR') {
                e.preventDefault();
                setRippleDelete(!rippleDelete);
                toast.info(rippleDelete ? 'Normal delete mode' : 'Magnetic delete mode');
            } else if (e.code === 'Home') {
                e.preventDefault();
                setCurrentTime(0);
            } else if (e.code === 'End') {
                e.preventDefault();
                setCurrentTime(duration);
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
                e.preventDefault();
                const allClipIds = clips.map(c => c.id);
                useProjectStore.setState({ selectedClipIds: allClipIds });
                toast.success(`Selected all ${clips.length} clips`);
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo()) {
                    const previousState = undo();
                    if (previousState && typeof previousState === 'object' && 'clips' in previousState) {
                        useProjectStore.setState({ clips: previousState.clips as Clip[] });
                        toast.info('Undo');
                    }
                }
            } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.code === 'KeyZ' || e.code === 'KeyY')) {
                e.preventDefault();
                if (canRedo()) {
                    const nextState = redo();
                    if (nextState && typeof nextState === 'object' && 'clips' in nextState) {
                        useProjectStore.setState({ clips: nextState.clips as Clip[] });
                        toast.info('Redo');
                    }
                }
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
                e.preventDefault();
                handleCopy();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
                e.preventDefault();
                handlePaste();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
                e.preventDefault();
                handleDuplicate();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        isPlaying, selectedClipIds, currentTime, timelineZoom, duration, rippleDelete,
        handlePlayPause, handleSplitAtPlayhead, handleDeleteSelected, handleCopy, handlePaste, handleDuplicate,
        undo, redo, canUndo, canRedo, setCurrentTime, clips
    ]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const screenClips = clips.filter(c => c.type === 'screen');
    const camClips = clips.filter(c => c.type === 'cam');

    return (
        <div className="h-64 bg-gray-900 border-t border-gray-800 flex flex-col">
            {/* Controls */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePlayPause}
                        className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <span className="font-mono text-sm text-gray-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    {selectedClipIds.length > 0 && (
                        <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                            {selectedClipIds.length} selected
                        </span>
                    )}

                    {/* Editing tools */}
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-700">
                        <button
                            onClick={handleSplitAtPlayhead}
                            disabled={selectedClipIds.length !== 1}
                            className="p-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Split Clip (S)"
                        >
                            <Scissors size={16} />
                        </button>
                        <button
                            onClick={handleDeleteSelected}
                            disabled={selectedClipIds.length === 0}
                            className="p-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-red-400"
                            title="Delete Selected (Del)"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setRippleDelete(!rippleDelete)}
                            className={`px-2 py-1 rounded transition-colors text-xs font-medium ${rippleDelete
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            title="Toggle Ripple Delete (Shift+R)"
                        >
                            {rippleDelete ? '🧲 Magnetic' : '⚡ Normal'}
                        </button>
                    </div>

                    {/* Timeline Zoom */}
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-700">
                        <span className="text-xs text-gray-500">Zoom</span>
                        <button
                            onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
                            className="p-1 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-xs"
                            title="Zoom Out (-)"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>
                        <span className="text-xs font-mono text-gray-400 w-10 text-center">{(timelineZoom * 100).toFixed(0)}%</span>
                        <button
                            onClick={() => setTimelineZoom(Math.min(4, timelineZoom + 0.25))}
                            className="p-1 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-xs"
                            title="Zoom In (+)"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setTimelineZoom(1)}
                            className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-xs"
                            title="Fit Timeline (Shift+Z)"
                        >
                            Fit
                        </button>
                    </div>
                </div>

                {/* Layout controls */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase font-bold mr-2">Add Layout</span>
                    <button
                        onClick={() => addKeyframe('split')}
                        className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                        title="Split View"
                    >
                        <SplitSquareHorizontal size={16} />
                    </button>
                    <button
                        onClick={() => addKeyframe('pip')}
                        className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                        title="Picture in Picture"
                    >
                        <PictureInPicture size={16} />
                    </button>
                    <button
                        onClick={() => addKeyframe('full_screen')}
                        className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                        title="Full Screen"
                    >
                        <Monitor size={16} />
                    </button>
                    <button
                        onClick={() => addKeyframe('full_cam')}
                        className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                        title="Full Camera"
                    >
                        <Maximize size={16} />
                    </button>
                </div>
            </div>

            {/* Timeline tracks */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex">
                    {/* Track labels */}
                    <div className="w-24 flex-shrink-0 bg-gray-900 border-r border-gray-800">
                        {/* Ruler spacer */}
                        <div className="h-6 border-b border-gray-800" />

                        <div
                            className="flex items-center justify-center font-medium text-xs text-purple-400 border-b border-gray-800"
                            style={{ height: TRACK_HEIGHT }}
                        >
                            Screen
                        </div>
                        <div
                            className="flex items-center justify-center font-medium text-xs text-green-400"
                            style={{ height: TRACK_HEIGHT }}
                        >
                            Camera
                        </div>
                    </div>

                    {/* Timeline content */}
                    <div className="relative flex-1 bg-gray-950">
                        {/* Time ruler */}
                        <TimelineRuler
                            duration={duration}
                            pixelsPerSecond={PIXELS_PER_SECOND}
                            width={Math.max(timelineWidth, 800)}
                        />

                        <div
                            ref={timelineRef}
                            className="relative cursor-pointer timeline-background"
                            style={{ width: Math.max(timelineWidth, 800), height: TRACK_HEIGHT * 2 }}
                            onClick={handleSeek}
                        >
                            {/* Markers */}
                            <TimelineMarkers pixelsPerMs={pixelsPerMs} />

                            {/* Grid lines */}
                            {Array.from({ length: Math.ceil(duration / 1000) + 1 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 border-l border-gray-800"
                                    style={{ left: i * PIXELS_PER_SECOND }}
                                />
                            ))}

                            {/* Screen track */}
                            <div
                                className="absolute top-0 left-0 right-0 border-b border-gray-800"
                                style={{ height: TRACK_HEIGHT }}
                            >
                                {/* Audio Waveform */}
                                <AudioWaveform
                                    audioSrc=""
                                    width={Math.max(timelineWidth, 800)}
                                    height={TRACK_HEIGHT}
                                    pixelsPerSecond={PIXELS_PER_SECOND}
                                />

                                {screenClips.map((clip) => (
                                    <TimelineClip
                                        key={clip.id}
                                        clip={clip}
                                        isSelected={selectedClipIds.includes(clip.id)}
                                        pixelsPerMs={pixelsPerMs}
                                        trackHeight={TRACK_HEIGHT}
                                        onSelect={(e: React.MouseEvent) => {
                                            if (e.ctrlKey || e.metaKey) {
                                                // Multi-select: toggle this clip
                                                if (selectedClipIds.includes(clip.id)) {
                                                    const newSelection = selectedClipIds.filter(id => id !== clip.id);
                                                    useProjectStore.setState({ selectedClipIds: newSelection });
                                                } else {
                                                    useProjectStore.setState({ selectedClipIds: [...selectedClipIds, clip.id] });
                                                }
                                            } else {
                                                // Single select
                                                selectClip(clip.id);
                                            }
                                        }}
                                        onDelete={() => deleteClip(clip.id)}
                                        onTrimStart={(newStart) =>
                                            updateClip(clip.id, {
                                                sourceStart: newStart,
                                                duration: clip.sourceEnd - newStart,
                                            })
                                        }
                                        onTrimEnd={(newEnd) =>
                                            updateClip(clip.id, {
                                                sourceEnd: newEnd,
                                                duration: newEnd - clip.sourceStart,
                                            })
                                        }
                                        onMove={(newStartTime) =>
                                            updateClip(clip.id, { startTime: newStartTime })
                                        }
                                        allClips={clips}
                                    />
                                ))}
                            </div>

                            {/* Camera track */}
                            <div
                                className="absolute left-0 right-0"
                                style={{ top: TRACK_HEIGHT, height: TRACK_HEIGHT }}
                            >
                                {camClips.map((clip) => (
                                    <TimelineClip
                                        key={clip.id}
                                        clip={clip}
                                        isSelected={selectedClipIds.includes(clip.id)}
                                        pixelsPerMs={pixelsPerMs}
                                        trackHeight={TRACK_HEIGHT}
                                        onSelect={(e: React.MouseEvent) => {
                                            if (e.ctrlKey || e.metaKey) {
                                                // Multi-select: toggle this clip
                                                if (selectedClipIds.includes(clip.id)) {
                                                    const newSelection = selectedClipIds.filter(id => id !== clip.id);
                                                    useProjectStore.setState({ selectedClipIds: newSelection });
                                                } else {
                                                    useProjectStore.setState({ selectedClipIds: [...selectedClipIds, clip.id] });
                                                }
                                            } else {
                                                // Single select
                                                selectClip(clip.id);
                                            }
                                        }}
                                        onDelete={() => deleteClip(clip.id)}
                                        onTrimStart={(newStart) =>
                                            updateClip(clip.id, {
                                                sourceStart: newStart,
                                                duration: clip.sourceEnd - newStart,
                                            })
                                        }
                                        onTrimEnd={(newEnd) =>
                                            updateClip(clip.id, {
                                                sourceEnd: newEnd,
                                                duration: newEnd - clip.sourceStart,
                                            })
                                        }
                                        onMove={(newStartTime) =>
                                            updateClip(clip.id, { startTime: newStartTime })
                                        }
                                        allClips={clips}
                                    />
                                ))}
                            </div>

                            {/* Playhead */}
                            <TimelinePlayhead
                                pixelsPerMs={pixelsPerMs}
                                onSeek={setCurrentTime}
                            />

                            {/* Layout keyframes */}
                            {useProjectStore.getState().layoutKeyframes.map((kf, i) => (
                                <div
                                    key={i}
                                    className="absolute -top-2 w-2 h-2 bg-yellow-400 rounded-full pointer-events-none z-10"
                                    style={{ left: kf.time * pixelsPerMs }}
                                    title={`${kf.type} at ${formatTime(kf.time)}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
