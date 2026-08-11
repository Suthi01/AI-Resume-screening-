import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  query?: string;
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
      <div className="p-4 rounded-2xl bg-bg-card border border-white/[0.05]">
        <SearchX className="w-8 h-8 text-text-muted" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-text-primary">No candidates found</p>
        <p className="text-xs text-text-muted max-w-[220px] leading-relaxed">
          {query
            ? `No results matched "${query}". Try broadening your search or switching modes.`
            : 'Try a different search query or adjust the search mode.'}
        </p>
      </div>
    </div>
  );
}

export default EmptyState;
