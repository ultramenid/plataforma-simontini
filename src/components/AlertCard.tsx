import { Link } from "react-router-dom";
import { Check, Code, FileText, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BeforeAfterCompare } from "@/components/BeforeAfterCompare";
import { CROSSING_COLOR, fmtDate } from "@/lib/data";
import { buildAlertUrl } from "@/lib/alert-url";
import type { Alert } from "@/lib/types";

interface AlertCardProps {
  alert: Alert | null;
  embed: boolean;
  onClose: () => void;
  onEmbed: (id: string) => void;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-[3px] text-[10px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </div>
      <div className="text-[13px] font-medium text-foreground">{value}</div>
    </div>
  );
}

function DateCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </span>
      <div className="text-[10px] font-medium text-foreground">{value}</div>
    </div>
  );
}

function CrossingRow({
  crossing,
  first,
}: {
  crossing: Alert["crossings"][number];
  first: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-2 ${first ? "pt-0" : "border-t border-line py-1.5"}`}
    >
      <span
        className="mt-[3px] size-3 shrink-0 rounded-[2px]"
        style={{ background: CROSSING_COLOR[crossing.type] || "#8ea395" }}
      />
      <div>
        <span className="block font-semibold uppercase text-foreground">
          {crossing.type}
        </span>
        <span className="lowercase text-muted-foreground">{crossing.name}</span>
      </div>
      <span className="ml-auto whitespace-nowrap font-medium text-foreground">
        {crossing.ha.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        ha
      </span>
    </li>
  );
}

/** Shared facts grid — rendered in both the main card and the embed bar. */
function AlertFacts({ alert }: { alert: Alert }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
      <Fact label="Code" value={alert.id} />
      <Fact label="Area" value={`${alert.ha.toLocaleString()} ha`} />
      <Fact label="Island" value={alert.island || "—"} />
      <Fact label="Province" value={alert.province || "—"} />
      <Fact label="District" value={alert.district || "—"} />
      <Fact label="Original Source" value={alert.originalSource} />
    </div>
  );
}

/** Shared crossings list — rendered in both the main card and the embed bar. */
function AlertCrossings({ alert, className }: { alert: Alert; className?: string }) {
  return (
    <ul className={`list-none space-y-0 p-0 text-xs ${className ?? ""}`}>
      {alert.crossings.map((crossing, i) => (
        <CrossingRow key={`${crossing.type}-${crossing.name}`} crossing={crossing} first={i === 0} />
      ))}
    </ul>
  );
}

export function AlertCard({ alert, embed, onClose, onEmbed }: AlertCardProps) {
  const { copied, copy } = useCopyToClipboard();
  if (!alert) return null;

  const shareUrl = buildAlertUrl(alert.id);

  const handleShare = () => copy(shareUrl);

  if (embed) {
    return <EmbedBar alert={alert} copied={copied} onShare={handleShare} />;
  }

  return (
    <div
      role="region"
      aria-label="Alert summary"
      className="glass absolute bottom-2.5 left-2.5 z-10 flex max-h-[calc(100%-20px)] w-80 max-w-[calc(100%-20px)] flex-col overflow-hidden rounded-[10px] border border-line shadow-[0_4px_14px_rgba(19,42,39,0.1)]"
    >
      <div className="flex items-center justify-between gap-2.5 border-b-2 border-canopy px-3 py-2.5">
        <span className="flex-1 text-center text-sm font-semibold text-foreground">
          Details
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-6 items-center justify-center text-[18px] leading-none text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <AlertFacts alert={alert} />

        <BeforeAfterCompare
          before={alert.before}
          after={alert.after}
          beforeLabel="Before · 2025"
          afterLabel={`After · ${alert.date.slice(0, 4)}`}
          className="mb-3 mt-4"
        />

        <div className="mb-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
          <DateCell label="Before" value="2025" />
          <DateCell label="After" value={fmtDate(alert.date)} />
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
          <DateCell label="Detected" value={fmtDate(alert.date)} />
          <DateCell label="Published" value={fmtDate(alert.publishedDate)} />
        </div>

        <div className="mb-[8px] text-[10px] font-semibold uppercase tracking-[0.05em] text-canopy">
          Alert crossings
        </div>
        <AlertCrossings alert={alert} className="mb-3" />

        <div className="flex items-center gap-2 border-t border-line pt-3">
          <Button asChild className="flex-1 text-[11px]">
            <Link to={`/alert/${alert.id}`}>
              <FileText className="size-3" />
              Open report
            </Link>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="size-9 text-muted-foreground hover:text-canopy"
                aria-label="Share"
              >
                {copied ? (
                  <Check className="size-4 text-canopy" />
                ) : (
                  <Share2 className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied" : "Share"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEmbed(alert.id)}
                className="size-9 text-muted-foreground hover:text-canopy"
                aria-label="Embed"
              >
                <Code className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Embed</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

/** Embed mode: a horizontal bottom bar so all details fit without scrolling. */
function EmbedBar({
  alert,
  copied,
  onShare,
}: {
  alert: Alert;
  copied: boolean;
  onShare: () => void;
}) {
  // Hairline divider between sections; only when the bar is wide enough to
  // stay on one row, so wrapped sections don't carry a stray left border.
  const divider = "min-[1000px]:border-l min-[1000px]:border-line min-[1000px]:pl-6";

  return (
    <div
      role="region"
      aria-label="Alert summary"
      className="glass z-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t-2 border-canopy px-4 py-3"
    >
      <BeforeAfterCompare
        before={alert.before}
        after={alert.after}
        beforeLabel="Before · 2025"
        afterLabel={`After · ${alert.date.slice(0, 4)}`}
        className="w-60 max-w-full shrink-0"
      />

      <div
        className={`grid shrink-0 grid-cols-2 content-center gap-x-6 gap-y-2.5 self-stretch ${divider}`}
      >
        <Fact label="Code" value={alert.id} />
        <Fact label="Area" value={`${alert.ha.toLocaleString()} ha`} />
        <Fact label="Island" value={alert.island || "—"} />
        <Fact label="Province" value={alert.province || "—"} />
        <Fact label="District" value={alert.district || "—"} />
        <Fact label="Original Source" value={alert.originalSource} />
        <Fact label="Detected" value={fmtDate(alert.date)} />
        <Fact label="Published" value={fmtDate(alert.publishedDate)} />
      </div>

      <div
        className={`flex min-w-[240px] flex-1 flex-col justify-center self-stretch ${divider}`}
      >
        <div className="mb-1.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.05em] text-canopy">
          Alert crossings
        </div>
        {/* max-h fits the 4 crossings every alert has today; scroll is a backstop */}
        <AlertCrossings alert={alert} className="max-h-48 overflow-y-auto" />
      </div>

      <div
        className={`flex w-[132px] shrink-0 flex-col justify-center gap-2 self-stretch ${divider} min-[1000px]:w-[156px]`}
      >
        <Button asChild className="w-full text-[11px]">
          <Link to={`/alert/${alert.id}`} target="_blank">
            <FileText className="size-3" />
            Open report
          </Link>
        </Button>
        <Button variant="outline" onClick={onShare} className="w-full text-[11px]">
          {copied ? (
            <Check className="size-3 text-canopy" />
          ) : (
            <Share2 className="size-3" />
          )}
          {copied ? "Copied" : "Share"}
        </Button>
      </div>
    </div>
  );
}
