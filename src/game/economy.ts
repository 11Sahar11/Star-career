import { isGearSlot, normalizeGear } from "./gear";
import type { AdState, Career, MatchReport, Moment } from "./types";

// Every economy number lives here. All are design proposals to tune with real data.

/** The one place to retune the economy after launch: every reward, price and cap. */
export const ECONOMY = {
  earn: {
    win: 30,
    draw: 8,
    perGoalOrAssist: 5,
    goalAssistCap: 25,
    highRating: 10,
    keyWin: 60,
    keyMoment: 5,
    trophy: { league: 250, cup: 150, europe: 400, national: 300 },
    targetHit: 100,
    award: 50,
    ballon: 500,
    /** Multiplier on all match and key-moment coins, by league tier in the country (bottom / middle / top division). */
    leagueMultiplier: { low: 1.0, mid: 1.25, top: 1.5 },
    /** End-of-season salary bonus, plus extra when the club finished in the top half. */
    salary: 200,
    salaryTopHalf: 100,
  },
  prices: {
    "unlock-country": 2500,
    trial: 900,
    "camp-premium": 350,
    "camp-key": 250,
    agent: 400,
    "med-fast": 200,
    "med-rest": 120,
    "cos-crest": 250,
    "cos-shirt": 100,
    "cos-legend": 500,
    "cos-armband": 300,
  },
  caps: {
    doubleCoinsPerSeason: 4,
    retryPerSeason: 2,
    interstitialsPerSeason: 2,
  },
  keyCampBonus: 6,
  /** Big-club trial: base signing chance range and the ad-boost cap. */
  bigTrial: { min: 5, max: 45, boostCap: 90 },
  /** Daily chest (replaces the daily-login coins): coins, or sometimes a key camp; an ad doubles it. */
  chest: { coins: 40, campEvery: 4 },
  discount: 0.25,
  /** Equipment ("My Player"): 6 slots, one per key-match situation. Gear belongs to the career. */
  gear: {
    tiers: {
      bronze: { bonus: 1, price: 300 },
      silver: { bonus: 2, price: 700 },
      gold: { bonus: 3, price: 1400 },
    },
    /** Gold can only be bought while playing in a country's top league. */
    goldNeedsTopLeague: true,
    /** Upgrade trade-in: this share of the owned tier's price comes off the next tier (700-150, 1,400-350). */
    tradeIn: 0.5,
    /** Most gear may add to one attribute, in total. Moment odds stay capped at 92%. */
    attrCap: 4,
    oddsCap: 92,
    /** Shin guards: share of the match-injury chance removed, by tier. */
    injuryCut: { bronze: 0.15, silver: 0.3, gold: 0.45 },
    /** Daily offer: one item off; one rewarded clip a day takes the same again. */
    dailyOff: 0.25,
    dailyAdOff: 0.25,
    /** "Try gold" rewarded clip: a gold item for one key match. */
    tryGoldPerSeason: 1,
    /** Off until the owner approves: the UI hides both when false. */
    dailyOfferEnabled: false,
    tryGoldEnabled: false,
  },
  // Coins are per career and reset on a new career (owner decision): no carry-over.
  legacyShare: 0,
  legacyMax: 0,
} as const;

export const EARN = ECONOMY.earn;

/** Countries open from the start (first two in COUNTRIES). Others unlock with coins or by playing. */
export const OPEN_COUNTRIES = ["eng", "esp"];

export const CAPS = ECONOMY.caps;

/** The halftime interstitial in key matches is off until the owner approves it. */
export const HALFTIME_INTERSTITIAL = false;
/** Remove-ads purchase: off, no price, Play Billing not wired. */
export const REMOVE_ADS_ENABLED = false;

export type StoreItemId =
  | "unlock-country"
  | "trial"
  | "camp-premium"
  | "camp-key"
  | "agent"
  | "med-fast"
  | "med-rest"
  | "cos-crest"
  | "cos-shirt"
  | "cos-legend"
  | "cos-armband";

export type StoreGroup = "leagues" | "camps" | "agent" | "medical" | "cosmetics";

