import type { SearchResponse } from '@/types/search.types';
import type { SearchMode } from '@/types/search.types';
import { ResultSummary } from './ResultSummary';
import { ResultCard } from './ResultCard';
import { EmptyState } from '@/components/common/EmptyState';

interface ResultsListProps {
  response: SearchResponse;
  searchMode: SearchMode;
  isReranked?: boolean;
}

export function ResultsList({ response, searchMode, isReranked = false }: ResultsListProps) {
  const { results, duration, query, resultCount } = response;

  return (
    <div className="flex flex-col gap-3 w-full">
      <ResultSummary
        count={resultCount}
        searchMode={searchMode}
        duration={duration}
        query={query}
        isReranked={isReranked}
      />

      {results.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((result, i) => (
            <ResultCard
              key={result.candidateId}
              result={result}
              rank={i + 1}
              searchMode={searchMode}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ResultsList;
