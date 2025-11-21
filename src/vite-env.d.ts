/// <reference types="vite/client" />

export { };

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

interface ElectronAPI {
    getSources: () => Promise<Array<{ id: string; name: string; thumbnail: string }>>;
    saveRecording: (data: { screenBlob: Blob | ArrayBuffer; camBlob: Blob | ArrayBuffer; mouseData: unknown[] }) => Promise<string>;


    startRender: (data: { projectPath: string; duration: number; width: number; height: number }) => Promise<boolean>;
    sendFrame: (buffer: ArrayBuffer) => void;
    renderComplete: () => void;
    readMetadata: (projectPath: string) => Promise<unknown[]>;

    on: (channel: string, listener: (...args: unknown[]) => void) => () => void;

}
