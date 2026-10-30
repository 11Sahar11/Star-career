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

function mix(hex: string, toward: string, amount: number): string {
  const a = rgb(hex);
  const b = rgb(toward);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const GROUND = "#0e0e10";

/** Theme for a club id; the keeper kit is not used, the club's own colours are. */
export function clubTheme(teamId: string): ClubTheme {
  const club = CLUBS.find((c) => c.id === teamId);
  const [field, second, trim] = crestSpec(teamId, club?.name ?? "").pal;
  const ink = contrast(field, "#ffffff") >= contrast(field, "#111317") ? "#ffffff" : "#111317";
  // The stripe must differ from the field; fall back to the trim, then to the ink.
  const stripe = distance(field, second) > 70 ? second : distance(field, trim) > 70 ? trim : ink;
  let text = field;
  for (let i = 1; i <= 10 && contrast(text, GROUND) < 4.5; i++) text = mix(field, "#ffffff", i * 0.1);
  return { club: field, club2: stripe, ink, text };
}

/** The STAR default before a career exists. */
export const STAR_THEME: ClubTheme = { club: "#ff5a1f", club2: "#0e0e10", ink: "#0e0e10", text: "#ff6a2b" };
