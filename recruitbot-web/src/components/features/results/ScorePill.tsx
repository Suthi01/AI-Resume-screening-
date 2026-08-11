import type { SearchMode } from '@/types/search.types';

interface ScorePillProps {
  score: number;
  searchMode: SearchMode;
}

const MODE_STYLE: Record<SearchMode, { label: string; className: string }> = {
  vector: {
    label: 'Similarity',
    className: 'bg-score-vector/10 text-score-vector border-score-vector/20',
  },
  bm25: {
    label: 'BM25 Score',
    className: 'bg-score-bm25/10 text-score-bm25 border-score-bm25/20',
  },
  hybrid: {
    label: 'Hybrid',
    className: 'bg-score-hybrid/10 text-score-hybrid border-score-hybrid/20',
  },
};

export function ScorePill({ score, searchMode }: ScorePillProps) {
  const { label, className } = MODE_STYLE[searchMode];
  const displayScore =
    score <= 1 ? (score * 100).toFixed(1) + '%' : score.toFixed(3);

  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${className}`}
      aria-label={`${label}: ${displayScore}`}
    >
      {displayScore} {label}
    </span>
  );
}

export default ScorePill;
