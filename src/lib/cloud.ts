import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sessionMiddleware } from "./access";

/**
 * Cloud features: a career backup for signed-in players, and the daily race
 * leaderboard. Both need a real database. On a deployment without
 * DATABASE_URL the app runs on a temporary in-memory fallback, so the features
 * report themselves unavailable there and the UI hides them.
 *
 * Fetched on demand (opening a screen, finishing a season); no polling.
 */

function cloudAvailable() {
  const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());
  return hasDatabase || process.env.NODE_ENV !== "production";
}

/** Bigger than any real career; stops a client from filling the database. */
const MAX_SAVE_BYTES = 1_000_000;

export type CloudSaveInfo = { playerName: string; seasonYear: number; updatedAt: string };
export type CloudStatus = { available: boolean; signedIn: boolean; save: CloudSaveInfo | null };

export const getCloudStatus = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<CloudStatus> => {
    if (!cloudAvailable()) return { available: false, signedIn: false, save: null };
    const { getSessionUser } = await import("./auth/verify.server");
    const user = await getSessionUser(context.bearerToken);
    if (!user) return { available: true, signedIn: false, save: null };
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{ player_name: string; season_year: number; updated_at: Date | string }>`
      select player_name, season_year, updated_at from career_saves where user_id = ${user.id}`;
    const row = rows[0];
    return {
      available: true,
      signedIn: true,
      save: row ? { playerName: row.player_name, seasonYear: row.season_year, updatedAt: new Date(row.updated_at).toISOString() } : null,
    };
  });

const uploadInput = z.object({
  data: z.string().max(MAX_SAVE_BYTES),
  saveVersion: z.number().int().min(1).max(1000),
  playerName: z.string().max(40),
  seasonYear: z.number().int().min(2000).max(2200),
});

/** Stores the signed-in player's career (as JSON text). */
export const uploadCareer = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .inputValidator((input: unknown) => uploadInput.parse(input))
  .handler(async ({ data: input, context }): Promise<{ saved: boolean; updatedAt: string | null }> => {
    if (!cloudAvailable()) return { saved: false, updatedAt: null };
    const { getSessionUser } = await import("./auth/verify.server");
    const user = await getSessionUser(context.bearerToken);
    if (!user) return { saved: false, updatedAt: null };
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.data);
    } catch {
      return { saved: false, updatedAt: null };
    }
    if (!parsed || typeof parsed !== "object") return { saved: false, updatedAt: null };
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{ updated_at: Date | string }>`
      insert into career_saves (user_id, data, save_version, player_name, season_year, updated_at)
      values (${user.id}, ${input.data}::jsonb, ${input.saveVersion}, ${input.playerName}, ${input.seasonYear}, now())
      on conflict (user_id) do update set
        data = excluded.data,
        save_version = excluded.save_version,
        player_name = excluded.player_name,
        season_year = excluded.season_year,
        updated_at = now()
      returning updated_at`;
    return { saved: true, updatedAt: rows[0] ? new Date(rows[0].updated_at).toISOString() : null };
  });

/** The signed-in player's stored career as JSON text, or null. The client migrates it like a local save. */
export const downloadCareer = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<{ data: string | null }> => {
    if (!cloudAvailable()) return { data: null };
    const { getSessionUser } = await import("./auth/verify.server");
    const user = await getSessionUser(context.bearerToken);
    if (!user) return { data: null };
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{ data: string }>`select data::text as data from career_saves where user_id = ${user.id}`;
    return { data: rows[0]?.data ?? null };
  });

// ---- Daily race leaderboard ----

const dayKey = z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/);

/** A day key is accepted only if it is today somewhere on Earth (UTC-12 to UTC+14). */
function isPlausibleDay(day: string) {
  const now = Date.now();
  for (let hours = -12; hours <= 14; hours++) {
    const local = new Date(now + hours * 3600000);
    if (`${local.getUTCFullYear()}-${local.getUTCMonth() + 1}-${local.getUTCDate()}` === day) return true;
  }
  return false;
}

/** Display names: letters, digits, spaces and a few marks; trimmed to 16. */
function cleanName(name: string) {
  const cleaned = name
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} ._'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  return cleaned || "Star";
}

const submitInput = z.object({
  day: dayKey,
  deviceId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  name: z.string().max(40),
  position: z.string().regex(/^[A-Z]{1,4}$/),
  seasons: z.number().int().min(1).max(40),
  try: z.number().int().min(1).max(999),
});

export const submitDailyScore = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .inputValidator((input: unknown) => submitInput.parse(input))
  .handler(async ({ data: input }): Promise<{ saved: boolean }> => {
    if (!cloudAvailable() || !isPlausibleDay(input.day)) return { saved: false };
    const { getSql } = await import("./db");
    const sql = await getSql();
    const name = cleanName(input.name);
    // Keep the device's best row: fewer seasons wins; on a tie the earlier try stays.
    await sql`
      insert into daily_scores (day, device_id, name, position, seasons, try)
      values (${input.day}, ${input.deviceId}, ${name}, ${input.position}, ${input.seasons}, ${input.try})
      on conflict (day, device_id) do update set
        name = excluded.name,
        position = excluded.position,
        seasons = excluded.seasons,
        try = excluded.try,
        created_at = now()
      where excluded.seasons < daily_scores.seasons
        or (excluded.seasons = daily_scores.seasons and excluded.try < daily_scores.try)`;
    return { saved: true };
  });

export type DailyBoardRow = { rank: number; name: string; seasons: number; try: number; you: boolean };
export type DailyBoardResult = { available: boolean; total: number; top: DailyBoardRow[]; you: DailyBoardRow | null };

const boardInput = z.object({ day: dayKey, deviceId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/).optional() });

/** Top 20 for a day, plus the device's own row when it is outside the top. */
export const getDailyLeaderboard = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .inputValidator((input: unknown) => boardInput.parse(input))
  .handler(async ({ data: input }): Promise<DailyBoardResult> => {
    if (!cloudAvailable()) return { available: false, total: 0, top: [], you: null };
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{ rank: number; name: string; seasons: number; try: number; device_id: string; total: number }>`
      with ranked as (
        select device_id, name, seasons, try,
          rank() over (order by seasons, try, created_at) as rank,
          count(*) over () as total
        from daily_scores where day = ${input.day}
      )
      select rank, name, seasons, try, device_id, total from ranked
      where rank <= 20 or device_id = ${input.deviceId ?? ""}
      order by rank
      limit 21`;
    const toRow = (row: (typeof rows)[number]): DailyBoardRow => ({
      rank: Number(row.rank),
      name: row.name,
      seasons: Number(row.seasons),
      try: Number(row.try),
      you: !!input.deviceId && row.device_id === input.deviceId,
    });
    const all = rows.map(toRow);
    return {
      available: true,
      total: Number(rows[0]?.total ?? 0),
      top: all.filter((row) => row.rank <= 20),
      you: all.find((row) => row.you) ?? null,
    };
  });
