import { create } from 'zustand';

export type LayoutType = 'split' | 'pip' | 'full_screen' | 'full_cam';

export interface Clip {
    id: string;
    type: 'screen' | 'cam';
    startTime: number;      // Position on timeline (ms)
    duration: number;       // Clip duration (ms)
    sourceStart: number;    // Start position in source file (ms)
    sourceEnd: number;      // End position in source file (ms)
    enabled: boolean;
    fadeIn: number;         // Fade in duration (ms)
    fadeOut: number;        // Fade out duration (ms)
    opacity: number;        // 0-1
    volume: number;         // 0-2 (0=mute, 1=normal, 2=200%)
    audioEnabled: boolean;  // Mute/unmute
}

export interface WebcamKeyframe {
    time: number;
    x: number;              // 0-1 (percentage)
    y: number;              // 0-1 (percentage)
    width: number;          // pixels
    height: number;         // pixels
    scale: number;          // 1.0 = normal
    shape: 'circle' | 'square' | 'rounded';
    borderColor: string;
    borderWidth: number;
    shadow: boolean;
    visible: boolean;
}

export interface ZoomKeyframe {
    time: number;
    scale: number;          // 1.0 - 4.0
    centerX: number;        // 0-1 (focus point)
    centerY: number;        // 0-1 (focus point)
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface LayoutKeyframe {
    time: number;
    type: LayoutType;
    properties: {
        camScale: number;
        camX: number;           // 0-1 (percentage)
        camY: number;           // 0-1 (percentage)
        camWidth: number;       // pixels
        camHeight: number;      // pixels
        camShape: 'circle' | 'square' | 'rounded';
        camBorderColor: string;
        camBorderWidth: number;
        camVisible: boolean;
        screenZoom: number;
        focusPoint: { x: number; y: number };
    };
}

export interface TextLayer {
    id: string;
    text: string;
    startTime: number;      // When text appears (ms)
    duration: number;       // How long it stays (ms)
    x: number;              // 0-1 (percentage from left)
    y: number;              // 0-1 (percentage from top)
    fontSize: number;       // pixels
    fontFamily: string;
    color: string;          // hex color
    backgroundColor: string; // hex color with alpha
    bold: boolean;
    italic: boolean;
    underline: boolean;
    align: 'left' | 'center' | 'right';
    opacity: number;        // 0-1
    rotation: number;       // degrees
    fadeIn: number;         // fade in duration (ms)
    fadeOut: number;        // fade out duration (ms)
    enabled: boolean;
}

export interface ProjectState {
    // Playback
    currentTime: number;
    duration: number;
    isPlaying: boolean;

    // Project Data
    projectPath: string | null;
    clips: Clip[];
    layoutKeyframes: LayoutKeyframe[];
    webcamKeyframes: WebcamKeyframe[];
    zoomKeyframes: ZoomKeyframe[];
    textLayers: TextLayer[];
    selectedClipIds: string[];
    selectedTextLayerId: string | null;

