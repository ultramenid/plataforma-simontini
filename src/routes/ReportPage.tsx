import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BeforeAfterCompare } from "@/components/BeforeAfterCompare";
import { Comments } from "@/components/Comments";
import { MiniMap } from "@/components/MiniMap";
import {
  CROSSING_COLOR,
  SEVERITY_COLOR,
  fmtDate,
  getAlert,
  relatedAlerts,
} from "@/lib/data";
import type { CrossingType } from "@/lib/types";
import { cn } from "@/lib/utils";

type TagVariant =
  | "concession"
  | "protected"
  | "community"
  | "moratorium"
  | "outline";

const TAG_VARIANTS: ReadonlySet<string> = new Set([
  "concession",
  "protected",
  "community",
  "moratorium",
]);

const tagVariant = (t: CrossingType): TagVariant =>
  TAG_VARIANTS.has(t) ? (t as TagVariant) : "outline";

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const a = getAlert(id);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    if (a) document.title = `${a.id} · ${a.region} — Simontini`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [a]);

  if (!a) {
    return (
      <div className="flex min-h-screen items-center justify-center p-16 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-semibold">Alert not found</h1>
          <p className="text-[13px] text-muted-foreground">
            The alert ID in this link does not exist.{" "}
            <Link to="/" className="text-canopy">
              Open the alert map
            </Link>{" "}
            to browse all active alerts.
          </p>
        </div>
      </div>
    );
  }

  const adminFields: [string, string][] = [
    ["Code", a.id],
    ["Area", `${a.ha.toLocaleString()} ha`],
    ["Country", a.country],
    ["Province", a.province || "—"],
    ["District", a.district || "—"],
    ["Island", a.island || "—"],
  ];
  const sourceFields: [string, string][] = [
    ["Original source", a.originalSource],
    ["Confidence", `${Math.round(a.confidence * 100)}%`],
    ["Driver", a.driver],
  ];
  const dateFields: [string, string][] = [
    ["Before image", "2025"],
    ["After image", fmtDate(a.date)],
    ["Detected", fmtDate(a.date)],
    ["Published", fmtDate(a.publishedDate)],
  ];
  const meta: [string, string][] = [
    ...adminFields,
    ...sourceFields,
    ...dateFields,
    ["Coordinates", `${a.lat.toFixed(3)}, ${a.lng.toFixed(3)}`],
  ];

  const related = relatedAlerts(a);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card px-4 py-3">
        <Link to="/" className="inline-flex">
          <img
            src="https://simontini.id/assets/logo-simontinus.png"
            alt="Simontini"
            className="h-[26px] w-auto"
          />
        </Link>
        <span className="text-[11px] font-medium tracking-[0.03em] text-muted-foreground">
          Alert report
        </span>
        <Link
          to={`/?alert=${a.id}`}
          className="ml-auto text-xs font-medium text-canopy"
        >
          ← Back to map
        </Link>
      </header>

      <main className="report-main mx-auto max-w-[900px] px-4 pb-[60px] pt-[22px]">
        <div className="mb-[18px]">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-canopy">
            {a.id} · detected {fmtDate(a.date)} · {a.source}
          </div>
          <h1 className="text-2xl font-semibold leading-tight text-balance max-md:text-[22px]">
            {a.region}, {a.country}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {a.ha.toLocaleString()} hectares of probable forest loss · driver:{" "}
            {a.driver}
          </div>
        </div>

        <div className="no-print mb-7 flex gap-2">
          <span className="flex-1" />
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-3.5" />
            Print to PDF
          </Button>
          <Button variant="outline" onClick={handleShare}>
            {copied ? "Copied ✓" : "Share link"}
          </Button>
        </div>

        <div className="report-hero my-4 grid gap-3 md:grid-cols-[1.6fr_1fr]">
          <BeforeAfterCompare
            before={a.before}
            after={a.after}
            beforeLabel="Before · 2025"
            afterLabel={`After · ${fmtDate(a.date)}`}
            fill
          />
          <MiniMap
            geometry={a.geometry}
            severity={a.severity}
            center={[a.lng, a.lat]}
          />
        </div>

        <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-y-3">
          {meta.map(([k, v], i) => (
            <div
              key={k}
              className={cn("px-3", i === 0 ? "border-l-0 pl-0" : "border-l border-line")}
            >
              <div className="mb-[3px] font-mono text-[8px] uppercase tracking-[0.12em] text-canopy">
                {k}
              </div>
              <div className="text-[13px] font-semibold tabular-nums">{v}</div>
            </div>
          ))}
        </div>

        <section className="mb-7">
          <h2 className="report-h2">Alert crossings</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Territory type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Overlap (ha)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.crossings.map((c) => (
                <TableRow key={`${c.type}-${c.name}`}>
                  <TableCell>
                    <span
                      className="mr-1.5 inline-block size-[9px] rounded-[2px] align-middle"
                      style={{
                        background: CROSSING_COLOR[c.type] || "#8ea395",
                      }}
                    />
                    {c.type.toUpperCase()}
                  </TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>
                    {c.ha.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="mb-7">
          <h2 className="report-h2">Crosscut — who this alert overlaps</h2>
          <ul className="space-y-1.5">
            {a.crosscut.map((c) => (
              <li key={`${c.type}-${c.name}`} className="flex items-center gap-2">
                <Badge variant={tagVariant(c.type)}>{c.type}</Badge>
                <span>{c.name}</span>
              </li>
            ))}
          </ul>
        </section>

        {(a.story || a.media?.length) && (
          <section className="mb-7">
            <h2 className="report-h2">Story &amp; coverage</h2>
            {a.story && (
              <article className="mb-5">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-canopy">
                  Field report · Simontini network
                </div>
                <h3 className="mb-2.5 text-xl font-semibold leading-tight">
                  {a.story.title}
                </h3>
                {a.story.body.map((p, i) => (
                  <p
                    key={`${i}-${p.slice(0, 20)}`}
                    className={cn(
                      "mb-3 max-w-[68ch] text-muted-foreground",
                      i === 0 &&
                        "first-letter:float-left first-letter:mr-2 first-letter:font-semibold first-letter:text-[38px] first-letter:leading-[0.9] first-letter:text-canopy",
                    )}
                  >
                    {p}
                  </p>
                ))}
              </article>
            )}
            {!!a.media?.length && (
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-canopy">
                  From other media
                </div>
                <ul className="space-y-2.5">
                  {a.media.map((m) => (
                    <li
                      key={m.url}
                      className="rounded-md border border-line bg-secondary px-3 py-2.5"
                    >
                      <div className="mb-0.5 flex items-baseline gap-1.5 font-mono text-[10px]">
                        <span className="font-semibold text-canopy">
                          {m.outlet}
                        </span>
                        <span className="text-muted-foreground">
                          {fmtDate(m.date)}
                        </span>
                      </div>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-semibold leading-snug hover:text-canopy"
                      >
                        {m.title}{" "}
                        <ExternalLink className="inline size-3 align-[-1px] text-muted-foreground" />
                      </a>
                      {m.excerpt && (
                        <p className="mt-1 max-w-[68ch] text-[12px] text-muted-foreground">
                          {m.excerpt}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {related.length > 0 && (
          <section className="mb-7">
            <h2 className="report-h2">Related alerts</h2>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {related.map(({ alert: r, relation, km }) => (
                <Link
                  key={r.id}
                  to={`/alert/${r.id}`}
                  className="group rounded-md border border-line bg-secondary px-3 py-2.5 transition-colors hover:border-canopy"
                >
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-canopy">
                    {relation}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: SEVERITY_COLOR[r.severity] }}
                    />
                    {r.id}
                  </div>
                  <div className="mt-0.5 text-[13px] font-semibold leading-snug group-hover:text-canopy">
                    {r.region}, {r.country}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {r.ha.toLocaleString()} ha · {fmtDate(r.date)} ·{" "}
                    {Math.round(km)} km away
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Comments alertId={a.id} />
      </main>
    </>
  );
}