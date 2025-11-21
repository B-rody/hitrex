import React from 'react';
import { Clock, Trash2, Play, Film } from 'lucide-react';
import { ProjectMetadata } from '../../store/useProjectLibraryStore';

interface ProjectCardProps {
  project: ProjectMetadata;
  onOpen: (project: ProjectMetadata) => void;
  onDelete: (project: ProjectMetadata) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onOpen, onDelete }) => {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Film className="w-16 h-16 text-gray-600" />
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button
            onClick={() => onOpen(project)}
            className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            title="Open in Editor"
          >
            <Play className="w-6 h-6 fill-current" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs font-mono text-white">
          {formatDuration(project.duration)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
          {project.name}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(project.recordedAt)}
          </div>
          <div>{formatFileSize(project.fileSize)}</div>
        </div>

        {project.settings && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-gray-700 rounded">
              {project.settings.resolution}
            </span>
            <span className="px-2 py-0.5 bg-gray-700 rounded">
              {project.settings.fps} FPS
            </span>
            {project.settings.webcamEnabled && (
              <span className="px-2 py-0.5 bg-gray-700 rounded">
                📹 Webcam
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
