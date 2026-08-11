import { createElement, useCallback } from 'react';
import toast from 'react-hot-toast';
import { rerankApi } from '@/lib/api/rerank.api';
import { useSearchStore } from '@/lib/stores/search.store';
import { useChatStore } from '@/lib/stores/chat.store';
import { ResultsList } from '@/components/features/results/ResultsList';
import type { SearchResult } from '@/types/search.types';

/**
 * Maps a canonical SearchResult → the { resumeId, snippet } shape the
 * backend rerankSchema expects.
 * Snippet is capped at 500 chars so the combined prompt stays within the
 * LLM's effective context window and ranks accurately.
 */
function toRerankCandidate(r: SearchResult) {
  const rawSnippet = r.content || r.name;
  return {
    resumeId: r.candidateId,   // our store uses candidateId; backend expects resumeId
    snippet: rawSnippet.slice(0, 500),
  };
}

/** Build a ResultsList React element */
function buildResultsElement(
  results: SearchResult[],
  query: string,
  searchType: string,
  isReranked: boolean
) {
  return createElement(ResultsList, {
    response: {
      query,
      searchType,
      topK: results.length,
      resultCount: results.length,
      duration: 0,
      results,
    },
    searchMode: searchType as 'vector' | 'bm25' | 'hybrid',
    isReranked,
  });
}

export function useRerank() {
  /**
   * Restores the original (pre-rerank) results and patches the bot message back
   * to the plain "Search Output" label. Called when the user toggles reranking off.
   */
  const restoreOriginalResults = useCallback(() => {
    const { originalResults, lastQuery, searchType, setResults } = useSearchStore.getState();
    if (!lastQuery || originalResults.length === 0) return;

    setResults(originalResults, lastQuery);
    useChatStore.getState().updateLastBotMessage(
      buildResultsElement(originalResults, lastQuery, searchType, false)
    );
  }, []);

  const rerankCurrentResults = useCallback(async () => {
    const store = useSearchStore.getState();
    const { results, lastQuery, searchType, setReranking, setResults, snapshotOriginalResults } = store;

    if (!lastQuery || results.length === 0 || store.isReranking) return;

    // Snapshot the current results as the pre-rerank baseline before mutating
    snapshotOriginalResults();

    // Build an O(1) lookup: resumeId → full SearchResult
    const byResumeId = new Map(results.map((r) => [r.candidateId, r]));

    const candidates = results.map(toRerankCandidate);

    setReranking(true);

    // First: label the current bot message as "Search Output" (pre-rerank)
    useChatStore.getState().updateLastBotMessage(
      buildResultsElement(results, lastQuery, searchType, false)
    );

    try {
      const response = await rerankApi.rerank({
        query: lastQuery,
        candidates,
        topK: results.length,
      });

      /**
       * Backend returns CandidateSnippet[] — each item has { resumeId, snippet }.
       * We use the returned ORDER (the LLM's ranking) but restore the full
       * SearchResult data from our local lookup so name/email/score etc. survive.
       */
      const reranked: SearchResult[] = [];
      for (const item of response.results) {
        const resumeId = item.resumeId;
        const original = byResumeId.get(resumeId);
        if (original) {
          reranked.push(original);
          byResumeId.delete(resumeId);
        }
      }

      // Append any candidates the LLM omitted (safety net)
      for (const remaining of byResumeId.values()) {
        reranked.push(remaining);
      }

      if (reranked.length === 0) {
        toast.error('Rerank returned no results — keeping original order.');
        // Restore search output label since rerank had no effect
        useChatStore.getState().updateLastBotMessage(
          buildResultsElement(results, lastQuery, searchType, false)
        );
        return;
      }

      // 1. Update store with reranked results
      setResults(reranked, lastQuery);

      // 2. Patch the bot message to show "Rerank Output"
      useChatStore.getState().updateLastBotMessage(
        buildResultsElement(reranked, lastQuery, searchType, true)
      );

    } catch (err) {
      console.error('[useRerank] Rerank failed:', err);
      toast.error('Rerank failed — showing original results.');
      // Restore search output label on error
      useChatStore.getState().updateLastBotMessage(
        buildResultsElement(results, lastQuery, searchType, false)
      );
    } finally {
      setReranking(false);
    }
  // All store values read via getState() at call time — no stale closures needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { rerankCurrentResults, restoreOriginalResults };
}
