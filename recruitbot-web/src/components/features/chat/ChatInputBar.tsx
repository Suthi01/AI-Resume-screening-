import { useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useSearchStore } from '@/lib/stores/search.store';

interface ChatInputBarProps {
  onSubmit: (query: string) => void;
}

export function ChatInputBar({ onSubmit }: ChatInputBarProps) {
  const [value, setValue] = useState('');
  const { isSearching } = useSearchStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = value.trim().length === 0;
  const disabled = isEmpty || isSearching;

  // Auto-resize: reset height, then set to scrollHeight (capped at ~6 lines)
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    setValue(el.value);
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`; // 144px ≈ 6 lines
  }

  function submit() {
    if (disabled) return;
    const query = value.trim();
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSubmit(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div
        className={`flex items-end gap-3 bg-bg-card border rounded-2xl px-4 py-3 transition-colors duration-200 ${
          disabled && !isSearching
            ? 'border-white/[0.05]'
            : 'border-white/[0.1] shadow-lg shadow-black/20'
        } focus-within:border-primary/40`}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Search candidates… e.g. 'Python developer with AWS'"
          disabled={isSearching}
          aria-label="Search candidates"
          className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-muted/60
            outline-none leading-6 max-h-36 overflow-y-auto disabled:opacity-50"
          style={{ height: 'auto' }}
        />

        <button
          onClick={submit}
          disabled={disabled}
          aria-label="Send message"
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            disabled
              ? 'bg-bg-surface opacity-40 cursor-not-allowed'
              : 'bg-gradient-to-br from-primary to-accent shadow-md hover:opacity-90 active:scale-95'
          }`}
        >
          <ArrowUp className="w-4 h-4 text-white" />
        </button>
      </div>

      <p className="text-[10px] text-text-muted text-center mt-1.5 select-none">
        Press <kbd className="px-1 py-0.5 rounded bg-white/[0.04] font-mono text-[9px]">Enter</kbd> to search
        ·{' '}
        <kbd className="px-1 py-0.5 rounded bg-white/[0.04] font-mono text-[9px]">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}

export default ChatInputBar;
