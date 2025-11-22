declare module 'ffmpeg-static' {
    const path: string;
    export default path;
}

interface ElectronAPI {
    getSources: () => Promise<Array<{ id: string; name: string; thumbnail: string }>>;
    saveRecording: (data: {
        screenBlob: ArrayBuffer;
        camBlob: ArrayBuffer;
        audioBlob: ArrayBuffer;
        mouseData: unknown[];
        settings?: unknown;
    }) => Promise<string | null>;
    listProjects: () => Promise<Array<any>>;
    deleteProject: (projectPath: string) => Promise<void>;
    getProjectThumbnail: (projectPath: string) => Promise<string | null>;
    getAudioDevices: () => Promise<Array<{ deviceId: string; label: string; kind: string }>>;
    getDisplayInfo: () => Promise<Array<{
        id: number;
        bounds: { x: number; y: number; width: number; height: number };
        workArea: { x: number; y: number; width: number; height: number };
        scaleFactor: number;
        rotation: number;
        internal: boolean;
    }>>;
    startRender: (data: {
        projectPath: string;
        duration: number;
        width: number;
        height: number;
    }) => Promise<boolean>;
    sendFrame: (buffer: ArrayBuffer) => void;
    renderComplete: () => void;
    readMetadata: (projectPath: string) => Promise<unknown>;
    on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
    showSaveDialog: (options: { defaultPath: string; filters: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>;
    exportVideo: (data: any) => Promise<{ success: boolean; error?: string }>;
    onExportProgress: (callback: (progress: number) => void) => void;
    showInFolder: (path: string) => void;
    saveProjectData: (projectPath: string, data: any) => Promise<void>;
    loadProjectData: (projectPath: string) => Promise<any>;
    extractVideoThumbnail: (videoPath: string, timeInSeconds: number) => Promise<string | null>;
    hideMainWindow: (sourceId?: string, includeTaskbar?: boolean, cameraDeviceId?: string, micDeviceId?: string) => Promise<void>;
    showMainWindow: () => Promise<void>;
    overlayStopRecording: () => void;
    overlayPauseRecording: () => void;
    overlayResumeRecording: () => void;
    overlayRestartRecording: () => void;
    overlayCancelRecording: () => void;
    overlayToggleMute: () => void;
    overlaySetIgnoreMouseEvents: (ignore: boolean) => void;
    overlayMouseClick: (clickData: { x: number; y: number; button: string; timestamp: number }) => void;
    overlayToggleAnnotations: (enabled: boolean) => void;
    overlayChangeTool: (tool: any) => void;
        overlayDrawingEvent: (event: { type: 'start' | 'move' | 'end'; x: number; y: number }) => void;

    // Window controls
    windowMinimize: () => void;
    windowMaximize: () => void;
    windowClose: () => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export { };
