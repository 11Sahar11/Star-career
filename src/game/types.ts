export const SAVE_VERSION = 10;

export const ATTR_KEYS = ["pace", "tackle", "passing", "dribbling", "shooting", "physical"] as const;
export type AttrKey = (typeof ATTR_KEYS)[number];
export type Attrs = Record<AttrKey, number>;

export type PositionId = "GK" | "CB" | "FB" | "CDM" | "CM" | "CAM" | "W" | "ST";
export type Difficulty = "easy" | "normal" | "hard";
export type Role = "Star" | "Starter" | "Rotation" | "Bench";
export type Screen = "hub" | "run" | "camp" | "break" | "match" | "bigmatch" | "report" | "season" | "summer" | "offers" | "retired";
export type Competition = "league" | "cup" | "europe" | "national";
export type RoundId = "league" | "cup-sf" | "cup-f" | "eu-qf" | "eu-sf" | "eu-f" | "national";

export type Country = {
  id: string;
  name: string;
  national: string;
  currency: string;
};

export type League = {
  id: string;
  name: string;
  countryId: string;
  tier: number;
  cup: string;
  europe: string | null;
};

export type Club = {
  id: string;
  name: string;
  short: string;
  leagueId: string;
};

export type Fixture = {
  id: string;
  competition: Competition;
  round: RoundId;
  roundLabel: string;
  opponentId: string;
  opponentName: string;
  opponentStrength: number;
  home: boolean;
};

export type TableRow = {
  clubId: string;
  pts: number;
  gf: number;
  ga: number;
  w: number;
  d: number;
  l: number;
};

export type MatchEvent = {
  minute: number;
  tone: "goal" | "bad" | "good" | "neutral";
  text: string;
  us: number;
  them: number;
};

export type MatchReport = {
  fixtureId: string;
  competition: Competition;
  round: RoundId;
  roundLabel: string;
  opponentName: string;
  home: boolean;
  us: number;
  them: number;
  missed: boolean;
  missReason?: "injury" | "bench";
  rating: number;
  goals: number;
  assists: number;
  tackles: number;
  keyPasses: number;
  saves: number;
  shots: number;
  errors: number;
  injured: boolean;
  events: MatchEvent[];
  deltas: Attrs;
  headline: string;
};

/** `salary` is shown on its own line; total earned = matches + bonuses + salary + ads. */
export type SeasonCoins = { matches: number; bonuses: number; salary: number; ads: number };

export type MatchLog = {
  opponentName: string;
  competition: Competition;
  roundLabel: string;
  us: number;
  them: number;
  rating: number;
  goals: number;
  assists: number;
  missed: boolean;
  events: MatchEvent[];
  headline: string;
  /** One of the season's two key matches. */
  key?: boolean;
};

export type Award = { id: string; name: string; detail: string };

export type EuropeComp = "cl" | "el";

export type EuropeRun = {
  comp: EuropeComp;
  name: string;
  stage: "Quarter-final" | "Semi-final" | "Final" | "Winners";
};

export type GrowthPreview = {
  before: Attrs;
  deltas: Attrs;
  after: Attrs;
  ovrBefore: number;
  ovrAfter: number;
  avg: number;
  lines: string[];
  awards: Award[];
  tablePos: number;
  age: number;
  targetLabel: string;
  targetHit: boolean;
  europe: EuropeRun | null;
  ballon: string;
  ballonYours: boolean;
};

export type Offer = {
  clubId: string;
  leagueId: string;
  wage: number;
  role: Role;
  kind: "stay" | "up" | "down" | "pro" | "side";
  years: number;
  note: string;
};

export type Trophy = { id: string; name: string; year: number; detail: string };

export type SeasonRecord = {
  year: number;
  clubId: string;
  leagueId: string;
  pos: number;
  apps: number;
  goals: number;
  avg: number;
  ovr: number;
};

export type Player = {
  name: string;
  position: PositionId;
  age: number;
  attrs: Attrs;
  potential: number;
  fitness: number;
  form: number;
  morale: number;
  /** Chosen skin tone, 1-6 (character art order). Missing = default art. */
  skin?: number;
  /** Hair style id (see game/look.ts). Missing = default. */
  hair?: string;
  /** Hair colour id (see game/look.ts). Missing = default. */
  hairColor?: string;
};

export type SeasonState = {
  training: Attrs;
  apps: number;
  sumRating: number;
  goals: number;
  assists: number;
  leagueGoals: number;
  fixturesPlayed: MatchLog[];
  cursor: number;
  fixtures: Fixture[];
  table: TableRow[];
  prep: "none" | "train" | "rest";
  outFor: number;
  targetLabel: string;
  targetLine: number;
  phase: "first" | "second";
  breakAt: number;
  breakDone: boolean;
  leagueId: string;
  /** Wins in this season's two key matches; they lift the cup run. Missing in old saves = 0. */
  keyWins?: number;
};

export type SummerKind = "friendly" | "euros" | "world-cup" | "copa";

export type Shuffle = {
  year: number;
  promoted: string[];
  relegated: string[];
  arrivedUp: string[];
  arrivedDown: string[];
};

