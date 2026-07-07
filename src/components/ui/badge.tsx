import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[3px] font-mono font-semibold uppercase tracking-[0.1em] leading-none",
  {
    variants: {
      variant: {
        high: "bg-[#d94e2e] text-white px-1.5 py-0.5 text-[9px]",
        medium: "bg-[#d9921e] text-white px-1.5 py-0.5 text-[9px]",
        low: "bg-[#c9b214] text-white px-1.5 py-0.5 text-[9px]",
        outline:
          "border border-line bg-transparent text-muted-foreground px-1.5 py-0.5 text-[8px] tracking-[0.08em]",
        // tinted outline variants for crossing tags
        concession:
          "border border-[rgba(217,78,46,0.45)] text-[#d94e2e] px-1.5 py-0.5 text-[8px] tracking-[0.08em]",
        protected:
          "border border-[rgba(55,106,100,0.45)] text-canopy px-1.5 py-0.5 text-[8px] tracking-[0.08em]",
        community:
          "border border-[rgba(217,146,30,0.45)] text-[#d9921e] px-1.5 py-0.5 text-[8px] tracking-[0.08em]",
        moratorium:
          "border border-[rgba(58,143,184,0.45)] text-[#3a8fb8] px-1.5 py-0.5 text-[8px] tracking-[0.08em]",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge };