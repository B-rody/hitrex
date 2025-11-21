import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRecorder } from './useRecorder';
import { Settings as SettingsIcon, FolderOpen, ChevronDown, Monitor, Video, Mic, MicOff, Volume2, MousePointer, X } from 'lucide-react';
import { Settings } from '../settings/Settings';
import { Tooltip } from '../../components/Tooltip';
import { useSettingsStore } from '../../store/useSettingsStore';

interface RecorderProps {
    onSaved?: (path: string) => void;
    onLibrary?: () => void;
}

export const Recorder: React.FC<RecorderProps> = ({ onSaved, onLibrary }) => {
    const { state, startRecording, stopRecording, pauseRecording, resumeRecording, cancelRecording } = useRecorder();
    const { 
        includeTaskbarInRecording, 
        recordingResolution, 
        recordingFps, 
        includeSystemAudio, 
        highlightClicks,
        setSettings 
    } = useSettingsStore();
    const [sources, setSources] = useState<Array<{ id: string; name: string; thumbnail: string }>>([]);
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
    const [camStream, setCamStream] = useState<MediaStream | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);

    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [isLoadingSources, setIsLoadingSources] = useState(false);
    const isLoadingSourcesRef = useRef(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [selectedMicId, setSelectedMicId] = useState<string>('');
    const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState(false);
    const [isMicDropdownOpen, setIsMicDropdownOpen] = useState(false);

    useEffect(() => {
        const loadDevices = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                    .then(s => s.getTracks().forEach(t => t.stop()))
                    .catch(() => { });

                const devices = await navigator.mediaDevices.enumerateDevices();
                const video = devices.filter(d => d.kind === 'videoinput');
                const audio = devices.filter(d => d.kind === 'audioinput');

                setVideoDevices(video);
                setAudioDevices(audio);

                if (video.length > 0) setSelectedCameraId(video[0].deviceId);
                if (audio.length > 0) setSelectedMicId(audio[0].deviceId);
            } catch (e) {
                console.error("Failed to load devices", e);
            }
        };
        loadDevices();
    }, []);

    const loadSources = useCallback(async () => {
        if (isLoadingSourcesRef.current) return;
        isLoadingSourcesRef.current = true;
        setIsLoadingSources(true);
        setError(null);
        try {
            if (!window.electronAPI) throw new Error("Electron API missing");
            const _sources = await window.electronAPI.getSources();
            setSources(_sources);
            setSelectedSourceId(prev => {
                if (prev) return prev;
                if (_sources.length > 0) {
                    const firstScreen = _sources.find(s => s.name.includes('Screen') || s.name.includes('Entire'));
                    return firstScreen?.id || _sources[0].id;
                }
                return null;
            });
        } catch (e: unknown) {
            console.error(e);
            const message = e instanceof Error ? e.message : String(e);
            setError(`Failed to load sources: ${message}`);
        } finally {
            setIsLoadingSources(false);
            isLoadingSourcesRef.current = false;
        }
    }, []);

    useEffect(() => {
        loadSources();
    }, [loadSources]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Element;
            if (isSourceDropdownOpen && !target.closest('.source-dropdown-container')) {
                setIsSourceDropdownOpen(false);
            }
            if (isCameraDropdownOpen && !target.closest('.camera-dropdown-container')) {
                setIsCameraDropdownOpen(false);
            }
            if (isMicDropdownOpen && !target.closest('.mic-dropdown-container')) {
                setIsMicDropdownOpen(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isSourceDropdownOpen, isCameraDropdownOpen, isMicDropdownOpen]);

    const handleStart = useCallback(async () => {
        if (!selectedSourceId) {
            setError("Please select a screen to record");
            return;
        }

        try {
            const audioConstraints = {
                audio: {
                    deviceId: selectedMicId ? { exact: selectedMicId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            };

            let audioStream: MediaStream | undefined;
            if (!isMuted) {
                audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            }

            // Map resolution to dimensions
            const resolutionMap = {
                '720p': { width: 1280, height: 720 },
                '1080p': { width: 1920, height: 1080 },
                '1440p': { width: 2560, height: 1440 },
                '4K': { width: 3840, height: 2160 }
            };
            const { width, height } = resolutionMap[recordingResolution];

            const screenStream = await navigator.mediaDevices.getUserMedia({
                audio: includeSystemAudio ? {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: selectedSourceId,
                    }
                } as unknown as MediaTrackConstraints : false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: selectedSourceId,
                        minWidth: width,
                        maxWidth: width,
                        minHeight: height,
                        maxHeight: height,
                        minFrameRate: recordingFps,
                        maxFrameRate: recordingFps
                    }
                } as unknown as MediaTrackConstraints
            });

            // Try to exclude own window from capture
            try {
                const videoTrack = screenStream.getVideoTracks()[0];
                // @ts-expect-error - experimental feature
                await videoTrack.applyConstraints({
                    // @ts-expect-error - experimental feature
                    selfBrowserSurface: 'exclude',
                    // @ts-expect-error - experimental feature
                    surfaceSwitching: 'exclude',
                    // @ts-expect-error - experimental feature
                    systemAudio: 'exclude'
                });
            } catch (err) {
                console.log('Could not apply exclusion constraints:', err);
            }

            if (audioStream) {
                audioStream.getTracks().forEach(track => screenStream.addTrack(track));
            }

            await startRecording(screenStream, camStream, highlightClicks);

            if (window.electronAPI?.hideMainWindow) {
                await window.electronAPI.hideMainWindow(selectedSourceId, includeTaskbarInRecording);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Failed to start recording: ${message}`);
        }
    }, [selectedSourceId, selectedMicId, isMuted, camStream, startRecording]);

    useEffect(() => {
        if (!window.electronAPI) {
            setError("Electron API not found. Preload script may have failed.");
            return;
        }

        const stopUnsubscribe = window.electronAPI.on('stop-recording', async () => {
            // Pause recording while user decides
            pauseRecording();

            // Ask user if they want to save (this will show save dialog)
            // We need to check if saveRecording returns a path or null
            // For now, let's call stopRecording and handle the dialog
            const result = await stopRecording();

            if (result) {
                const screenBuffer = await result.screenBlob.arrayBuffer();
                const camBuffer = await result.camBlob.arrayBuffer();

                const path = await window.electronAPI.saveRecording({
                    screenBlob: screenBuffer,
                    camBlob: camBuffer,
                    mouseData: result.mouseData,
                    settings: null
                });

                if (window.electronAPI?.showMainWindow) {
                    await window.electronAPI.showMainWindow();
                }

                if (path && onSaved) {
                    onSaved(path);
                } else {
                    // User cancelled save - but recording is already stopped
                    // We can't resume from here, so just show main window
                    if (window.electronAPI?.showMainWindow) {
                        await window.electronAPI.showMainWindow();
                    }
                }
            }
        });

        const pauseUnsubscribe = window.electronAPI.on('pause-recording', () => {
            pauseRecording();
        });

        const resumeUnsubscribe = window.electronAPI.on('resume-recording', () => {
            resumeRecording();
        });

        const restartUnsubscribe = window.electronAPI.on('restart-recording', () => {
            cancelRecording();
            handleStart();
        });

        const cancelUnsubscribe = window.electronAPI.on('cancel-recording', async () => {
            cancelRecording();
            if (window.electronAPI?.showMainWindow) {
                await window.electronAPI.showMainWindow();
            }
        });

        return () => {
            stopUnsubscribe();
            pauseUnsubscribe();
            resumeUnsubscribe();
            restartUnsubscribe();
            cancelUnsubscribe();
        };
    }, [stopRecording, pauseRecording, resumeRecording, cancelRecording, onSaved, handleStart]);

    const startCamera = useCallback(async (deviceId?: string) => {
        try {
            const idToUse = deviceId || selectedCameraId;
            const constraints = {
                video: {
                    deviceId: idToUse ? { exact: idToUse } : undefined,
                    width: 1280,
                    height: 720
                },
                audio: false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setCamStream(stream);
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream;
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Camera error: ${message}`);
        }
    }, [selectedCameraId]);

    const stopCamera = useCallback(() => {
        if (camStream) {
            camStream.getTracks().forEach(track => track.stop());
            setCamStream(null);
        }
    }, [camStream]);

    const toggleCamera = async () => {
        if (camStream) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    useEffect(() => {
        if (camStream && selectedCameraId) {
            const currentTrack = camStream.getVideoTracks()[0];
            if (currentTrack.getSettings().deviceId !== selectedCameraId) {
                stopCamera();
                startCamera(selectedCameraId);
            }
        }
    }, [selectedCameraId, camStream, startCamera, stopCamera]);

    // Auto-dismiss error after 3 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <>
            {!state.isRecording && (
                <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                                <Video className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">New Recording</h2>
                                <p className="text-surface-400 text-sm">Select your sources and preferences</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Tooltip content="Open Library">
                                <button onClick={onLibrary} className="p-2 hover:bg-surface-800 rounded-lg text-surface-400 hover:text-white transition-colors">
                                    <FolderOpen size={20} />
                                </button>
                            </Tooltip>
                            <Tooltip content="Settings">
                                <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-surface-800 rounded-lg text-surface-400 hover:text-white transition-colors">
                                    <SettingsIcon size={20} />
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="space-y-3 bg-surface-950/50 p-4 rounded-2xl border border-surface-800/50 backdrop-blur-sm relative">
                        {/* Absolute positioned error to prevent layout shift */}
                        {error && (
                            <div className="absolute -top-3 left-4 right-4 z-10 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                <span className="flex-1">{error}</span>
                                <button
                                    onClick={() => setError(null)}
                                    className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                    aria-label="Close error"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="relative source-dropdown-container">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (sources.length === 0) loadSources();
                                        setIsSourceDropdownOpen(!isSourceDropdownOpen);
                                    }}
                                    disabled={isLoadingSources}
                                    className={`w-full bg-surface-900 hover:bg-surface-800 border transition-all rounded-xl px-4 py-4 flex items-center gap-4 text-left disabled:opacity-50 cursor-pointer ${isSourceDropdownOpen ? 'border-brand-500 ring-1 ring-brand-500' : 'border-surface-800'}`}
                                >
                                    <div className="w-10 h-10 bg-surface-800 rounded-lg flex items-center justify-center flex-shrink-0 text-brand-400">
                                        <Monitor size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-0.5">Record Screen</div>
                                        <div className="font-semibold text-sm truncate text-white">
                                            {isLoadingSources ? 'Loading...' : selectedSourceId ? sources.find(s => s.id === selectedSourceId)?.name || 'Full Screen' : 'Full Screen'}
                                        </div>
                                    </div>
                                    <ChevronDown size={18} className={`text-surface-500 transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isSourceDropdownOpen && sources.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-900 border border-surface-700 rounded-xl overflow-hidden shadow-2xl z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        {sources.map((source) => (
                                            <button
                                                key={source.id}
                                                onClick={() => {
                                                    setSelectedSourceId(source.id);
                                                    setIsSourceDropdownOpen(false);
                                                }}
                                                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-800 transition-colors text-left border-b border-surface-800 last:border-0 ${selectedSourceId === source.id ? 'bg-surface-800' : ''}`}
                                            >
                                                <img src={source.thumbnail} alt={source.name} className="w-20 h-12 object-cover rounded border border-surface-700" />
                                                <span className="text-sm font-medium text-surface-200 truncate">{source.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Taskbar inclusion toggle */}
                            <button
                                onClick={() => setSettings({ includeTaskbarInRecording: !includeTaskbarInRecording })}
                                className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-surface-800 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-surface-800 rounded-lg flex items-center justify-center flex-shrink-0 text-brand-400">
                                        <Monitor size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-semibold text-white">Include Taskbar</div>
                                        <div className="text-xs text-surface-400">Show taskbar in screen recording</div>
                                    </div>
                                </div>
                                <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${includeTaskbarInRecording ? 'bg-brand-500' : 'bg-surface-700'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${includeTaskbarInRecording ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </button>

                            {/* Recording quality settings */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-surface-900 border border-surface-800 rounded-xl p-3">
                                    <label className="block text-xs text-surface-400 font-medium uppercase tracking-wider mb-2">Resolution</label>
                                    <select
                                        value={recordingResolution}
                                        onChange={(e) => setSettings({ recordingResolution: e.target.value as '720p' | '1080p' | '1440p' | '4K' })}
                                        className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                                    >
                                        <option value="720p">720p</option>
                                        <option value="1080p">1080p</option>
                                        <option value="1440p">1440p</option>
                                        <option value="4K">4K</option>
                                    </select>
                                </div>
                                <div className="bg-surface-900 border border-surface-800 rounded-xl p-3">
                                    <label className="block text-xs text-surface-400 font-medium uppercase tracking-wider mb-2">Frame Rate</label>
                                    <select
                                        value={recordingFps}
                                        onChange={(e) => setSettings({ recordingFps: Number(e.target.value) as 30 | 60 })}
                                        className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                                    >
                                        <option value="30">30 FPS</option>
                                        <option value="60">60 FPS</option>
                                    </select>
                                </div>
                            </div>

                            {/* System audio and highlight clicks side by side */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSettings({ includeSystemAudio: !includeSystemAudio })}
                                    className="bg-surface-900 border border-surface-800 rounded-xl p-3 hover:bg-surface-800 transition-colors cursor-pointer text-left"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Volume2 size={16} className="text-brand-400" />
                                            <div className="text-sm font-semibold text-white">System Audio</div>
                                        </div>
                                        <div className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${includeSystemAudio ? 'bg-brand-500' : 'bg-surface-700'}`}>
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${includeSystemAudio ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                    <div className="text-xs text-surface-400">Capture desktop sound</div>
                                </button>
                                <button
                                    onClick={() => setSettings({ highlightClicks: !highlightClicks })}
                                    className="bg-surface-900 border border-surface-800 rounded-xl p-3 hover:bg-surface-800 transition-colors cursor-pointer text-left"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <MousePointer size={16} className="text-brand-400" />
                                            <div className="text-sm font-semibold text-white">Highlight Clicks</div>
                                        </div>
                                        <div className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${highlightClicks ? 'bg-brand-500' : 'bg-surface-700'}`}>
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${highlightClicks ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                    <div className="text-xs text-surface-400">Visual click indicator</div>
                                </button>
                            </div>

                            <div className="relative camera-dropdown-container w-full">
                                <div className={`flex bg-surface-900 border border-surface-800 rounded-xl transition-all group overflow-hidden ${camStream ? 'border-brand-500/50 bg-brand-500/5' : 'hover:bg-surface-800'}`}>
                                    <button onClick={toggleCamera} className="flex-1 px-4 py-3 flex items-center gap-3 text-left min-w-0 overflow-hidden cursor-pointer">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${camStream ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400'}`}>
                                            <Video size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-0.5">Camera</div>
                                            <div className="font-semibold text-sm text-white truncate">
                                                {camStream ? (videoDevices.find(d => d.deviceId === selectedCameraId)?.label || 'Active') : 'Disabled'}
                                            </div>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${camStream ? 'bg-green-500' : 'bg-surface-700'}`} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setIsCameraDropdownOpen(!isCameraDropdownOpen); }} className="px-4 border-l border-surface-800 hover:bg-surface-700/50 flex items-center justify-center cursor-pointer">
                                        <ChevronDown size={16} className={`text-surface-500 transition-transform ${isCameraDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {isCameraDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-900 border border-surface-700 rounded-xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        {videoDevices.map((device) => (
                                            <button
                                                key={device.deviceId}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCameraId(device.deviceId);
                                                    setIsCameraDropdownOpen(false);
                                                    if (!camStream) startCamera(device.deviceId);
                                                }}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-surface-800 transition-colors border-b border-surface-800 last:border-0 truncate ${selectedCameraId === device.deviceId ? 'text-brand-400 bg-surface-800/50' : 'text-surface-200'}`}
                                            >
                                                {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative mic-dropdown-container w-full">
                                <div className={`flex bg-surface-900 border border-surface-800 rounded-xl transition-all group overflow-hidden ${!isMuted ? 'border-brand-500/50 bg-brand-500/5' : 'hover:bg-surface-800'}`}>
                                    <button onClick={() => setIsMuted(!isMuted)} className="flex-1 px-4 py-3 flex items-center gap-3 text-left min-w-0 overflow-hidden cursor-pointer">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!isMuted ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400'}`}>
                                            {!isMuted ? <Mic size={16} /> : <MicOff size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-0.5">Microphone</div>
                                            <div className="font-semibold text-sm text-white truncate">
                                                {isMuted ? 'Muted' : (audioDevices.find(d => d.deviceId === selectedMicId)?.label || 'Active')}
                                            </div>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!isMuted ? 'bg-green-500' : 'bg-surface-700'}`} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setIsMicDropdownOpen(!isMicDropdownOpen); }} className="px-4 border-l border-surface-800 hover:bg-surface-700/50 flex items-center justify-center cursor-pointer">
                                        <ChevronDown size={16} className={`text-surface-500 transition-transform ${isMicDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {isMicDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-900 border border-surface-700 rounded-xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        {audioDevices.map((device) => (
                                            <button
                                                key={device.deviceId}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedMicId(device.deviceId);
                                                    setIsMicDropdownOpen(false);
                                                    if (isMuted) setIsMuted(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-surface-800 transition-colors border-b border-surface-800 last:border-0 truncate ${selectedMicId === device.deviceId ? 'text-brand-400 bg-surface-800/50' : 'text-surface-200'}`}
                                            >
                                                {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleStart}
                            disabled={!selectedSourceId || isLoadingSources}
                            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:from-surface-800 disabled:to-surface-800 disabled:text-surface-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-brand-500/20 disabled:shadow-none transform active:scale-[0.98]"
                        >
                            Start Recording
                        </button>
                    </div>

                    <video ref={videoPreviewRef} autoPlay muted className="hidden" />
                </div>
            )}

            {showSettings && (
                <Settings onClose={() => setShowSettings(false)} />
            )}
        </>
    );
};
