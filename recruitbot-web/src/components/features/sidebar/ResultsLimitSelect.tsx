import { useSearchStore } from '@/lib/stores/search.store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ResultsLimitSelect() {
  const { topK, setTopK } = useSearchStore();

  return (
    <div className="flex items-center justify-between w-full text-xs py-1 border-t border-white/[0.05] pt-4">
      <span className="text-text-muted font-medium">Show top</span>
      <div className="flex items-center gap-1.5">
        <Select
          value={String(topK)}
          onValueChange={(val) => setTopK(Number(val))}
        >
          <SelectTrigger className="h-7 w-14 text-xs bg-bg-card/40 border-white/[0.05] focus:ring-0 focus:ring-offset-0 text-text-primary">
            <SelectValue placeholder={String(topK)} />
          </SelectTrigger>
          <SelectContent className="bg-bg-surface border-white/[0.07] text-text-primary">
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-text-muted font-medium">results</span>
      </div>
    </div>
  );
}

export default ResultsLimitSelect;
