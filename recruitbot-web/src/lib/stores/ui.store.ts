import { create } from 'zustand';
import type { CandidateProfile } from '@/types/candidate.types';

interface UiState {
  selectedCandidateId: string | null;
  isCandidateModalOpen: boolean;
  isSidebarOpen: boolean;
  candidate: CandidateProfile | null;
  loading: boolean;
  setSelectedCandidateId: (id: string | null) => void;
  setCandidateModalOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  /** Convenience: open the candidate modal for a given ID */
  openCandidate: (id: string) => void;
  closeCandidate: () => void;
  setCandidate: (candidate: CandidateProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedCandidateId: null,
  isCandidateModalOpen: false,
  isSidebarOpen: true,
  candidate: null,
  loading: false,
  setSelectedCandidateId: (id) => set({ selectedCandidateId: id }),
  setCandidateModalOpen: (open) => set({ isCandidateModalOpen: open }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openCandidate: (id) => set({ selectedCandidateId: id, isCandidateModalOpen: true }),
  closeCandidate: () => set({ selectedCandidateId: null, isCandidateModalOpen: false }),
  setCandidate: (candidate) => set({ candidate }),
  setLoading: (loading) => set({ loading }),
}));
