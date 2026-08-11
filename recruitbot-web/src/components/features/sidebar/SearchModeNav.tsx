import { Sparkles, Hash, Shuffle, Check } from 'lucide-react';
import type { SearchMode } from '@/types/search.types';

interface SearchModeNavProps {
  activeMode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

export function SearchModeNav({ activeMode, onChange }: SearchModeNavProps) {
  const modes: { id: SearchMode; name: string; desc: string; icon: React.ComponentType<any>; color: string }[] = [
    {
      id: 'vector',
      name: 'Vector Search',
      desc: 'Semantic similarity using embedding vectors.',
      icon: Sparkles,
      color: 'text-score-vector bg-score-vector/10 border-score-vector/20',
    },
    {
      id: 'bm25',
      name: 'BM25 Keyword',
      desc: 'Exact matches based on term frequency.',
      icon: Hash,
      color: 'text-score-bm25 bg-score-bm25/10 border-score-bm25/20',
    },
    {
      id: 'hybrid',
      name: 'Hybrid',
      desc: 'Combines vector and keyword ranks.',
      icon: Shuffle,
      color: 'text-score-hybrid bg-score-hybrid/10 border-score-hybrid/20',
    },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-start gap-3 relative group focus:outline-none cursor-pointer ${
              isActive
                ? 'bg-white/[0.06] border-primary/40 shadow-sm text-text-primary ring-1 ring-primary/30'
                : 'bg-bg-card/40 border-white/[0.04] text-text-muted hover:bg-white/[0.04] hover:border-white/[0.08] hover:text-text-primary'
            }`}
          >
            <div
              className={`p-2 rounded-lg transition-colors border ${
                isActive ? mode.color : 'bg-white/[0.03] border-white/[0.04] text-text-muted group-hover:bg-white/[0.06]'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex flex-col min-w-0 pr-5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold tracking-tight text-text-primary">
                  {mode.name}
                </span>
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                {mode.desc}
              </span>
            </div>

            {isActive && (
              <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SearchModeNav;

