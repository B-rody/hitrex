import React, { useState, useEffect } from 'react';
import { X, Monitor, Camera, Mic, Settings as SettingsIcon } from 'lucide-react';

export interface RecordingSettings {
  resolution: '720p' | '1080p' | '1440p' | '4K';
  fps: 30 | 60;
  screenSource: 'full' | 'window' | 'region';
  region?: { x: number; y: number; width: number; height: number };
  audioInputs: {
    system: boolean;
    microphone: string | null; // device ID
  };
  webcam: {
    enabled: boolean;
    deviceId: string;
    resolution: string;
  };
  showCursor: boolean;
}

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

interface RecordingSettingsProps {
  onClose: () => void;
  onStart: (settings: RecordingSettings) => void;
  initialSettings?: Partial<RecordingSettings>;
}

const RESOLUTION_OPTIONS = [
  { value: '720p', label: '720p (1280x720)', width: 1280, height: 720 },
  { value: '1080p', label: '1080p (1920x1080)', width: 1920, height: 1080 },
  { value: '1440p', label: '1440p (2560x1440)', width: 2560, height: 1440 },
  { value: '4K', label: '4K (3840x2160)', width: 3840, height: 2160 },
] as const;

const FPS_OPTIONS = [30, 60] as const;

export const RecordingSettings: React.FC<RecordingSettingsProps> = ({
  onClose,
  onStart,
  initialSettings,
}) => {
  const [settings, setSettings] = useState<RecordingSettings>({
    resolution: initialSettings?.resolution || '1080p',
    fps: initialSettings?.fps || 30,
    screenSource: initialSettings?.screenSource || 'full',
    audioInputs: {
      system: initialSettings?.audioInputs?.system ?? true,
      microphone: initialSettings?.audioInputs?.microphone || null,
    },
    webcam: {
      enabled: initialSettings?.webcam?.enabled ?? true,
      deviceId: initialSettings?.webcam?.deviceId || '',
      resolution: initialSettings?.webcam?.resolution || '720p',
    },
    showCursor: initialSettings?.showCursor ?? true,
  });

  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Request permissions first
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        // Get all devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const audio = devices
          .filter(d => d.kind === 'audioinput')
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`,
            kind: 'audioinput' as const,
          }));

        const video = devices
          .filter(d => d.kind === 'videoinput')
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 5)}`,
          }));

        setAudioDevices(audio);
        setVideoDevices(video);

        // Set default microphone if none selected
        if (audio.length > 0 && !initialSettings?.audioInputs?.microphone) {
          setSettings(prev => ({
            ...prev,
            audioInputs: { ...prev.audioInputs, microphone: audio[0].deviceId },
          }));
        }

        // Set default webcam if none selected
        if (video.length > 0 && !initialSettings?.webcam?.deviceId) {
          setSettings(prev => ({
            ...prev,
            webcam: { ...prev.webcam, deviceId: video[0].deviceId },
          }));
        }
      } catch (error) {
        console.error('Failed to enumerate devices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, [initialSettings?.audioInputs?.microphone, initialSettings?.webcam?.deviceId]);

  const handleStart = () => {
    onStart(settings);
  };

  const updateSettings = (partial: Partial<RecordingSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Recording Settings</h2>
              <p className="text-sm text-gray-400">Configure your recording preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            Loading devices...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Video Quality */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Monitor className="w-4 h-4" />
                Video Quality
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Resolution */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Resolution</label>
                  <select
                    value={settings.resolution}
                    onChange={(e) => updateSettings({ resolution: e.target.value as '720p' | '1080p' | '1440p' | '4K' })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {RESOLUTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FPS */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Frame Rate</label>
                  <select
                    value={settings.fps}
                    onChange={(e) => updateSettings({ fps: Number(e.target.value) as 30 | 60 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FPS_OPTIONS.map(fps => (
                      <option key={fps} value={fps}>
                        {fps} FPS
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Screen Source */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Monitor className="w-4 h-4" />
                Screen Capture
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateSettings({ screenSource: 'full' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.screenSource === 'full'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <Monitor className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-xs font-medium">Full Screen</div>
                  </div>
                </button>
                <button
                  onClick={() => updateSettings({ screenSource: 'window' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.screenSource === 'window'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <Monitor className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-xs font-medium">Window</div>
                  </div>
                </button>
                <button
                  onClick={() => updateSettings({ screenSource: 'region' })}
                  className={`p-3 rounded-lg border-2 transition-all opacity-50 cursor-not-allowed ${
                    settings.screenSource === 'region'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                  disabled
                >
                  <div className="text-center">
                    <Monitor className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-xs font-medium">Region</div>
                    <div className="text-[10px] text-gray-500 mt-1">Coming Soon</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Audio */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Mic className="w-4 h-4" />
                Audio Sources
              </label>
              <div className="space-y-3">
                {/* System Audio */}
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-700 rounded">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">System Audio</div>
                      <div className="text-xs text-gray-500">Capture desktop sound</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.audioInputs.system}
                      onChange={(e) =>
                        updateSettings({
                          audioInputs: { ...settings.audioInputs, system: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Microphone */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400">Microphone</label>
                    <span className="text-xs text-gray-500">
                      {audioDevices.length} device{audioDevices.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  <select
                    value={settings.audioInputs.microphone || ''}
                    onChange={(e) =>
                      updateSettings({
                        audioInputs: {
                          ...settings.audioInputs,
                          microphone: e.target.value || null,
                        },
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Microphone</option>
                    {audioDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Webcam */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Camera className="w-4 h-4" />
                Webcam
              </label>
              <div className="space-y-3">
                {/* Enable/Disable Webcam */}
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-700 rounded">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Show Webcam</div>
                      <div className="text-xs text-gray-500">Include camera in recording</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.webcam.enabled}
                      onChange={(e) =>
                        updateSettings({
                          webcam: { ...settings.webcam, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings.webcam.enabled && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Camera Device</label>
                    <select
                      value={settings.webcam.deviceId}
                      onChange={(e) =>
                        updateSettings({
                          webcam: { ...settings.webcam, deviceId: e.target.value },
                        })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {videoDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Additional Options</label>
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Show Cursor</div>
                  <div className="text-xs text-gray-500">Include mouse cursor in recording</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCursor}
                    onChange={(e) => updateSettings({ showCursor: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-gray-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-8 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-bold transition-all flex items-center gap-2"
          >
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            Start Recording
          </button>
        </div>
      </div>
    </div>
  );
};
