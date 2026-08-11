import { motion } from 'framer-motion';
import { Mail, Phone, Briefcase } from 'lucide-react';
import type { SearchResult } from '@/types/search.types';
import type { SearchMode } from '@/types/search.types';
import { RankBadge } from './RankBadge';
import { ScorePill } from './ScorePill';
import { useCandidateModal } from '@/hooks/use-candidate-modal';

interface ResultCardProps {
  result: SearchResult;
  rank: number;
  searchMode: SearchMode;
  index: number;
}

/** Strip any HTML tags and truncate to maxLen characters */
function safeSnippet(raw: string, maxLen = 200): string {
  const stripped = raw.replace(/<[^>]*>/g, '').trim();
  return stripped.length > maxLen ? stripped.slice(0, maxLen) + '…' : stripped;
}

export function ResultCard({
  result,
  rank,
  searchMode,
  index,
}: ResultCardProps) {
  const { openCandidateModal } = useCandidateModal();
  const snippet = safeSnippet(result.content);

  const hasBothSources =
    result.sources &&
    result.sources.includes('bm25') &&
    result.sources.includes('vector');

  const tooltipText =
    result.bm25Score !== undefined && result.vectorScore !== undefined
      ? `BM25 Score: ${Math.round(result.bm25Score * 100)}% | Vector Score: ${Math.round(result.vectorScore * 100)}%`
      : 'Matched by both Keyword (BM25) and Semantic (Vector) search';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={() => openCandidateModal(result.candidateId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && openCandidateModal(result.candidateId)}
      aria-label={`View profile for ${result.name}`}
      className="bg-bg-surface border border-white/[0.06] rounded-xl p-3.5 flex flex-col gap-2.5
        cursor-pointer hover:border-primary/25 hover:bg-bg-surface/80
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50
        shadow-sm transition-colors duration-150"
    >
      {/* Top row: rank + name + match badge + score */}
      <div className="flex items-center gap-2 min-w-0">
        <RankBadge rank={rank} />
        <span className="flex-1 text-sm font-semibold text-text-primary truncate">
          {result.name}
        </span>
        {hasBothSources && (
          <span
            title={tooltipText}
            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] text-text-muted/90 border border-white/10 hover:border-white/20 transition-colors flex-shrink-0"
          >
            Matched: Keyword + Semantic
          </span>
        )}
        <ScorePill score={result.score} searchMode={searchMode} />
      </div>

      {/* Second row: metadata chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {result.experienceYears != null && (
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <Briefcase className="w-3 h-3" />
            {result.experienceYears} yr{result.experienceYears !== 1 ? 's' : ''}
          </span>
        )}
        {result.email && (
          <span className="flex items-center gap-1 text-[11px] text-text-muted truncate max-w-[180px]">
            <Mail className="w-3 h-3 flex-shrink-0" />
            {result.email}
          </span>
        )}
        {result.phoneNumber && (
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <Phone className="w-3 h-3 flex-shrink-0" />
            {result.phoneNumber}
          </span>
        )}
      </div>

      {/* Content snippet */}
      {snippet && (
        <p className="text-[11px] text-text-muted leading-relaxed line-clamp-3">
          {snippet}
        </p>
      )}
    </motion.div>
  );
}

export default ResultCard;
