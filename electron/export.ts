import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { BrowserWindow } from 'electron';

interface Clip {
    id: string;
    type: 'screen' | 'cam';
    startTime: number;
    duration: number;
    sourceStart: number;
    sourceEnd: number;
    enabled: boolean;
}

interface WebcamKeyframe {
    time: number;
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    shape: 'circle' | 'square' | 'rounded';
    borderColor: string;
    borderWidth: number;
    shadow: boolean;
    visible: boolean;
}

interface ZoomKeyframe {
    time: number;
    scale: number;
    centerX: number;
    centerY: number;
    easing: string;
}

interface ExportData {
    projectPath: string;
    savePath: string;
    clips: Clip[];
    webcamKeyframes: WebcamKeyframe[];
    zoomKeyframes: ZoomKeyframe[];
    duration: number;
    settings: {
        format: string;
        quality: string;
        fps: number;
        resolution: string;
        codec: string;
        bitrate: string;
        crf: number;
    };
}

export async function exportVideo(
    exportData: ExportData,
    mainWindow: BrowserWindow
): Promise<{ success: boolean; error?: string }> {
    try {
        const { projectPath, savePath, clips, settings } = exportData;

        // Get source video paths
        const projectDir = path.dirname(projectPath);
        const screenVideoPath = path.join(projectDir, 'recording_screen.webm');
        // const camVideoPath = path.join(projectDir, 'recording_cam.webm'); // TODO: Overlay support

        // Verify files exist
        if (!fs.existsSync(screenVideoPath)) {
            throw new Error('Screen recording not found');
        }

        // Sort clips by startTime
        const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

        // For now, simple concatenation approach
        // TODO: Implement full frame-by-frame rendering with zoom/webcam overlay
        
        if (sortedClips.length === 0) {
            throw new Error('No clips to export');
        }

        // Create a filter_complex for concatenating clips
        const screenClips = sortedClips.filter(c => c.type === 'screen');
        
        if (screenClips.length === 1) {
            // Single clip - simple trim and encode
            const clip = screenClips[0];
            
            return new Promise((resolve) => {
                let progress = 0;
                
                ffmpeg(screenVideoPath)
                    .setStartTime(clip.sourceStart / 1000)
                    .setDuration(clip.duration / 1000)
                    .videoCodec(settings.codec === 'h264' ? 'libx264' : settings.codec === 'h265' ? 'libx265' : 'libvpx-vp9')
                    .audioCodec('aac')
                    .videoBitrate(settings.bitrate)
                    .fps(settings.fps)
                    .outputOptions([
                        `-crf ${settings.crf}`,
                        '-preset fast',
                        '-movflags +faststart',
                    ])
                    .on('start', (cmd) => {
                        console.log('FFmpeg command:', cmd);
                        mainWindow.webContents.send('export-progress', 0);
                    })
                    .on('progress', (info) => {
                        if (info.percent) {
                            progress = Math.min(info.percent, 99);
                            mainWindow.webContents.send('export-progress', progress);
                        }
                    })
                    .on('end', () => {
                        mainWindow.webContents.send('export-progress', 100);
                        resolve({ success: true });
                    })
                    .on('error', (err) => {
                        console.error('FFmpeg error:', err);
                        resolve({ success: false, error: err.message });
                    })
                    .save(savePath);
            });
        } else {
            // Multiple clips - concatenation approach
            // Create a concat file
            const concatFilePath = path.join(projectDir, 'concat_list.txt');
            const tempClips: string[] = [];

            try {
                // First pass: trim all clips to temp files
                for (let i = 0; i < screenClips.length; i++) {
                    const clip = screenClips[i];
                    const tempPath = path.join(projectDir, `temp_clip_${i}.mp4`);
                    tempClips.push(tempPath);

                    await new Promise<void>((resolve, reject) => {
                        ffmpeg(screenVideoPath)
                            .setStartTime(clip.sourceStart / 1000)
                            .setDuration(clip.duration / 1000)
                            .videoCodec('libx264')
                            .audioCodec('aac')
                            .outputOptions(['-preset ultrafast'])
                            .on('end', () => resolve())
                            .on('error', (err) => reject(err))
                            .save(tempPath);
                    });

                    const clipProgress = ((i + 1) / screenClips.length) * 50;
                    mainWindow.webContents.send('export-progress', clipProgress);
                }

                // Create concat file
                const concatContent = tempClips.map(p => `file '${p}'`).join('\n');
                fs.writeFileSync(concatFilePath, concatContent);

                // Second pass: concatenate and encode
                return new Promise((resolve) => {
                    ffmpeg()
                        .input(concatFilePath)
                        .inputOptions(['-f concat', '-safe 0'])
                        .videoCodec(settings.codec === 'h264' ? 'libx264' : settings.codec === 'h265' ? 'libx265' : 'libvpx-vp9')
                        .audioCodec('aac')
                        .videoBitrate(settings.bitrate)
                        .fps(settings.fps)
                        .outputOptions([
                            `-crf ${settings.crf}`,
                            '-preset fast',
                            '-movflags +faststart',
                        ])
                        .on('progress', (info) => {
                            if (info.percent) {
                                const progress = 50 + (info.percent / 2);
                                mainWindow.webContents.send('export-progress', Math.min(progress, 99));
                            }
                        })
                        .on('end', () => {
                            // Cleanup
                            tempClips.forEach(p => {
                                if (fs.existsSync(p)) fs.unlinkSync(p);
                            });
                            if (fs.existsSync(concatFilePath)) fs.unlinkSync(concatFilePath);
                            
                            mainWindow.webContents.send('export-progress', 100);
                            resolve({ success: true });
                        })
                        .on('error', (err) => {
                            // Cleanup on error
                            tempClips.forEach(p => {
                                if (fs.existsSync(p)) fs.unlinkSync(p);
                            });
                            if (fs.existsSync(concatFilePath)) fs.unlinkSync(concatFilePath);
                            
                            console.error('FFmpeg error:', err);
                            resolve({ success: false, error: err.message });
                        })
                        .save(savePath);
                });
            } catch (error: unknown) {
                // Cleanup on error
                tempClips.forEach(p => {
                    if (fs.existsSync(p)) fs.unlinkSync(p);
                });
                if (fs.existsSync(concatFilePath)) fs.unlinkSync(concatFilePath);
                
                throw error;
            }
        }
    } catch (error: unknown) {
        console.error('Export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}
