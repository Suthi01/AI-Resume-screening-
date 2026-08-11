import { createElement, useCallback } from 'react';
import { searchApi } from '@/lib/api/search.api';
import type { BackendSearchResult, BackendSearchResponse } from '@/lib/api/search.api';
import { useChatStore } from '@/lib/stores/chat.store';
import { useSearchStore } from '@/lib/stores/search.store';
import { ResultsList } from '@/components/features/results/ResultsList';
import type { SearchResponse, SearchResult } from '@/types/search.types';
import type { SearchMode } from '@/types/search.types';
import { useRerank } from '@/hooks/use-rerank';

/** Normalise a raw backend result into the canonical SearchResult shape */
function normaliseResult(raw: BackendSearchResult, searchMode: SearchMode): SearchResult {
  const expYears = raw.experienceYears ?? raw.totalExperience ?? raw.relevantExperience;

  return {
    candidateId: raw.candidateId ?? raw.resumeId ?? raw.id ?? '',
    name: raw.name ?? 'Unknown Candidate',
    email: raw.email,
    phoneNumber: raw.phoneNumber,
    score:
      raw.score ??
      raw.finalScore ??
      (searchMode === 'vector' ? (raw.vectorScore ?? 0) : (raw.bm25Score ?? 0)),
    bm25Score: raw.bm25Score,
    vectorScore: raw.vectorScore,
    sources: raw.sources ?? [searchMode],
    experienceYears: expYears != null ? Math.round(expYears) : undefined,
    content: raw.content ?? raw.snippet ?? '',
  };
}

/** Normalise a raw backend response into the canonical SearchResponse shape */
function normaliseResponse(
  raw: BackendSearchResponse,
  searchMode: SearchMode,
  query: string
): SearchResponse {
  const rawResults = raw.results ?? raw.candidates ?? [];
  const results = rawResults.map((r) => normaliseResult(r, searchMode));
  return {
    query: raw.query ?? query,
    searchType: raw.searchType ?? searchMode,
    topK: raw.topK ?? results.length,
    resultCount: raw.resultCount ?? raw.total ?? results.length,
    duration: raw.duration ?? raw.durationMs ?? 0,
    results,
    metadata: raw.metadata,
  };
}

export function useSearch() {
  const { isSearching, setSearching } = useSearchStore();
  const { rerankCurrentResults } = useRerank();

  // Read ALL volatile values from getState() at call time so this callback
  // never needs to be recreated on render — giving it a permanently stable reference.
  const submitQuery = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q || useSearchStore.getState().isSearching) return;

    const { searchType, topK, bm25Weight, vectorWeight, rerankEnabled } = useSearchStore.getState();
    const { addUserMessage: addUser, addBotMessage: addBot } = useChatStore.getState();

    addUser(q);
    setSearching(true);
    useSearchStore.getState().setResults([], q);

    try {
      const raw = await searchApi.search(searchType, {
        query: q,
        topK,
        ...(searchType === 'hybrid' ? { bm25Weight, vectorWeight } : {}),
      });
      const response = normaliseResponse(raw, searchType, q);

      // Client-side defensive deduplication by candidateId
      const seenIds = new Set<string>();
      const dedupedResults: SearchResult[] = [];
      let removedCount = 0;

      for (const result of response.results) {
        if (!seenIds.has(result.candidateId)) {
          seenIds.add(result.candidateId);
          dedupedResults.push(result);
        } else {
          removedCount++;
        }
      }

      if (removedCount > 0) {
        console.warn(`[useSearch] Client-side dedup removed ${removedCount} duplicate candidate(s).`);
      }

      response.results = dedupedResults;
      response.resultCount = dedupedResults.length;

      // Store results in the search store first (needed by rerankCurrentResults)
      useSearchStore.getState().setResults(response.results, q);

      const content = createElement(ResultsList, {
        response,
        searchMode: searchType,
      });

      addBot(content);

      // Auto-rerank if enabled
      if (rerankEnabled && response.results.length > 0) {
        // Small yield so the bot message is committed to the store before we patch it
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        await rerankCurrentResults();
      }
    } catch {
      addBot(
        createElement(
          'p',
          { className: 'text-red-400 text-sm' },
          '⚠️ Search failed. Please check the backend connection and try again.'
        )
      );
    } finally {
      setSearching(false);
    }
  // rerankCurrentResults is stable (useCallback with [] deps); isSearching/setSearching are stable refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rerankCurrentResults]);

  return { submitQuery, isSearching };
}
