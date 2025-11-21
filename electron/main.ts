import { app, BrowserWindow, ipcMain, desktopCapturer, dialog, shell, screen } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { exportVideo } from './export';

// const __dirname = path.dirname(fileURLToPath(import.meta.url))





// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let overlayWin: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 500,
    height: 700,
    resizable: false,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),

      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    center: true,
    frame: false,
    backgroundColor: '#0a0a0a'
  })


  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function createOverlayWindow(displayId?: string, includeTaskbar: boolean = true) {
  const allDisplays = screen.getAllDisplays();
  let targetDisplay = screen.getPrimaryDisplay();
  
  if (displayId) {
    // Source ID from desktopCapturer looks like "screen:0:0" where the number is the display index
    // Try to match by parsing the ID
    if (displayId.startsWith('screen:')) {
      // Get all screen sources to find the index
      const displayIndex = parseInt(displayId.split(':')[1]) || 0;
      if (displayIndex < allDisplays.length) {
        targetDisplay = allDisplays[displayIndex];
      }
    }
    
    console.log(`Creating overlay for source: ${displayId}, using display:`, targetDisplay.id, targetDisplay.bounds);
  }
  
  // Use bounds (includes taskbar) or workArea (excludes taskbar) based on setting
  const displayArea = includeTaskbar ? targetDisplay.bounds : targetDisplay.workArea;
  const { width, height, x, y } = displayArea;

  overlayWin = new BrowserWindow({
    width,
    height,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Make the window click-through except for specific regions
  overlayWin.setIgnoreMouseEvents(true, { forward: true })

  // Prevent overlay from being captured in screen recordings
  overlayWin.setContentProtection(true)
  
  // Also set the window to be excluded from capture (for Windows)
  if (process.platform === 'win32') {
    overlayWin.setSkipTaskbar(true)
  }

  // Set to screen-saver level for maximum visibility while still functioning
  overlayWin.setAlwaysOnTop(true, 'screen-saver')
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (VITE_DEV_SERVER_URL) {
    overlayWin.loadURL(`${VITE_DEV_SERVER_URL}?overlay=true`)
  } else {
    overlayWin.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      query: { overlay: 'true' }
    })
  }

  overlayWin.on('closed', () => {
    overlayWin = null
  })
}

// IPC Handlers
ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({ types: ['window', 'screen'], thumbnailSize: { width: 150, height: 150 } })
  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL()
  }))
})

// New: Get audio input devices
ipcMain.handle('get-audio-devices', async () => {
  // Note: Electron doesn't directly expose audio device enumeration from main process
  // This should be done in renderer process via navigator.mediaDevices.enumerateDevices()
  // We'll return empty array here and handle it in renderer
  return []
})

// New: Get display information
ipcMain.handle('get-display-info', async () => {
  const { screen } = await import('electron')
  const displays = screen.getAllDisplays()
  return displays.map(display => ({
    id: display.id,
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
    rotation: display.rotation,
    internal: display.internal
  }))
})




ipcMain.handle('save-recording', async (_, { screenBlob, camBlob, mouseData, settings }) => {
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save Project',
    defaultPath: `recording-${Date.now()}.hitrex`,
    filters: [
      { name: 'HitRex Project', extensions: ['hitrex'] }
    ],
    properties: ['createDirectory', 'showOverwriteConfirmation']
  })

  if (filePath) {
    // Remove extension if added by dialog, we'll use it as a directory
    const projectPath = filePath.replace(/\.hitrex$/, '')
    await fs.mkdir(projectPath, { recursive: true })
    await fs.writeFile(path.join(projectPath, 'recording_screen.webm'), Buffer.from(screenBlob))
    await fs.writeFile(path.join(projectPath, 'recording_cam.webm'), Buffer.from(camBlob))

    // Save metadata with recording settings and events
    const metadata = {
      recordingSettings: settings || {},
      events: mouseData || [],
      recordedAt: new Date().toISOString(),
      version: '1.0'
    }
    await fs.writeFile(path.join(projectPath, 'recording_meta.json'), JSON.stringify(metadata, null, 2))

    return projectPath
  }
  return null
})

// Window management for recording
ipcMain.handle('hide-main-window', async (_, sourceId?: string, includeTaskbar?: boolean) => {
  if (win) {
    win.hide()
  }
  // Create overlay window for recording controls on the correct display
  if (!overlayWin) {
    createOverlayWindow(sourceId, includeTaskbar ?? true)
  }
})

ipcMain.handle('show-main-window', async () => {
  // Destroy overlay window
  if (overlayWin) {
    overlayWin.close()
    overlayWin = null
  }
  if (win) {
    win.show()
    win.focus()
  }
})

// Overlay recording control handlers - forward to main window
ipcMain.on('overlay-stop-recording', () => {
  if (win) {
    win.webContents.send('stop-recording')
  }
})

ipcMain.on('overlay-pause-recording', () => {
  if (win) {
    win.webContents.send('pause-recording')
  }
})

ipcMain.on('overlay-resume-recording', () => {
  if (win) {
    win.webContents.send('resume-recording')
  }
})

ipcMain.on('overlay-restart-recording', () => {
  if (win) {
    win.webContents.send('restart-recording')
  }
})

ipcMain.on('overlay-cancel-recording', () => {
  if (win) {
    win.webContents.send('cancel-recording')
  }
  // Close overlay and show main window
  if (overlayWin) {
    overlayWin.close()
    overlayWin = null
  }
  if (win) {
    win.show()
    win.focus()
  }
})

ipcMain.on('overlay-toggle-mute', () => {
  if (win) {
    win.webContents.send('toggle-mute')
  }
})

