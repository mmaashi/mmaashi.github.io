/**
 * SŪQAI Display-Name Normalization
 * Cleans raw DB company names for consistent, professional display.
 *
 * Common DB issues:
 *  - ALL CAPS: "SAUDI ARABIAN OIL CO" → "Saudi Arabian Oil Co"
 *  - Trailing suffixes: "Company SJSC" → "Company"
 *  - Extra whitespace / punctuation
 */

/** Suffixes to strip from display names (case-insensitive) */
const STRIP_SUFFIXES = [
  /\b(sjsc|cjsc|jsc|llc|ltd|co\.?|inc\.?|corp\.?|pjsc|bsc|wll)\s*\.?$/i,
];

/** Words that should stay lowercase in title case */
const LOWERCASE_WORDS = new Set([
  "and", "of", "the", "for", "in", "al", "el",
]);

/** Words/abbreviations that should stay uppercase */
const UPPERCASE_WORDS = new Set([
  "STC", "SABIC", "ACWA", "SNB", "SAB", "SABB", "BSF", "BSFR",
  "SACO", "SPIMACO", "MIS", "SIG", "AXA", "GBX", "TASI", "IPO",
  "MESC", "SIIG", "SISCO", "SADAFCO", "SAPTCO", "NASEEJ",
]);

function titleCase(word: string): string {
  const upper = word.toUpperCase();
  if (UPPERCASE_WORDS.has(upper)) return upper;
  if (LOWERCASE_WORDS.has(word.toLowerCase())) return word.toLowerCase();
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Normalize a raw English company name for display.
 * Returns the cleaned name or the original if already clean.
 */
export function normalizeNameEn(raw: string | null | undefined): string {
  if (!raw) return "";
  let name = raw.trim();

  // If name is all-uppercase (3+ words), convert to title case
  if (name === name.toUpperCase() && name.split(/\s+/).length >= 2) {
    name = name
      .split(/\s+/)
      .map((w, i) => (i === 0 ? titleCase(w) : titleCase(w)))
      .join(" ");
    // Ensure first word is always capitalized
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Strip corporate suffixes
  for (const re of STRIP_SUFFIXES) {
    name = name.replace(re, "").trim();
  }

  // Collapse multiple spaces
  name = name.replace(/\s{2,}/g, " ").trim();

  return name;
}

/**
 * Pick the correct display name for the current locale.
 * Falls back to English if Arabic is missing.
 */
export function displayName(
  locale: string,
  nameEn: string | null | undefined,
  nameAr: string | null | undefined,
): string {
  if (locale === "ar" && nameAr && nameAr.trim()) return nameAr.trim();
  return normalizeNameEn(nameEn);
}
