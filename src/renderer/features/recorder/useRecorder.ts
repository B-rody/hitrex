import { useState, useRef, useCallback } from 'react';


export interface RecorderState {
    isRecording: boolean;
    isPaused: boolean;
    recordingTime: number;
}

export interface MouseEventData {
    x: number;
    y: number;
    timestamp: number;
    type: 'move' | 'click' | 'keypress';
    button?: 'left' | 'right' | 'middle';
    key?: string;
}

export const useRecorder = () => {
    const [state, setState] = useState<RecorderState>({
        isRecording: false,
        isPaused: false,
        recordingTime: 0,
    });

    const screenRecorderRef = useRef<MediaRecorder | null>(null);
    const camRecorderRef = useRef<MediaRecorder | null>(null);
    const mouseDataRef = useRef<MouseEventData[]>([]);
    const startTimeRef = useRef<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const screenChunks = useRef<Blob[]>([]);
    const camChunks = useRef<Blob[]>([]);

    const startRecording = useCallback(async (screenStream: MediaStream, camStream?: MediaStream | null) => {
        screenChunks.current = [];
        camChunks.current = [];
        mouseDataRef.current = [];
        startTimeRef.current = Date.now();

        // Initialize Recorders
        const screenRecorder = new MediaRecorder(screenStream, { mimeType: 'video/webm; codecs=vp9' });
        screenRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) screenChunks.current.push(e.data);
        };
        screenRecorder.start(1000); // Slice every second
        screenRecorderRef.current = screenRecorder;

        if (camStream) {
            const camRecorder = new MediaRecorder(camStream, { mimeType: 'video/webm; codecs=vp9' });
            camRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) camChunks.current.push(e.data);
            };
            camRecorder.start(1000);
            camRecorderRef.current = camRecorder;
        } else {
            camRecorderRef.current = null;
        }

        setState(s => ({ ...s, isRecording: true, isPaused: false }));

        // Start Timer
        timerIntervalRef.current = setInterval(() => {
            setState(s => ({ ...s, recordingTime: Date.now() - startTimeRef.current }));
        }, 100);

        // Start Mouse Tracking
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        window.addEventListener('contextmenu', handleRightClick);
        window.addEventListener('auxclick', handleMiddleClick);
        window.addEventListener('keydown', handleKeyPress);
    }, []);

    const stopRecording = useCallback(async () => {
        if (!screenRecorderRef.current) return;

        const stopPromise = new Promise<void>((resolve) => {
            let pendingStops = 1;
            if (camRecorderRef.current) pendingStops++;

            let stoppedCount = 0;
            const checkStopped = () => {
                stoppedCount++;
                if (stoppedCount === pendingStops) resolve();
            };

            screenRecorderRef.current!.onstop = checkStopped;
            if (camRecorderRef.current) {
                camRecorderRef.current.onstop = checkStopped;
            }
        });

        screenRecorderRef.current.stop();
        if (camRecorderRef.current) {
            camRecorderRef.current.stop();
        }

        await stopPromise;

        clearInterval(timerIntervalRef.current!);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
        window.removeEventListener('contextmenu', handleRightClick);
        window.removeEventListener('auxclick', handleMiddleClick);
        window.removeEventListener('keydown', handleKeyPress);

        setState(s => ({ ...s, isRecording: false, isPaused: false }));

        const screenBlob = new Blob(screenChunks.current, { type: 'video/webm' });
        const camBlob = camChunks.current.length > 0 ? new Blob(camChunks.current, { type: 'video/webm' }) : new Blob([], { type: 'video/webm' });
        const mouseData = mouseDataRef.current;

        return { screenBlob, camBlob, mouseData };
    }, []);

    const handleMouseMove = (e: MouseEvent) => {
        if (!startTimeRef.current) return;
        // Throttle mouse move events (record every 50ms max)
        const now = Date.now();
        const lastEvent = mouseDataRef.current[mouseDataRef.current.length - 1];
        if (lastEvent && lastEvent.type === 'move' && now - lastEvent.timestamp < 50) {
            return;
        }
        mouseDataRef.current.push({
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now() - startTimeRef.current,
            type: 'move'
        });
    };

    const handleClick = (e: MouseEvent) => {
        if (!startTimeRef.current) return;
        mouseDataRef.current.push({
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now() - startTimeRef.current,
            type: 'click',
            button: 'left'
        });
    };

    const handleRightClick = (e: MouseEvent) => {
        if (!startTimeRef.current) return;
        e.preventDefault(); // Prevent context menu during recording
        mouseDataRef.current.push({
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now() - startTimeRef.current,
            type: 'click',
            button: 'right'
        });
    };

    const handleMiddleClick = (e: MouseEvent) => {
        if (!startTimeRef.current) return;
        if (e.button === 1) { // Middle mouse button
            mouseDataRef.current.push({
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now() - startTimeRef.current,
                type: 'click',
                button: 'middle'
            });
        }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        if (!startTimeRef.current) return;

        // Build key combination string
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.shiftKey) modifiers.push('Shift');
        if (e.altKey) modifiers.push('Alt');
        if (e.metaKey) modifiers.push('Meta');

        const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        const keyCombo = modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;

        mouseDataRef.current.push({
            x: 0,
            y: 0,
            timestamp: Date.now() - startTimeRef.current,
            type: 'keypress',
            key: keyCombo
        });
    };

    return {
        state,
        startRecording,
        stopRecording,
        pauseRecording: () => {
            screenRecorderRef.current?.pause();
            camRecorderRef.current?.pause();
            setState(prev => ({ ...prev, isPaused: true }));
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        },
        resumeRecording: () => {
            screenRecorderRef.current?.resume();
            camRecorderRef.current?.resume();
            setState(prev => ({ ...prev, isPaused: false }));
            // Resume timer
            timerIntervalRef.current = setInterval(() => {
                setState(prev => ({ ...prev, recordingTime: Date.now() - startTimeRef.current }));
            }, 100);
        },
        cancelRecording: () => {
            if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
                screenRecorderRef.current.stop();
            }
            if (camRecorderRef.current && camRecorderRef.current.state !== 'inactive') {
                camRecorderRef.current.stop();
            }

            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }

            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('contextmenu', handleRightClick);
            window.removeEventListener('auxclick', handleMiddleClick);
            window.removeEventListener('keydown', handleKeyPress);

            screenChunks.current = [];
            camChunks.current = [];
            mouseDataRef.current = [];

            setState(s => ({ ...s, isRecording: false, isPaused: false, recordingTime: 0 }));
        }
    };
};
