import { ipcRenderer, contextBridge, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    const subscription = (event: IpcRendererEvent, ...args: unknown[]) => listener(event, ...args)

    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },


  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  saveRecording: (data: { screenBlob: Blob | ArrayBuffer; camBlob: Blob | ArrayBuffer; mouseData: unknown[]; settings?: unknown }) => ipcRenderer.invoke('save-recording', data),

  // Recording settings
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  getDisplayInfo: () => ipcRenderer.invoke('get-display-info'),

  // Project management
  listProjects: () => ipcRenderer.invoke('list-projects'),
  deleteProject: (projectPath: string) => ipcRenderer.invoke('delete-project', projectPath),
  getProjectThumbnail: (projectPath: string) => ipcRenderer.invoke('get-project-thumbnail', projectPath),

  startRender: (data: { projectPath: string; duration: number; width: number; height: number }) => ipcRenderer.invoke('start-render', data),
  sendFrame: (buffer: ArrayBuffer) => ipcRenderer.send('render-frame', { buffer }),
  renderComplete: () => ipcRenderer.send('render-complete'),
  readMetadata: (projectPath: string) => ipcRenderer.invoke('read-metadata', projectPath),

  on: (channel: string, listener: (...args: unknown[]) => void) => {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => listener(...args)
    ipcRenderer.on(channel, subscription)
    return () => { ipcRenderer.removeListener(channel, subscription) }
  },

  // Export
  showSaveDialog: (options: { defaultPath: string; filters: Array<{ name: string; extensions: string[] }> }) =>
    ipcRenderer.invoke('show-save-dialog', options),
  exportVideo: (data: any) => ipcRenderer.invoke('export-video', data),
  onExportProgress: (callback: (progress: number) => void) => {
    const subscription = (_event: IpcRendererEvent, progress: number) => callback(progress);
    ipcRenderer.on('export-progress', subscription);
    return () => ipcRenderer.removeListener('export-progress', subscription);
  },
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),

  // Project persistence
  saveProjectData: (projectPath: string, data: any) => ipcRenderer.invoke('save-project-data', projectPath, data),
  loadProjectData: (projectPath: string) => ipcRenderer.invoke('load-project-data', projectPath),

  // Window management
  hideMainWindow: (sourceId?: string, includeTaskbar?: boolean) => ipcRenderer.invoke('hide-main-window', sourceId, includeTaskbar),
  showMainWindow: () => ipcRenderer.invoke('show-main-window'),

  // Overlay recording controls
  overlayStopRecording: () => ipcRenderer.send('overlay-stop-recording'),
  overlayPauseRecording: () => ipcRenderer.send('overlay-pause-recording'),
  overlayResumeRecording: () => ipcRenderer.send('overlay-resume-recording'),
  overlayRestartRecording: () => ipcRenderer.send('overlay-restart-recording'),
  overlayCancelRecording: () => ipcRenderer.send('overlay-cancel-recording'),
  overlayToggleMute: () => ipcRenderer.send('overlay-toggle-mute'),
  overlaySetIgnoreMouseEvents: (ignore: boolean) => ipcRenderer.send('overlay-set-ignore-mouse-events', ignore),

  // Window controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
})






