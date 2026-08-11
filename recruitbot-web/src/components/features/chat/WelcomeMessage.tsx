import { Sparkles, Hash, Shuffle, Check } from 'lucide-react';
import BotBubble from './BotBubble';
import { useSearchStore } from '@/lib/stores/search.store';
import type { SearchMode } from '@/types/search.types';

export function WelcomeMessage() {
  const { searchType, setSearchType } = useSearchStore();

  const modes: { id: SearchMode; title: string; desc: string; icon: React.ComponentType<any>; color: string }[] = [
    {
      id: 'vector',
      title: 'Vector Search',
      desc: 'Finds semantically similar candidates — great for concepts like "machine learning engineer".',
      icon: Sparkles,
      color: 'bg-score-vector/10 text-score-vector border-score-vector/20',
    },
    {
      id: 'bm25',
      title: 'BM25 Keyword',
      desc: 'Matches exact keywords — best for specific skills like "Cypress" or "AWS Lambda".',
      icon: Hash,
      color: 'bg-score-bm25/10 text-score-bm25 border-score-bm25/20',
    },
    {
      id: 'hybrid',
      title: 'Hybrid',
      desc: 'Blends both — use the sliders to tune the balance for precision + recall.',
      icon: Shuffle,
      color: 'bg-score-hybrid/10 text-score-hybrid border-score-hybrid/20',
    },
  ];

  return (
    <BotBubble>
      <div className="flex flex-col gap-3">
        <p className="font-medium text-text-primary">
          👋 Welcome to <span className="text-primary font-semibold">RecruitBot</span>! I can help you find the best candidates from your resume database.
        </p>
        <p className="text-text-muted text-xs">Click a search mode to select your algorithm:</p>
        <div className="flex flex-col gap-2 mt-0.5">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = searchType === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSearchType(mode.id)}
                className={`flex items-start gap-2.5 p-2 rounded-lg text-left transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.06] border-primary/40 text-text-primary ring-1 ring-primary/20'
                    : 'bg-white/[0.02] border-white/[0.04] text-text-muted hover:bg-white/[0.04] hover:text-text-primary'
                }`}
              >
                <div className={`p-1.5 rounded-md mt-0.5 flex-shrink-0 border ${mode.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold ${isActive ? 'text-text-primary' : 'text-text-muted'}`}>
                      {mode.title}
                    </p>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">
                    {mode.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-text-muted border-t border-white/[0.05] pt-2 mt-0.5">
          Try a suggestion below, or type your own query to get started ↓
        </p>
      </div>
    </BotBubble>
  );
}

export default WelcomeMessage;

