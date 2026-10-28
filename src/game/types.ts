export const SAVE_VERSION = 8;

export const ATTR_KEYS = ["pace", "tackle", "passing", "dribbling", "shooting", "physical"] as const;
export type AttrKey = (typeof ATTR_KEYS)[number];
export type Attrs = Record<AttrKey, number>;

export type PositionId = "GK" | "CB" | "FB" | "CDM" | "CM" | "CAM" | "W" | "ST";
export type Difficulty = "easy" | "normal" | "hard";
export type Role = "Star" | "Starter" | "Rotation" | "Bench";
export type Screen = "hub" | "run" | "camp" | "break" | "match" | "report" | "season" | "summer" | "offers" | "retired";
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
  daily: DailyState | null;
  race: string | null;
  retired: boolean;
  released?: boolean;
  news: string[];
};
