import React from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { X, Save } from 'lucide-react';

interface SettingsProps {
    onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const { aiProvider, openaiApiKey, localModelPath, setSettings } = useSettingsStore();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">AI Provider</label>
                        <div className="flex bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => setSettings({ aiProvider: 'openai' })}
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${aiProvider === 'openai' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                OpenAI Cloud
                            </button>
                            <button
                                onClick={() => setSettings({ aiProvider: 'local' })}
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${aiProvider === 'local' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Local Model
                            </button>
                        </div>
                    </div>

                    {aiProvider === 'openai' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">OpenAI API Key</label>
                            <input
                                type="password"
                                value={openaiApiKey}
                                onChange={(e) => setSettings({ openaiApiKey: e.target.value })}
                                placeholder="sk-..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Your key is stored locally and never sent to our servers.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Local Model Path (whisper.cpp)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={localModelPath}
                                    onChange={(e) => setSettings({ localModelPath: e.target.value })}
                                    placeholder="C:/path/to/main.exe"
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button className="bg-gray-700 hover:bg-gray-600 px-3 rounded-lg text-white">
                                    Browse
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
