import { create } from 'zustand';
import { ingestionService } from '../services/ingestionService';

export type StepStatus = 'pending' | 'in-progress' | 'done' | 'failed';

export interface IngestionStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface IngestionState {
  uploadLoading: boolean;
  uploadProgress: number;
  ingestionSuccess: boolean;
  ingestionError: string | null;
  uploadedFile: File | null;
  steps: IngestionStep[];
  resultMetadata: any | null;
  
  setUploadedFile: (file: File | null) => void;
  uploadFile: (file: File) => Promise<any>;
  resetStore: () => void;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getInitialSteps = (): IngestionStep[] => [
  { id: 'upload', label: 'Resume Upload', status: 'pending' },
  { id: 'processing', label: 'PDF Processing', status: 'pending' },
  { id: 'parsing', label: 'Resume Parsing', status: 'pending' },
  { id: 'embedding', label: 'Embedding Generation', status: 'pending' },
  { id: 'ingestion', label: 'MongoDB Ingestion', status: 'pending' },
  { id: 'completed', label: 'Completed', status: 'pending' },
];

export const useIngestionStore = create<IngestionState>((set, get) => ({
  uploadLoading: false,
  uploadProgress: 0,
  ingestionSuccess: false,
  ingestionError: null,
  uploadedFile: null,
  steps: getInitialSteps(),
  resultMetadata: null,

  setUploadedFile: (file) => set({ uploadedFile: file }),

  uploadFile: async (file) => {
    set({
      uploadLoading: true,
      uploadProgress: 0,
      ingestionSuccess: false,
      ingestionError: null,
      uploadedFile: file,
      steps: [
        { id: 'upload', label: 'Resume Upload', status: 'in-progress' },
        { id: 'processing', label: 'PDF Processing', status: 'pending' },
        { id: 'parsing', label: 'Resume Parsing', status: 'pending' },
        { id: 'embedding', label: 'Embedding Generation', status: 'pending' },
        { id: 'ingestion', label: 'MongoDB Ingestion', status: 'pending' },
        { id: 'completed', label: 'Completed', status: 'pending' },
      ],
      resultMetadata: null,
    });

    let apiFinished = false;
    let apiFailed = false;
    let apiData: any = null;
    let apiError: any = null;

    // Start actual HTTP upload call in parallel
    const apiPromise = ingestionService.injectResume(file, (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        set({ uploadProgress: percentCompleted });
        
        if (percentCompleted >= 100) {
          set((state) => ({
            steps: state.steps.map(s => s.id === 'upload' ? { ...s, status: 'done' as const } : s)
          }));
        }
      }
    });

    apiPromise
      .then((data) => {
        apiData = data;
        apiFinished = true;
      })
      .catch((err) => {
        apiError = err;
        apiFailed = true;
      });

    try {
      // 1. Wait for physical file upload to complete (reaches 100% progress)
      while (get().uploadProgress < 100 && !apiFailed) {
        await sleep(50);
      }

      // Mark upload step as done
      set((state) => ({
        steps: state.steps.map(s => s.id === 'upload' ? { ...s, status: 'done' as const } : s)
      }));

      // 2. Run simulated stepper steps linked to API state checks
      const remainingSteps = [
        { id: 'processing', duration: 700 },
        { id: 'parsing', duration: 700 },
        { id: 'embedding', duration: 900 },
        { id: 'ingestion', duration: 500 }
      ];

      for (const step of remainingSteps) {
        if (apiFailed) break;

        // Set current active step to in-progress
        set((state) => ({
          steps: state.steps.map(s => s.id === step.id ? { ...s, status: 'in-progress' as const } : s)
        }));

        await sleep(step.duration);

        if (apiFailed) break;

        // Set current active step to done
        set((state) => ({
          steps: state.steps.map(s => s.id === step.id ? { ...s, status: 'done' as const } : s)
        }));
      }

      // 3. Wait for the API to fully complete if it is still running (e.g. slow embeddings / DB write)
      while (!apiFinished && !apiFailed) {
        await sleep(50);
      }

      if (apiFailed) {
        throw apiError;
      }

      // 4. Mark Completed step as done
      set((state) => ({
        steps: state.steps.map(s => s.id === 'completed' ? { ...s, status: 'done' as const } : s),
        uploadLoading: false,
        ingestionSuccess: true,
        resultMetadata: apiData,
      }));

      return apiData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Ingestion failed';
      
      // Update step array: find the first active/pending step, mark it and all subsequent steps as failed
      set((state) => {
        const updatedSteps = state.steps.map(s => {
          if (s.status === 'in-progress' || s.status === 'pending') {
            return { ...s, status: 'failed' as const };
          }
          return s;
        });

        return {
          steps: updatedSteps,
          uploadLoading: false,
          ingestionError: errorMessage,
          ingestionSuccess: false,
        };
      });

      throw err;
    }
  },

  resetStore: () => set({
    uploadLoading: false,
    uploadProgress: 0,
    ingestionSuccess: false,
    ingestionError: null,
    uploadedFile: null,
    steps: getInitialSteps(),
    resultMetadata: null,
  }),
}));
