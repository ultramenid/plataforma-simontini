import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";

interface SidebarProps {
  count: number;
  ha: number;
  countries: number;
  label: string;
  onOpenMobileFilters: () => void;
  children: ReactNode; // desktop FilterPanel
  embed: boolean;
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5 text-[10px] font-medium leading-[1.35] text-muted-foreground">
      <b className="text-base font-semibold tabular-nums text-foreground">
        {value}
      </b>
      {label}
    </span>
  );
}

export function Sidebar({
  count,
  ha,
  countries,
  label,
  onOpenMobileFilters,
  children,
  embed,
}: SidebarProps) {
  if (embed) return null;

  return (
    <aside className="relative flex min-h-0 flex-col border-r border-line max-md:flex-row max-md:items-center max-md:justify-between max-md:gap-2 max-md:border-b max-md:border-r-0 max-md:px-3 max-md:py-0">
      <div className="glass pointer-events-none absolute inset-0 -z-10" />
      <div className="relative z-10 hidden justify-center border-b border-line px-5 pb-5 pt-6 md:flex">
        <Link to="/" className="inline-flex">
          <img
            src="https://simontini.id/assets/logo-simontinus.png"
            alt="Simontini"
            className="h-[26px] w-auto"
          />
        </Link>
      </div>
      <div className="relative z-10 hidden grid-cols-3 gap-2 border-b border-line bg-secondary px-3.5 py-3 text-center md:grid">
        <Stat value={count} label="active alerts" />
        <Stat value={ha.toLocaleString()} label="ha detected" />
        <Stat value={countries} label="countries" />
      </div>
      <div className="relative z-10 flex w-full items-center justify-between gap-2 md:hidden">
        <span className="text-[11px] font-medium tracking-[0.03em] text-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="flex items-center gap-1 text-[11px] font-medium text-canopy"
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
          </button>
        </div>
      </div>
      <div className="relative z-10 hidden min-h-0 flex-1 flex-col md:flex">
        {children}
        <div className="border-t border-line bg-secondary/60 px-4 py-3">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}