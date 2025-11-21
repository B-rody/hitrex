import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useProjectStore } from '../../store/useProjectStore';
import { MouseEventData } from '../recorder/useRecorder';
import { interpolateWebcamKeyframes, interpolateZoomKeyframes } from '../../utils/interpolation';

interface PreviewPlayerProps {
    screenSrc: string;
    camSrc: string;
    mouseData?: MouseEventData[];
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({ screenSrc, camSrc }) => {
    const { currentTime, isPlaying, webcamKeyframes, zoomKeyframes, clips, textLayers } = useProjectStore();
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const camVideoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeking, setIsSeeking] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

    // Calculate current opacity based on fade in/out
    const getCurrentOpacity = () => {
        const currentClip = clips.find(c =>
            currentTime >= c.startTime && currentTime < c.startTime + c.duration
        );
        if (!currentClip) return 1;

        const clipTime = currentTime - currentClip.startTime;
        let opacity = currentClip.opacity || 1;

        // Fade in
        if (clipTime < currentClip.fadeIn) {
            opacity *= clipTime / currentClip.fadeIn;
        }
        // Fade out
        const fadeOutStart = currentClip.duration - currentClip.fadeOut;
        if (clipTime > fadeOutStart) {
            opacity *= (currentClip.duration - clipTime) / currentClip.fadeOut;
        }

        return opacity;
    };

    const getCurrentVolume = () => {
        const currentClip = clips.find(c =>
            currentTime >= c.startTime && currentTime < c.startTime + c.duration
        );
        if (!currentClip || !currentClip.audioEnabled) return 0;
        return currentClip.volume || 1;
    };

    const currentOpacity = getCurrentOpacity();
    const currentVolume = getCurrentVolume();

    // Get current webcam layout with interpolation
    const getCurrentWebcamLayout = () => {
        // Use interpolation if multiple keyframes exist
        if (webcamKeyframes.length > 1) {
            const interpolated = interpolateWebcamKeyframes(webcamKeyframes, currentTime);
            if (interpolated) return interpolated;
        }

        // Fallback to nearest keyframe or default
        if (webcamKeyframes.length === 1) {
            return webcamKeyframes[0];
        }

        if (webcamKeyframes.length > 0) {
            const sorted = [...webcamKeyframes].sort((a, b) => a.time - b.time);
            for (let i = sorted.length - 1; i >= 0; i--) {
                if (sorted[i].time <= currentTime) return sorted[i];
            }
            return sorted[0];
        }

        // Default layout
        return {
            time: 0,
            x: 0.85,
            y: 0.85,
            width: 240,
            height: 180,
            scale: 1,
            shape: 'rounded' as const,
            borderColor: '#ffffff',
            borderWidth: 2,
            shadow: true,
            visible: true,
        };
    };

    const webcamLayout = getCurrentWebcamLayout();

    // Get current zoom with interpolation
    const getCurrentZoom = () => {
        if (zoomKeyframes.length > 1) {
            const interpolated = interpolateZoomKeyframes(zoomKeyframes, currentTime);
            if (interpolated) return interpolated;
        }

        if (zoomKeyframes.length === 1) {
            return zoomKeyframes[0];
        }

        if (zoomKeyframes.length > 0) {
            const sorted = [...zoomKeyframes].sort((a, b) => a.time - b.time);
            for (let i = sorted.length - 1; i >= 0; i--) {
                if (sorted[i].time <= currentTime) return sorted[i];
            }
            return sorted[0];
        }

        return { scale: 1, centerX: 0.5, centerY: 0.5, easing: 'linear' as const, time: 0 };
    };

    const zoomState = getCurrentZoom();

    // Sync videos with currentTime (when user seeks)
    useEffect(() => {
        if (screenVideoRef.current && Math.abs(screenVideoRef.current.currentTime * 1000 - currentTime) > 100) {
            setIsSeeking(true);
            screenVideoRef.current.currentTime = currentTime / 1000;
        }
        if (camVideoRef.current && Math.abs(camVideoRef.current.currentTime * 1000 - currentTime) > 100) {
            camVideoRef.current.currentTime = currentTime / 1000;
        }

        // Update volume
        if (screenVideoRef.current) {
            screenVideoRef.current.volume = currentVolume;
        }
    }, [currentTime, currentVolume]);

    // Handle video load states
    useEffect(() => {
        const screenVideo = screenVideoRef.current;
        if (!screenVideo) return;

        const handleLoadedData = () => setIsLoading(false);
        const handleSeeked = () => setIsSeeking(false);
        const handleWaiting = () => setIsSeeking(true);

        screenVideo.addEventListener('loadeddata', handleLoadedData);
        screenVideo.addEventListener('seeked', handleSeeked);
        screenVideo.addEventListener('waiting', handleWaiting);

        return () => {
            screenVideo.removeEventListener('loadeddata', handleLoadedData);
            screenVideo.removeEventListener('seeked', handleSeeked);
            screenVideo.removeEventListener('waiting', handleWaiting);
        };
    }, []);

    // Play/Pause control
    useEffect(() => {
        if (isPlaying) {
            screenVideoRef.current?.play()?.catch(console.error);
            camVideoRef.current?.play()?.catch(console.error);
        } else {
            screenVideoRef.current?.pause();
            camVideoRef.current?.pause();
        }
    }, [isPlaying]);

