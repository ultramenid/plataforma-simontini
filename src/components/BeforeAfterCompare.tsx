import { useState } from "react";

import { cn } from "@/lib/utils";

interface BeforeAfterCompareProps {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  /** Fill the parent height (report hero) instead of using a 16:10 aspect ratio. */
  fill?: boolean;
  className?: string;
}

export function BeforeAfterCompare({
  before,
  after,
  beforeLabel,
  afterLabel,
  fill = false,
  className,
}: BeforeAfterCompareProps) {
  const [pos, setPos] = useState(50);

  return (
    <div
      className={cn("compare", fill ? "h-full min-h-[280px]" : "aspect", className)}
    >
      <div
        className="before-wrap"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img src={before} alt="Satellite view before clearing" draggable={false} />
      </div>
      <img src={after} alt="Satellite view after clearing" draggable={false} />
      <div className="divider" style={{ left: `${pos}%` }} />
      <span className="lbl b">{beforeLabel}</span>
      <span className="lbl a">{afterLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        aria-label="Compare before and after imagery"
        onChange={(e) => setPos(Number(e.target.value))}
      />
    </div>
  );
}