import { SAVE_VERSION, type Career } from "./types";

const CAREER_KEY = "kochav-career-v8";
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

export function loadCareer(): Career | null {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCareer(parsed) ? parsed : null;
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
    if (parsed.career && parsed.career.version !== SAVE_VERSION) parsed.career = null;
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

export function touchStreak(): number {
  const today = dayKey();
  const prevDate = new Date();
  prevDate.setDate(prevDate.getDate() - 1);
  const yesterday = dayKey(prevDate);
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const prev = raw ? (JSON.parse(raw) as { date?: string; n?: number }) : null;
    if (prev?.date === today && typeof prev.n === "number") return prev.n;
    const n = prev?.date === yesterday && typeof prev.n === "number" ? prev.n + 1 : 1;
    localStorage.setItem(STREAK_KEY, JSON.stringify({ date: today, n }));
    return n;
  } catch {
    return 1;
  }
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
