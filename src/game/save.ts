import { isHairColor, isHairStyle, isSkin } from "./look";
import { OPEN_COUNTRIES, withEconomy } from "./economy";
import { unlockCountry, withDeviceCosmetics } from "./legacy";
import { SAVE_VERSION, type Career } from "./types";

const CAREER_KEY = "kochav-career-v10";
const OLD_CAREER_KEYS = ["kochav-career-v9", "kochav-career-v8"];
const SOUND_KEY = "kochav-sound";
const DAILY_KEY = "kochav-daily-v2";

export type DailyAttempt = {
  date: string;
  career: Career | null;
  seasons: number | null;
};

function isCareer(value: unknown): value is Career {
  if (!value || typeof value !== "object") return false;
  const data = value as Career;
  return data.version === SAVE_VERSION && !!data.player && !!data.season && typeof data.clubId === "string";
}

/**
 * Brings an older save up to the current version: v8 gets the economy fields
 * (coins 0, no gear, fresh ad counters) and the old device-wide boost/heal flags
 * move into the save so a refresh cannot reuse a reward. Unknown shapes return null.
 */
export function migrateCareer(raw: unknown): Career | null {
  const career = migrateShape(raw);
  return career ? withSkin(career) : null;
}

/** Drops look fields that are not valid ids so old or edited saves fall back to the default look. */
function withSkin(career: Career): Career {
  const { skin, hair, hairColor } = career.player;
  if ((skin === undefined || isSkin(skin)) && (hair === undefined || isHairStyle(hair)) && (hairColor === undefined || isHairColor(hairColor))) return career;
  const player = { ...career.player };
  if (!isSkin(skin)) delete player.skin;
  if (!isHairStyle(hair)) delete player.hair;
  if (!isHairColor(hairColor)) delete player.hairColor;
  return { ...career, player };
}

function migrateShape(raw: unknown): Career | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Career & { version: number };
  if (!data.player || !data.season || typeof data.clubId !== "string") return null;
  if (data.version === SAVE_VERSION) return withDeviceCosmetics(withEconomy(data));
  // v9 → v10: gear moves from [{key, amount}] to one tier per slot (withEconomy converts it).
  if (data.version === 9) return withDeviceCosmetics(withEconomy({ ...data, version: SAVE_VERSION } as Career));
  if (data.version !== 8) return null;
  const upgraded = withEconomy({ ...data, version: SAVE_VERSION } as Career);
  const id = boostId(data.player.name, data.year);
  upgraded.adState = { ...upgraded.adState, boostTaken: boostTaken(id), healTaken: healTaken(id) };
  // League unlocks live in the device profile; a career already running abroad keeps its country open.
  if (!upgraded.race && !upgraded.daily && !OPEN_COUNTRIES.includes(upgraded.countryId)) unlockCountry(upgraded.countryId);
  return withDeviceCosmetics(upgraded);
}

export function loadCareer(): Career | null {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (raw) {
      const parsed = migrateCareer(JSON.parse(raw));
      return parsed && isCareer(parsed) ? parsed : null;
    }
    for (const oldKey of OLD_CAREER_KEYS) {
      const old = localStorage.getItem(oldKey);
      if (!old) continue;
      const migrated = migrateCareer(JSON.parse(old));
      if (!migrated) continue;
      // Keep the old copy until the new save is written.
      localStorage.setItem(CAREER_KEY, JSON.stringify(migrated));
      if (localStorage.getItem(CAREER_KEY)) localStorage.removeItem(oldKey);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCareer(career: Career | null) {
  try {
    if (!career) localStorage.removeItem(CAREER_KEY);
    else localStorage.setItem(CAREER_KEY, JSON.stringify(career));
  } catch {
    /* private mode / quota — keep playing in memory */
  }
}

export function loadSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function saveSound(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

export function loadDailyAttempt(): DailyAttempt | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyAttempt;
    if (!parsed || typeof parsed.date !== "string") return null;
    if (parsed.career) parsed.career = migrateCareer(parsed.career);
    return parsed;
  } catch {
    return null;
  }
}

const STREAK_KEY = "star-streak";
const BOOST_KEY = "star-boost";

function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Daily-race streak. It grows by one on each day the player finishes at least
 * one season of the daily race (opening the app is not enough).
 * A freeze covers one missed day; a new player gets one, every 7-day milestone
 * adds one, and at most two are held. Freezes are never sold.
 */
export type StreakState = {
  /** Current streak in days; 0 when there is none. */
  n: number;
  freezes: number;
  best: number;
  playedToday: boolean;
  /** Freezes spent on missed days since the last check (for a one-time notice). */
  freezesUsed: number;
  /** Set when this update reached a milestone (7, 30, 100, ...). */
  milestone: number | null;
};

const STREAK_START_FREEZES = 1;
const STREAK_MAX_FREEZES = 2;
const STREAK_FREEZE_EVERY = 7;
const STREAK_MILESTONES = [7, 30, 100, 365];

type StoredStreak = { v: 2; date: string; n: number; freezes: number; best: number };

function daysSince(key: string, now = new Date()) {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return Infinity;
  const from = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - from.getTime()) / 86400000);
}