// Overlay mouse event handling
ipcMain.on('overlay-set-ignore-mouse-events', (_, ignore: boolean) => {
  if (overlayWin) {
    overlayWin.setIgnoreMouseEvents(ignore, { forward: true })
  }
})

// Window controls
ipcMain.on('window-minimize', () => {
  if (win) win.minimize()
})

ipcMain.on('window-maximize', () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.on('window-close', () => {
  if (win) win.close()
})

// Project Management
const getProjectsDir = () => path.join(os.homedir(), 'Videos', 'HitRex')

ipcMain.handle('list-projects', async () => {
  const projectsDir = getProjectsDir()

  try {
    // Create directory if it doesn't exist
    await fs.mkdir(projectsDir, { recursive: true })

    const entries = await fs.readdir(projectsDir, { withFileTypes: true })
    const projects = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectPath = path.join(projectsDir, entry.name)
        const metadataPath = path.join(projectPath, 'recording_meta.json')

        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8')
          const metadata = JSON.parse(metadataContent)

          // Get file sizes
          const screenPath = path.join(projectPath, 'recording_screen.webm')
          const camPath = path.join(projectPath, 'recording_cam.webm')

          let fileSize = 0
          try {
            const screenStat = await fs.stat(screenPath)
            const camStat = await fs.stat(camPath)
            fileSize = screenStat.size + camStat.size
          } catch (e) {
            // Files might not exist
          }

          // Get video duration (approximate from metadata events)
          let duration = 0
          if (metadata.events && metadata.events.length > 0) {
            const lastEvent = metadata.events[metadata.events.length - 1]
            duration = lastEvent.timestamp || 0
          }

          projects.push({
            path: projectPath,
            name: entry.name,
            duration,
            recordedAt: metadata.recordedAt || new Date().toISOString(),
            fileSize,
            settings: metadata.recordingSettings
          })
        } catch (e) {
          // Skip projects without valid metadata
          console.error(`Skipping project ${entry.name}:`, e)
        }
      }
    }

    // Sort by date, newest first
    projects.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())

    return projects
  } catch (error) {
    console.error('Error listing projects:', error)
    return []
  }
})

ipcMain.handle('delete-project', async (_, projectPath) => {
  try {
    await fs.rm(projectPath, { recursive: true, force: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    throw error
  }
})

ipcMain.handle('get-project-thumbnail', async () => {
  // TODO: Extract first frame from video using ffmpeg
  // For now, return null
  return null
})


ipcMain.handle('start-render', async (_, { projectPath, duration, width, height }) => {
  const renderWin = new BrowserWindow({
    width,
    height,
    show: false, // Hidden window
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Important!
      offscreen: true // Optional, but good for headless
    },
  })

  if (VITE_DEV_SERVER_URL) {
    renderWin.loadURL(`${VITE_DEV_SERVER_URL}?mode=render&projectPath=${encodeURIComponent(projectPath)}&duration=${duration}`)
  } else {
    renderWin.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      query: { mode: 'render', projectPath, duration: duration.toString() }
    })
  }

  // FFmpeg Setup
  const outputPath = path.join(projectPath, 'output.mp4');
  const ffmpegCommand = ffmpeg()
    .setFfmpegPath(ffmpegStatic as string)
    .input('pipe:0')
    .inputOptions([
      '-f image2pipe',
      '-vcodec png',
      '-r 30', // Assume 30fps for now
    ])
    .input(path.join(projectPath, 'recording_screen.webm')) // Add audio from original (simplified)
    //.input(path.join(projectPath, 'recording_cam.webm')) // Complex mixing needed later
    .outputOptions([
      '-c:v libx264',
      '-pix_fmt yuv420p',
      '-shortest'
    ])
    .output(outputPath)
    .on('end', () => {
      console.log('Rendering finished');
      win?.webContents.send('render-finished', outputPath);
      renderWin.close();
    })
    .on('error', (err) => {
      console.error('Rendering error:', err);
      renderWin.close();
    });

  const ffmpegInput = ffmpegCommand.pipe();

  ipcMain.on('render-frame', async (_, { buffer }) => {
    // If buffer is empty, it means "Ready to capture"
    if (buffer.byteLength === 0) {
      try {
        // Capture the window
        const image = await renderWin.webContents.capturePage();
        const pngBuffer = image.toPNG();

        // Write to FFmpeg
        if (ffmpegInput.writable) {
          ffmpegInput.write(pngBuffer);
        }

        // Signal renderer to advance
        if (!renderWin.isDestroyed()) {
          renderWin.webContents.send('capture-done');
        }
      } catch (e) {
        console.error('Capture failed:', e);
      }
    } else {
      ffmpegInput.write(Buffer.from(buffer));
    }
  });


  ipcMain.handle('read-metadata', async (_, projectPath) => {
    try {
      const data = await fs.readFile(path.join(projectPath, 'recording_meta.json'), 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  });

  // Export handlers
  ipcMain.handle('show-save-dialog', async (_, options) => {
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: options.defaultPath,
      filters: options.filters,
    });
    return result.canceled ? null : result.filePath;
  });

  ipcMain.handle('export-video', async (_, exportData) => {
    if (!win) return { success: false, error: 'Window not available' };
    return await exportVideo(exportData, win);
  });

  ipcMain.handle('show-in-folder', async (_, filePath) => {
    shell.showItemInFolder(filePath);
  });

  // Project data persistence
  ipcMain.handle('save-project-data', async (_, projectPath, data) => {
    const dataPath = path.join(projectPath, 'project.json');
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
  });

  ipcMain.handle('load-project-data', async (_, projectPath) => {
    try {
      const dataPath = path.join(projectPath, 'project.json');
      const data = await fs.readFile(dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  });

  return true;
})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
