import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/lib/stores/chat.store';
import { useSearchStore } from '@/lib/stores/search.store';
import UserBubble from './UserBubble';
import BotBubble from './BotBubble';
import LoadingDots from '@/components/common/LoadingDots';

export function ChatMessages() {
  const { messages } = useChatStore();
  const { isSearching } = useSearchStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change or searching toggles
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSearching]);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 scroll-smooth"
      aria-live="polite"
      aria-label="Conversation thread"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) =>
          msg.type === 'user' ? (
            <UserBubble key={msg.id} text={msg.text ?? ''} timestamp={msg.timestamp} />
          ) : (
            <BotBubble key={msg.id} timestamp={msg.timestamp}>
              {msg.content}
            </BotBubble>
          )
        )}

        {/* Typing indicator while search is in flight */}
        {isSearching && (
          <BotBubble key="loading-dots">
            <LoadingDots />
          </BotBubble>
        )}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatMessages;
