import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AlertCard } from "@/components/AlertCard";
import { CommandPalette } from "@/components/CommandPalette";
import { EmbedDialog } from "@/components/EmbedDialog";
import { FilterPanel } from "@/components/FilterPanel";
import { MapSearch } from "@/components/MapSearch";
import { MapView } from "@/components/MapView";
import { useTheme } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ALERTS_GEOJSON,
  defaultFilters,
  getAlert,
  visibleAlerts,
} from "@/lib/data";
import type { BasemapKey, Filters } from "@/lib/types";
import { cn } from "@/lib/utils";

function shareAlert(id: string) {
  const url = `${window.location.origin}${window.location.pathname}?alert=${id}`;
  navigator.clipboard?.writeText(url).catch(() => {});
}

export function MapPage() {
  const [params, setParams] = useSearchParams();
  const embed = params.get("embed") === "1";
  const { resolved } = useTheme();

  const [draft, setDraft] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(defaultFilters);
  const [basemap, setBasemap] = useState<BasemapKey>("map");
  const [activeId, setActiveId] = useState<string | null>(() => {
    const initial = params.get("alert");
    return initial && getAlert(initial) ? initial : null;
  });
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  const didInit = useRef(false);

  // lock body scroll on the map surface
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ⌘K / Ctrl+K toggles the command palette (disabled in embed mode)
  useEffect(() => {
    if (embed) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [embed]);

  // Esc: close the alert card; if already closed, reset everything.
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // let open overlays handle their own Esc
      if (cmdkOpen || embedOpen || mobileFiltersOpen) return;
      if (activeIdRef.current) {
        // 1st Esc: close the alert detail
        setActiveId(null);
        return;
      }
      // 2nd Esc: reset view, filters, and search via a single trigger;
      // the actual filter reset happens in the resetToken effect below.
      setResetToken((t) => t + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cmdkOpen, embedOpen, mobileFiltersOpen]);

  // Bumping resetToken resets both the map view (in MapView) and the
  // filter state. Kept here so the Esc handler only calls one setState.
  const didReset = useRef(false);
  useEffect(() => {
    if (!didReset.current) {
      didReset.current = true;
      return;
    }
    const d = defaultFilters();
    setDraft(d);
    setApplied(d);
  }, [resetToken]);

  // keep ?alert in the URL in sync with the selection (skip the first pass)
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (activeId) next.set("alert", activeId);
        else next.delete("alert");
        return next;
      },
      { replace: true },
    );
  }, [activeId, setParams]);

  const visible = useMemo(() => visibleAlerts(applied), [applied]);
  const visIds = useMemo(() => new Set(visible.map((a) => a.id)), [visible]);
  const features = useMemo(
    () => ALERTS_GEOJSON.features.filter((f) => visIds.has(f.id)),
    [visIds],
  );

  const count = visible.length;
  const ha = visible.reduce((s, a) => s + a.ha, 0);
  const countries = new Set(visible.map((a) => a.country)).size;
  const label = `${count} active alert${count === 1 ? "" : "s"}`;
  const activeAlert = getAlert(activeId);

  const onDraftChange = (patch: Partial<Filters>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const handleApply = () => setApplied(draft);
  const handleReset = () => {
    const d = defaultFilters();
    setDraft(d);
    setApplied(d);
  };
  // code search is live across both draft and applied
  const setCode = (v: string) => {
    setDraft((d) => ({ ...d, code: v }));
    setApplied((a) => ({ ...a, code: v }));
  };

  const onSelectAlert = (id: string) => setActiveId(id);
  const onPickAlert = (id: string) => {
    setCode(id);
    setActiveId(id);
  };

  const handleEmbed = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?alert=${id}&embed=1`;
    setEmbedCode(
      `<iframe src="${url}" width="100%" style="aspect-ratio:16/9;border:1px solid #263029;border-radius:8px" loading="lazy" title="Simontini deforestation alert ${id}"></iframe>`,
    );
    setEmbedOpen(true);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "grid h-screen grid-rows-[minmax(0,1fr)] overflow-hidden",
          embed
            ? "grid-cols-1"
            : "grid-cols-[300px_1fr] max-md:grid-cols-1 max-md:grid-rows-[50px_1fr]",
        )}
      >
        <Sidebar
          count={count}
          ha={ha}
          countries={countries}
          label={label}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          embed={embed}
        >
          <FilterPanel
            draft={draft}
            onDraftChange={onDraftChange}
            onApply={handleApply}
            onReset={handleReset}
          />
        </Sidebar>

        <div className="relative h-full w-full min-w-0">
          <MapView
            features={features}
            activeId={activeId}
            basemap={basemap}
            theme={resolved}
            resetToken={resetToken}
            onSelect={onSelectAlert}
          />
          {!embed && (
            <MapSearch onOpenCommand={() => setCmdkOpen(true)} />
          )}
          <AlertCard
            alert={activeAlert ?? null}
            embed={embed}
            onClose={() => setActiveId(null)}
            onEmbed={handleEmbed}
          />
          {!embed && <EscHint active={!!activeId} resetToken={resetToken} />}
        </div>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-80 max-w-xs gap-0 p-0">
          <div className="flex items-center justify-center border-b border-line px-5 pb-5 pt-6">
            <img
              src="https://simontini.id/assets/logo-simontinus.png"
              alt="Simontini"
              className="h-[26px] w-auto"
            />
          </div>
          <FilterPanel
            draft={draft}
            onDraftChange={onDraftChange}
            onApply={() => {
              handleApply();
              setMobileFiltersOpen(false);
            }}
            onReset={handleReset}
          />
        </SheetContent>
      </Sheet>

      {!embed && (
        <CommandPalette
          open={cmdkOpen}
          onOpenChange={setCmdkOpen}
          activeId={activeId}
          onSetBasemap={setBasemap}
          onPickAlert={onPickAlert}
          onShare={shareAlert}
          onEmbed={handleEmbed}
        />
      )}

      <EmbedDialog
        open={embedOpen}
        onOpenChange={setEmbedOpen}
        code={embedCode}
      />
    </TooltipProvider>
  );
}

/** Floating bottom-center hint describing the Esc grammar. */
function EscHint({
  active,
  resetToken,
}: {
  active: boolean;
  resetToken: number;
}) {
  // re-render on resetToken so the labels stay in sync after a reset
  void resetToken;
  void active;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-3.5 left-1/2 z-10 -translate-x-1/2 flex items-center gap-3 text-[10px] font-medium text-muted-foreground"
    >
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-foreground">Esc</span>
        <span>close alert</span>
      </span>
      <span className="h-2.5 w-px bg-line" />
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-foreground">Esc Esc</span>
        <span>reset all</span>
      </span>
    </div>
  );
}