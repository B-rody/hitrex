import React, { useRef } from 'react';
import { Film, Trash2 } from 'lucide-react';
import { Clip, useProjectStore } from '../../store/useProjectStore';

interface TimelineClipProps {
  clip: Clip;
  isSelected: boolean;
  pixelsPerMs: number;
  trackHeight: number;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onTrimStart: (newSourceStart: number) => void;
  onTrimEnd: (newSourceEnd: number) => void;
  onMove: (newStartTime: number) => void;
  onUpdateFade?: (fadeIn: number, fadeOut: number) => void;
  allClips?: Clip[]; // For snap-to-clip
}

export const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  isSelected,
  pixelsPerMs,
  trackHeight,
  onSelect,
  onDelete,
  onTrimStart,
  onTrimEnd,
  onMove,
  allClips = [],
}) => {
  const clipRef = useRef<HTMLDivElement>(null);
  const [thumbnails, setThumbnails] = React.useState<string[]>([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = React.useState(true);
  const { projectPath } = useProjectStore();
  const isDragging = useRef(false);
  const dragType = useRef<'move' | 'trim-start' | 'trim-end' | null>(null);
  const dragStartX = useRef(0);
  const originalValue = useRef(0);
  const [snapIndicator, setSnapIndicator] = React.useState<number | null>(null);

  const clipWidth = clip.duration * pixelsPerMs;
  const clipLeft = clip.startTime * pixelsPerMs;

  // Snap to nearby clips within 100ms
  const snapToClip = (targetTime: number): number => {
    const SNAP_THRESHOLD = 100; // ms
    
    for (const otherClip of allClips) {
      if (otherClip.id === clip.id) continue;
      
      // Snap to other clip's start
      if (Math.abs(targetTime - otherClip.startTime) < SNAP_THRESHOLD) {
        setSnapIndicator(otherClip.startTime);
        return otherClip.startTime;
      }
      // Snap to other clip's end
      const otherEnd = otherClip.startTime + otherClip.duration;
      if (Math.abs(targetTime - otherEnd) < SNAP_THRESHOLD) {
        setSnapIndicator(otherEnd);
        return otherEnd;
      }
    }
    
    setSnapIndicator(null);
    return targetTime;
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'trim-start' | 'trim-end') => {
    e.stopPropagation();
    isDragging.current = true;
    dragType.current = type;
    dragStartX.current = e.clientX;

    if (type === 'move') {
      originalValue.current = clip.startTime;
    } else if (type === 'trim-start') {
      originalValue.current = clip.sourceStart;
    } else if (type === 'trim-end') {
      originalValue.current = clip.sourceEnd;
    }

    // Don't call onSelect here - it's called from onClick handler

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = moveEvent.clientX - dragStartX.current;
      const deltaMs = deltaX / pixelsPerMs;

      if (dragType.current === 'move') {
        const rawTime = Math.max(0, originalValue.current + deltaMs);
        const snappedTime = snapToClip(rawTime);
        onMove(snappedTime);
      } else if (dragType.current === 'trim-start') {
        const newSourceStart = Math.max(0, Math.min(originalValue.current + deltaMs, clip.sourceEnd - 100));
        onTrimStart(newSourceStart);
      } else if (dragType.current === 'trim-end') {
        const newSourceEnd = Math.max(clip.sourceStart + 100, originalValue.current + deltaMs);
        onTrimEnd(newSourceEnd);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      dragType.current = null;
      setSnapIndicator(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Load thumbnails for clip using canvas-based video frame extraction
  React.useEffect(() => {
    const loadThumbnails = async () => {
      // Only generate thumbnails if clip is wide enough (>200px)
      if (clipWidth < 200 || !projectPath) {
        setIsLoadingThumbs(false);
        return;
      }

      try {
        // Calculate how many thumbnails we need based on clip width
        const thumbCount = Math.min(Math.floor(clipWidth / 100), 10);
        const thumbs: string[] = [];

        // Create video element for frame extraction
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        
        const videoSrc = clip.type === 'screen'
          ? `file://${projectPath}/recording_screen.webm`
          : `file://${projectPath}/recording_cam.webm`;

        video.src = videoSrc;

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size (small for performance)
        canvas.width = 160;
        canvas.height = 90;

        // Extract frames at intervals
        for (let i = 0; i < thumbCount; i++) {
          const timeInClip = (clip.duration / (thumbCount - 1 || 1)) * i;
          const sourceTime = (clip.sourceStart + timeInClip) / 1000; // Convert to seconds
          
          video.currentTime = sourceTime;
          
          await new Promise((resolve) => {
            video.onseeked = resolve;
          });

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          thumbs.push(dataUrl);
        }

        setThumbnails(thumbs);
        setIsLoadingThumbs(false);
      } catch (error) {
        console.error('Failed to load thumbnails:', error);
        setIsLoadingThumbs(false);
      }
    };

    loadThumbnails();
  }, [clip.id, clip.type, clip.sourceStart, clip.duration, clipWidth, projectPath]);

  return (
    <>
      {/* Snap indicator line */}
      {snapIndicator !== null && (
        <div
          className="absolute top-0 w-0.5 bg-yellow-400 z-20 pointer-events-none"
          style={{
            left: `${snapIndicator * pixelsPerMs}px`,
            height: `${trackHeight * 2}px`, // Span both tracks
          }}
        />
      )}
      
      <div
        ref={clipRef}
        className={`absolute top-0 h-full rounded cursor-move group ${
        isSelected
          ? 'ring-2 ring-blue-500 bg-blue-600/80'
          : clip.type === 'screen'
          ? 'bg-purple-600/60 hover:bg-purple-600/80'
          : 'bg-green-600/60 hover:bg-green-600/80'
      } transition-colors overflow-hidden`}
      style={{
        left: clipLeft,
        width: Math.max(clipWidth, 20),
        height: trackHeight,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Thumbnail strip */}
      {!isLoadingThumbs && thumbnails.length > 0 && (
        <div className="absolute inset-0 flex overflow-hidden opacity-30">
          {thumbnails.map((thumb, idx) => (
            <img
              key={idx}
              src={thumb}
              alt=""
              className="h-full object-cover flex-shrink-0"
              style={{ width: `${100 / thumbnails.length}%` }}
            />
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoadingThumbs && clipWidth >= 200 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}

      {/* Trim handle - Start */}
      <div
        className="absolute left-0 top-0 w-2 h-full bg-blue-400/50 hover:bg-blue-400 cursor-ew-resize z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, 'trim-start');
        }}
      />

      {/* Clip content */}
      <div className="flex items-center justify-between h-full px-2 text-white text-xs font-medium pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Film className="w-3 h-3" />
          <span className="truncate">
            {clip.type === 'screen' ? 'Screen' : 'Camera'}
          </span>
        </div>
        <span className="text-[10px] opacity-70">{formatTime(clip.duration)}</span>
      </div>

      {/* Fade indicators */}
      {clip.fadeIn > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-transparent to-white/10 pointer-events-none"
          style={{ width: `${(clip.fadeIn / clip.duration) * 100}%` }}
        />
      )}
      {clip.fadeOut > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-transparent to-white/10 pointer-events-none"
          style={{ width: `${(clip.fadeOut / clip.duration) * 100}%` }}
        />
      )}

      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Delete Clip"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {/* Trim handle - End */}
      <div
        className="absolute right-0 top-0 w-2 h-full bg-blue-400/50 hover:bg-blue-400 cursor-ew-resize z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, 'trim-end');
        }}
      />
    </div>
    </>
  );
};