    // Real-time playback: update currentTime as videos play
    useEffect(() => {
        if (!isPlaying || !screenVideoRef.current) return;

        const updateTime = () => {
            if (screenVideoRef.current) {
                const videoTime = screenVideoRef.current.currentTime * 1000;
                useProjectStore.getState().setCurrentTime(videoTime);
            }
        };

        const intervalId = setInterval(updateTime, 16); // 60fps updates

        const handleVideoEnd = () => {
            useProjectStore.getState().setIsPlaying(false);
        };

        screenVideoRef.current?.addEventListener('ended', handleVideoEnd);
        const screenRef = screenVideoRef.current;

        return () => {
            clearInterval(intervalId);
            screenRef?.removeEventListener('ended', handleVideoEnd);
        };
    }, [isPlaying]);

    const handleWebcamMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        e.stopPropagation();
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            camX: webcamLayout.x,
            camY: webcamLayout.y,
        };
    };

    useEffect(() => {
        if (!isDragging || !containerRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const deltaX = e.clientX - dragStartPos.current.x;
            const deltaY = e.clientY - dragStartPos.current.y;

            const newX = dragStartPos.current.camX + deltaX / rect.width;
            const newY = dragStartPos.current.camY + deltaY / rect.height;

            // Update store (create keyframe if needed)
            const { addWebcamKeyframe, updateWebcamKeyframe } = useProjectStore.getState();
            const existingKf = webcamKeyframes.find((kf) => kf.time === currentTime);

            if (existingKf) {
                updateWebcamKeyframe(currentTime, { x: newX, y: newY });
            } else {
                addWebcamKeyframe({
                    ...webcamLayout,
                    time: currentTime,
                    x: newX,
                    y: newY,
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, currentTime, webcamLayout, webcamKeyframes]);

    const getShapeStyles = () => {
        const base = {
            borderWidth: `${webcamLayout.borderWidth}px`,
            borderColor: webcamLayout.borderColor,
            borderStyle: 'solid' as const,
            boxShadow: webcamLayout.shadow ? '0 10px 40px rgba(0,0,0,0.5)' : 'none',
        };

        switch (webcamLayout.shape) {
            case 'circle':
                return { ...base, borderRadius: '50%' };
            case 'square':
                return { ...base, borderRadius: '0' };
            case 'rounded':
                return { ...base, borderRadius: '12px' };
            default:
                return base;
        }
    };

    if (!webcamLayout.visible) {
        return (
            <div ref={containerRef} className="relative w-full h-full bg-gray-900 overflow-hidden">
                <video
                    ref={screenVideoRef}
                    src={screenSrc}
                    className="w-full h-full object-contain"
                    muted
                />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-gray-900 overflow-hidden">
            {/* Loading overlay */}
            {(isLoading || isSeeking) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-300">
                            {isLoading ? 'Loading video...' : 'Seeking...'}
                        </span>
                    </div>
                </div>
            )}

            {/* Screen Layer with Zoom */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    transform: `scale(${zoomState.scale}) translate(${(0.5 - zoomState.centerX) * 100 / zoomState.scale}%, ${(0.5 - zoomState.centerY) * 100 / zoomState.scale}%)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease-out',
                    opacity: currentOpacity,
                }}
            >
                <video
                    ref={screenVideoRef}
                    src={screenSrc}
                    className="w-full h-full object-contain"
                    muted
                />
            </div>

            {/* Webcam Layer */}
            <motion.div
                className="absolute cursor-move"
                style={{
                    left: `${webcamLayout.x * 100}%`,
                    top: `${webcamLayout.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: webcamLayout.width * webcamLayout.scale,
                    height: webcamLayout.height * webcamLayout.scale,
                    ...getShapeStyles(),
                    overflow: 'hidden',
                    zIndex: 10,
                }}
                onMouseDown={handleWebcamMouseDown}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
                <video
                    ref={camVideoRef}
                    src={camSrc}
                    className="w-full h-full object-cover"
                    style={{
                        borderRadius: webcamLayout.shape === 'circle' ? '50%' : webcamLayout.shape === 'rounded' ? '12px' : '0',
                    }}
                    muted
                />

                {/* Resize handles (corner indicators) */}
                {!isDragging && (
                    <>
                        <div className="absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                        <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                    </>
                )}
            </motion.div>

            {/* Text Layers */}
            {textLayers.map((layer) => {
                if (!layer.enabled) return null;

                const endTime = layer.startTime + layer.duration;
                if (currentTime < layer.startTime || currentTime > endTime) return null;

                // Calculate fade opacity
                const layerTime = currentTime - layer.startTime;
                let fadeOpacity = 1;

                if (layerTime < layer.fadeIn) {
                    fadeOpacity = layerTime / layer.fadeIn;
                } else if (layerTime > layer.duration - layer.fadeOut) {
                    fadeOpacity = (endTime - currentTime) / layer.fadeOut;
                }

                const finalOpacity = layer.opacity * fadeOpacity;

                return (
                    <div
                        key={layer.id}
                        className="absolute pointer-events-none"
                        style={{
                            left: `${layer.x * 100}%`,
                            top: `${layer.y * 100}%`,
                            transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                            fontSize: layer.fontSize,
                            fontFamily: layer.fontFamily,
                            color: layer.color,
                            backgroundColor: layer.backgroundColor,
                            fontWeight: layer.bold ? 'bold' : 'normal',
                            fontStyle: layer.italic ? 'italic' : 'normal',
                            textDecoration: layer.underline ? 'underline' : 'none',
                            textAlign: layer.align,
                            opacity: finalOpacity,
                            padding: layer.backgroundColor !== 'transparent' ? '8px 16px' : '0',
                            borderRadius: layer.backgroundColor !== 'transparent' ? '4px' : '0',
                            whiteSpace: 'pre-wrap',
                            maxWidth: '80%',
                            zIndex: 20,
                        }}
                    >
                        {layer.text}
                    </div>
                );
            })}
        </div>
    );
};
