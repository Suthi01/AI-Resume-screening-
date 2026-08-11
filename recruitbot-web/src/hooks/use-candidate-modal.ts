import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { candidateApi } from '@/lib/api/candidate.api';
import { useUiStore } from '@/lib/stores/ui.store';

export function useCandidateModal() {
  const {
    isCandidateModalOpen,
    openCandidate,
    closeCandidate,
    candidate,
    loading,
    setCandidate,
    setLoading,
  } = useUiStore();

  const openCandidateModal = useCallback(async (id: string) => {
    openCandidate(id);
    setCandidate(null);
    setLoading(true);
    try {
      const data = await candidateApi.getById(id);
      setCandidate(data);
    } catch {
      toast.error('Failed to load candidate profile.');
      closeCandidate();
    } finally {
      setLoading(false);
    }
  }, [openCandidate, closeCandidate, setCandidate, setLoading]);

  const closeModal = useCallback(() => {
    closeCandidate();
    setCandidate(null);
  }, [closeCandidate, setCandidate]);

  return {
    isOpen: isCandidateModalOpen,
    candidate,
    loading,
    openCandidateModal,
    closeModal,
  };
}
