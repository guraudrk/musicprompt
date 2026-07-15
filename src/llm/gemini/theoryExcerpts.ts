import "server-only";

/**
 * Per-genre excerpts from `knowledge/composition_theory/top_music_school_general_composition.txt`
 * §8 (Genre-Specific Topline Decisions), keyed by normalized genre tag. Selecting only the
 * genre(s) actually present in `musicalIdentity.genres` keeps the system instruction targeted to
 * the input instead of always listing every genre's guidance regardless of relevance.
 */
const GENRE_TOPLINE: Record<string, string> = {
  pop: "Pop=hook-first, fast identity, singable chorus.",
  ballad: "Ballad=earned high notes, final-chorus payoff.",
  "r&b": "R&B=vocal rhythm/ad-libs over straight melody.",
  rock: "Rock=riff + verse/chorus energy contrast.",
  "k-pop": "K-pop=multiple distinct hooks per section.",
  kpop: "K-pop=multiple distinct hooks per section.",
  ost: "OST/cinematic=emotional image over loudness.",
  cinematic: "OST/cinematic=emotional image over loudness.",
};

/** Safe default when no declared genre matches a known excerpt — the full pre-ADR-052 list. */
const FALLBACK_GENRE_TOPLINE = Array.from(new Set(Object.values(GENRE_TOPLINE))).join(" ");

/** ADR-052: pick only the genre excerpt(s) that match this spec, falling back to all of them. */
export function selectGenreTopline(genreTags: string[]): string {
  const matched = new Set<string>();
  for (const rawTag of genreTags) {
    const line = GENRE_TOPLINE[rawTag.trim().toLowerCase()];
    if (line) matched.add(line);
  }
  return matched.size > 0 ? Array.from(matched).join(" ") : FALLBACK_GENRE_TOPLINE;
}