    // Actions
    setProject: (path: string, duration: number) => void;
    setCurrentTime: (time: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    
    // Clip management
    addClip: (clip: Clip) => void;
    updateClip: (id: string, updates: Partial<Clip>) => void;
    deleteClip: (id: string) => void;
    deleteClipRipple: (id: string) => void; // Delete and auto-close gap
    splitClip: (id: string, splitTime: number) => void;
    selectClip: (id: string, multiSelect?: boolean) => void;
    deselectAllClips: () => void;
    
    // Layout keyframes
    addLayoutKeyframe: (keyframe: LayoutKeyframe) => void;
    updateLayoutKeyframe: (index: number, keyframe: Partial<LayoutKeyframe>) => void;
    
    // Webcam keyframes
    addWebcamKeyframe: (keyframe: WebcamKeyframe) => void;
    updateWebcamKeyframe: (time: number, updates: Partial<WebcamKeyframe>) => void;
    deleteWebcamKeyframe: (time: number) => void;
    
    // Zoom keyframes
    addZoomKeyframe: (keyframe: ZoomKeyframe) => void;
    updateZoomKeyframe: (time: number, updates: Partial<ZoomKeyframe>) => void;
    deleteZoomKeyframe: (time: number) => void;
    
    deleteLayoutKeyframe: (index: number) => void;
    
    // Text layers
    addTextLayer: (layer: TextLayer) => void;
    updateTextLayer: (id: string, updates: Partial<TextLayer>) => void;
    deleteTextLayer: (id: string) => void;
    selectTextLayer: (id: string | null) => void;
    
    // Project persistence
    saveProject: () => Promise<void>;
    loadProject: (projectPath: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    projectPath: null,
    clips: [],
    layoutKeyframes: [],
    webcamKeyframes: [],
    zoomKeyframes: [],
    textLayers: [],
    selectedClipIds: [],
    selectedTextLayerId: null,

    setProject: (path, duration) => {
        // Initialize with default clips for screen and cam
        const clips: Clip[] = [
            {
                id: 'screen-1',
                type: 'screen',
                startTime: 0,
                duration,
                sourceStart: 0,
                sourceEnd: duration,
                enabled: true,
                fadeIn: 0,
                fadeOut: 0,
                opacity: 1,
                volume: 1,
                audioEnabled: true,
            },
            {
                id: 'cam-1',
                type: 'cam',
                startTime: 0,
                duration,
                sourceStart: 0,
                sourceEnd: duration,
                enabled: true,
                fadeIn: 0,
                fadeOut: 0,
                opacity: 1,
                volume: 1,
                audioEnabled: true,
            },
        ];

        // Initialize with default PiP layout
        const defaultLayout: LayoutKeyframe = {
            time: 0,
            type: 'pip',
            properties: {
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
            },
        };

        set({
            projectPath: path,
            duration,
            currentTime: 0,
            isPlaying: false,
            clips,
            layoutKeyframes: [defaultLayout],
            selectedClipIds: [],
        });
    },

    setCurrentTime: (time) => set({ currentTime: Math.max(0, Math.min(time, get().duration)) }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),

    // Clip management
    addClip: (clip) => set((state) => ({
        clips: [...state.clips, { 
            ...clip,
            fadeIn: clip.fadeIn ?? 0, 
            fadeOut: clip.fadeOut ?? 0, 
            opacity: clip.opacity ?? 1,
            volume: clip.volume ?? 1,
            audioEnabled: clip.audioEnabled ?? true,
        }].sort((a, b) => a.startTime - b.startTime),
    })),

    updateClip: (id, updates) => set((state) => ({
        clips: state.clips.map((clip) =>
            clip.id === id ? { ...clip, ...updates } : clip
        ),
    })),

    deleteClip: (id) => set((state) => ({
        clips: state.clips.filter((clip) => clip.id !== id),
        selectedClipIds: state.selectedClipIds.filter((clipId) => clipId !== id),
    })),

    deleteClipRipple: (id) => set((state) => {
        const clipToDelete = state.clips.find(c => c.id === id);
        if (!clipToDelete) return state;

        // Calculate gap size
        const gapDuration = clipToDelete.duration;
        const gapStartTime = clipToDelete.startTime;

        // Shift all clips after this one to the left
        const updatedClips = state.clips
            .filter(c => c.id !== id)
            .map(clip => {
                if (clip.startTime > gapStartTime) {
                    return { ...clip, startTime: clip.startTime - gapDuration };
                }
                return clip;
            });

        return {
            clips: updatedClips,
            selectedClipIds: state.selectedClipIds.filter((clipId) => clipId !== id),
        };
    }),

    splitClip: (id, splitTime) => set((state) => {
        const clip = state.clips.find((c) => c.id === id);
        if (!clip || splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) {
            return state;
        }

        const splitOffset = splitTime - clip.startTime;
        const firstClip: Clip = {
            ...clip,
            id: `${clip.id}-split-1`,
            duration: splitOffset,
            sourceEnd: clip.sourceStart + splitOffset,
        };

        const secondClip: Clip = {
            ...clip,
            id: `${clip.id}-split-2`,
            startTime: splitTime,
            duration: clip.duration - splitOffset,
            sourceStart: clip.sourceStart + splitOffset,
        };

        return {
            clips: [
                ...state.clips.filter((c) => c.id !== id),
                firstClip,
                secondClip,
            ].sort((a, b) => a.startTime - b.startTime),
        };
    }),

    selectClip: (id, multiSelect = false) => set((state) => {
        if (multiSelect) {
            const isSelected = state.selectedClipIds.includes(id);
            return {
                selectedClipIds: isSelected
                    ? state.selectedClipIds.filter((clipId) => clipId !== id)
                    : [...state.selectedClipIds, id],
            };
        }
        return { selectedClipIds: [id] };
    }),

    deselectAllClips: () => set({ selectedClipIds: [] }),

    // Layout keyframes
    addLayoutKeyframe: (keyframe) => set((state) => {
        const newKeyframes = [...state.layoutKeyframes, keyframe].sort((a, b) => a.time - b.time);
        return { layoutKeyframes: newKeyframes };
    }),

    updateLayoutKeyframe: (index, keyframe) => set((state) => {
        const newKeyframes = [...state.layoutKeyframes];
        newKeyframes[index] = { ...newKeyframes[index], ...keyframe };
        return { layoutKeyframes: newKeyframes };
    }),

    deleteLayoutKeyframe: (index) => set((state) => ({
        layoutKeyframes: state.layoutKeyframes.filter((_, i) => i !== index),
    })),

    // Webcam keyframes
    addWebcamKeyframe: (keyframe) => set((state) => {
        const newKeyframes = [...state.webcamKeyframes, keyframe].sort((a, b) => a.time - b.time);
        return { webcamKeyframes: newKeyframes };
    }),

    updateWebcamKeyframe: (time, updates) => set((state) => {
        const index = state.webcamKeyframes.findIndex((kf) => kf.time === time);
        if (index === -1) return state;
        
        const newKeyframes = [...state.webcamKeyframes];
        newKeyframes[index] = { ...newKeyframes[index], ...updates };
        return { webcamKeyframes: newKeyframes };
    }),

    deleteWebcamKeyframe: (time) => set((state) => ({
        webcamKeyframes: state.webcamKeyframes.filter((kf) => kf.time !== time),
    })),

    // Zoom keyframes
    addZoomKeyframe: (keyframe) => set((state) => {
        const newKeyframes = [...state.zoomKeyframes, keyframe].sort((a, b) => a.time - b.time);
        return { zoomKeyframes: newKeyframes };
    }),

    updateZoomKeyframe: (time, updates) => set((state) => {
        const index = state.zoomKeyframes.findIndex((kf) => kf.time === time);
        if (index === -1) return state;
        
        const newKeyframes = [...state.zoomKeyframes];
        newKeyframes[index] = { ...newKeyframes[index], ...updates };
        return { zoomKeyframes: newKeyframes };
    }),

    deleteZoomKeyframe: (time) => set((state) => ({
        zoomKeyframes: state.zoomKeyframes.filter((kf) => kf.time !== time),
    })),

    // Text layers
    addTextLayer: (layer) => set((state) => ({
        textLayers: [...state.textLayers, layer],
        selectedTextLayerId: layer.id,
    })),

    updateTextLayer: (id, updates) => set((state) => {
        const index = state.textLayers.findIndex((layer) => layer.id === id);
        if (index === -1) return state;
        
        const newTextLayers = [...state.textLayers];
        newTextLayers[index] = { ...newTextLayers[index], ...updates };
        return { textLayers: newTextLayers };
    }),

    deleteTextLayer: (id) => set((state) => ({
        textLayers: state.textLayers.filter((layer) => layer.id !== id),
        selectedTextLayerId: state.selectedTextLayerId === id ? null : state.selectedTextLayerId,
    })),

    selectTextLayer: (id) => set({
        selectedTextLayerId: id,
        selectedClipIds: [], // Deselect clips when selecting text
    }),

    // Project persistence
    saveProject: async () => {
        const state = get();
        if (!state.projectPath) return;

        const projectData = {
            version: 1,
            clips: state.clips,
            webcamKeyframes: state.webcamKeyframes,
            zoomKeyframes: state.zoomKeyframes,
            layoutKeyframes: state.layoutKeyframes,
            textLayers: state.textLayers,
            duration: state.duration,
            savedAt: new Date().toISOString(),
        };

        try {
            await window.electronAPI.saveProjectData(state.projectPath, projectData);
            console.log('Project saved:', state.projectPath);
        } catch (error) {
            console.error('Failed to save project:', error);
        }
    },

    loadProject: async (projectPath: string) => {
        try {
            const projectData = await window.electronAPI.loadProjectData(projectPath);
            if (projectData) {
                set({
                    projectPath,
                    clips: projectData.clips || [],
                    webcamKeyframes: projectData.webcamKeyframes || [],
                    zoomKeyframes: projectData.zoomKeyframes || [],
                    layoutKeyframes: projectData.layoutKeyframes || [],
                    textLayers: projectData.textLayers || [],
                    duration: projectData.duration || 10000,
                });
                console.log('Project loaded:', projectPath);
            }
        } catch (error) {
            console.error('Failed to load project:', error);
        }
    },
}));
