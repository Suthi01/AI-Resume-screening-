import { motion } from 'framer-motion';
import { useHybridWeights } from '@/hooks/use-hybrid-weights';

export function HybridWeightPanel() {
  const {
    bm25Weight,
    vectorWeight,
    handleBm25Change,
    handleVectorChange,
    applyPreset,
  } = useHybridWeights();

  return (
    <motion.div
      key="hybrid-weight-panel"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="w-full flex flex-col gap-5 border-t border-white/[0.08] pt-4"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Search Weights
        </span>
        <p className="text-[10px] text-text-muted/70 leading-relaxed">
          Drag sliders to tune keyword vs semantic balance.
        </p>
      </div>

      {/* BM25 Slider */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-text-primary flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-score-bm25" />
            Keyword (BM25)
          </span>
          <span className="text-score-bm25 font-bold tabular-nums">{bm25Weight}%</span>
        </div>
        {/* Custom native range — always visible, reliable */}
        <div className="relative w-full h-5 flex items-center">
          <div className="absolute inset-x-0 h-[4px] rounded-full bg-white/10" />
          <div
            className="absolute left-0 h-[4px] rounded-full bg-score-bm25 transition-all duration-75"
            style={{ width: `${bm25Weight}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={bm25Weight}
            onChange={(e) => handleBm25Change(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing z-10"
            aria-label="BM25 keyword weight"
          />
          {/* Thumb */}
          <div
            className="absolute w-4 h-4 rounded-full bg-white border-2 border-score-bm25 shadow-lg pointer-events-none transition-all duration-75"
            style={{ left: `calc(${bm25Weight}% - 8px)` }}
          />
        </div>
      </div>

      {/* Vector Slider */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-text-primary flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-score-vector" />
            Vector (Semantic)
          </span>
          <span className="text-score-vector font-bold tabular-nums">{vectorWeight}%</span>
        </div>
        <div className="relative w-full h-5 flex items-center">
          <div className="absolute inset-x-0 h-[4px] rounded-full bg-white/10" />
          <div
            className="absolute left-0 h-[4px] rounded-full bg-score-vector transition-all duration-75"
            style={{ width: `${vectorWeight}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={vectorWeight}
            onChange={(e) => handleVectorChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing z-10"
            aria-label="Vector semantic weight"
          />
          {/* Thumb */}
          <div
            className="absolute w-4 h-4 rounded-full bg-white border-2 border-score-vector shadow-lg pointer-events-none transition-all duration-75"
            style={{ left: `calc(${vectorWeight}% - 8px)` }}
          />
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex items-center gap-1.5 w-full">
        {([
          [50, 50, '50 / 50'],
          [70, 30, '70 / 30'],
          [30, 70, '30 / 70'],
        ] as [number, number, string][]).map(([b, v, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => applyPreset(b, v)}
            className={`flex-1 text-[10px] py-1.5 px-2 rounded-md font-semibold border text-center transition-all ${
              bm25Weight === b && vectorWeight === v
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-white/[0.02] border-white/[0.06] text-text-muted hover:bg-white/[0.05] hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default HybridWeightPanel;
