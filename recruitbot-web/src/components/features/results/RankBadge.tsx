interface RankBadgeProps {
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  const isTop3 = rank <= 3;

  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
        isTop3
          ? 'text-white shadow-sm'
          : 'bg-bg-surface border border-white/[0.08] text-text-muted'
      }`}
      style={
        isTop3
          ? { background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' }
          : {}
      }
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </div>
  );
}

export default RankBadge;
