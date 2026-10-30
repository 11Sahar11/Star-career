import { ECONOMY } from "./economy";
import type { AttrKey, Career, GearLoadout, GearSlotId, GearTierId, LegacyGearItem, PositionId } from "./types";

// Equipment logic. No UI here: the "My Player" screen reads GEAR_SLOTS / GEAR_TIERS by id,
// so its visuals can be swapped without touching any rule. Numbers live in ECONOMY.gear.
// (ECONOMY is only read inside functions: economy.ts imports this module.)

export type GearSlot = {
  /** Stable id, saved in Career.gear. */
  id: GearSlotId;
  /** Attribute the slot adds to (outfield). */
  attr: AttrKey;
  /** Key-match situations it is meant for (outfield). */
  situations: string[];
  /** Keepers wear a different item in this slot. */
  keeper?: { item: string; attr: AttrKey; situations: string[] };
  /** Extra effect: lower match-injury chance. */
  injury?: boolean;
};

/** The 6 fixed slots, one per situation type. `item` ids (for i18n/art) = slot id or keeper.item. */
export const GEAR_SLOTS: readonly GearSlot[] = [
  { id: "kick", attr: "shooting", situations: ["penalty", "freekick"], keeper: { item: "gk-dive", attr: "physical", situations: ["gkdive"] } },
  { id: "dribble", attr: "dribbling", situations: ["oneonone"], keeper: { item: "gk-claim", attr: "tackle", situations: ["gkstand", "gkcomeoff"] } },
  { id: "sleeve", attr: "pace", situations: ["runbehind"] },
  { id: "headband", attr: "physical", situations: ["aerial"] },
  { id: "wristband", attr: "passing", situations: ["keypass"] },
  { id: "shin", attr: "tackle", situations: ["defend"], injury: true },
];

export const GEAR_TIERS: readonly GearTierId[] = ["bronze", "silver", "gold"];

export function isGearSlot(value: unknown): value is GearSlotId {
  return typeof value === "string" && GEAR_SLOTS.some((slot) => slot.id === value);
}

function isTier(value: unknown): value is GearTierId {
  return typeof value === "string" && (GEAR_TIERS as readonly string[]).includes(value);
}

export function tierInfo(tier: GearTierId) {
  return ECONOMY.gear.tiers[tier];
}

/** Slot as worn by this position: item id (for labels/art), attribute and situations. */
export function slotFor(slot: GearSlot, position: PositionId) {
  if (position === "GK" && slot.keeper) return { id: slot.id, item: slot.keeper.item, attr: slot.keeper.attr, situations: slot.keeper.situations, injury: !!slot.injury };
  return { id: slot.id, item: slot.id as string, attr: slot.attr, situations: slot.situations, injury: !!slot.injury };
}

/** Fills/upgrades older gear shapes: v9 saved [{key, amount}] → the slot for that attribute. */
export function normalizeGear(raw: unknown): GearLoadout {
  const out: GearLoadout = {};
  if (Array.isArray(raw)) {
    for (const item of raw as LegacyGearItem[]) {
      const slot = GEAR_SLOTS.find((entry) => entry.attr === item?.key);
      if (!slot) continue;
      const tier: GearTierId = item.amount >= 2 ? "silver" : "bronze";
      if (!out[slot.id] || GEAR_TIERS.indexOf(tier) > GEAR_TIERS.indexOf(out[slot.id]!)) out[slot.id] = tier;
    }
    return out;
  }
  if (raw && typeof raw === "object") {
    for (const [key, tier] of Object.entries(raw)) if (isGearSlot(key) && isTier(tier)) out[key] = tier;
  }
  return out;
}

/** Tier a slot plays at; `keyMatch` lets the "try gold" item count. */
export function slotTier(career: Career, slot: GearSlotId, keyMatch = false): GearTierId | null {
  if (keyMatch && career.gearTrial === slot) return "gold";
  return career.gear?.[slot] ?? null;
}

/** Attribute points from gear, per attribute, capped at ECONOMY.gear.attrCap. */
export function gearBonus(career: Career, keyMatch = false): Partial<Record<AttrKey, number>> {
  const out: Partial<Record<AttrKey, number>> = {};
  for (const slot of GEAR_SLOTS) {
    const tier = slotTier(career, slot.id, keyMatch);
    if (!tier) continue;
    const { attr } = slotFor(slot, career.player.position);
    out[attr] = Math.min(ECONOMY.gear.attrCap, (out[attr] ?? 0) + tierInfo(tier).bonus);
  }
  return out;
}

