import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserProject {
  id: string
  name: string
  domain: string
}

interface ProjectState {
  selectedProjectId: string | null
  selectedProject: UserProject | null
  setSelectedProject: (project: UserProject | null) => void
  clearProject: () => void
  projectsLoading: boolean
  setProjectsLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      selectedProject: null,
      setSelectedProject: (project) =>
        set({ selectedProjectId: project?.id ?? null, selectedProject: project }),
      clearProject: () => set({ selectedProjectId: null, selectedProject: null }),
      projectsLoading: true,
      setProjectsLoading: (loading) => set({ projectsLoading: loading }),
    }),
    {
      name: 'oms-project-store',
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
        selectedProject: state.selectedProject,
      }),
    }
  )
)


