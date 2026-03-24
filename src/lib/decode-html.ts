/**
 * Decode common HTML entities back to their character equivalents.
 * Used for news titles scraped from external sources (mubasher, argaam, etc.)
 * that may contain encoded entities like &quot; &amp; &lt; etc.
 */
const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
  "&nbsp;": " ",
  "&#8220;": "\u201C",
  "&#8221;": "\u201D",
  "&#8216;": "\u2018",
  "&#8217;": "\u2019",
  "&laquo;": "\u00AB",
  "&raquo;": "\u00BB",
  "&ndash;": "\u2013",
  "&mdash;": "\u2014",
  "&hellip;": "\u2026",
};

const ENTITY_RE = new RegExp(Object.keys(ENTITY_MAP).join("|"), "gi");

export function decodeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(ENTITY_RE, (match) => ENTITY_MAP[match.toLowerCase()] ?? match);
}
