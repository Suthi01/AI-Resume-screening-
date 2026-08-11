import { useRef, useState, useEffect } from 'react';
import { PanelLeft, Sparkles, Hash, Shuffle, ChevronDown, Check } from 'lucide-react';
import { useSearchStore } from '@/lib/stores/search.store';
import { useUiStore } from '@/lib/stores/ui.store';
import type { SearchMode } from '@/types/search.types';

const MODE_META: Record<
  SearchMode,
  { label: string; sublabel: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  vector: {
    label: 'Vector Search',
    sublabel: 'Semantic similarity',
    badgeClass: 'bg-score-vector/15 text-score-vector border-score-vector/25 hover:bg-score-vector/25',
    icon: Sparkles,
  },
  bm25: {
    label: 'BM25 Keyword',
    sublabel: 'Term frequency ranking',
    badgeClass: 'bg-score-bm25/15 text-score-bm25 border-score-bm25/25 hover:bg-score-bm25/25',
    icon: Hash,
  },
  hybrid: {
    label: 'Hybrid Search',
    sublabel: 'Semantic + keyword blend',
    badgeClass: 'bg-score-hybrid/15 text-score-hybrid border-score-hybrid/25 hover:bg-score-hybrid/25',
    icon: Shuffle,
  },
};

const MODES: SearchMode[] = ['vector', 'bm25', 'hybrid'];

export function ChatTopbar() {
  const { searchType, setSearchType } = useSearchStore();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();
  const meta = MODE_META[searchType];
  const CurrentIcon = meta.icon;

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (mode: SearchMode) => {
    setSearchType(mode);
    setOpen(false);
  };

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-5 border-b border-white/[0.07] bg-bg-base/90 backdrop-blur-md z-10 select-none">
      {/* Left — Toggle button + mini avatar + name */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors flex items-center justify-center focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <PanelLeft className={`w-5 h-5 transition-colors duration-200 ${isSidebarOpen ? 'text-primary' : ''}`} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[11px] font-bold text-white shadow-md flex-shrink-0">
            RB
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary leading-tight">RecruitBot</span>
            <span className="text-[11px] text-text-muted leading-tight hidden sm:inline-block">
              {meta.label} · {meta.sublabel}
            </span>
          </div>
        </div>
      </div>

      {/* Right — Custom mode selector dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title="Click to switch search mode"
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1.5 focus:outline-none cursor-pointer ${meta.badgeClass}`}
        >
          <CurrentIcon className="w-3.5 h-3.5" />
          <span>{meta.label}</span>
          <ChevronDown className={`w-3 h-3 opacity-60 ml-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/[0.1] bg-bg-surface shadow-2xl z-50 overflow-hidden py-1">
            {MODES.map((mode) => {
              const m = MODE_META[mode];
              const Icon = m.icon;
              const isActive = searchType === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSelect(mode)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-muted hover:bg-white/[0.05] hover:text-text-primary'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${
                    mode === 'vector' ? 'text-score-vector' :
                    mode === 'bm25'   ? 'text-score-bm25'   : 'text-score-hybrid'
                  }`} />
                  <span className="flex-1 text-left">{m.label}</span>
                  {isActive && <Check className="w-3 h-3 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

export default ChatTopbar;