export const CATALOG: { id: StoreItemId; price: number; group: StoreGroup }[] = [
  { id: "unlock-country", price: ECONOMY.prices["unlock-country"], group: "leagues" },
  { id: "trial", price: ECONOMY.prices["trial"], group: "leagues" },
  { id: "camp-premium", price: ECONOMY.prices["camp-premium"], group: "camps" },
  { id: "camp-key", price: ECONOMY.prices["camp-key"], group: "camps" },
  { id: "agent", price: ECONOMY.prices["agent"], group: "agent" },
  { id: "med-fast", price: ECONOMY.prices["med-fast"], group: "medical" },
  { id: "med-rest", price: ECONOMY.prices["med-rest"], group: "medical" },
  { id: "cos-crest", price: ECONOMY.prices["cos-crest"], group: "cosmetics" },
  { id: "cos-shirt", price: ECONOMY.prices["cos-shirt"], group: "cosmetics" },
  { id: "cos-legend", price: ECONOMY.prices["cos-legend"], group: "cosmetics" },
  { id: "cos-armband", price: ECONOMY.prices["cos-armband"], group: "cosmetics" },
];

/** Cosmetics are permanent: kept in the device profile (star-economy-v1), not in the career. */
export const COSMETIC_IDS: StoreItemId[] = ["cos-crest", "cos-shirt", "cos-legend", "cos-armband"];

export const DISCOUNT = ECONOMY.discount;

export function formatCoins(n: number) {
  return Math.max(0, Math.floor(n)).toLocaleString("en-US");
}

export function freshAdState(year: number): AdState {
  return {
    seasonYear: year,
    doubleCoinsThisSeason: 0,
    doubledFixtureIds: [],
    retryMomentThisSeason: 0,
    retriedFixtureIds: [],
    boostTaken: false,
    healTaken: false,
    freeCampDate: null,
    discountDate: null,
    discountItem: null,
    interstitialsThisSeason: 0,
    halftimeShownFixtureIds: [],
    restHalf: null,
    tryGoldTaken: false,
    gearOfferAdDate: null,
    gearOfferBoughtDate: null,
  };
}

/** Economy fields for a career; fills whatever an older save is missing. */
export function withEconomy(career: Career): Career {
  const ad = career.adState;
  return {
    ...career,
    coins: typeof career.coins === "number" && career.coins >= 0 ? Math.floor(career.coins) : 0,
    gear: normalizeGear(career.gear),
    gearTrial: isGearSlot(career.gearTrial) ? career.gearTrial : null,
    agentHired: career.agentHired === true,
    trialCall: career.trialCall === true,
    keyCampBonus: typeof career.keyCampBonus === "number" ? career.keyCampBonus : 0,
    premiumCamp: career.premiumCamp === true,
    cosmetics: Array.isArray(career.cosmetics) ? career.cosmetics : [],
    adState: ad && typeof ad === "object" ? { ...freshAdState(career.year), ...ad } : freshAdState(career.year),
  };
}

/** Coins for one match. The daily race never earns. */
export function earnForReport(report: MatchReport, isKey: boolean, moments: Moment[] = []) {
  if (report.missed) return 0;
  const won = report.us > report.them;
  let coins = won ? (isKey ? EARN.keyWin : EARN.win) : report.us === report.them ? EARN.draw : 0;
  coins += Math.min(EARN.goalAssistCap, (report.goals + report.assists) * EARN.perGoalOrAssist);
  if (report.rating >= 8) coins += EARN.highRating;
  // Every successful key-match moment pays, whatever it led to.
  coins += moments.filter((moment) => moment.success === true).length * EARN.keyMoment;
  return coins;
}

export function itemPrice(career: Career, id: StoreItemId, today: string, admin = false) {
  if (admin) return 0;
  const item = CATALOG.find((entry) => entry.id === id);
  if (!item) return Infinity;
  const ad = career.adState;
  const discounted = ad.discountDate === today && ad.discountItem === id;
  return discounted ? Math.round(item.price * (1 - DISCOUNT)) : item.price;
}

export type BuyCheck = "ok" | "coins" | "owned" | "full" | "notNeeded" | "daily";

export function canBuy(career: Career, id: StoreItemId, today: string, admin = false): BuyCheck {
  if (career.race) return "daily";
  if (career.coins < itemPrice(career, id, today, admin)) return "coins";
  switch (id) {
    case "trial":
      return career.trialCall ? "owned" : "ok";
    case "camp-premium":
      return career.premiumCamp ? "owned" : "ok";
    case "camp-key":
      return career.keyCampBonus > 0 ? "owned" : "ok";
    case "agent":
      return career.agentHired ? "owned" : "ok";
    case "med-fast":
      return career.season.outFor > 0 ? "ok" : "notNeeded";
    case "med-rest":
      return career.adState.restHalf === halfKey(career) ? "owned" : career.season.outFor > 0 ? "ok" : "notNeeded";
    case "cos-crest":
    case "cos-shirt":
    case "cos-legend":
    case "cos-armband":
      return career.cosmetics.includes(id) ? "owned" : "ok";
    default:
      return "ok";
  }
}

