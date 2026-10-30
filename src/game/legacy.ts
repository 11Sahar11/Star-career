import { isTopLeague, overall, statCap } from "./engine";
import { ECONOMY, OPEN_COUNTRIES } from "./economy";
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

/** Admin tool: add points (for testing the perk shop). */
export function adminGrant(points: number): Legacy {
  const legacy = loadLegacy();
  const next = { ...legacy, points: legacy.points + points, earned: legacy.earned + points };
  saveLegacy(next);
  return next;
}

/** Admin tool: own every perk without spending points. */
export function adminUnlockAll(): Legacy {
  const legacy = loadLegacy();
  const next = { ...legacy, perks: PERKS.map((perk) => perk.id) };
  saveLegacy(next);
  return next;
}

// ---------- device-level economy state (not per career) ----------


export type DeviceEconomy = {
  unlockedCountries: string[];
  dailyLoginDate: string | null;
  dailyRetryDate: string | null;
  removeAds: { owned: boolean; checkedAt: number; purchaseToken?: string };
  /** Coins carried from the last retired career into the next one. */
  coinBonus: number;
  careersFinished: number;
  settled: string[];
  /** Permanent cosmetics (colours, captain armband, ...), shared by every career. */
  cosmetics: string[];
};

const DEVICE_KEY = "star-economy-v1";

export function loadDevice(): DeviceEconomy {
  const empty: DeviceEconomy = { unlockedCountries: [], dailyLoginDate: null, dailyRetryDate: null, removeAds: { owned: false, checkedAt: 0 }, coinBonus: 0, careersFinished: 0, settled: [], cosmetics: [] };
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    if (!raw) return empty;
    const data = JSON.parse(raw) as Partial<DeviceEconomy>;
    return {
      unlockedCountries: Array.isArray(data.unlockedCountries) ? data.unlockedCountries.filter((id) => typeof id === "string") : [],
      dailyLoginDate: typeof data.dailyLoginDate === "string" ? data.dailyLoginDate : null,
      dailyRetryDate: typeof data.dailyRetryDate === "string" ? data.dailyRetryDate : null,
      removeAds: data.removeAds && typeof data.removeAds.owned === "boolean" ? data.removeAds : empty.removeAds,
      coinBonus: typeof data.coinBonus === "number" ? Math.max(0, Math.min(ECONOMY.legacyMax, data.coinBonus)) : 0,
      careersFinished: typeof data.careersFinished === "number" ? data.careersFinished : 0,
      settled: Array.isArray(data.settled) ? data.settled : [],
      cosmetics: Array.isArray(data.cosmetics) ? data.cosmetics.filter((id) => typeof id === "string") : [],
    };
  } catch {
    return empty;
  }
}

export function saveDevice(device: DeviceEconomy) {
  try {
    localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
  } catch {
    /* ignore */
  }
}

export function countryOpen(device: DeviceEconomy, countryId: string, admin = false) {
  return admin || OPEN_COUNTRIES.includes(countryId) || device.unlockedCountries.includes(countryId);
}

export function unlockCountry(countryId: string): DeviceEconomy {
  const device = loadDevice();
  if (device.unlockedCountries.includes(countryId)) return device;
  const next = { ...device, unlockedCountries: [...device.unlockedCountries, countryId] };
  saveDevice(next);
  return next;
}

/** Retirement: counts the finished career (coins reset; leagues open only by purchase). */
export function settleRetirement(career: Career, nextLocked: string | null): DeviceEconomy {
  const device = loadDevice();
  const key = careerKey(career);
  if (device.settled.includes(key)) return device;
  const bonus = Math.min(ECONOMY.legacyMax, Math.floor((career.coins ?? 0) * ECONOMY.legacyShare));
  const finished = device.careersFinished + 1;
  const unlocked = [...device.unlockedCountries];
  // Leagues open only through the store (no free unlock path).
  void nextLocked;
  const next = { ...device, coinBonus: bonus, careersFinished: finished, unlockedCountries: unlocked, settled: [...device.settled, key].slice(-50) };
  saveDevice(next);
  return next;
}

export type ChestReward = { kind: "coins"; coins: number } | { kind: "camp" };

/** Today's chest, or null once opened. Every few days it holds a key camp instead of coins. */
export function chestToday(today: string): ChestReward | null {
  const device = loadDevice();
  if (device.dailyLoginDate === today) return null;
  let hash = 0;
  for (const ch of today) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % ECONOMY.chest.campEvery === 0 ? { kind: "camp" } : { kind: "coins", coins: ECONOMY.chest.coins };
}

/** Marks today's chest opened (device-wide, once a day). */
export function markChest(today: string) {
  saveDevice({ ...loadDevice(), dailyLoginDate: today });
}

export function takeCoinBonus(): number {
  const device = loadDevice();
  if (!device.coinBonus) return 0;
  saveDevice({ ...device, coinBonus: 0 });
  return device.coinBonus;
}

/** Adds a permanent cosmetic to the device profile. */
export function ownCosmetic(id: string): DeviceEconomy {
  const device = loadDevice();
  if (device.cosmetics.includes(id)) return device;
  const next = { ...device, cosmetics: [...device.cosmetics, id] };
  saveDevice(next);
  return next;
}

/** Cosmetics are permanent: a career shows every cosmetic the device owns, and older careers' cosmetics move to the device. */
export function withDeviceCosmetics(career: Career): Career {
  if (career.race) return career;
  let device = loadDevice();
  for (const id of career.cosmetics ?? []) if (!device.cosmetics.includes(id)) device = ownCosmetic(id);
  const all = [...new Set([...(career.cosmetics ?? []), ...device.cosmetics])];
  return all.length === (career.cosmetics ?? []).length ? career : { ...career, cosmetics: all };
}
