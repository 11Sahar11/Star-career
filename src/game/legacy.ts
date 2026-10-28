import { overall, statCap } from "./engine";
import { ATTR_KEYS, type Career } from "./types";

// Legacy carries value from one finished career into the next.
// Points are paid once per career at retirement; perks apply to every new
// main career (never to the daily race, which must stay a level start).

export type PerkId = "academy1" | "mentor" | "academy2";

export const PERKS: { id: PerkId; cost: number; needs?: PerkId }[] = [
  { id: "academy1", cost: 40 },
  { id: "mentor", cost: 90 },
  { id: "academy2", cost: 150, needs: "academy1" },
];

export type Legacy = {
  points: number;
  earned: number;
  perks: PerkId[];
  paid: string[];
  doubled: string[];
};

const KEY = "star-legacy-v1";
const EMPTY: Legacy = { points: 0, earned: 0, perks: [], paid: [], doubled: [] };

export function loadLegacy(): Legacy {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const data = JSON.parse(raw) as Partial<Legacy>;
    return {
      points: typeof data.points === "number" ? data.points : 0,
      earned: typeof data.earned === "number" ? data.earned : 0,
      perks: Array.isArray(data.perks) ? data.perks.filter((id): id is PerkId => PERKS.some((perk) => perk.id === id)) : [],
      paid: Array.isArray(data.paid) ? data.paid.slice(-50) : [],
      doubled: Array.isArray(data.doubled) ? data.doubled.slice(-50) : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function saveLegacy(legacy: Legacy) {
  try {
    localStorage.setItem(KEY, JSON.stringify(legacy));
  } catch {
    /* private mode: legacy just will not persist */
  }
}

export function careerKey(career: Career) {
  return `${career.player.name}|${career.year}|${career.totals.apps}|${career.totals.goals}`;
}

export function peakOverall(career: Career) {
  return career.history.reduce((best, row) => Math.max(best, row.ovr), overall(career.player.position, career.player.attrs));
}

export function legacyPoints(career: Career) {
  const peak = peakOverall(career);
  return career.totals.seasons * 5 + Math.floor(career.totals.goals / 5) + career.trophies.length * 20 + Math.max(0, peak - 70);
}

/** Pays the career's points once. Safe to call on every render of the retired screen. */
export function payLegacy(career: Career): { legacy: Legacy; gained: number } {
  const legacy = loadLegacy();
  const key = careerKey(career);
  const gained = legacyPoints(career);
  if (legacy.paid.includes(key)) return { legacy, gained };
  const next = { ...legacy, points: legacy.points + gained, earned: legacy.earned + gained, paid: [...legacy.paid, key] };
  saveLegacy(next);
  return { legacy: next, gained };
}

export function canDouble(career: Career) {
  const legacy = loadLegacy();
  const key = careerKey(career);
  return legacy.paid.includes(key) && !legacy.doubled.includes(key);
}

/** Rewarded clip: pays the career's points a second time, once. */
export function doubleLegacy(career: Career): Legacy {
  const legacy = loadLegacy();
  const key = careerKey(career);
  if (!legacy.paid.includes(key) || legacy.doubled.includes(key)) return legacy;
  const gained = legacyPoints(career);
  const next = { ...legacy, points: legacy.points + gained, earned: legacy.earned + gained, doubled: [...legacy.doubled, key] };
  saveLegacy(next);
  return next;
}

export function perkState(legacy: Legacy, id: PerkId): "owned" | "locked" | "short" | "ready" {
  const perk = PERKS.find((item) => item.id === id);
  if (!perk) return "locked";
  if (legacy.perks.includes(id)) return "owned";
  if (perk.needs && !legacy.perks.includes(perk.needs)) return "locked";
  return legacy.points >= perk.cost ? "ready" : "short";
}

export function buyPerk(id: PerkId): Legacy {
  const legacy = loadLegacy();
  if (perkState(legacy, id) !== "ready") return legacy;
  const perk = PERKS.find((item) => item.id === id);
  if (!perk) return legacy;
  const next = { ...legacy, points: legacy.points - perk.cost, perks: [...legacy.perks, id] };
  saveLegacy(next);
  return next;
}

/** Applies owned perks to a freshly created main career. */
export function applyPerks(career: Career, perks: PerkId[]): Career {
  if (!perks.length) return career;
  const player = career.player;
  const potential = perks.includes("mentor") ? Math.min(99, player.potential + 3) : player.potential;
  const bump = (perks.includes("academy1") ? 1 : 0) + (perks.includes("academy2") ? 2 : 0);
  const attrs = { ...player.attrs };
  for (const key of ATTR_KEYS) {
    attrs[key] = Math.max(attrs[key], Math.min(attrs[key] + bump, statCap(player.position, potential, key)));
  }
  return { ...career, player: { ...player, potential, attrs } };
}