function shiftDay(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

/** Reads the stored streak; the v1 format ({ date, n }, counted on app open) keeps its count. */
function loadStreak(): StoredStreak | null {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<StoredStreak> & { date?: string; n?: number };
    if (typeof data?.date !== "string" || typeof data.n !== "number") return null;
    if (data.v === 2) return data as StoredStreak;
    // v1 counted app opens; an open today is not a race today, so today stays to play.
    const date = data.date === dayKey() ? shiftDay(-1) : data.date;
    return { v: 2, date, n: data.n, freezes: STREAK_START_FREEZES, best: data.n };
  } catch {
    return null;
  }
}

function storeStreak(state: StoredStreak) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Applies missed days: spends freezes for them, or ends the streak. Saves any change. */
function settleStreak(): { state: StoredStreak | null; freezesUsed: number } {
  const stored = loadStreak();
  if (!stored || stored.n <= 0) return { state: stored, freezesUsed: 0 };
  const missed = daysSince(stored.date) - 1;
  if (missed <= 0) return { state: stored, freezesUsed: 0 };
  if (missed <= stored.freezes) {
    // Covered: the missed days count as kept (not added), and the last kept day is yesterday.
    const kept = { ...stored, freezes: stored.freezes - missed, date: shiftDay(-1) };
    storeStreak(kept);
    return { state: kept, freezesUsed: missed };
  }
  const broken = { ...stored, n: 0 };
  storeStreak(broken);
  return { state: broken, freezesUsed: 0 };
}

function view(state: StoredStreak | null, freezesUsed: number, milestone: number | null): StreakState {
  if (!state) return { n: 0, freezes: STREAK_START_FREEZES, best: 0, playedToday: false, freezesUsed, milestone };
  return { n: state.n, freezes: state.freezes, best: state.best, playedToday: state.date === dayKey() && state.n > 0, freezesUsed, milestone };
}

/** On boot: the current streak, after spending freezes on any missed days. Does not add a day. */
export function readStreak(): StreakState {
  const { state, freezesUsed } = settleStreak();
  return view(state, freezesUsed, null);
}

/** Called when a daily-race season is finished. Adds today once. */
export function markStreakPlayed(): StreakState {
  const { state } = settleStreak();
  const today = dayKey();
  if (state && state.n > 0 && state.date === today) return view(state, 0, null);
  const continuing = state && state.n > 0 && daysSince(state.date) === 1;
  const n = continuing ? state.n + 1 : 1;
  let freezes = state ? state.freezes : STREAK_START_FREEZES;
  if (n % STREAK_FREEZE_EVERY === 0) freezes = Math.min(STREAK_MAX_FREEZES, freezes + 1);
  const next: StoredStreak = { v: 2, date: today, n, freezes, best: Math.max(state?.best ?? 0, n) };
  storeStreak(next);
  return view(next, 0, STREAK_MILESTONES.includes(n) ? n : null);
}

export function boostId(name: string, year: number) {
  return `${name}|${year}`;
}

export function boostTaken(id: string) {
  try {
    return localStorage.getItem(BOOST_KEY) === id;
  } catch {
    return false;
  }
}

export function markBoost(id: string) {
  try {
    localStorage.setItem(BOOST_KEY, id);
  } catch {
    /* ignore */
  }
}

export function saveDailyAttempt(attempt: DailyAttempt) {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(attempt));
  } catch {
    /* ignore */
  }
}

const HEAL_KEY = "star-heal";

export function healTaken(id: string) {
  try {
    return localStorage.getItem(HEAL_KEY) === id;
  } catch {
    return false;
  }
}

export function markHeal(id: string) {
  try {
    localStorage.setItem(HEAL_KEY, id);
  } catch {
    /* ignore */
  }
}
