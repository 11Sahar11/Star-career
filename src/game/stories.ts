import type { AttrKey, Career, PendingStory, StoryEffect } from "./types";

/**
 * Short choices between matches. Each story has two answers with a fixed,
 * visible effect, so a choice is a trade rather than a gamble.
 * Text lives in i18n under story.<id>.q / .a / .b.
 */
export type Story = {
  id: string;
  /** Only offered when this returns true. */
  when?: (career: Career) => boolean;
  a: StoryEffect;
  b: StoryEffect;
};

const TOP_ATTR: Record<string, AttrKey> = {
  GK: "physical",
  CB: "tackle",
  FB: "pace",
  CDM: "tackle",
  CM: "passing",
  CAM: "passing",
  W: "dribbling",
  ST: "shooting",
};

export const STORIES: Story[] = [
  { id: "press", a: { morale: 5 }, b: { reputation: 4, morale: -3 } },
  { id: "extra", a: { attrDelta: 1, fitness: -15 }, b: { fitness: 15 } },
  {
    id: "captain",
    when: (career) => career.player.age >= 23 && (career.role === "Star" || career.role === "Starter"),
    a: { morale: 8, reputation: 2 },
    b: { morale: 2, form: 3 },
  },
  { id: "agent", a: { form: 5 }, b: { reputation: 3, morale: -2 } },
  { id: "academy", a: { morale: 6, reputation: 2, fitness: -5 }, b: { fitness: 6 } },
  { id: "teammate", a: { morale: 4 }, b: { reputation: -2, form: 4 } },
  { id: "diet", a: { attr: "physical", attrDelta: 1, morale: -3 }, b: { morale: 3 } },
  { id: "social", a: { reputation: 3, form: -3 }, b: { form: 3 } },
];

export function storyById(id: string): Story | undefined {
  return STORIES.find((story) => story.id === id);
}

/** About three a season: every seventh match from the fourth, three times in five, a story not seen recently. */
export function rollStory(career: Career, roll: () => number): PendingStory | null {
  if (career.story || career.retired) return null;
  const played = career.season.fixturesPlayed.length;
  if (played < 4 || played % 7 !== 4) return null;
  if (roll() > 0.6) return null;
  const seen = career.storiesSeen ?? [];
  let pool = STORIES.filter((story) => !seen.includes(story.id) && (!story.when || story.when(career)));
  if (!pool.length) pool = STORIES.filter((story) => !story.when || story.when(career));
  const story = pool[Math.floor(roll() * pool.length)] ?? pool[0];
  return story ? { id: story.id } : null;
}

export function storyAttr(career: Career, effect: StoryEffect): AttrKey {
  return effect.attr ?? TOP_ATTR[career.player.position] ?? "physical";
}

const clampTo = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function answerStory(career: Career, choice: "a" | "b"): Career {
  const pending = career.story;
  const story = pending ? storyById(pending.id) : undefined;
  if (!story) return { ...career, story: null };
  const effect = story[choice];
  const player = { ...career.player, attrs: { ...career.player.attrs } };
  if (effect.morale) player.morale = clampTo(player.morale + effect.morale, 5, 100);
  if (effect.form) player.form = clampTo(player.form + effect.form, 8, 100);
  if (effect.fitness) player.fitness = clampTo(player.fitness + effect.fitness, 24, 100);
  if (effect.attrDelta) {
    const key = storyAttr(career, effect);
    player.attrs[key] = clampTo(player.attrs[key] + effect.attrDelta, 28, 99);
  }
  const reputation = effect.reputation ? clampTo(career.reputation + effect.reputation, 0, 100) : career.reputation;
  const seen = [...(career.storiesSeen ?? []).filter((id) => id !== story.id), story.id].slice(-6);
  return { ...career, player, reputation, story: null, storiesSeen: seen };
}
