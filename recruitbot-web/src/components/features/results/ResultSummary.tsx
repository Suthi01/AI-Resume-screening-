import { Sparkles } from 'lucide-react';
import type { SearchMode } from '@/types/search.types';

interface ResultSummaryProps {
  count: number;
  searchMode: SearchMode;
  duration: number;
  query: string;
  isReranked?: boolean;
}

const MODE_LABEL: Record<SearchMode, { label: string; className: string }> = {
  vector: { label: 'Vector',  className: 'bg-score-vector/10 text-score-vector border-score-vector/20' },
  bm25:   { label: 'BM25',    className: 'bg-score-bm25/10 text-score-bm25 border-score-bm25/20' },
  hybrid: { label: 'Hybrid',  className: 'bg-score-hybrid/10 text-score-hybrid border-score-hybrid/20' },
};

export function ResultSummary({ count, searchMode, duration, query, isReranked }: ResultSummaryProps) {
  const { label, className } = MODE_LABEL[searchMode];

  return (
    <div className="flex flex-col gap-2 pb-3 border-b border-white/[0.06]">
      {/* Stage label */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted/60">
          {isReranked ? 'Rerank Output' : 'Search Output'}
        </span>
        {isReranked && (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
            <Sparkles className="w-2.5 h-2.5" />
            AI Reranked
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-text-primary">
          Found{' '}
          <span className="text-primary font-bold">{count}</span>{' '}
          {count === 1 ? 'candidate' : 'candidates'}
        </span>
        <span className="text-text-muted text-xs">·</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${className}`}>
          {label}
        </span>
        {!isReranked && (
          <>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-[11px] text-text-muted">{duration} ms</span>
          </>
        )}
        {query && (
          <>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-[11px] text-text-muted italic truncate max-w-[180px]">
              "{query}"
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default ResultSummary;
