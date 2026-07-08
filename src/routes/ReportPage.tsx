import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, Printer } from "lucide-react";

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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MiniMap } from "@/components/MiniMap";
import {
  CROSSING_COLOR,
  SEVERITY_COLOR,
  fmtDate,
  getAlert,
  relatedAlerts,
} from "@/lib/data";
import type { Alert } from "@/lib/types";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";

// A single label/value fact inside a grouped fact block.
function FactCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact-cell">
      <div className="k">{label}</div>
      <div className="v tabular-nums">{value}</div>
    </div>
  );
}

// A labelled sub-block of case-file facts (Location / Source / Timeline).
function FactBlock({
  kicker,
  children,
}: {
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fact-block">
      <div className="fact-kicker">{kicker}</div>
      {children}
    </div>
  );
}

// The signature element: territorial overlaps rendered as a vertical stack of
// horizontal bands. Each band is tinted with its crossing-type color and sized
// so the clearing reads as a core sample of the land it sits on top of.
function OverlapStack({ alert }: { alert: Alert }) {
  if (alert.crosscut.length === 0) {
    return (
      <div className="overlap-stack">
        <p className="overlap-empty">
          No recorded territorial overlaps for this alert.
        </p>
      </div>
    );
  }

  const maxHa = Math.max(...alert.crosscut.map((c) => c.ha), 1);

  return (
    <div className="overlap-stack">
      {alert.crosscut.map((c) => {
        const color = CROSSING_COLOR[c.type] ?? "#8ea395";
        const isFull = c.ha >= alert.ha;
        // Scale band height between 38px (floor) and ~78px (max overlap).
        const height = 38 + Math.round((c.ha / maxHa) * 40);
        return (
          <div
            key={`${c.type}-${c.name}`}
            className="overlap-band"
            style={
              {
                ["--band-color" as string]: color,
                minHeight: height,
              } as React.CSSProperties
            }
          >
            <span className="swatch" />
            <span className="type">{c.type}</span>
            <span className="name">{c.name}</span>
            <span className="ha">
              {isFull && <span className="full">full · </span>}
              {c.ha.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{" "}
              ha
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const alert = getAlert(id);
  const { copied, copy } = useCopyToClipboard();

  useEffect(() => {
    if (alert) document.title = `${alert.id} · ${alert.region} — Simontini`;
  }, [alert]);

  if (!alert) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-16 text-center">
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

  const related = relatedAlerts(alert);
  const handleShare = () => copy(window.location.href);

  return (
    <div className="min-h-screen w-full bg-background">
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
        <span className="ml-auto font-mono text-[11px] font-semibold text-foreground">
          {alert.id}
        </span>
        <Link
          to={`/?alert=${alert.id}`}
          className="text-xs font-medium text-canopy"
        >
          ← Back to map
        </Link>
      </header>

      <main className="report-main mx-auto max-w-[900px] px-4 pb-[60px] pt-[22px]">
        {/* Case-file banner */}
        <div className="case-banner mb-5">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-canopy">
            {alert.id} · detected {fmtDate(alert.date)} · {alert.source}
          </div>
          <h1 className="mb-2 text-[28px] leading-[1.15] text-balance max-md:text-[22px]">
            {alert.region}, {alert.country}
          </h1>
          <p className="summary">
            {alert.ha.toLocaleString()} hectares of probable forest loss ·
            driver: {alert.driver} · {Math.round(alert.confidence * 100)}%
            confidence
          </p>
          <div className="rule mt-4" />
        </div>

        {/* Quiet action row */}
        <div className="no-print mb-7 flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-3.5" />
            Print to PDF
          </Button>
          <Button variant="outline" onClick={handleShare}>
            {copied ? "Copied ✓" : "Share link"}
          </Button>
        </div>

        {/* Evidence hero: before/after comparator (dominant) + location map */}
        <ErrorBoundary label="Before / after imagery & location map">
          <div className="report-hero my-4 grid gap-3 md:grid-cols-[1.6fr_1fr]">
            <BeforeAfterCompare
              before={alert.before}
              after={alert.after}
              beforeLabel="Before · 2025"
              afterLabel={`After · ${fmtDate(alert.date)}`}
              fill
            />
            <MiniMap
              geometry={alert.geometry}
              severity={alert.severity}
              center={[alert.lng, alert.lat]}
            />
          </div>
        </ErrorBoundary>

        {/* Territorial overlaps: the clearing read as a core sample of the
            land it sits on. Band height scales with overlap hectares; "full"
            marks overlaps that cover the whole alert polygon. */}
        <section className="mb-7">
          <h2 className="report-h2">Territorial overlaps</h2>
          <OverlapStack alert={alert} />
        </section>

        {/* Case-file facts, grouped into Location / Source / Timeline */}
        <section className="mb-7">
          <h2 className="report-h2">Case file</h2>
          <div className="grid gap-y-3 md:grid-cols-3">
            <FactBlock kicker="Location">
              <FactCell label="Code" value={alert.id} />
              <FactCell
                label="Area"
                value={`${alert.ha.toLocaleString()} ha`}
              />
              <FactCell label="Country" value={alert.country} />
              <FactCell label="Province" value={alert.province || "—"} />
              <FactCell label="District" value={alert.district || "—"} />
              <FactCell label="Island" value={alert.island || "—"} />
              <FactCell
                label="Coordinates"
                value={`${alert.lat.toFixed(3)}, ${alert.lng.toFixed(3)}`}
              />
            </FactBlock>

            <FactBlock kicker="Source">
              <FactCell label="Original source" value={alert.originalSource} />
              <FactCell
                label="Confidence"
                value={`${Math.round(alert.confidence * 100)}%`}
              />
              <FactCell label="Driver" value={alert.driver} />
            </FactBlock>

            <FactBlock kicker="Timeline">
              <FactCell label="Before image" value="2025" />
              <FactCell label="After image" value={fmtDate(alert.date)} />
              <FactCell label="Detected" value={fmtDate(alert.date)} />
              <FactCell
                label="Published"
                value={fmtDate(alert.publishedDate)}
              />
            </FactBlock>
          </div>
        </section>

        {/* Administrative crossings (tabular data → table) */}
        <section className="mb-7">
          <h2 className="report-h2">Administrative crossings</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Territory type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Overlap (ha)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alert.crossings.map((crossing) => (
                <TableRow key={`${crossing.type}-${crossing.name}`}>
                  <TableCell>
                    <span
                      className="mr-1.5 inline-block size-[9px] rounded-[2px] align-middle"
                      style={{
                        background: CROSSING_COLOR[crossing.type] || "#8ea395",
                      }}
                    />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em]">
                      {crossing.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-[13px] font-medium">
                    {crossing.name}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] font-semibold tabular-nums">
                    {crossing.ha.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        {/* Story & media coverage */}
        {(alert.story || alert.media?.length) && (
          <section className="mb-7">
            <h2 className="report-h2">Story &amp; coverage</h2>

            {alert.story && (
              <article className="dispatch">
                <div className="dateline">
                  <span className="dot" aria-hidden="true" />
                  Field report · Simontini network · {fmtDate(alert.date)}
                </div>
                <h3>{alert.story.title}</h3>
                {alert.story.body[0] && (
                  <p className="lede">{alert.story.body[0]}</p>
                )}
                {alert.story.body.length > 1 && (
                  <div className="body">
                    {alert.story.body.slice(1).map((paragraph, i) => (
                      <p key={`${i}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </article>
            )}

            {!!alert.media?.length && (
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-canopy">
                  From other media
                </div>
                <ul className="clippings">
                  {alert.media.map((media) => (
                    <li key={media.url}>
                      <div className="masthead">
                        <span className="outlet">{media.outlet}</span>
                        <span className="sep" aria-hidden="true">
                          /
                        </span>
                        <time className="date">{fmtDate(media.date)}</time>
                      </div>
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="headline"
                      >
                        {media.title}{" "}
                        <ExternalLink className="inline size-3 align-[-1px] text-muted-foreground" />
                      </a>
                      {media.excerpt && (
                        <p className="excerpt">{media.excerpt}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Related alerts */}
        {related.length > 0 && (
          <section className="mb-7">
            <h2 className="report-h2">Related alerts</h2>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {related.map(({ alert: relatedAlert, relation, km }) => (
                <Link
                  key={relatedAlert.id}
                  to={`/alert/${relatedAlert.id}`}
                  className="group rounded-md border border-line bg-secondary px-3 py-2.5 transition-colors hover:border-canopy"
                >
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-canopy">
                    {relation}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{
                        background: SEVERITY_COLOR[relatedAlert.severity],
                      }}
                    />
                    {relatedAlert.id}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold leading-snug group-hover:text-canopy">
                    {relatedAlert.region}, {relatedAlert.country}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {relatedAlert.ha.toLocaleString()} ha ·{" "}
                    {fmtDate(relatedAlert.date)} · {Math.round(km)} km away
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <ErrorBoundary label="Discussion">
          <Comments alertId={alert.id} />
        </ErrorBoundary>
      </main>
    </div>
  );
}
