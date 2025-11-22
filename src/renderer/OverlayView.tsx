import React, { useEffect } from 'react';
import { RecordingControls } from './features/recorder/RecordingControls';
import { RecordingBorder } from './features/recorder/RecordingBorder';
import { MouseTracker } from './features/recorder/MouseTracker';
import { WebcamPreview } from './features/recorder/WebcamPreview';
import { AnnotationTools } from './features/recorder/AnnotationTools';

export const OverlayView: React.FC = () => {
    const [recordingTime, setRecordingTime] = React.useState(0);
    const [isPaused, setIsPaused] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(false);
    const [showAnnotations, setShowAnnotations] = React.useState(false);
    const [camStream, setCamStream] = React.useState<MediaStream | null>(null);
    const [micStream, setMicStream] = React.useState<MediaStream | null>(null);
    const [micLevel, setMicLevel] = React.useState(0);
    const startTimeRef = React.useRef(Date.now());
    const pausedTimeRef = React.useRef(0);
    const pauseStartRef = React.useRef<number | null>(null);

    // Initialize camera and microphone streams from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const cameraId = params.get('cameraId');
        const micId = params.get('micId');
        
        if (cameraId && cameraId !== 'null') {
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: { exact: cameraId },
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        },
                        audio: false
                    });
                    setCamStream(stream);
                } catch (err) {
                    console.error('Failed to start camera in overlay:', err);
                }
            };
            startCamera();
        }

        if (micId && micId !== 'null') {
            const startMic = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: { exact: micId },
                            echoCancellation: true,
                            noiseSuppression: true,
                        }
                    });
                    setMicStream(stream);
                } catch (err) {
                    console.error('Failed to start mic in overlay:', err);
                }
            };
            startMic();
        }

        return () => {
            if (camStream) {
                camStream.getTracks().forEach(track => track.stop());
            }
            if (micStream) {
                micStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Notify main window when annotation mode changes
    useEffect(() => {
        if (window.electronAPI?.overlayToggleAnnotations) {
            window.electronAPI.overlayToggleAnnotations(showAnnotations);
        }
        if (window.electronAPI?.overlaySetIgnoreMouseEvents) {
            // Capture pointer for drawing when annotations are active
            window.electronAPI.overlaySetIgnoreMouseEvents(!showAnnotations);
        }
    }, [showAnnotations]);

    // Monitor microphone audio levels
    useEffect(() => {
        if (!micStream || isMuted) {
            setMicLevel(0);
            return;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(micStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let animationFrameId: number;

        const updateLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            const normalizedLevel = Math.min(100, (average / 255) * 100 * 4);
            setMicLevel(normalizedLevel);
            animationFrameId = requestAnimationFrame(updateLevel);
        };

        updateLevel();

        return () => {
            cancelAnimationFrame(animationFrameId);
            source.disconnect();
            audioContext.close();
        };
    }, [micStream, isMuted]);

    // Sync pause state with main window
    useEffect(() => {
        const pauseHandler = () => {
            setIsPaused(true);
            pauseStartRef.current = Date.now();
        };

        const resumeHandler = () => {
            if (pauseStartRef.current !== null) {
                pausedTimeRef.current += Date.now() - pauseStartRef.current;
                pauseStartRef.current = null;
            }
            setIsPaused(false);
        };

        // These events come from the main window when recording state changes
        const pauseUnsub = window.electronAPI?.on?.('pause-recording', pauseHandler);
        const resumeUnsub = window.electronAPI?.on?.('resume-recording', resumeHandler);

        return () => {
            pauseUnsub?.();
            resumeUnsub?.();
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isPaused) {
                const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
                setRecordingTime(elapsed);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isPaused]);

    const handleStop = () => {
        // Pause overlay timer when stopping
        setIsPaused(true);
        pauseStartRef.current = Date.now();
        
        if (window.electronAPI?.overlayStopRecording) {
            window.electronAPI.overlayStopRecording();
        }
    };

    const handlePause = () => {
        setIsPaused(true);
        pauseStartRef.current = Date.now();
        if (window.electronAPI?.overlayPauseRecording) {
            window.electronAPI.overlayPauseRecording();
        }
    };

    const handleResume = () => {
        if (pauseStartRef.current !== null) {
            pausedTimeRef.current += Date.now() - pauseStartRef.current;
            pauseStartRef.current = null;
        }
        setIsPaused(false);
        if (window.electronAPI?.overlayResumeRecording) {
            window.electronAPI.overlayResumeRecording();
        }
    };

    const handleToggleMute = () => {
        setIsMuted(!isMuted);
        if (window.electronAPI?.overlayToggleMute) {
            window.electronAPI.overlayToggleMute();
        }
    };

    const handleRestart = () => {
        startTimeRef.current = Date.now();
        pausedTimeRef.current = 0;
        pauseStartRef.current = null;
        setRecordingTime(0);
        setIsPaused(false);
        if (window.electronAPI?.overlayRestartRecording) {
            window.electronAPI.overlayRestartRecording();
        }
    };

    const handleCancel = () => {
        const api = window.electronAPI;
        if (api?.overlayCancelRecording) {
            api.overlayCancelRecording();
        }
    };

    return (
        <div 
            className="bg-transparent overflow-hidden pointer-events-none"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: `${window.screen.width}px`,
                height: `${window.screen.height}px`,
            }}
        >
            <RecordingBorder isRecording={true} />
            <WebcamPreview stream={camStream} annotationsActive={showAnnotations} />
            {showAnnotations && (
                <div className="pointer-events-auto relative z-50">
                    <AnnotationTools />
                </div>
            )}
            <div className="pointer-events-auto relative z-40">
                <RecordingControls
                    isRecording={true}
                    isPaused={isPaused}
                    isMuted={isMuted}
                    micLevel={micLevel}
                    recordingTime={recordingTime}
                    onStop={handleStop}
                    onPause={handlePause}
                    onResume={handleResume}
                    onToggleMute={handleToggleMute}
                    onRestart={handleRestart}
                    onCancel={handleCancel}
                    onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
                    showAnnotations={showAnnotations}
                />
            </div>
            <MouseTracker isRecording={true} annotationsActive={showAnnotations} />
        </div>
    );
};
