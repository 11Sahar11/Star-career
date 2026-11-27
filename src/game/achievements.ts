import { careerAim, overall } from "./engine";
import { kvGet, kvSet } from "./kv";
import type { Career } from "./types";

/**
 * Achievements span careers: once unlocked they stay, so every new career
 * has something left to chase. Only the main career unlocks them; the daily
 * race starts strong and would hand them out for free.
 */
export type Achievement = {
  id: string;
  /** Ordered roughly by when a player first reaches it. */
  test: (career: Career) => boolean;
};

const countEvents = (career: Career, check: (text: string) => boolean) =>
  career.season.fixturesPlayed.reduce((sum, log) => sum + log.events.filter((event) => check(event.text)).length, 0);

const hasTrophy = (career: Career, prefix: string) => career.trophies.some((trophy) => trophy.id.startsWith(prefix));

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_goal", test: (c) => c.totals.goals >= 10 },
  { id: "moment_goal", test: (c) => countEvents(c, (text) => /^@mo\.goal\.(shoot|dribble)/.test(text)) >= 3 },
  { id: "moment_stop", test: (c) => countEvents(c, (text) => text.startsWith("@mo.stop.")) >= 3 },
  { id: "rating_9", test: (c) => c.season.fixturesPlayed.filter((log) => !log.missed && log.rating >= 9).length >= 3 },
  { id: "hat_trick", test: (c) => c.season.fixturesPlayed.filter((log) => log.goals >= 3).length >= 2 || c.history.some((row) => row.goals >= 20) },
  { id: "goals_season_15", test: (c) => c.season.goals >= 25 || c.history.some((row) => row.goals >= 25) },
  { id: "first_trophy", test: (c) => c.trophies.length >= 1 },
  { id: "cup", test: (c) => hasTrophy(c, "cup-") },
  { id: "top_flight", test: (c) => careerAim(c) !== "division" },
  { id: "league_title", test: (c) => hasTrophy(c, "league-") },
  { id: "golden_boot", test: (c) => hasTrophy(c, "boot-") },
  { id: "first_cap", test: (c) => c.totals.caps >= 1 },
  { id: "ovr_80", test: (c) => overall(c.player.position, c.player.attrs) >= 80 },
  { id: "goals_100", test: (c) => c.totals.goals >= 100 },
  { id: "caps_25", test: (c) => c.totals.caps >= 25 },
  { id: "ovr_90", test: (c) => overall(c.player.position, c.player.attrs) >= 90 },
  { id: "ballon", test: (c) => hasTrophy(c, "ballon-") },
  { id: "seasons_15", test: (c) => c.totals.seasons >= 15 },
];

const KEY = "star-achievements-v1";

export function loadUnlocked(): Record<string, string> {
  try {
    const raw = kvGet(KEY);
    const data = raw ? (JSON.parse(raw) as unknown) : null;
    return data && typeof data === "object" ? (data as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Unlocks whatever the career now satisfies and returns the ids that are new. */
export function checkAchievements(career: Career): string[] {
  const unlocked = loadUnlocked();
  const fresh = ACHIEVEMENTS.filter((item) => !unlocked[item.id] && item.test(career)).map((item) => item.id);
  if (!fresh.length) return [];
  const stamp = new Date().toISOString().slice(0, 10);
  for (const id of fresh) unlocked[id] = stamp;
  try {
    kvSet(KEY, JSON.stringify(unlocked));
  } catch {
    /* private mode: the toast still shows, the unlock just is not kept */
  }
  return fresh;
}
