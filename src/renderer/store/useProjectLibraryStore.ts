import { create } from 'zustand';

export interface ProjectMetadata {
  path: string;
  name: string;
  duration: number;
  recordedAt: string;
  fileSize: number;
  thumbnail?: string;
  settings?: {
    resolution: string;
    fps: number;
    webcamEnabled: boolean;
  };
}

interface ProjectLibraryState {
  projects: ProjectMetadata[];
  loading: boolean;
  selectedProject: ProjectMetadata | null;
  searchQuery: string;

  // Actions
  setProjects: (projects: ProjectMetadata[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedProject: (project: ProjectMetadata | null) => void;
  setSearchQuery: (query: string) => void;
  removeProject: (path: string) => void;
  addProject: (project: ProjectMetadata) => void;
}

export const useProjectLibraryStore = create<ProjectLibraryState>((set) => ({
  projects: [],
  loading: false,
  selectedProject: null,
  searchQuery: '',

  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ loading }),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  removeProject: (path) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.path !== path),
    })),
  
  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),
}));
