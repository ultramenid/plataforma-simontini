import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DualRange } from "@/components/DualRange";
import {
  COUNTRIES,
  DRIVERS,
  SOURCES,
  MAX_MONTH,
  HA_MIN,
  HA_MAX,
  monthFromIdx,
} from "@/lib/data";
import type { Filters } from "@/lib/types";

interface FilterPanelProps {
  draft: Filters;
  onDraftChange: (patch: Partial<Filters>) => void;
  onApply: () => void;
  onReset: () => void;
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-6 mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-canopy first:mt-0">
      {children}
    </h3>
  );
}

// ponytail: one Field wrapper replaces the per-filter mb-2.5 drift —
// every filter now gets the same 16px block gap, so each reads as its own unit.
function Field({ children }: { children: ReactNode }) {
  return <div className="mb-3">{children}</div>;
}

export function FilterPanel({
  draft,
  onDraftChange,
  onApply,
  onReset,
}: FilterPanelProps) {
  const allDates = draft.monthFrom === 0 && draft.monthTo === MAX_MONTH;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <Heading>Date filter</Heading>
      <Field>
        <RadioGroup
          value={draft.dateMode}
          onValueChange={(v) =>
            onDraftChange({
              dateMode: v === "detected" || v === "published" ? v : draft.dateMode,
            })
          }
          className="mt-0.5 flex gap-3"
        >
          <div className="flex items-center gap-1 text-xs text-foreground">
            <RadioGroupItem value="detected" id="dm-detected" />
            <Label
              htmlFor="dm-detected"
              className="cursor-pointer font-normal tracking-normal text-foreground"
            >
              Detected at
            </Label>
          </div>
          <div className="flex items-center gap-1 text-xs text-foreground">
            <RadioGroupItem value="published" id="dm-published" />
            <Label
              htmlFor="dm-published"
              className="cursor-pointer font-normal tracking-normal text-foreground"
            >
              Published at
            </Label>
          </div>
        </RadioGroup>
      </Field>
      <Field>
        <Label>Month range</Label>
        <DualRange
          min={0}
          max={MAX_MONTH}
          valueFrom={draft.monthFrom}
          valueTo={draft.monthTo}
          onFromChange={(v) => onDraftChange({ monthFrom: v })}
          onToChange={(v) => onDraftChange({ monthTo: v })}
          fromLabel={allDates ? "All dates" : monthFromIdx(draft.monthFrom)}
          toLabel={allDates ? "All dates" : monthFromIdx(draft.monthTo)}
          ariaFromLabel="From month"
          ariaToLabel="To month"
        />
      </Field>

      <Heading>Alert size</Heading>
      <Field>
        <Label>Hectares range</Label>
        <DualRange
          min={HA_MIN}
          max={HA_MAX}
          step={10}
          valueFrom={draft.haFrom}
          valueTo={draft.haTo}
          onFromChange={(v) => onDraftChange({ haFrom: v })}
          onToChange={(v) => onDraftChange({ haTo: v })}
          fromLabel={`${draft.haFrom} ha`}
          toLabel={`${draft.haTo} ha`}
          ariaFromLabel="From hectares"
          ariaToLabel="To hectares"
        />
      </Field>

      <Heading>Attributes</Heading>
      <Field>
        <Label htmlFor="f-country">Country</Label>
        <Select
          value={draft.country || "all"}
          onValueChange={(v) =>
            onDraftChange({ country: v === "all" ? "" : v })
          }
        >
          <SelectTrigger id="f-country">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <Label htmlFor="f-driver">Deforestation driver</Label>
        <Select
          value={draft.driver || "all"}
          onValueChange={(v) => onDraftChange({ driver: v === "all" ? "" : v })}
        >
          <SelectTrigger id="f-driver">
            <SelectValue placeholder="All drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All drivers</SelectItem>
            {DRIVERS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <Label htmlFor="f-source">Original source</Label>
        <Select
          value={draft.source || "all"}
          onValueChange={(v) => onDraftChange({ source: v === "all" ? "" : v })}
        >
          <SelectTrigger id="f-source">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="mt-5 flex gap-2">
        <Button className="flex-1 text-[11px]" onClick={onApply}>
          Apply filters
        </Button>
        <Button variant="outline" className="text-[11px]" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
