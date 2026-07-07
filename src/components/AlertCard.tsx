import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Code, FileText, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BeforeAfterCompare } from "@/components/BeforeAfterCompare";
import { CROSSING_COLOR, fmtDate } from "@/lib/data";
import type { Alert } from "@/lib/types";

interface AlertCardProps {
  alert: Alert | null;
  embed: boolean;
  onClose: () => void;
  onEmbed: (id: string) => void;
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="mb-[3px] text-[10px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {k}
      </div>
      <div className="text-[13px] font-medium text-foreground">{v}</div>
    </div>
  );
}

function DateCell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {k}
      </span>
      <div className="text-[10px] font-medium text-foreground">{v}</div>
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

export function AlertCard({ alert, embed, onClose, onEmbed }: AlertCardProps) {
  const [copied, setCopied] = useState(false);
  if (!alert) return null;

  const shareUrl = `${window.location.origin}${window.location.pathname}?alert=${alert.id}`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* clipboard may be unavailable; the URL is still shown via embed */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

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
        <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
          <Fact k="Code" v={alert.id} />
          <Fact k="Area" v={`${alert.ha.toLocaleString()} ha`} />
          <Fact k="Islands" v={alert.island || "—"} />
          <Fact k="Provinces" v={alert.province || "—"} />
          <Fact k="Districts" v={alert.district || "—"} />
          <Fact k="Original Source" v={alert.originalSource} />
        </div>

        <BeforeAfterCompare
          before={alert.before}
          after={alert.after}
          beforeLabel="Before · 2025"
          afterLabel={`After · ${alert.date.slice(0, 4)}`}
          className="mb-3"
        />

        <div className="mb-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
          <DateCell k="Before" v="2025" />
          <DateCell k="After" v={fmtDate(alert.date)} />
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
          <DateCell k="Detected" v={fmtDate(alert.date)} />
          <DateCell k="Published" v={fmtDate(alert.publishedDate)} />
        </div>

        <div className="mb-[8px] text-[10px] font-semibold uppercase tracking-[0.05em] text-canopy">
          Alert crossings
        </div>
        <ul className="mb-3 list-none space-y-0 p-0 text-xs">
          {alert.crossings.map((c, i) => (
            <CrossingRow key={`${c.type}-${c.name}`} crossing={c} first={i === 0} />
          ))}
        </ul>

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
  return (
    <div
      role="region"
      aria-label="Alert summary"
      className="glass z-10 flex items-stretch gap-5 border-t-2 border-canopy px-4 py-3"
    >
      <BeforeAfterCompare
        before={alert.before}
        after={alert.after}
        beforeLabel="Before · 2025"
        afterLabel={`After · ${alert.date.slice(0, 4)}`}
        className="w-60 shrink-0 self-center"
      />

      <div className="shrink-0 self-center">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <Fact k="Code" v={alert.id} />
          <Fact k="Area" v={`${alert.ha.toLocaleString()} ha`} />
          <Fact k="Islands" v={alert.island || "—"} />
          <Fact k="Provinces" v={alert.province || "—"} />
          <Fact k="Districts" v={alert.district || "—"} />
          <Fact k="Original Source" v={alert.originalSource} />
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-x-6">
          <DateCell k="Detected" v={fmtDate(alert.date)} />
          <DateCell k="Published" v={fmtDate(alert.publishedDate)} />
        </div>
      </div>

      <div className="min-w-0 flex-1 self-center">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-canopy">
          Alert crossings
        </div>
        {/* max-h fits the 4 crossings every alert has today; scroll is a backstop */}
        <ul className="max-h-48 list-none space-y-0 overflow-y-auto p-0 text-xs">
          {alert.crossings.map((c, i) => (
            <CrossingRow key={`${c.type}-${c.name}`} crossing={c} first={i === 0} />
          ))}
        </ul>
      </div>

      <div className="flex shrink-0 flex-col justify-center gap-2 self-center">
        <Button asChild className="text-[11px]">
          <Link to={`/alert/${alert.id}`} target="_blank">
            <FileText className="size-3" />
            Open report
          </Link>
        </Button>
        <Button variant="outline" onClick={onShare} className="text-[11px]">
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
