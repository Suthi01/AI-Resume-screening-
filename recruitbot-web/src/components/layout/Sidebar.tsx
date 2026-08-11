import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { X, PanelLeftClose } from 'lucide-react';
import { useSearchStore } from '@/lib/stores/search.store';
import { useUiStore } from '@/lib/stores/ui.store';
import BrandAvatar from '@/components/common/BrandAvatar';
import SearchModeNav from '@/components/features/sidebar/SearchModeNav';
import HybridWeightPanel from '@/components/features/sidebar/HybridWeightPanel';
import RerankToggle from '@/components/features/sidebar/RerankToggle';
import ResultsLimitSelect from '@/components/features/sidebar/ResultsLimitSelect';
import ClearChatButton from '@/components/features/sidebar/ClearChatButton';
import ResumeUploadButton from '@/components/features/sidebar/ResumeUploadButton';

export function Sidebar() {
  const { searchType, setSearchType } = useSearchStore();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();

  // Auto-open sidebar when hybrid is selected so weight sliders are visible
  useEffect(() => {
    if (searchType === 'hybrid' && !isSidebarOpen) {
      setSidebarOpen(true);
    }
  }, [searchType, isSidebarOpen, setSidebarOpen]);

  const sidebarContent = (
    <div className="w-[280px] sm:w-[260px] shrink-0 bg-bg-surface border-r border-border flex flex-col p-4 sm:p-5 gap-4 overflow-y-auto h-full select-none shadow-2xl md:shadow-none">
      {/* Brand Header with Close Toggle */}
      <div className="flex items-center justify-between w-full">
        <BrandAvatar />
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors"
          title="Close sidebar"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="w-4 h-4 hidden sm:block" />
          <X className="w-4 h-4 sm:hidden" />
        </button>
      </div>

      {/* Search Mode Label */}
      <div className="flex flex-col gap-0.5 mt-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Search Algorithm
        </span>
        <span className="text-[10px] text-text-muted/70">
          Select how candidate matches are ranked
        </span>
      </div>

      {/* Navigation Controls */}
      <SearchModeNav activeMode={searchType} onChange={setSearchType} />

      {/* Weight Controls — key is required for AnimatePresence enter/exit to work */}
      <AnimatePresence initial={false}>
        {searchType === 'hybrid' && <HybridWeightPanel key="hybrid-panel" />}
      </AnimatePresence>

      {/* AI Rerank toggle */}
      <RerankToggle />

      {/* Results Limit Label (Pushed to bottom) */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mt-auto pt-2">
        Settings
      </span>

      {/* Limit Selector */}
      <ResultsLimitSelect />

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <ResumeUploadButton />
        <ClearChatButton />
      </div>

      {/* Footer Text */}
      <footer className="text-[10px] text-text-muted font-medium pt-1 text-center border-t border-white/[0.03]">
        RecruitBot v2.0
      </footer>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer (fixed) & Desktop Collapsible Sidebar (relative) */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0, width: 0 }}
            animate={{ x: 0, opacity: 1, width: 'auto' }}
            exit={{ x: -280, opacity: 0, width: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed md:relative inset-y-0 left-0 z-40 h-full flex shrink-0"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;

