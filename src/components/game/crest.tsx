/**
 * ClubCrest — procedural, deterministic SVG crests for Star Career.
 * Drop-in for src/components/game/crest.tsx: `<Crest className=…/>` with no club renders
 * the original app mark; pass `clubId` + `name` ("<City> <Nickname>") for a club crest.
 */
import * as React from "react";

type Props = { className?: string; clubId?: string; name?: string; monogram?: boolean; title?: string };

// ---------- hashing ----------
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pick<T>(arr: T[], h: number, salt: number): T { return arr[((h ^ Math.imul(salt, 2654435761)) >>> 0) % arr.length]; }

// ---------- palettes: [field, secondary, glyph/trim] ----------
export const PALETTES: [string, string, string][] = [
  ["#c8102e", "#ffffff", "#ffd24a"], ["#0b2f6b", "#ffffff", "#e8b923"], ["#1f7a3a", "#ffffff", "#0b2a16"],
  ["#111317", "#ffffff", "#e8b923"], ["#6a1b3a", "#5fb4e6", "#ffffff"], ["#f2c230", "#121212", "#ffffff"],
  ["#5a2a82", "#ffffff", "#f2c230"], ["#e05a1a", "#111317", "#ffffff"], ["#0e6fb8", "#ffffff", "#0b1f3a"],
  ["#8b0f14", "#111317", "#f2c230"], ["#0f7f7a", "#f2c230", "#ffffff"], ["#ffffff", "#c8102e", "#0b2f6b"],
  ["#2a2f3a", "#e05a1a", "#ffffff"], ["#7ec3ea", "#0b2f6b", "#ffffff"], ["#1a4d2e", "#f2c230", "#ffffff"],
  ["#b3122a", "#0b2f6b", "#ffffff"],
];

// ---------- shields (viewBox 0 0 100 100) ----------
export const SHIELDS: string[] = [
  "M10 8H90V48C90 74 70 88 50 96 30 88 10 74 10 48Z",                 // heater
  "M50 4 92 18V50C92 74 72 90 50 97 28 90 8 74 8 50V18Z",              // peaked
  "M50 4A46 46 0 1 1 49.9 4Z",                                         // roundel
  "M12 6H88L92 14V60C92 80 70 92 50 97 30 92 8 80 8 60V14Z",           // squared
  "M50 3 93 26V74L50 97 7 74V26Z",                                     // hexagon
  "M8 8C30 14 70 14 92 8 92 56 82 82 50 97 18 82 8 56 8 8Z",           // curved top
];

// ---------- glyphs (authored in 0 0 40 40, bold & flat) ----------
export const GLYPHS: Record<string, string> = {
  Royals: "M4 30 6 12 13 20 20 8 27 20 34 12 36 30Z M4 33H36V37H4Z",
  Comets: "M30 10A8 8 0 1 1 29.9 10Z M24 14 4 4 12 18 2 22 16 24Z",
  Mavericks: "M6 12C2 6 4 2 4 2 8 8 12 9 15 10H25C28 9 32 8 36 2 36 2 38 6 34 12L30 16 28 32 20 38 12 32 10 16Z",
  Titans: "M8 6H32V12H24V36H16V12H8Z M4 2H36V6H4Z",
  Griffins: "M6 34 10 22 4 14 12 14 16 4 20 12 34 6 28 16 36 20 26 22 24 34 18 28 14 34Z",
  Herons: "M22 4C27 4 29 8 27 11L36 12 27 14 24 22C24 28 20 32 15 32L17 38H14L12 32 8 34 11 28C14 22 20 22 22 16 20 12 18 8 22 4Z",
  Thunder: "M24 2 6 22H18L14 38 34 16H22Z",
  Sparks: "M20 2 24 16 38 20 24 24 20 38 16 24 2 20 16 16Z M32 3 33.5 6.5 37 8 33.5 9.5 32 13 30.5 9.5 27 8 30.5 6.5Z",
  Orbit: "M20 12A8 8 0 1 1 19.9 12Z M20 6C30 6 38 12 38 20 38 28 30 34 20 34 10 34 2 28 2 20 2 12 10 6 20 6ZM20 10C12 10 6 14.5 6 20 6 25.5 12 30 20 30 28 30 34 25.5 34 20 34 14.5 28 10 20 10Z",
  Stags: "M14 18 8 12 6 4 9 4 10 9 12 6 13 12 16 16H24L27 12 28 6 30 9 31 4 34 4 32 12 26 18 28 24 24 36H16L12 24Z",
  Vipers: "M20 4C28 4 32 8 30 14L22 16C18 17 16 20 18 23 21 27 30 26 30 32 30 37 22 38 10 36 18 34 24 33 22 30 18 26 8 26 8 18 8 9 13 4 20 4Z",
  Pilots: "M20 2 23 14 38 22V26L23 22 22 32 27 36V38H13V36L18 32 17 22 2 26V22L17 14Z",
  Mariners: "M18 2H22V6H26V9H22V30C27 29 31 26 32 21L29 22 34 15 36 23 34 22C33 30 27 35 20 36 13 35 7 30 6 22L4 23 6 15 11 22 8 21C9 26 13 29 18 30V9H14V6H18Z",
  Knights: "M12 36H30V32H26C26 26 30 20 28 12 26 6 20 4 16 4L14 2 12 6 6 14 8 18 12 16 16 18 12 26Z",
  Pioneers: "M8 2H12V38H8Z M12 4H34L28 11 34 18H12Z",
  Kestrels: "M2 14 16 16 20 10 24 16 38 14 26 22 22 22 24 36 20 32 16 36 18 22 14 22Z",
  Bears: "M8 6A5 5 0 1 1 7.9 6Z M32 6A5 5 0 1 1 31.9 6Z M20 6C30 6 34 14 34 22 34 32 28 36 20 36 12 36 6 32 6 22 6 14 10 6 20 6Z",
  Phoenix: "M20 38 15 28C10 26 4 20 2 10 8 16 12 18 14 18 12 12 13 6 16 2 17 10 20 14 23 10 24 2 27 6 28 12 26 18 28 18 32 16 38 10 36 20 30 26 25 28Z",
  Ravens: "M4 22C8 16 16 12 22 12 24 8 30 6 34 10L38 12 34 14C34 20 30 26 24 28L26 36H22L20 29 14 34 16 28C10 28 6 26 4 22Z",
  Bison: "M4 14C4 8 8 6 8 6 8 10 10 12 14 12H26C30 12 32 10 32 6 32 6 36 8 36 14 36 18 32 20 30 20L28 32 20 38 12 32 10 20C8 20 4 18 4 14Z",
  Storm: "M10 22C4 22 2 18 2 15 2 11 6 8 10 9 12 4 18 2 23 4 26 2 32 3 34 8 38 9 38 16 34 19 32 22Z M14 25 10 38 22 28H17L20 25Z M26 25 24 33 30 25Z",
  Hawks: "M20 6 24 12 38 8 30 18 26 18 25 32 20 38 15 32 14 18 10 18 2 8 16 12Z",
  Falcons: "M2 6 18 18 20 14 22 18 38 6 30 22 24 24 22 36 20 32 18 36 16 24 10 22Z",
  Meteors: "M26 22A10 10 0 1 1 25.9 22Z M18 18 2 2 6 2 22 16Z M24 14 14 2 18 2 28 13Z M14 24 2 14 2 18 12 28Z",
  Lynx: "M6 2 14 12H26L34 2 34 18C34 30 28 36 20 36 12 36 6 30 6 18Z",
};
const FALLBACK = "M20 4 36 12V24C36 32 28 36 20 38 12 36 4 32 4 24V12Z";
const PATTERNS = ["plain", "plain", "stripes", "halves", "hoop", "sash", "chevron"] as const;

