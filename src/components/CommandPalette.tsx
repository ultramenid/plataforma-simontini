import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code,
  FileText,
  Map as MapIcon,
  Satellite,
  Search,
  Share2,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ALERTS } from "@/lib/data";
import type { BasemapKey } from "@/lib/types";
import { cmdKey, cmdKeyKey } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeId: string | null;
  onSetBasemap: (basemap: BasemapKey) => void;
  onPickAlert: (id: string) => void;
  onShare: (id: string) => void;
  onEmbed: (id: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  activeId,
  onSetBasemap,
  onPickAlert,
  onShare,
  onEmbed,
}: CommandPaletteProps) {
  const navigate = useNavigate();

  const close = () => onOpenChange(false);

  const run = (action: () => void) => {
    action();
    close();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      {/* key on `open` so the inner state resets cleanly each time the
          palette opens, without a useEffect state-sync (react-doctor). */}
      <CommandPaletteBody
        key={open ? "open" : "closed"}
        activeId={activeId}
        navigate={navigate}
        onSetBasemap={onSetBasemap}
        onPickAlert={onPickAlert}
        onShare={onShare}
        onEmbed={onEmbed}
        run={run}
      />
    </CommandDialog>
  );
}

interface CommandPaletteBodyProps {
  activeId: string | null;
  navigate: ReturnType<typeof useNavigate>;
  onSetBasemap: (basemap: BasemapKey) => void;
  onPickAlert: (id: string) => void;
  onShare: (id: string) => void;
  onEmbed: (id: string) => void;
  run: (action: () => void) => void;
}

function CommandPaletteBody({
  activeId,
  navigate,
  onSetBasemap,
  onPickAlert,
  onShare,
  onEmbed,
  run,
}: CommandPaletteBodyProps) {
  const [mode, setMode] = useState<"commands" | "code">("commands");
  const [query, setQuery] = useState("");

  const codeResults = ALERTS.filter((alert) =>
    alert.id.toLowerCase().includes(query.trim().toLowerCase()),
  ).slice(0, 10);

  return (
    <>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={
          mode === "code"
            ? "Type alert code, e.g. ID-RIAU-2481"
            : "Search commands…"
        }
      />
      <CommandList>
        {mode === "code" ? (
          <CodeResults
            results={codeResults}
            query={query}
            onPickAlert={onPickAlert}
            run={run}
          />
        ) : (
          <ActionList
            activeId={activeId}
            navigate={navigate}
            onEnterCodeMode={() => {
              setMode("code");
              setQuery("");
            }}
            onSetBasemap={onSetBasemap}
            onShare={onShare}
            onEmbed={onEmbed}
            run={run}
          />
        )}
      </CommandList>
      <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[10px] text-muted-foreground">
        <span>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate · <Kbd>Enter</Kbd> run · <Kbd>Esc</Kbd>{" "}
          close
        </span>
        <span>
          <Kbd>{cmdKey}</Kbd>
          <span className="mx-0.5 opacity-50">+</span>
          <Kbd>{cmdKeyKey}</Kbd>
        </span>
      </div>
    </>
  );
}

interface CodeResultsProps {
  results: (typeof ALERTS)[number][];
  query: string;
  onPickAlert: (id: string) => void;
  run: (action: () => void) => void;
}

function CodeResults({ results, query, onPickAlert, run }: CodeResultsProps) {
  if (results.length === 0) {
    return (
      <CommandEmpty>
        {query.trim()
          ? `No alerts found for “${query.trim()}”`
          : "Type an alert code…"}
      </CommandEmpty>
    );
  }

  return (
    <CommandGroup heading="Alerts">
      {results.map((alert) => (
        <CommandItem
          key={alert.id}
          value={`alert-${alert.id}`}
          onSelect={() => run(() => onPickAlert(alert.id))}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-canopy">
            <Search className="size-4" />
          </span>
          <span className="flex-1 leading-tight">
            {alert.id}
            <span className="block text-[10px] text-muted-foreground">
              {alert.ha.toLocaleString()} ha · {alert.region}, {alert.country}
            </span>
          </span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

interface ActionListProps {
  activeId: string | null;
  navigate: ReturnType<typeof useNavigate>;
  onEnterCodeMode: () => void;
  onSetBasemap: (basemap: BasemapKey) => void;
  onShare: (id: string) => void;
  onEmbed: (id: string) => void;
  run: (action: () => void) => void;
}

function ActionList({
  activeId,
  navigate,
  onEnterCodeMode,
  onSetBasemap,
  onShare,
  onEmbed,
  run,
}: ActionListProps) {
  return (
    <CommandGroup heading="Actions">
      <CommandItem value="search-code" onSelect={onEnterCodeMode}>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-canopy">
          <Search className="size-4" />
        </span>
        <span className="flex-1">Search alert code…</span>
        <span className="text-[10px] text-muted-foreground">
          Type code and press Enter
        </span>
      </CommandItem>
      <CommandItem
        value="basemap-map"
        onSelect={() => run(() => onSetBasemap("map"))}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-canopy">
          <MapIcon className="size-4" />
        </span>
        <span className="flex-1">Switch to Map basemap</span>
      </CommandItem>
      <CommandItem
        value="basemap-sat"
        onSelect={() => run(() => onSetBasemap("sat"))}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-canopy">
          <Satellite className="size-4" />
        </span>
        <span className="flex-1">Switch to Satellite basemap</span>
      </CommandItem>
      {activeId && (
        <>
          <CommandItem
            value="open-report"
            onSelect={() => run(() => navigate(`/alert/${activeId}`))}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-canopy">
              <FileText className="size-4" />
            </span>
            <span className="flex-1">Open report {activeId}</span>
          </CommandItem>
          <CommandItem
            value="share-alert"
            onSelect={() => run(() => onShare(activeId))}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-canopy">
              <Share2 className="size-4" />
            </span>
            <span className="flex-1">Share selected alert</span>
          </CommandItem>
          <CommandItem
            value="embed-alert"
            onSelect={() => run(() => onEmbed(activeId))}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-canopy">
              <Code className="size-4" />
            </span>
            <span className="flex-1">Embed selected alert</span>
          </CommandItem>
        </>
      )}
    </CommandGroup>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[4px] border border-line bg-secondary px-1 py-px font-mono">
      {children}
    </kbd>
  );
}