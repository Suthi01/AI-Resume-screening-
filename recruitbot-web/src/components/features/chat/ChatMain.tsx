// src/components/features/chat/ChatMain.tsx
import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatTopbar from '@/components/features/chat/ChatTopbar';
import ChatMessages from '@/components/features/chat/ChatMessages';
import WelcomeMessage from '@/components/features/chat/WelcomeMessage';
import SuggestionChips from '@/components/features/chat/SuggestionChips';
import ChatInputBar from '@/components/features/chat/ChatInputBar';
import { useChatStore } from '@/lib/stores/chat.store';
import { useSearch } from '@/hooks/use-search';
import { useSearchStore } from '@/lib/stores/search.store';

export function ChatMain() {
  const { messages } = useChatStore();
  const { submitQuery } = useSearch();
  const isEmpty = messages.length === 0;

  const { searchType, bm25Weight, vectorWeight } = useSearchStore();
  const prevSearchTypeRef = useRef(searchType);
  const submitQueryRef = useRef(submitQuery);
  submitQueryRef.current = submitQuery;

  // Effect 1: Re-search when the user switches search mode.
  // Deps: [searchType] only — messages.length/lastQuery are read via getState()
  // so they never cause this effect to re-fire after a search completes.
  useEffect(() => {
    const { lastQuery } = useSearchStore.getState();
    const msgCount = useChatStore.getState().messages.length;

    if (!lastQuery || msgCount === 0) {
      prevSearchTypeRef.current = searchType;
      return;
    }

    if (searchType !== prevSearchTypeRef.current) {
      prevSearchTypeRef.current = searchType;
      submitQueryRef.current(lastQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType]);

  // Effect 2: Re-search (debounced) when Hybrid weights change.
  // Deps: [bm25Weight, vectorWeight] only — searchType/lastQuery read via getState().
  useEffect(() => {
    const { searchType: currentType, lastQuery } = useSearchStore.getState();
    const msgCount = useChatStore.getState().messages.length;

    // Only react if we're already in hybrid mode with an active query
    if (currentType !== 'hybrid' || !lastQuery || msgCount === 0) return;

    const handler = setTimeout(() => {
      submitQueryRef.current(useSearchStore.getState().lastQuery);
    }, 400);

    return () => clearTimeout(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bm25Weight, vectorWeight]);

  return (
    <main className="flex-1 flex flex-col bg-bg-base min-w-0 h-full overflow-hidden">
      {/* Topbar */}
      <ChatTopbar />

      {/* Messages area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Welcome message always at top */}
          <div className="px-4 pt-5">
            <WelcomeMessage />
          </div>
          {/* Thread */}
          <ChatMessages />
        </div>
        {/* Suggestion chips – only when thread empty */}
        <AnimatePresence>{isEmpty && <SuggestionChips onSubmit={submitQuery} />}</AnimatePresence>
      </div>

      {/* Input bar */}
      <ChatInputBar onSubmit={submitQuery} />
    </main>
  );
}

export default ChatMain;
