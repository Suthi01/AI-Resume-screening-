import { create } from 'zustand';
import type { SearchMode, SearchResult } from '@/types/search.types';

interface SearchState {
  // ── Search ──────────────────────────────────────────────────────
  searchType: SearchMode;
  bm25Weight: number;
  vectorWeight: number;
  topK: number;
  results: SearchResult[];
  /** Pre-rerank snapshot — restored when reranking is toggled off */
  originalResults: SearchResult[];
  isSearching: boolean;
  lastQuery: string;
  setSearchType: (mode: SearchMode) => void;
  setWeights: (bm25: number, vector: number) => void;
  setTopK: (k: number) => void;
  setResults: (results: SearchResult[], query: string) => void;
  /** Saves the current results as the pre-rerank baseline */
  snapshotOriginalResults: () => void;
  setSearching: (v: boolean) => void;

  // ── Rerank ──────────────────────────────────────────────────────
  rerankEnabled: boolean;
  isReranking: boolean;
  setRerankEnabled: (v: boolean) => void;
  setReranking: (v: boolean) => void;

  // ── Summary ─────────────────────────────────────────────────────
  summary: string | null;
  summaryKeyPoints: string[] | null;
  isSummarizing: boolean;
  summaryError: string | null;
  setSummary: (summary: string | null, keyPoints?: string[] | null) => void;
  setSummarizing: (v: boolean) => void;
  setSummaryError: (err: string | null) => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  // ── Search defaults ─────────────────────────────────────────────
  searchType: 'vector',
  bm25Weight: 50,
  vectorWeight: 50,
  topK: 5,
  results: [],
  originalResults: [],
  isSearching: false,
  lastQuery: '',
  setSearchType: (mode) => set({ searchType: mode }),
  setWeights: (bm25, vector) => set({ bm25Weight: bm25, vectorWeight: vector }),
  setTopK: (k) => set({ topK: k }),
  setResults: (results, query) => set({ results, lastQuery: query }),
  snapshotOriginalResults: () => set({ originalResults: [...get().results] }),
  setSearching: (v) => set({ isSearching: v }),

  // ── Rerank defaults ─────────────────────────────────────────────
  rerankEnabled: false,
  isReranking: false,
  setRerankEnabled: (v) => set({ rerankEnabled: v }),
  setReranking: (v) => set({ isReranking: v }),

  // ── Summary defaults ────────────────────────────────────────────
  summary: null,
  summaryKeyPoints: null,
  isSummarizing: false,
  summaryError: null,
  setSummary: (summary, keyPoints = null) => set({ summary, summaryKeyPoints: keyPoints }),
  setSummarizing: (v) => set({ isSummarizing: v }),
  setSummaryError: (err) => set({ summaryError: err }),
}));