export function halfKey(career: Career) {
  return `${career.year}|${career.season.breakDone ? 2 : 1}`;
}

/** Buys an item. unlock-country is applied by the caller on the device (legacy); this only takes the coins. */
export function buy(career: Career, id: StoreItemId, today: string, opts: { admin?: boolean } = {}): Career {
  if (canBuy(career, id, today, opts.admin) !== "ok") return career;
  const price = itemPrice(career, id, today, opts.admin);
  const ad = career.adState;
  const next: Career = {
    ...career,
    coins: career.coins - price,
    adState: ad.discountItem === id ? { ...ad, discountItem: null } : ad,
  };
  switch (id) {
    case "trial":
      next.trialCall = true;
      break;
    case "camp-premium":
      next.premiumCamp = true;
      break;
    case "camp-key":
      next.keyCampBonus = ECONOMY.keyCampBonus;
      break;
    case "agent":
      next.agentHired = true;
      break;
    case "med-fast":
      next.season = { ...career.season, outFor: Math.max(0, career.season.outFor - 2) };
      break;
    case "med-rest":
      // Halves the remaining time out (rounded down), once per half-season.
      next.season = { ...career.season, outFor: Math.floor(career.season.outFor / 2) };
      next.adState = { ...next.adState, restHalf: halfKey(career) };
      break;
    case "cos-crest":
    case "cos-shirt":
    case "cos-legend":
    case "cos-armband":
      next.cosmetics = [...career.cosmetics, id];
      break;
  }
  return next;
}

// ---------- rewarded clips: caps live in the save ----------

export type RewardId = "double-coins" | "retry-moment" | "free-camp" | "store-discount" | "attribute-boost" | "injury-return" | "gear-offer" | "try-gold";

export function rewardAvailable(career: Career, id: RewardId, today: string, fixtureId?: string): boolean {
  const ad = career.adState;
  switch (id) {
    case "double-coins":
      return (
        !career.race &&
        !!career.coinsEarnedLast &&
        !!career.coinsFixtureId &&
        !ad.doubledFixtureIds.includes(career.coinsFixtureId) &&
        ad.doubleCoinsThisSeason < CAPS.doubleCoinsPerSeason
      );
    case "retry-moment":
      return !career.race && !!fixtureId && !ad.retriedFixtureIds.includes(fixtureId) && ad.retryMomentThisSeason < CAPS.retryPerSeason;
    case "free-camp":
      return !career.race && ad.freeCampDate !== today && career.keyCampBonus === 0;
    case "store-discount":
      return !career.race && ad.discountDate !== today;
    case "attribute-boost":
      return !ad.boostTaken;
    case "injury-return":
      return !ad.healTaken && career.season.outFor > 0;
    case "gear-offer":
      return ECONOMY.gear.dailyOfferEnabled && !career.race && ad.gearOfferAdDate !== today && ad.gearOfferBoughtDate !== today;
    case "try-gold":
      return ECONOMY.gear.tryGoldEnabled && !career.race && !ad.tryGoldTaken && !career.gearTrial;
  }
}

export function grantDoubleCoins(career: Career): Career {
  if (!career.coinsEarnedLast || !career.coinsFixtureId) return career;
  const ad = career.adState;
  return {
    ...career,
    coins: career.coins + career.coinsEarnedLast,
    adState: { ...ad, doubleCoinsThisSeason: ad.doubleCoinsThisSeason + 1, doubledFixtureIds: [...ad.doubledFixtureIds, career.coinsFixtureId] },
  };
}

export function grantFreeCamp(career: Career, today: string): Career {
  return { ...career, keyCampBonus: ECONOMY.keyCampBonus, adState: { ...career.adState, freeCampDate: today } };
}

export function grantDiscount(career: Career, today: string, item: StoreItemId): Career {
  return { ...career, adState: { ...career.adState, discountDate: today, discountItem: item } };
}

export function canShowSeasonInterstitial(career: Career) {
  return !career.race && career.adState.interstitialsThisSeason < CAPS.interstitialsPerSeason;
}

export function countInterstitial(career: Career): Career {
  return { ...career, adState: { ...career.adState, interstitialsThisSeason: career.adState.interstitialsThisSeason + 1 } };
}
