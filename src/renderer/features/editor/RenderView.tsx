import React, { useEffect, useState } from 'react';
import { PreviewPlayer } from './PreviewPlayer';
import { useProjectStore } from '../../store/useProjectStore';

const FPS = 30;
const FRAME_DURATION = 1000 / FPS;

export const RenderView: React.FC = () => {
    const { setProject, setCurrentTime } = useProjectStore();
    const [isReady, setIsReady] = useState(false);
    const [frame, setFrame] = useState(0);

    // Parse query params
    const params = new URLSearchParams(window.location.search);
    const projectPath = params.get('projectPath');
    const duration = Number(params.get('duration'));


    useEffect(() => {
        if (projectPath && duration) {
            setProject(projectPath, duration);
            setIsReady(true);
        }

        // Listen for capture completion from main process
        const removeListener = window.electronAPI.on('capture-done', () => {
            const nextTime = (frame + 1) * FRAME_DURATION;
            if (nextTime < duration) {
                setFrame(f => f + 1);
                setCurrentTime(nextTime);
            } else {
                window.electronAPI.renderComplete();
            }
        });

        return () => {
            removeListener(); // We need to implement 'off' or return unsubscribe from 'on'
        };
    }, [projectPath, duration, frame, setProject, setCurrentTime]);


    // When time updates, we need to wait for video to seek (handled in PreviewPlayer mostly)
    // But here we just signal main process that we are ready for capture
    // We might need a small delay or check video 'seeked' state if possible
    useEffect(() => {
        if (!isReady) return;

        // Small delay to ensure React has rendered and videos have seeked
        // In a real app, we'd pass a callback to PreviewPlayer to know when seek is done
        const timer = setTimeout(() => {
            window.electronAPI.sendFrame(new ArrayBuffer(0)); // Signal ready, main will capture page
        }, 100);

        return () => clearTimeout(timer);
    }, [frame, isReady]);

    if (!projectPath) return <div>Loading...</div>;

    const screenSrc = `file://${projectPath}/recording_screen.webm`;
    const camSrc = `file://${projectPath}/recording_cam.webm`;

    return (
        <div className="w-full h-full bg-black overflow-hidden">
            <PreviewPlayer screenSrc={screenSrc} camSrc={camSrc} />
        </div>
    );
};