export function crestSpec(clubId: string, name = "") {
  const h = hash(clubId);
  const parts = name.replace(/\s+II$/, "").trim().split(/\s+/);
  const nickname = parts[parts.length - 1] ?? "";
  const city = parts.slice(0, -1).join(" ");
  const pal = pick(PALETTES, h, 1);
  const shield = ((h >>> 3) % SHIELDS.length);
  const pattern = pick([...PATTERNS], h, 3);
  const words = city.split(/[\s-]+/).filter(Boolean);
  const mono = (words.length > 1 ? words.map(w => w[0]).join("").slice(0, 3) : city.slice(0, 3)).toUpperCase();
  return { pal, shield, pattern, glyph: GLYPHS[nickname] ?? FALLBACK, nickname, mono };
}

export function Crest({ className = "h-24 w-24", clubId, name, monogram = true, title }: Props) {
  if (!clubId) {
    return (
      <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
        <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />
        <path d="M40 10 47 33 70 40 47 47 40 70 33 47 10 40 33 33Z" fill="var(--color-accent)" />
        <circle cx="40" cy="40" r="5.5" fill="var(--color-ink)" />
      </svg>
    );
  }
  const s = crestSpec(clubId, name);
  const [field, second, trim] = s.pal;
  const id = "c" + hash(clubId).toString(36);
  const shape = SHIELDS[s.shield];
  // glyph backing disc keeps the emblem readable over any pattern
  const pat = {
    plain: null,
    stripes: [22, 42, 62, 82].map(x => <rect key={x} x={x - 5} y="0" width="10" height="100" fill={second} />),
    halves: <rect x="50" y="0" width="50" height="100" fill={second} />,
    hoop: <rect x="0" y="36" width="100" height="30" fill={second} />,
    sash: <path d="M0 18 18 0 100 82 82 100Z" fill={second} />,
    chevron: <path d="M0 40 50 70 100 40V58L50 88 0 58Z" fill={second} />,
  }[s.pattern];
  const showMono = monogram;
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={title ?? name ?? clubId}>
      <defs><clipPath id={id}><path d={shape} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect width="100" height="100" fill={field} />
        {pat}
      </g>
      <circle cx="50" cy={showMono ? 42 : 50} r={showMono ? 23 : 26} fill={field} stroke={trim} strokeWidth="3" />
      <g transform={`translate(${50 - (showMono ? 16 : 18)},${(showMono ? 42 : 50) - (showMono ? 16 : 18)}) scale(${showMono ? 0.8 : 0.9})`}>
        <path d={s.glyph} fill={trim} fillRule="evenodd" />
      </g>
      {showMono && (
        <text x="50" y="86" textAnchor="middle" fontFamily="system-ui,Segoe UI,Arial,sans-serif"
          fontWeight="800" fontSize="12" letterSpacing="1" fill={trim}
          stroke={field} strokeWidth="3" paintOrder="stroke">{s.mono}</text>
      )}
      <path d={shape} fill="none" stroke={trim} strokeWidth="4" />
      <path d={shape} fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="1" />
    </svg>
  );
}
export default Crest;
