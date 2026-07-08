import { useLayoutEffect, useRef, useState, type ChangeEvent } from "react";

interface DualRangeProps {
  min: number;
  max: number;
  step?: number;
  valueFrom: number;
  valueTo: number;
  onFromChange: (value: number) => void;
  onToChange: (value: number) => void;
  fromLabel: string;
  toLabel: string;
  ariaFromLabel: string;
  ariaToLabel: string;
  className?: string;
}

export function DualRange({
  min,
  max,
  step,
  valueFrom,
  valueTo,
  onFromChange,
  onToChange,
  fromLabel,
  toLabel,
  ariaFromLabel,
  ariaToLabel,
  className,
}: DualRangeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState({ left: 0, width: 100 });

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const update = () => {
      // Guard against max === 0 (or NaN inputs) so the fill style never
      // collapses to Infinity/NaN — render an empty fill instead.
      if (!isFinite(max) || max <= 0) {
        setFill({ left: 0, width: 0 });
        return;
      }
      const pctFrom = (valueFrom / max) * 100;
      const pctTo = (valueTo / max) * 100;
      const thumbOffset = 12; // compensate for thumb width so fill appears to touch thumb centres
      const trackWidth = 100 - (thumbOffset / wrap.clientWidth) * 100;
      const scale = trackWidth / 100;
      const left = pctFrom * scale + (100 - trackWidth) / 2;
      const width = (pctTo - pctFrom) * scale;
      setFill({ left, width });
    };
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(wrap);
    return () => resizeObserver.disconnect();
  }, [valueFrom, valueTo, max]);

  const handleFrom = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (value > valueTo) onToChange(value);
    onFromChange(value);
  };
  const handleTo = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (value < valueFrom) onFromChange(value);
    onToChange(value);
  };

  return (
    <div className={className}>
      <div className="dual-range" ref={wrapRef}>
        <div className="dual-range-track">
          <div
            className="dual-range-fill"
            style={{ left: `${fill.left}%`, width: `${fill.width}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueFrom}
          onChange={handleFrom}
          aria-label={ariaFromLabel}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueTo}
          onChange={handleTo}
          aria-label={ariaToLabel}
        />
      </div>
      <div className="-mt-2 flex justify-between text-[10px]">
        <span className="font-medium text-foreground">{fromLabel}</span>
        <span className="text-right font-medium text-foreground">{toLabel}</span>
      </div>
    </div>
  );
}
