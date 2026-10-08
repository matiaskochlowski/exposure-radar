export type SafeLink = { url: string; host: string };

const MAX_LINKS = 12;

/**
 * Pulls openable links out of free text from the KEV feed. The text is untrusted: only
 * well-formed `https:` URLs survive, without credentials, deduplicated and capped.
 */
export function extractSafeLinks(text: string): SafeLink[] {
  const candidates = text.match(/https?:\/\/[^\s;,<>"']+/gi) ?? [];
  const seen = new Set<string>();
  const links: SafeLink[] = [];

  for (const raw of candidates) {
    const link = toSafeLink(trimTrailingPunctuation(raw));
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
  // IP literals: no name for the user to recognize before opening.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname) || parsed.hostname.startsWith('[')) return null;
  return { url: parsed.toString(), host: parsed.hostname.replace(/^www\./, '') };
}

/** Drops sentence punctuation after a URL, and a `)` only when it closes prose, not the URL. */
function trimTrailingPunctuation(raw: string): string {
  let url = raw.replace(/[.,\]]+$/, '');
  while (url.endsWith(')') && count(url, ')') > count(url, '('))
    url = url.slice(0, -1).replace(/[.,\]]+$/, '');
  return url;
}

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}
