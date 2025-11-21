import React, { useEffect, useState } from 'react';
import { Plus, Search, Film, Folder } from 'lucide-react';
import { useProjectLibraryStore } from '../../store/useProjectLibraryStore';
import { ProjectCard } from './ProjectCard';

interface ProjectLibraryProps {
  onNewRecording: () => void;
  onOpenProject: (projectPath: string) => void;
}

export const ProjectLibrary: React.FC<ProjectLibraryProps> = ({
  onNewRecording,
  onOpenProject,
}) => {
  const { projects, loading, searchQuery, setProjects, setLoading, setSearchQuery, removeProject } = useProjectLibraryStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!window.electronAPI?.listProjects) {
          setError('Project management not available');
          return;
        }

        const projectList = await window.electronAPI.listProjects();
        setProjects(projectList);
      } catch (err: unknown) {
        console.error('Failed to load projects:', err);
        const message = err instanceof Error ? err.message : 'Failed to load projects';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [setLoading, setError, setProjects]);

  const handleDeleteProject = async (project: { name: string; path: string }) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await window.electronAPI.deleteProject(project.path);
      removeProject(project.path);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to delete project: ${message}`);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Folder className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
                <p className="text-gray-400 text-base mt-1">
                  {projects.length} recording{projects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={onNewRecording}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-2xl font-bold text-base transition-all shadow-xl shadow-red-600/20"
            >
              <Plus className="w-5 h-5" />
              New Recording
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl pl-12 pr-4 py-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-4 rounded-2xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400">Loading projects...</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-6 p-6 bg-gray-800/30 rounded-3xl border border-gray-700/30">
                <Film className="w-16 h-16 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-300 mb-2">No recordings yet</h2>
              <p className="text-gray-500 mb-8 text-center max-w-md">
                Create your first recording to get started
              </p>
              <button
                onClick={onNewRecording}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-semibold text-base transition-all"
              >
                <Plus className="w-5 h-5" />
                New Recording
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.path}
                  project={project}
                  onOpen={(p) => onOpenProject(p.path)}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
