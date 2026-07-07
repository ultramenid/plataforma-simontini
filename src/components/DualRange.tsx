import { useLayoutEffect, useRef, useState, type ChangeEvent } from "react";

interface DualRangeProps {
  min: number;
  max: number;
  step?: number;
  valueFrom: number;
  valueTo: number;
  onFromChange: (v: number) => void;
  onToChange: (v: number) => void;
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
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [valueFrom, valueTo, max]);

  const handleFrom = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (v > valueTo) onToChange(v);
    onFromChange(v);
  };
  const handleTo = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (v < valueFrom) onFromChange(v);
    onToChange(v);
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
