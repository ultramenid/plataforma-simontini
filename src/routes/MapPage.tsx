import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AlertCard } from "@/components/AlertCard";
import { CommandPalette } from "@/components/CommandPalette";
import { EmbedDialog } from "@/components/EmbedDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import { buildAlertUrl } from "@/lib/alert-url";
import { cn } from "@/lib/utils";

function shareAlert(id: string) {
  navigator.clipboard?.writeText(buildAlertUrl(id)).catch(() => {});
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
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCmdkOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [embed]);

  // Esc: close the alert card; if already closed, reset everything.
  // Disabled in embed mode — the embed stays locked on its alert.
  useEffect(() => {
    if (embed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // let open overlays handle their own Esc
      if (cmdkOpen || embedOpen || mobileFiltersOpen) return;
      if (activeId) {
        // 1st Esc: close the alert detail
        setActiveId(null);
        return;
      }
      // 2nd Esc: reset view, filters, and search via a single trigger;
      // the actual filter reset happens in the resetToken effect below.
      setResetToken((token) => token + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeId, cmdkOpen, embedOpen, mobileFiltersOpen, embed]);

  // Reset both draft and applied filters to defaults. Shared by the resetToken
  // effect (double-Esc) and the Reset button so the logic lives in one place.
  const resetFilters = () => {
    const defaults = defaultFilters();
    setDraft(defaults);
    setApplied(defaults);
  };

  // Bumping resetToken resets both the map view (in MapView) and the
  // filter state. Kept here so the Esc handler only calls one setState.
  const didReset = useRef(false);
  useEffect(() => {
    if (!didReset.current) {
      didReset.current = true;
      return;
    }
    resetFilters();
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

  // Reconcile activeId with browser navigation (Back/Forward) so the deep-link
  // `?alert=ID` contract stays in sync when the URL changes externally. One-way
  // state→URL sync above handles user-driven selection; this closes the loop.
  // `activeId` is intentionally read via the setter closure to avoid a feedback
  // loop with the state→URL effect above.
  useEffect(() => {
    const urlAlert = params.get("alert");
    const resolved = urlAlert && getAlert(urlAlert) ? urlAlert : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveId((current) => (current === resolved ? current : resolved));
  }, [params]);

  const visible = useMemo(() => visibleAlerts(applied), [applied]);
  const visIds = useMemo(() => new Set(visible.map((alert) => alert.id)), [visible]);
  const features = useMemo(
    () => ALERTS_GEOJSON.features.filter((feature) => visIds.has(feature.id)),
    [visIds],
  );

  const count = visible.length;
  const totalHa = visible.reduce((sum, alert) => sum + alert.ha, 0);
  const countries = new Set(visible.map((alert) => alert.country)).size;
  const label = `${count} active alert${count === 1 ? "" : "s"}`;
  const activeAlert = getAlert(activeId);

  const onDraftChange = (patch: Partial<Filters>) =>
    setDraft((draft) => ({ ...draft, ...patch }));
  const handleApply = () => setApplied(draft);
  const handleReset = resetFilters;
  // code search is live across both draft and applied
  const setCode = (code: string) => {
    setDraft((draft) => ({ ...draft, code }));
    setApplied((applied) => ({ ...applied, code }));
  };

  const onSelectAlert = (id: string) => setActiveId(id);
  const onPickAlert = (id: string) => {
    setCode(id);
    setActiveId(id);
  };

  const handleEmbed = (id: string) => {
    const url = buildAlertUrl(id, true);
    setEmbedCode(
      `<iframe src="${url}" width="1200" height="630" style="max-width:100%;border:1px solid #263029;border-radius:8px" loading="lazy" title="Simontini deforestation alert ${id}"></iframe>`,
    );
    setEmbedOpen(true);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "grid h-screen grid-rows-[minmax(0,1fr)] overflow-hidden",
          embed
            ? activeAlert
              ? "grid-cols-1 grid-rows-[minmax(0,1fr)_auto]"
              : "grid-cols-1"
            : "grid-cols-[300px_1fr] max-md:grid-cols-1 max-md:grid-rows-[50px_1fr]",
        )}
      >
        <ErrorBoundary label="Sidebar">
          <Sidebar
            count={count}
            ha={totalHa}
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
        </ErrorBoundary>

        <div className="relative h-full w-full min-w-0">
          <ErrorBoundary label="Map">
            <MapView
              features={features}
              activeId={activeId}
              basemap={basemap}
              theme={resolved}
              resetToken={resetToken}
              embed={embed}
              onSelect={onSelectAlert}
            />
          </ErrorBoundary>
          {!embed && (
            <>
              <MapSearch onOpenCommand={() => setCmdkOpen(true)} />
              <AlertCard
                alert={activeAlert ?? null}
                embed={false}
                onClose={() => setActiveId(null)}
                onEmbed={handleEmbed}
              />
              <EscHint />
            </>
          )}
        </div>

        {embed && (
          <AlertCard
            alert={activeAlert ?? null}
            embed
            onClose={() => setActiveId(null)}
            onEmbed={handleEmbed}
          />
        )}
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
function EscHint() {
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