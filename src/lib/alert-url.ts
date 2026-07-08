/** Build a deep-link URL to a single alert on this app instance.
 *  Single source of truth for the `?alert=ID` and `?embed=1` query-param
 *  contracts documented in DESIGN.md (Edge cases). Any change to the format
 *  must follow the versioned-migration rule in CLAUDE.md. */
export function buildAlertUrl(id: string, embed = false): string {
  const base = `${window.location.origin}${window.location.pathname}?alert=${id}`;
  return embed ? `${base}&embed=1` : base;
}