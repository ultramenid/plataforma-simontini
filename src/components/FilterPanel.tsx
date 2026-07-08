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

/** Shared label + select for single-value filter fields (country/driver/source).
 *  Extracted because the three original blocks were structurally identical. */
function FilterSelect({
  id,
  label,
  placeholder,
  allLabel,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  allLabel: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || "all"} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
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
          onValueChange={(value) =>
            onDraftChange({
              dateMode: value === "detected" || value === "published" ? value : draft.dateMode,
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
          onFromChange={(value) => onDraftChange({ monthFrom: value })}
          onToChange={(value) => onDraftChange({ monthTo: value })}
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
          onFromChange={(value) => onDraftChange({ haFrom: value })}
          onToChange={(value) => onDraftChange({ haTo: value })}
          fromLabel={`${draft.haFrom} ha`}
          toLabel={`${draft.haTo} ha`}
          ariaFromLabel="From hectares"
          ariaToLabel="To hectares"
        />
      </Field>

      <Heading>Attributes</Heading>
      <FilterSelect
        id="f-country"
        label="Country"
        placeholder="All countries"
        allLabel="All countries"
        options={COUNTRIES}
        value={draft.country}
        onChange={(value) => onDraftChange({ country: value === "all" ? "" : value })}
      />
      <FilterSelect
        id="f-driver"
        label="Deforestation driver"
        placeholder="All drivers"
        allLabel="All drivers"
        options={DRIVERS}
        value={draft.driver}
        onChange={(value) => onDraftChange({ driver: value === "all" ? "" : value })}
      />
      <FilterSelect
        id="f-source"
        label="Original source"
        placeholder="All sources"
        allLabel="All sources"
        options={SOURCES}
        value={draft.source}
        onChange={(value) => onDraftChange({ source: value === "all" ? "" : value })}
      />

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
