/** Merge a batch of new achievement unlocks into the toast queue. */
export function queueAchievements(list: string[], fresh: string[]): string[] {
  if (!fresh.length) return list;
  if (fresh.length === 1) return [...list, fresh[0]];
  return [...list, `achievements:${fresh.length}`];
}

/** The purchase toast always goes to the front and restarts immediately. */
export function queueBought(list: string[]): string[] {
  return ["bought", ...list.filter((token) => token !== "bought")];
}

export function isAchievementBatch(token: string) {
  return token.startsWith("achievements:");
}

export function achievementBatchCount(token: string) {
  return Number(token.slice("achievements:".length));
}
