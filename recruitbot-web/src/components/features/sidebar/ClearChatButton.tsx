import { X } from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat.store';
import { useSearchStore } from '@/lib/stores/search.store';
import { Button } from '@/components/ui/button';

export function ClearChatButton() {
  const { clearMessages } = useChatStore();
  const { setResults } = useSearchStore();

  const handleClear = () => {
    clearMessages();
    setResults([], '');
  };

  return (
    <Button
      variant="outline"
      onClick={handleClear}
      className="w-full text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-white/[0.04] border-white/[0.05] bg-bg-card/25 gap-2 transition-all h-9"
    >
      <X className="w-3.5 h-3.5" />
      Clear Chat
    </Button>
  );
}

export default ClearChatButton;
