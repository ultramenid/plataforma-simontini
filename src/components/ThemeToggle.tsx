import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/components/ThemeProvider";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "pointer-events-auto isolate flex gap-0.5 rounded-lg border border-line bg-secondary p-0.5",
        compact && "rounded-md gap-px",
      )}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-label={`Use ${label} theme`}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "pointer-events-auto relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium transition-[color,background-color,box-shadow] duration-200",
              compact ? "px-1.5 py-1" : "px-2.5 py-1.5 text-xs",
              active
                ? "z-20 bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.14)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {!compact && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}