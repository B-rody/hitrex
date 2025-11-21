import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Download, Settings } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { toast } from '../../store/useToastStore';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectPath: string;
}

interface ExportSettings {
    format: 'mp4' | 'webm' | 'gif';
    quality: 'low' | 'medium' | 'high' | 'ultra';
    fps: 30 | 60;
    resolution: 'source' | '1080p' | '720p' | '480p';
    codec: 'h264' | 'h265' | 'vp9';
}

const qualityPresets = {
    low: { bitrate: '1M', crf: 28 },
    medium: { bitrate: '3M', crf: 23 },
    high: { bitrate: '8M', crf: 18 },
    ultra: { bitrate: '16M', crf: 15 },
};

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, projectPath }) => {
    const { clips, webcamKeyframes, zoomKeyframes, duration } = useProjectStore();
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [settings, setSettings] = useState<ExportSettings>({
        format: 'mp4',
        quality: 'high',
        fps: 60,
        resolution: 'source',
        codec: 'h264',
    });

    const handleExport = async () => {
        setIsExporting(true);
        setExportProgress(0);

        try {
            // Request file save location
            const savePath = await window.electronAPI.showSaveDialog({
                defaultPath: `hitrex-export-${Date.now()}.${settings.format}`,
                filters: [
                    { name: 'Video Files', extensions: [settings.format] },
                ],
            });

            if (!savePath) {
                setIsExporting(false);
                return;
            }

            // Prepare export data
            const exportData = {
                projectPath,
                savePath,
                clips: clips.filter(c => c.enabled),
                webcamKeyframes,
                zoomKeyframes,
                duration,
                settings: {
                    ...settings,
                    ...qualityPresets[settings.quality],
                },
            };

            // Listen for progress updates
            const progressListener = (progress: number) => {
                setExportProgress(progress);
            };
            window.electronAPI.onExportProgress(progressListener);

            // Start export
            const result = await window.electronAPI.exportVideo(exportData);

            if (result.success) {
                toast.success('Video exported successfully!');
                setExportProgress(100);
                
                // Open file location
                setTimeout(() => {
                    window.electronAPI.showInFolder(savePath);
                }, 500);
            } else {
                toast.error(`Export failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed. Check console for details.');
        } finally {
            setIsExporting(false);
            setTimeout(() => {
                setExportProgress(0);
                onClose();
            }, 2000);
        }
    };

    const estimatedFileSize = () => {
        const durationSec = duration / 1000;
        const bitrate = parseInt(qualityPresets[settings.quality].bitrate);
        const sizeMB = (durationSec * bitrate) / 8;
        return sizeMB.toFixed(1);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={!isExporting ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                                        <Film className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Export Video</h2>
                                        <p className="text-sm text-gray-400">
                                            {clips.filter(c => c.enabled).length} clips • {(duration / 1000).toFixed(1)}s
                                        </p>
                                    </div>
                                </div>
                                {!isExporting && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                )}
                            </div>

                            {/* Settings */}
                            <div className="p-6 space-y-6">
                                {/* Format */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Format
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['mp4', 'webm', 'gif'] as const).map((format) => (
                                            <button
                                                key={format}
                                                onClick={() => setSettings({ ...settings, format })}
                                                disabled={isExporting}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                    settings.format === format
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {format.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quality */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Quality
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['low', 'medium', 'high', 'ultra'] as const).map((quality) => (
                                            <button
                                                key={quality}
                                                onClick={() => setSettings({ ...settings, quality })}
                                                disabled={isExporting}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                    settings.quality === quality
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {quality.charAt(0).toUpperCase() + quality.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Resolution */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Resolution
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['source', '1080p', '720p', '480p'] as const).map((res) => (
                                            <button
                                                key={res}
                                                onClick={() => setSettings({ ...settings, resolution: res })}
                                                disabled={isExporting}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                    settings.resolution === res
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {res === 'source' ? 'Source' : res}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* FPS */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Frame Rate
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {([30, 60] as const).map((fps) => (
                                            <button
                                                key={fps}
                                                onClick={() => setSettings({ ...settings, fps })}
                                                disabled={isExporting}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                    settings.fps === fps
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {fps} FPS
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Codec (Advanced) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        Codec (Advanced)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['h264', 'h265', 'vp9'] as const).map((codec) => (
                                            <button
                                                key={codec}
                                                onClick={() => setSettings({ ...settings, codec })}
                                                disabled={isExporting}
                                                className={`px-4 py-2 rounded-lg font-medium text-xs transition-colors ${
                                                    settings.codec === codec
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {codec.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Estimated file size */}
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Estimated file size:</span>
                                        <span className="font-mono text-white font-medium">
                                            ~{estimatedFileSize()} MB
                                        </span>
                                    </div>
                                </div>

                                {/* Progress */}
                                {isExporting && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Exporting...</span>
                                            <span className="font-mono text-white font-medium">
                                                {exportProgress.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${exportProgress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
                                <button
                                    onClick={onClose}
                                    disabled={isExporting}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting || clips.filter(c => c.enabled).length === 0}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download className="w-4 h-4" />
                                    {isExporting ? 'Exporting...' : 'Export'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
