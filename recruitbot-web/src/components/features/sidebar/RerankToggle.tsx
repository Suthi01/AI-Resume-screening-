import { Loader2, Sparkles } from 'lucide-react';
import { useSearchStore } from '@/lib/stores/search.store';
import { useRerank } from '@/hooks/use-rerank';

export function RerankToggle() {
  const { rerankEnabled, isReranking, setRerankEnabled, results } = useSearchStore();
  const { rerankCurrentResults, restoreOriginalResults } = useRerank();

  const handleToggle = (checked: boolean) => {
    setRerankEnabled(checked);
    if (checked && results.length > 0) {
      // Enabling: rerank immediately if there are existing results
      rerankCurrentResults();
    } else if (!checked && results.length > 0) {
      // Disabling: restore the pre-rerank original results immediately
      restoreOriginalResults();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full border-t border-white/[0.05] pt-4">
      {/* Section label */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Result Ranking
        </span>
      </div>

      {/* Toggle row */}
      <div className="flex items-start justify-between gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-text-primary">AI Rerank</span>
            {isReranking && (
              <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-text-muted/80 leading-relaxed">
            {isReranking
              ? 'Reordering with AI…'
              : 'Reorders results using deeper relevance scoring'}
          </p>
        </div>

        {/* Custom toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={rerankEnabled}
          aria-label="Toggle AI Rerank"
          onClick={() => handleToggle(!rerankEnabled)}
          disabled={isReranking}
          className={`relative flex-shrink-0 w-9 h-5 rounded-full border transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${rerankEnabled
              ? 'bg-primary border-primary/60'
              : 'bg-white/[0.06] border-white/[0.1]'
            }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${rerankEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
          />
        </button>
      </div>
    </div>
  );
}

export default RerankToggle;
