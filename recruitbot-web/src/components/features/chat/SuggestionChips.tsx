import { motion } from 'framer-motion';

interface SuggestionChipsProps {
  onSubmit: (query: string) => void;
}

const CHIPS = [
  { label: '🔍 Selenium QA 3 yrs',   query: 'Selenium automation engineer 3 years' },
  { label: '🐍 Python ML dev',        query: 'Python developer with machine learning' },
  { label: '☁️ Java AWS backend',    query: 'Java backend developer AWS cloud' },
  { label: '⚡ Lead QA Cypress',      query: 'Lead QA engineer with Cypress and CI/CD' },
];

export function SuggestionChips({ onSubmit }: SuggestionChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="flex flex-wrap gap-2 px-4 pb-2"
      aria-label="Suggested searches"
    >
      {CHIPS.map(({ label, query }) => (
        <button
          key={query}
          onClick={() => onSubmit(query)}
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-bg-card border border-white/[0.07]
            text-text-muted hover:text-text-primary hover:bg-primary/10 hover:border-primary/25
            transition-all duration-150 active:scale-95"
        >
          {label}
        </button>
      ))}
    </motion.div>
  );
}

export default SuggestionChips;