export type SummerState = {
  kind: SummerKind;
  called: boolean;
  reason: string;
  fixtures: Fixture[];
  cursor: number;
  played: MatchLog[];
  done: boolean;
};
export type DailyState = {
  date: string;
  report: MatchReport | null;
  claimed: boolean;
};

export type Career = {
  version: typeof SAVE_VERSION;
  rng: number;
  screen: Screen;
  player: Player;
  reputation: number;
  countryId: string;
  nationId?: string;
  clubId: string;
  difficulty: Difficulty;
  year: number;
  wage: number;
  role: Role;
  contractLeft: number;
  lastFinish: number;
  europeComp: EuropeComp | null;
  divisions: Record<string, string>;
  shuffle: Shuffle | null;
  season: SeasonState;
  summer: SummerState | null;
  totals: {
    seasons: number;
    apps: number;
    goals: number;
    assists: number;
    trophies: number;
    ratingSum: number;
    caps: number;
    intlGoals: number;
  };
  trophies: Trophy[];
  history: SeasonRecord[];
  pendingOffers: Offer[] | null;
  growthPreview: GrowthPreview | null;
  activeReport: MatchReport | null;
  recentDeltas: Attrs | null;
  lastTrain?: { key: AttrKey; delta: number; outFor: number } | null;
  /** Attribute points gained from training since the last key match; shown as +X% on its choices. */
  keyGain?: Partial<Record<AttrKey, number>> | null;
  daily: DailyState | null;
  race: string | null;
  retired: boolean;
  released?: boolean;
  pending?: PendingMatch | null;
  story?: PendingStory | null;
  storiesSeen?: string[];
  news: string[];
  /** Economy (save v9). Coins are per career; retirement resets them. */
  coins: number;
  /** Coins from the last match, for the double-coins clip. */
  coinsEarnedLast?: number;
  coinsFixtureId?: string | null;
  /** Coins earned this season by source (purchases and trade-ins excluded); reset when a new season starts. */
  seasonCoins?: SeasonCoins;
  /** Year whose end-of-season bonuses were paid (when the summary opened), so they are never paid twice. */
  seasonBonusYear?: number | null;
  /** Equipment by slot (save v10); belongs to the career, counts in simulation and odds, never written into player.attrs. */
  gear: GearLoadout;
  /** "Try gold" clip: this slot plays at gold tier in the next key match only. */
  gearTrial?: GearSlotId | null;
  agentHired: boolean;
  trialCall: boolean;
  /** Percentage points added to every choice in the next key match (0 or 6). */
  keyCampBonus: number;
  premiumCamp: boolean;
  cosmetics: string[];
  adState: AdState;
  /** Big-club trial in this transfer window: visible signing chance; one ad boost doubles it (max 90%). */
  bigTrial?: BigTrial | null;
};

export type BigTrial = { year: number; clubId: string; chance: number; boosted: boolean; result: "open" | "won" | "lost" };

/** Stable slot ids (one per key-match situation type). Keepers wear diving / handling gloves in the first two. */
export type GearSlotId = "kick" | "dribble" | "sleeve" | "headband" | "wristband" | "shin";
export type GearTierId = "bronze" | "silver" | "gold";
export type GearLoadout = Partial<Record<GearSlotId, GearTierId>>;
/** Save v9 gear shape, kept for migration. */
export type LegacyGearItem = { key: AttrKey; amount: 1 | 2 };

export type AdState = {
  seasonYear: number;
  doubleCoinsThisSeason: number;
  doubledFixtureIds: string[];
  retryMomentThisSeason: number;
  retriedFixtureIds: string[];
  boostTaken: boolean;
  healTaken: boolean;
  freeCampDate: string | null;
  discountDate: string | null;
  /** The item id the store discount applies to, until used. */
  discountItem: string | null;
  interstitialsThisSeason: number;
  halftimeShownFixtureIds: string[];
  restHalf: string | null;
  /** "Try gold" used this season. */
  tryGoldTaken: boolean;
  /** Day the daily gear offer got its extra ad discount / was bought. */
  gearOfferAdDate: string | null;
  gearOfferBoughtDate: string | null;
};

export type MomentKind = "chance" | "defend" | "keeper";
export type MomentReward = "goal" | "assist" | "stop";

export type MomentOption = {
  id: string;
  attr: AttrKey;
  odds: number;
  reward: MomentReward;
  /** Odds gained from training since the last key match. */
  gain?: number;
  /** Odds added by gear, and the slot variant that gives them (for "Shot 58% (+4% boots)"). */
  gear?: number;
  gearItem?: string;
};

export type Moment = {
  minute: number;
  kind: MomentKind;
  /** Situation from the key-match pool (penalty, freekick, ...). Older saves have none. */
  situation?: string;
  options: MomentOption[];
  picked?: string;
  success?: boolean;
};

/** A big match paused at its decisive moments; the base report is not applied until every moment is played. */
export type PendingMatch = {
  base: MatchReport;
  moments: Moment[];
  seed: number;
  rngState: number;
};

export type StoryEffect = Partial<Record<"morale" | "form" | "fitness" | "reputation", number>> & { attr?: AttrKey; attrDelta?: number };

export type PendingStory = { id: string };