/** Item (slot variant id) giving the most to an attribute, for button labels. */
export function gearItemFor(career: Career, attr: AttrKey, keyMatch = false): string | null {
  let best: { item: string; bonus: number } | null = null;
  for (const slot of GEAR_SLOTS) {
    const tier = slotTier(career, slot.id, keyMatch);
    const worn = slotFor(slot, career.player.position);
    if (!tier || worn.attr !== attr) continue;
    const bonus = tierInfo(tier).bonus;
    if (!best || bonus > best.bonus) best = { item: worn.item, bonus };
  }
  return best?.item ?? null;
}

/** Multiplier on the match-injury chance (shin guards). */
export function injuryFactor(career: Career) {
  const tier = career.gear?.shin;
  return tier ? 1 - ECONOMY.gear.injuryCut[tier] : 1;
}

export type GearCheck = "ok" | "coins" | "owned" | "locked" | "daily";

export function gearPrice(career: Career, slot: GearSlotId, tier: GearTierId, today: string, admin = false) {
  if (admin) return 0;
  const base = tierInfo(tier).price;
  const offer = dailyGearOffer(career, today, true);
  if (offer && offer.slot === slot && offer.tier === tier && career.adState.gearOfferBoughtDate !== today) {
    const off = ECONOMY.gear.dailyOff + (career.adState.gearOfferAdDate === today ? ECONOMY.gear.dailyAdOff : 0);
    return Math.round(base * (1 - off));
  }
  return base;
}

export function canBuyGear(career: Career, slot: GearSlotId, tier: GearTierId, today: string, topLeague: boolean, admin = false): GearCheck {
  if (career.race) return "daily";
  const current = career.gear?.[slot];
  if (current && GEAR_TIERS.indexOf(current) >= GEAR_TIERS.indexOf(tier)) return "owned";
  if (tier === "gold" && ECONOMY.gear.goldNeedsTopLeague && !topLeague && !admin) return "locked";
  if (career.coins < gearPrice(career, slot, tier, today, admin)) return "coins";
  return "ok";
}

/** Buys (or upgrades to) a tier in a slot. Full tier price; the old item is replaced. */
export function buyGear(career: Career, slot: GearSlotId, tier: GearTierId, today: string, topLeague: boolean, admin = false): Career {
  if (canBuyGear(career, slot, tier, today, topLeague, admin) !== "ok") return career;
  const price = gearPrice(career, slot, tier, today, admin);
  const offer = dailyGearOffer(career, today, true);
  const usedOffer = !!offer && offer.slot === slot && offer.tier === tier && career.adState.gearOfferBoughtDate !== today;
  return {
    ...career,
    coins: career.coins - price,
    gear: { ...career.gear, [slot]: tier },
    adState: usedOffer ? { ...career.adState, gearOfferBoughtDate: today } : career.adState,
  };
}

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Today's offer: the next tier of one slot, picked by the date (gold only counts if it could be bought:
 * `topLeague` true). Returns null when every slot is maxed.
 */
export function dailyGearOffer(career: Career, today: string, topLeague: boolean): { slot: GearSlotId; tier: GearTierId } | null {
  if (!ECONOMY.gear.dailyOfferEnabled) return null;
  const start = hash(today) % GEAR_SLOTS.length;
  for (let i = 0; i < GEAR_SLOTS.length; i += 1) {
    const slot = GEAR_SLOTS[(start + i) % GEAR_SLOTS.length].id;
    const current = career.gear?.[slot];
    const tier = current ? GEAR_TIERS[GEAR_TIERS.indexOf(current) + 1] : "bronze";
    if (!tier) continue;
    if (tier === "gold" && ECONOMY.gear.goldNeedsTopLeague && !topLeague) continue;
    return { slot, tier };
  }
  return null;
}

/** Rewarded clip on the daily offer: another ECONOMY.gear.dailyAdOff off, once a day. */
export function grantGearOfferAd(career: Career, today: string): Career {
  return { ...career, adState: { ...career.adState, gearOfferAdDate: today } };
}

/** Rewarded "try gold": the slot plays gold in the next key match. Once a season. */
export function grantTryGold(career: Career, slot: GearSlotId): Career {
  if (!ECONOMY.gear.tryGoldEnabled || career.adState.tryGoldTaken || career.gearTrial) return career;
  return { ...career, gearTrial: slot, adState: { ...career.adState, tryGoldTaken: true } };
}
