/**
 * Team kit colours (data only; the character art is not recoloured yet).
 * Outfield kits reuse each club's crest palette so shirt and crest match.
 * Keepers get their own colour that stays clear of the outfield kit.
 */
import { crestSpec } from "@/components/game/crest";
import { CLUBS } from "@/game/data";
import type { Career } from "@/game/types";

export type TeamKit = {
  /** Shirt and shorts. */
  primary: string;
  /** Sleeves and collar. */
  secondary: string;
};

/** Keeper colours, tried in order until one is far enough from the outfield shirt. */
const GK_COLORS = ["#2bd94a", "#ff8a1f", "#e8e22c", "#ff4fa3", "#8a5cff", "#22c4d6", "#1b1d22"];

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function distance(a: string, b: string): number {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}
/** Readable trim on top of a colour: dark on light shirts, white on dark ones. */
function trimFor(hex: string): string {
  const [r, g, b] = rgb(hex);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? "#111317" : "#ffffff";
}

const cache = new Map<string, { outfield: TeamKit; keeper: TeamKit }>();

function kitsFor(teamId: string): { outfield: TeamKit; keeper: TeamKit } {
  const hit = cache.get(teamId);
  if (hit) return hit;
  const club = CLUBS.find((c) => c.id === teamId);
  const [field, second, trim] = crestSpec(teamId, club?.name ?? "").pal;
  const outfield: TeamKit = { primary: field, secondary: distance(field, second) > 60 ? second : trim };
  const gk = GK_COLORS.find((c) => distance(c, outfield.primary) > 140 && distance(c, outfield.secondary) > 90) ?? GK_COLORS[GK_COLORS.length - 1];
  const keeper: TeamKit = { primary: gk, secondary: trimFor(gk) };
  const kits = { outfield, keeper };
  cache.set(teamId, kits);
  return kits;
}

/** Kit for a team; pass the player's current club id so the kit follows transfers. */
export function getTeamKit(teamId: string, isGoalkeeper = false): TeamKit {
  const kits = kitsFor(teamId);
  return isGoalkeeper ? kits.keeper : kits.outfield;
}

/** Kit the player wears right now: current club, keeper kit for goalkeepers. */
export function playerKit(career: Pick<Career, "clubId" | "player">): TeamKit {
  return getTeamKit(career.clubId, career.player.position === "GK");
}

/** Colours a club's announcement graphic is built from. */
export type ClubTheme = {
  /** The field: the club's main colour. */
  club: string;
  /** The stripe along the diagonal cut. */
  club2: string;
  /** Text and marks on the field. */
  ink: string;
  /** The club colour lifted until it reads as text on the kit-black ground. */
  text: string;
};

function lum(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const GROUND = "#0e0e10";

function toLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function fromLinear(v: number): number {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

/** sRGB hex to OKLCH [lightness, chroma, hue in radians]. */
function toOklch(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

/** OKLCH to sRGB hex, or null when the colour falls outside sRGB. */
function fromOklch(L: number, C: number, h: number): string | null {
  const A = C * Math.cos(h);
  const B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  if (lin.some((v) => v < -0.0005 || v > 1.0005)) return null;
  return `#${lin.map((v) => fromLinear(v).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * The club colour made readable as text on the kit-black ground (4.5:1): lighter in OKLCH,
 * same hue, as vivid as sRGB allows. Mixing with white instead turns dark reds salmon.
 */
function liftForText(field: string): string {
  if (contrast(field, GROUND) >= 4.5) return field;
  const [L0, C0, h] = toOklch(field);
  for (let L = L0 + 0.02; L <= 0.99; L += 0.02) {
    for (let C = C0; C >= 0; C -= 0.01) {
      const hex = fromOklch(L, C, h);
      if (!hex) continue;
      if (contrast(hex, GROUND) >= 4.5) return hex;
      break;
    }
  }
  return "#ffffff";
}

/** Theme for a club id; the keeper kit is not used, the club's own colours are. */
export function clubTheme(teamId: string): ClubTheme {
  const club = CLUBS.find((c) => c.id === teamId);
  const [field, second, trim] = crestSpec(teamId, club?.name ?? "").pal;
  const ink = contrast(field, "#ffffff") >= contrast(field, "#111317") ? "#ffffff" : "#111317";
  // The stripe sits between the field and the kit-black ground, so it must differ from both:
  // the club's second colour first, then its trim, then the ink, then white.
  const stripe =
    [second, trim, ink, "#ffffff"].find((c) => distance(field, c) > 70 && contrast(c, GROUND) >= 1.5) ?? "#ffffff";
  return { club: field, club2: stripe, ink, text: liftForText(field) };
}

/** The STAR default before a career exists. */
export const STAR_THEME: ClubTheme = { club: "#ff5a1f", club2: "#ffffff", ink: "#0e0e10", text: "#ff6a2b" };

/** Lets a hyphenated name ("Umm al-Fahm") wrap only between words, never after the hyphen. */
export function keepHyphens(name: string): string {
  return name.replace(/-/g, "-⁠");
}
