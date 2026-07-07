import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { cn, cmdKey, cmdKeyKey } from "@/lib/utils";

interface MapSearchProps {
  onOpenCommand: () => void;
}

export function MapSearch({ onOpenCommand }: MapSearchProps) {
  // searchParams only read to keep the component loosely aware of embed context
  const [params] = useSearchParams();
  const isEmbed = params.get("embed") === "1";

  return (
    <button
      type="button"
      onClick={onOpenCommand}
      aria-label="Open search"
      className={cn(
        "glass absolute top-3.5 left-1/2 z-10 flex w-[min(440px,calc(100%-24px))] -translate-x-1/2 cursor-pointer items-center gap-2 rounded-[10px] border border-line pl-3 pr-1.5 py-1 text-left shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-[box-shadow,border-color,transform] duration-150",
        "hover:-translate-y-px hover:border-ring/45 hover:shadow-[0_4px_18px_color-mix(in_srgb,var(--ring)_18%,transparent)]",
        "focus-visible:-translate-y-px focus-visible:border-ring/45 focus-visible:shadow-[0_4px_18px_color-mix(in_srgb,var(--ring)_18%,transparent)] focus-visible:outline-none",
        isEmbed && "pr-2.5",
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate px-0 py-1.5 text-[13px] font-normal tracking-[0.01em] text-muted-foreground">
        Search alert code…
      </span>
      {!isEmbed && (
        <kbd className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-secondary px-1.5 py-1 font-mono text-[12px] font-medium text-muted-foreground">
          <span>{cmdKey}</span>
          <span className="opacity-50">+</span>
          <span>{cmdKeyKey}</span>
        </kbd>
      )}
    </button>
  );
}