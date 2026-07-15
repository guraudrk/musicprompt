/**
 * Lightweight, deterministic keyword extraction for the no-login demo. The demo only ever
 * receives one free-text "idea" string, but the Mock compiler's Style output
 * (src/llm/mock/mockOutputBuilders.ts buildStyleText) reads structured fields
 * (musicalIdentity.genres/tempoDescription/instrumentation) that a single string can't populate
 * on its own. Without this, every demo result showed "unspecified genre at unspecified" regardless
 * of what the user actually typed — a real quality bug, not a consequence of Gemini being
 * unavailable anonymously (see DECISIONS.md ADR-042). This is plain keyword matching, not
 * classification or AI — it only ever adds a tag when a known word is actually present.
 */

const GENRE_KEYWORDS: [RegExp, string][] = [
  [/k-?pop|케이팝/i, "K-pop"],
  [/j-?pop/i, "J-pop"],
  [/hip-?hop|힙합|랩|rap/i, "Hip-hop"],
  [/r&b|알앤비/i, "R&B"],
  [/ballad|발라드|バラード/i, "Ballad"],
  [/rock|락|롹|ロック/i, "Rock"],
  [/jazz|재즈|ジャズ/i, "Jazz"],
  [/indie|인디|インディー/i, "Indie"],
  [/edm|electronic|일렉트로닉|エレクトロニック/i, "Electronic"],
  [/folk|포크|フォーク/i, "Folk"],
  [/(?<![kj-])pop|(?<!케이)팝|(?<!ケイ)ポップ/i, "Pop"],
];

const TEMPO_KEYWORDS: [RegExp, string][] = [
  [/mid-?\s?tempo|미드\s?템포|ミディアム\s?テンポ/i, "mid-tempo"],
  [/up-?\s?tempo|업\s?템포|アップ\s?テンポ/i, "up-tempo"],
  [/fast|빠른|빠르게|速い/i, "fast"],
  [/slow|느린|느리게|遅い/i, "slow"],
];

const VOCAL_KEYWORDS: [RegExp, string][] = [
  [/female\s?(vocal|singer)|여자\s?(가수|보컬)|女性\s?(ボーカル|歌手)/i, "female vocal"],
  [/\bmale\s?(vocal|singer)|남자\s?(가수|보컬)|男性\s?(ボーカル|歌手)/i, "male vocal"],
];

function matchAll(text: string, dictionary: [RegExp, string][]): string[] {
  const seen = new Set<string>();
  for (const [pattern, label] of dictionary) {
    if (pattern.test(text)) seen.add(label);
  }
  return [...seen];
}

function matchFirst(text: string, dictionary: [RegExp, string][]): string | undefined {
  return dictionary.find(([pattern]) => pattern.test(text))?.[1];
}

export interface ExtractedHints {
  genres: string[];
  tempo?: string;
  vocal?: string;
}

export function extractHints(idea: string): ExtractedHints {
  return {
    genres: matchAll(idea, GENRE_KEYWORDS),
    tempo: matchFirst(idea, TEMPO_KEYWORDS),
    vocal: matchFirst(idea, VOCAL_KEYWORDS),
  };
}
