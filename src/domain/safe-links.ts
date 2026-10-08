export type SafeLink = { url: string; host: string };

const MAX_LINKS = 12;

/**
 * Pulls openable links out of free text from the KEV feed. The text is untrusted: only
 * well-formed `https:` URLs survive, without credentials, deduplicated and capped.
 */
export function extractSafeLinks(text: string): SafeLink[] {
  const candidates = text.match(/https?:\/\/[^\s;,<>"'()]+/gi) ?? [];
  const seen = new Set<string>();
  const links: SafeLink[] = [];

  for (const raw of candidates) {
    const link = toSafeLink(raw.replace(/[.)\]]+$/, ''));
    if (!link || seen.has(link.url)) continue;
    seen.add(link.url);
    links.push(link);
    if (links.length >= MAX_LINKS) break;
  }
  return links;
}

export function toSafeLink(raw: string): SafeLink | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;
  if (!parsed.hostname.includes('.')) return null;
  return { url: parsed.toString(), host: parsed.hostname.replace(/^www\./, '') };
}
