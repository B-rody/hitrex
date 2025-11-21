import React, { useEffect, useState } from 'react';
import { PreviewPlayer } from './PreviewPlayer';
import { Timeline } from './Timeline';
import { WebcamControls } from './WebcamControls';
import { ZoomControls } from './ZoomControls';
import { FadeControls } from './FadeControls';
import { AudioControls } from './AudioControls';
import { TextControls } from './TextControls';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { ExportModal } from './ExportModal';
import { useProjectStore } from '../../store/useProjectStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Settings } from '../settings/Settings';
import { ToastContainer } from '../../components/Toast';
import { toast } from '../../store/useToastStore';
import { Tooltip } from '../../components/Tooltip';
import { ArrowLeft, Settings as SettingsIcon, Wand2, Keyboard, Download } from 'lucide-react';

import { MouseEventData } from '../recorder/useRecorder';

interface EditorProps {
    projectPath: string;
    onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ projectPath, onBack }) => {
    const { setProject, loadProject, saveProject } = useProjectStore();
    const { openaiApiKey } = useSettingsStore();
    const [showSettings, setShowSettings] = useState(false);
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [mouseData, setMouseData] = useState<MouseEventData[]>([]);


    useEffect(() => {
        setProject(projectPath, 10000);
        loadProject(projectPath); // Load saved edits
        window.electronAPI.readMetadata(projectPath).then((data) => setMouseData(data as MouseEventData[]));
    }, [projectPath, setProject, loadProject]);

    // Auto-save every 5 seconds when edits change
    useEffect(() => {
        const interval = setInterval(() => {
            saveProject();
        }, 5000);
        return () => clearInterval(interval);
    }, [saveProject]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Show keyboard shortcuts help
            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                e.preventDefault();
                setShowKeyboardHelp(true);
            }
            
            // Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                setShowExportModal(true);
            }
            
            // Undo/Redo (handled in Timeline for now)
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    toast.info('Undo', 1000);
                } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                    e.preventDefault();
                    toast.info('Redo', 1000);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);




    // Construct file URLs
    // Note: In production Electron, we might need a custom protocol 'hitrex://' to avoid security warnings
    // But 'file://' usually works in dev if webSecurity is disabled or properly configured
    const screenSrc = `file://${projectPath}/recording_screen.webm`;
    const camSrc = `file://${projectPath}/recording_cam.webm`;

    const handleTranscribe = async () => {
        if (!openaiApiKey) {
            setShowSettings(true);
            toast.warning('Please set your OpenAI API key in settings');
            return;
        }
        setIsTranscribing(true);
        toast.info('Starting transcription...');
        try {
            // await window.electronAPI.transcribe({ projectPath, apiKey: openaiApiKey });
            // Mock for now
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success('Transcription complete! ✨');
        } catch (e) {
            console.error(e);
            toast.error('Transcription failed. Please try again.');
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <div className="h-screen w-full bg-black flex flex-col">
            {/* Toolbar */}
            <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 justify-between">
                <div className="flex items-center gap-4">
                    <Tooltip content="Back to Library" shortcut="Esc">
                        <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                            <ArrowLeft size={16} /> Back
                        </button>
                    </Tooltip>
                    <div className="text-sm font-medium text-gray-300 border-l border-gray-700 pl-4">
                        {projectPath.split(/[\\/]/).pop()}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Tooltip content="AI-powered auto editing" shortcut="Ctrl+E">
                        <button
                            onClick={handleTranscribe}
                            disabled={isTranscribing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-purple-600/30"
                        >
                            <Wand2 size={14} />
                            {isTranscribing ? 'Processing...' : 'Auto Edit'}
                        </button>
                    </Tooltip>

                    <Tooltip content="Keyboard Shortcuts" shortcut="?">
                        <button
                            onClick={() => setShowKeyboardHelp(true)}
                            className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded transition-colors"
                        >
                            <Keyboard size={20} />
                        </button>
                    </Tooltip>

                    <Tooltip content="Settings" shortcut="Ctrl+,">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded transition-colors"
                        >
                            <SettingsIcon size={20} />
                        </button>
                    </Tooltip>

                    <Tooltip content="Export video" shortcut="Ctrl+E">
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-600/30 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Preview Area */}
                <div className="flex-1 bg-black relative flex items-center justify-center p-8">
                    <div className="aspect-video w-full max-w-5xl bg-gray-900 shadow-2xl overflow-hidden rounded-lg border border-gray-800">
                        <PreviewPlayer screenSrc={screenSrc} camSrc={camSrc} mouseData={mouseData} />
                    </div>
                </div>

                {/* Sidebar (Properties) */}
                <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Properties</h3>
                    
                    {/* Webcam Controls */}
                    <WebcamControls />
                    
                    {/* Zoom Controls */}
                    <div className="mt-4">
                            <ZoomControls />
                        </div>

                        {/* Fade Controls */}
                        <div className="border-t border-gray-800">
                            <div className="p-3 bg-gray-800/50 border-b border-gray-700">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transitions</h3>
                            </div>
                            <FadeControls />
                        </div>

                        {/* Audio Controls */}
                        <div className="border-t border-gray-800">
                            <div className="p-3 bg-gray-800/50 border-b border-gray-700">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Audio</h3>
                            </div>
                            <AudioControls />
                        </div>

                        {/* Text Controls */}
                        <div className="border-t border-gray-800">
                            <div className="p-3 bg-gray-800/50 border-b border-gray-700">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Text Overlays</h3>
                            </div>
                            <div className="p-3">
                                <TextControls />
                            </div>
                        </div>

                    {/* Additional controls can go here */}
                    <div className="mt-4 space-y-4">
                        <div className="bg-gray-800 p-3 rounded">
                            <label className="text-xs text-gray-400 block mb-1">Background</label>
                            <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500 cursor-pointer ring-2 ring-white" />
                                <div className="w-6 h-6 rounded-full bg-purple-500 cursor-pointer" />
                                <div className="w-6 h-6 rounded-full bg-green-500 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <Timeline />

            {/* Modals & Overlays */}
            {showSettings && <Settings onClose={() => setShowSettings(false)} />}
            <KeyboardShortcutsHelp isOpen={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />
            <ExportModal 
                isOpen={showExportModal} 
                onClose={() => setShowExportModal(false)} 
                projectPath={projectPath}
            />
            <ToastContainer />
        </div>
    );
};
