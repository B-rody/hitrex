import React, { useEffect } from 'react';
import { RecordingControls } from './features/recorder/RecordingControls';
import { RecordingBorder } from './features/recorder/RecordingBorder';
import { MouseTracker } from './features/recorder/MouseTracker';

export const OverlayView: React.FC = () => {
    const [recordingTime, setRecordingTime] = React.useState(0);
    const [isPaused, setIsPaused] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(false);
    const startTimeRef = React.useRef(Date.now());
    const pausedTimeRef = React.useRef(0);
    const pauseStartRef = React.useRef<number | null>(null);

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
        <div className="w-screen h-screen bg-transparent overflow-hidden pointer-events-none">
            <RecordingBorder isRecording={true} />
            <div className="pointer-events-auto">
                <RecordingControls
                    isRecording={true}
                    isPaused={isPaused}
                    isMuted={isMuted}
                    recordingTime={recordingTime}
                    onStop={handleStop}
                    onPause={handlePause}
                    onResume={handleResume}
                    onToggleMute={handleToggleMute}
                    onRestart={handleRestart}
                    onCancel={handleCancel}
                />
            </div>
            <MouseTracker isRecording={true} />
        </div>
    );
};
