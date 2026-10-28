import {
  ATTR_LABEL,
  BIAS,
  CLUBS,
  COUNTRIES,
  LEAGUES,
  NATIONS,
  POSITIONS,
  RELEVANCE,
  TIER_STRENGTH,
  WEIGHTS,
  clubStrength,
  clubsIn,
  entryLeague,
  getClub,
  getCountry,
  getLeague,
  leaguesIn,
  nextLeague,
  positionMeta,
  prevLeague,
} from "./data";
import {
  ATTR_KEYS,
  SAVE_VERSION,
  type AttrKey,
  type Attrs,
  type Award,
  type Career,
  type Club,
  type Difficulty,
  type EuropeComp,
  type EuropeRun,
  type Fixture,
  type GrowthPreview,
  type MatchEvent,
  type MatchLog,
  type MatchReport,
  type Offer,
  type PositionId,
  type Role,
  type RoundId,
  type TableRow,
} from "./types";
import { t } from "./i18n";

export function emptyAttrs(value = 0): Attrs {
  const attrs = {} as Attrs;
  for (const key of ATTR_KEYS) attrs[key] = value;
  return attrs;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed: number) {
  let state = seed >>> 0 || 1;
  return {
    next() {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    state() {
      return state >>> 0;
    },
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] ?? items[0];
}

export function overall(position: PositionId, attrs: Attrs) {
  const weights = WEIGHTS[position];
  let total = 0;
  for (const key of ATTR_KEYS) total += attrs[key] * weights[key];
  return clamp(Math.round(total), 1, 99);
}

export function statCap(position: PositionId, potential: number, key: AttrKey) {
  return clamp(potential + BIAS[position][key], 46, 99);
}

export function potentialLabel(potential: number) {
  if (potential >= 91) return "Generational";
  if (potential >= 86) return "Elite";
  if (potential >= 80) return "High";
  return "Solid";
}

export function formLabel(form: number) {
  if (form >= 75) return "High";
  if (form >= 55) return "Steady";
  return "Fragile";
}

export function moraleLabel(morale: number) {
  if (morale >= 72) return "High";
  if (morale >= 48) return "Calm";
  return "Low";
}

export function reputationLabel(reputation: number) {
  if (reputation >= 80) return "European star";
  if (reputation >= 60) return "International";
  if (reputation >= 40) return "National talent";
  if (reputation >= 22) return "Known in the league";
  return "Unknown";
}

export function farewellAge(position: PositionId) {
  return position === "GK" ? 41 : 38;
}

export function seasonLabel(year: number) {
  const next = String(year + 1).slice(2);
  return `${year}/${next}`;
}

export function money(wage: number, currency = "€") {
  return `${currency}${wage.toLocaleString("en-GB")}`;
}

function ageGrowth(age: number) {
  if (age <= 17) return 1.4;
  if (age <= 19) return 1.2;
  if (age <= 21) return 1;
  if (age <= 24) return 0.72;
  if (age <= 27) return 0.42;
  if (age <= 30) return 0.22;
  if (age <= 32) return 0.08;
  return 0;
}

function gainCap(age: number, difficulty: Difficulty = "normal") {
  let cap = age <= 19 ? 5 : age <= 24 ? 3 : 2;
  if (difficulty === "easy") cap += 2;
  if (difficulty === "hard") cap = Math.max(1, cap - 1);
  return cap;
}

export function moveEvery(difficulty: Difficulty) {
  if (difficulty === "easy") return 3;
  if (difficulty === "hard") return 1;
  return 2;
}

export function moveOpen(completedSeasons: number, difficulty: Difficulty) {
  const every = moveEvery(difficulty);
  return completedSeasons > 0 && completedSeasons % every === 0;
}

export function nextMoveAfter(completedSeasons: number, difficulty: Difficulty) {
  const every = moveEvery(difficulty);
  if (completedSeasons > 0 && completedSeasons % every === 0) return completedSeasons + every;
  const mod = completedSeasons % every;
  return completedSeasons + (mod === 0 ? every : every - mod);
}

export function previewPlayer(name: string, position: PositionId, salt: number) {
  const seed = hashString(`${name.trim()}|${position}|${salt}`) || 1;
  const rng = makeRng(seed);
  const potential = 86 + Math.floor(((rng.next() + rng.next()) / 2) * 13);
  const attrs = emptyAttrs();
  for (const key of ATTR_KEYS) {
    const cap = statCap(position, potential, key);
    const rel = RELEVANCE[position][key];
    const gap = (rel > 1 ? 6 : rel > 0.8 ? 10 : 16) + Math.floor(rng.next() * 3);
    attrs[key] = clamp(cap - gap, 64, 90);
  }
  return {
    seed,
    rng: rng.state(),
    potential,
    attrs,
    ovr: overall(position, attrs),
  };
}

function pushNews(news: string[], line: string) {
  return [line, ...news].slice(0, 10);
}

function emptyTable(clubs: Club[]): TableRow[] {
  return clubs.map((club) => ({
    clubId: club.id,
    pts: 0,
    gf: 0,
    ga: 0,
    w: 0,
    d: 0,
    l: 0,
  }));
}

export function leagueOf(career: Career, clubId: string) {
  return career.divisions[clubId] ?? getClub(clubId).leagueId;
}

export function divisionClubs(career: Career, leagueId: string) {
  return CLUBS.filter((club) => leagueOf(career, club.id) === leagueId).sort((a, b) => clubStrength(b.id) - clubStrength(a.id));
}

function initialDivisions() {
  const divisions: Record<string, string> = {};
  for (const club of CLUBS) divisions[club.id] = club.leagueId;
  return divisions;
}

function slotsFor(sizeA: number, sizeB: number) {
  const spots = Math.min(sizeA, sizeB) >= 20 ? 3 : 2;
  return Math.min(spots, Math.floor(sizeA / 3), Math.floor(sizeB / 3));
}

function ghostTable(career: Career, leagueId: string, rng: () => number): TableRow[] {
  return divisionClubs(career, leagueId).map((club) => ({
    clubId: club.id,
    pts: Math.round(clubStrength(club.id) + rng() * 14 - 7),
    gf: Math.round(28 + rng() * 36),
    ga: Math.round(28 + rng() * 36),
    w: 0,
    d: 0,
    l: 0,
  }));
}

function shufflePyramid(career: Career) {
  const divisions = { ...career.divisions };
  const rng = makeRng(hashString(`${career.player.name}|pyramid|${career.year}`) || 1);
  const roll = () => rng.next();
  const ours = leagueOf(career, career.clubId);
  const promoted: string[] = [];
  const relegated: string[] = [];
  const arrivedUp: string[] = [];
  const arrivedDown: string[] = [];
  for (const countryId of [...new Set(LEAGUES.map((league) => league.countryId))]) {
    const ladder = leaguesIn(countryId);
    const tables = new Map<string, TableRow[]>();
    for (const league of ladder) {
      tables.set(league.id, league.id === ours ? career.season.table.map((row) => ({ ...row })) : ghostTable(career, league.id, roll));
    }
    for (let i = ladder.length - 1; i > 0; i -= 1) {
      const upper = ladder[i];
      const lower = ladder[i - 1];
      const upTable = sortTable(tables.get(upper.id) ?? []);
      const lowTable = sortTable(tables.get(lower.id) ?? []);
      const count = slotsFor(upTable.length, lowTable.length);
      if (!count) continue;
      const goingDown = upTable.slice(-count).map((row) => row.clubId);
      const goingUp = lowTable.slice(0, count).map((row) => row.clubId);
      for (const id of goingDown) divisions[id] = lower.id;
      for (const id of goingUp) divisions[id] = upper.id;
      if (upper.id === ours) {
        relegated.push(...goingDown);
        arrivedUp.push(...goingUp);
      }
      if (lower.id === ours) {
        promoted.push(...goingUp);
        arrivedDown.push(...goingDown);
      }
    }
  }
  return {
    divisions,
    shuffle: { year: career.year, promoted, relegated, arrivedUp, arrivedDown },
  };
}

function applyScore(table: TableRow[], homeId: string, awayId: string, homeGoals: number, awayGoals: number) {
  const home = table.find((row) => row.clubId === homeId);
  const away = table.find((row) => row.clubId === awayId);
  if (!home || !away) return;
  home.gf += homeGoals;
  home.ga += awayGoals;
  away.gf += awayGoals;
  away.ga += homeGoals;
  if (homeGoals > awayGoals) {
    home.pts += 3;
    home.w += 1;
    away.l += 1;
  } else if (homeGoals < awayGoals) {
    away.pts += 3;
    away.w += 1;
    home.l += 1;
  } else {
    home.pts += 1;
    away.pts += 1;
    home.d += 1;
    away.d += 1;
  }
}

export function sortTable(table: TableRow[]) {
  return [...table].sort((a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf);
}

export function tablePosition(career: Career) {
  const sorted = sortTable(career.season.table);
  const index = sorted.findIndex((row) => row.clubId === career.clubId);
  return index < 0 ? sorted.length : index + 1;
}

function poisson(lambda: number, rng: () => number) {
  if (lambda <= 0) return 0;
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng();
  } while (p > limit && k < 9);
  return k - 1;
}

function sampleScore(attack: number, defense: number, home: boolean, rng: () => number) {
  const homeBoost = home ? 1.08 : 0.96;
  const awayBoost = home ? 0.94 : 1.04;
  const lambdaUs = clamp(1.02 * homeBoost * (attack / Math.max(40, defense)), 0.28, 3.15);
  const lambdaThem = clamp(1.02 * awayBoost * (defense / Math.max(40, attack)), 0.28, 3.15);
  return [poisson(lambdaUs, rng), poisson(lambdaThem, rng)] as const;
}

export function sideStrength(career: Career, playing: boolean) {
  const base = clubStrength(career.clubId);
  if (!playing) return base - 1.5;
  const ovr = overall(career.player.position, career.player.attrs);
  const lift = clamp((ovr - base) * 0.3, -6, 12);
  const fit = career.player.fitness < 55 ? -3 : 0;
  const form = (career.player.form - 62) / 28;
  const morale = (career.player.morale - 55) / 40;
  return base + lift + fit + form + morale;
}

const ROLE_RATES: Record<PositionId, { shot: number; key: number; tackle: number; goal: number; assist: number; error: number }> = {
  ST: { shot: 0.7, key: 0.28, tackle: 0.08, goal: 0.46, assist: 0.16, error: 0.1 },
  W: { shot: 0.55, key: 0.42, tackle: 0.12, goal: 0.3, assist: 0.32, error: 0.12 },
  CAM: { shot: 0.42, key: 0.58, tackle: 0.12, goal: 0.24, assist: 0.38, error: 0.11 },
  CM: { shot: 0.24, key: 0.5, tackle: 0.32, goal: 0.1, assist: 0.28, error: 0.11 },
  CDM: { shot: 0.1, key: 0.32, tackle: 0.58, goal: 0.05, assist: 0.16, error: 0.1 },
  CB: { shot: 0.06, key: 0.14, tackle: 0.64, goal: 0.04, assist: 0.06, error: 0.14 },
  FB: { shot: 0.16, key: 0.36, tackle: 0.44, goal: 0.08, assist: 0.22, error: 0.12 },
  GK: { shot: 0.02, key: 0.12, tackle: 0.22, goal: 0, assist: 0.03, error: 0.16 },
};

function statCheck(stat: number, opposition: number, rng: () => number) {
  const skill = stat + rng() * 18 - 8;
  const bar = 40 + (opposition - 58) * 0.48;
  return skill >= bar;
}

function headlineFor(report: Pick<MatchReport, "missed" | "missReason" | "goals" | "rating" | "errors" | "us" | "them">) {
  if (report.missed) return report.missReason === "injury" ? "@head.inj" : "@head.bench";
  if (report.goals >= 3) return "@head.hat";
  if (report.goals === 2) return "@head.brace";
  if (report.goals === 1 && report.us > report.them) return "@head.goalwin";
  if (report.rating >= 8.4) return "@head.huge";
  if (report.rating >= 7.2 && report.us >= report.them) return "@head.clean";
  if (report.errors > 0 && report.rating < 6) return "@head.forget";
  if (report.us < report.them) return "@head.loss";
  return "@head.ok";
}

function buildEvents(
  position: PositionId,
  attrs: Attrs,
  us: number,
  them: number,
  oppStrength: number,
  playing: boolean,
  rng: () => number,
): { events: MatchEvent[]; goals: number; assists: number; tackles: number; keyPasses: number; saves: number; shots: number; errors: number; dribbles: number } {
  const events: MatchEvent[] = [{ minute: 0, tone: "neutral", text: "@ev.kick", us: 0, them: 0 }];
  if (!playing) {
    events.push({ minute: 90, tone: "neutral", text: "@ev.watch", us, them });
    return { events, goals: 0, assists: 0, tackles: 0, keyPasses: 0, saves: 0, shots: 0, errors: 0, dribbles: 0 };
  }

  const rates = ROLE_RATES[position];
  let goals = 0;
  for (let i = 0; i < us; i++) {
    const share = rates.goal * (0.72 + attrs.shooting / 150);
    if (rng() < share) goals += 1;
  }
  let assists = 0;
  for (let i = 0; i < us - goals; i++) {
    const share = rates.assist * (0.7 + attrs.passing / 160);
    if (rng() < share) assists += 1;
  }

  let errors = 0;
  if (position === "GK") {
    if (them > 0 && !statCheck((attrs.physical + attrs.tackle) / 2, oppStrength, rng) && rng() < 0.55) errors = 1;
  } else if (rng() < rates.error * (1.25 - attrs.passing / 130)) {
    errors = 1;
  }

  let tackles = 0;
  const tackleTries = position === "GK" ? 1 : 2 + Math.floor(rng() * 4);
  for (let i = 0; i < tackleTries; i++) {
    if (statCheck(attrs.tackle, oppStrength, rng) && rng() < rates.tackle + 0.35) tackles += 1;
  }

  let keyPasses = assists;
  const passTries = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < passTries; i++) {
    if (statCheck(attrs.passing, oppStrength, rng) && rng() < rates.key) keyPasses += 1;
  }

  let dribbles = 0;
  const dribbleTries = position === "GK" ? 1 : 1 + Math.floor(rng() * 3);
  const dribbleRate = position === "W" || position === "CAM" || position === "ST" ? 0.55 : 0.3;
  for (let i = 0; i < dribbleTries; i++) {
    if (statCheck(attrs.dribbling, oppStrength, rng) && rng() < dribbleRate) dribbles += 1;
  }

  let shots = goals;
  const shotTries = position === "GK" ? 0 : 1 + Math.floor(rng() * 3);
  for (let i = 0; i < shotTries; i++) {
    if (rng() < rates.shot) shots += 1;
  }

  let saves = 0;
  if (position === "GK") {
    saves = them === 0 ? 2 + Math.floor(rng() * 4) : 1 + Math.floor(rng() * 4);
    if (statCheck(attrs.physical, oppStrength, rng)) saves += 1;
  } else if (rng() < 0.18) {
    saves = 0;
  }

  type Beat = { kind: string; minute: number };
  const beats: Beat[] = [];
  const minute = () => 4 + Math.floor(rng() * 84);
  for (let i = 0; i < goals; i++) beats.push({ kind: "mygoal", minute: minute() });
  for (let i = 0; i < us - goals; i++) beats.push({ kind: "teamgoal", minute: minute() });
  for (let i = 0; i < them; i++) beats.push({ kind: i < errors ? "errorgoal" : "theirgoal", minute: minute() });
  for (let i = 0; i < assists; i++) beats.push({ kind: "assist", minute: minute() });
  for (let i = 0; i < tackles; i++) beats.push({ kind: "tackle", minute: minute() });
  for (let i = 0; i < Math.max(0, keyPasses - assists); i++) beats.push({ kind: "pass", minute: minute() });
  for (let i = 0; i < dribbles; i++) beats.push({ kind: "dribble", minute: minute() });
  for (let i = 0; i < Math.max(0, shots - goals); i++) beats.push({ kind: "shot", minute: minute() });
  for (let i = 0; i < saves; i++) beats.push({ kind: "save", minute: minute() });
  if (beats.length < 4) beats.push({ kind: "quiet", minute: minute() });
  beats.sort((a, b) => a.minute - b.minute);

  let scoreUs = 0;
  let scoreThem = 0;
  for (const beat of beats) {
    if (beat.kind === "mygoal" || beat.kind === "teamgoal") scoreUs += 1;
    if (beat.kind === "theirgoal" || beat.kind === "errorgoal") scoreThem += 1;
    events.push({
      minute: beat.minute,
      tone: beat.kind === "mygoal" || beat.kind === "teamgoal" ? "goal" : beat.kind === "errorgoal" || beat.kind === "theirgoal" ? "bad" : beat.kind === "quiet" ? "neutral" : "good",
      text: lineFor(beat.kind, position, rng),
      us: scoreUs,
      them: scoreThem,
    });
  }
  events.push({
    minute: 90,
    tone: us > them ? "good" : us < them ? "bad" : "neutral",
    text: us > them ? "@ev.ftWin" : us < them ? "@ev.ftLoss" : "@ev.ftDraw",
    us,
    them,
  });
  return { events, goals, assists, tackles, keyPasses, saves, shots, errors, dribbles };
}

function lineFor(kind: string, position: PositionId, rng: () => number) {
  const key = kind === "mygoal" && position === "CB" ? "ev.cbgoal" : kind === "errorgoal" && position === "GK" ? "ev.gkerror" : `ev.${kind}`;
  const count = Math.max(1, t(key, undefined, "en").split("|").length);
  return `@${key}#${Math.floor(rng() * count)}`;
}

function rateMatch(position: PositionId, attrs: Attrs, input: { goals: number; assists: number; tackles: number; keyPasses: number; saves: number; errors: number; dribbles: number; us: number; them: number; fitness: number }) {
  let rating = 6.7;
  rating += input.goals * 0.85;
  rating += input.assists * 0.45;
  rating += Math.min(input.keyPasses, 4) * 0.1;
  rating += Math.min(input.dribbles, 4) * (position === "W" || position === "CAM" || position === "ST" ? 0.14 : 0.08);
  const tackleWeight = position === "CB" || position === "CDM" || position === "FB" ? 0.12 : 0.06;
  rating += Math.min(input.tackles, 6) * tackleWeight;
  if (position === "GK") rating += Math.min(input.saves, 6) * 0.14;
  rating -= input.errors * 0.7;
  if (input.us > input.them) rating += 0.25;
  else if (input.us < input.them) rating -= 0.08;
  if (input.fitness < 50) rating -= (50 - input.fitness) / 120;
  const touch = (attrs.passing + attrs.dribbling + (position === "GK" ? attrs.physical : attrs.shooting)) / 3;
  if (input.errors === 0) rating += Math.max(0, (touch - 64) / 70);
  if (position === "GK" && input.them === 0) rating += 0.3;
  if ((position === "CB" || position === "CDM" || position === "FB") && input.errors === 0 && input.tackles >= 2) rating += 0.2;
  rating = clamp(rating, 4.6, 10);
  const heroic = input.goals >= 2 || (position === "GK" && input.saves >= 5 && input.them === 0);
  if (!heroic) rating = Math.min(rating, 9.4);
  return Math.round(rating * 10) / 10;
}

function microGrowth(position: PositionId, attrs: Attrs, potential: number, age: number, rating: number, rng: () => number): Attrs {
  const deltas = emptyAttrs();
  if (rating < 7.7 || age > 23) return deltas;
  if (rng() > 0.34) return deltas;
  const keys = ATTR_KEYS.filter((key) => RELEVANCE[position][key] >= 1).sort((a, b) => RELEVANCE[position][b] - RELEVANCE[position][a]);
  const key = keys[0];
  if (!key) return deltas;
  if (attrs[key] < statCap(position, potential, key)) deltas[key] = 1;
  return deltas;
}

function roundLabel(round: RoundId, cupName: string, _europeName: string | null, national = "National team") {
  if (round === "league") return "@round.league";
  if (round === "cup-sf") return `@round.cupSf|${cupName}`;
  if (round === "cup-f") return `@round.cupF|${cupName}`;
  return `@round.nat|${national}`;
}

function isTopLeague(leagueId: string) {
  const league = getLeague(leagueId);
  const ladder = leaguesIn(league.countryId);
  return ladder[ladder.length - 1]?.id === league.id;
}

export function europeTicket(career: Career, clubId: string): EuropeComp | null {
  const leagueId = leagueOf(career, clubId);
  if (!isTopLeague(leagueId)) return null;
  const size = divisionClubs(career, leagueId).length;
  const champions = size >= 18 ? 4 : size >= 14 ? 2 : 1;
  const europa = size >= 18 ? 2 : 1;
  const sameClub = clubId === career.clubId;
  const place = sameClub
    ? career.lastFinish
    : Math.max(1, divisionClubs(career, leagueId).findIndex((club) => club.id === clubId) + 1);
  if (place <= champions) return "cl";
  if (place <= champions + europa) return "el";
  return null;
}

function silentEurope(career: Career): EuropeRun | null {
  if (career.europeComp !== "cl" && career.europeComp !== "el") return null;
  const rng = makeRng(hashString(`${career.player.name}|europe|${career.year}|${career.europeComp}`) || 1);
  const ovr = overall(career.player.position, career.player.attrs);
  const name = career.europeComp === "cl" ? "Champions League" : "Europa League";
  const rounds = ["Quarter-final", "Semi-final", "Final"] as const;
  let won = false;
  let stage: EuropeRun["stage"] = "Quarter-final";
  for (const round of rounds) {
    const bump = round === "Final" ? 7 : round === "Semi-final" ? 4 : 0;
    const wall = (career.europeComp === "cl" ? 82 : 74) + bump;
    won = rng.next() < clamp(0.28 + (ovr - wall) / 22, 0.12, 0.88);
    stage = round;
    if (!won) break;
  }
  if (won) stage = "Winners";
  return { comp: career.europeComp, name, stage };
}

function makeFixture(partial: Omit<Fixture, "roundLabel"> & { roundLabel?: string }, cupName: string, europeName: string | null, national = "National team"): Fixture {
  return { ...partial, roundLabel: partial.roundLabel ?? roundLabel(partial.round, cupName, europeName, national) };
}

function buildFixtures(career: Career, rng: () => number): { fixtures: Fixture[]; table: TableRow[]; breakAt: number } {
  const club = getClub(career.clubId);
  const league = getLeague(leagueOf(career, club.id));
  const country = getCountry(league.countryId);
  const mates = divisionClubs(career, league.id).filter((item) => item.id !== club.id);
  const fixtures: Fixture[] = [];

  mates.forEach((opp, index) => {
    fixtures.push(
      makeFixture(
        {
          id: `L-${career.year}-${index}-h`,
          competition: "league",
          round: "league",
          opponentId: opp.id,
          opponentName: opp.name,
          opponentStrength: clubStrength(opp.id),
          home: true,
        },
        league.cup,
        league.europe,
        country.national,
      ),
    );
  });
  const breakAt = fixtures.length;
  mates.forEach((opp, index) => {
    fixtures.push(
      makeFixture(
        {
          id: `L-${career.year}-${index}-a`,
          competition: "league",
          round: "league",
          opponentId: opp.id,
          opponentName: opp.name,
          opponentStrength: clubStrength(opp.id),
          home: false,
        },
        league.cup,
        league.europe,
        country.national,
      ),
    );
  });

  const cupOpp = pick(rng, mates);
  fixtures.push(
    makeFixture(
      {
        id: `C-sf-${career.year}`,
        competition: "cup",
        round: "cup-sf",
        opponentId: cupOpp.id,
        opponentName: cupOpp.name,
        opponentStrength: clubStrength(cupOpp.id) + 1,
        home: true,
      },
      league.cup,
      league.europe,
      country.national,
    ),
  );

  return { fixtures, table: emptyTable(divisionClubs(career, league.id)), breakAt };
}

function boardTarget(career: Career) {
  const league = getLeague(leagueOf(career, career.clubId));
  const list = divisionClubs(career, league.id);
  const size = Math.max(1, list.length);
  const idx = Math.max(0, list.findIndex((club) => club.id === career.clubId));
  const rank = idx / Math.max(1, size - 1);
  let label = "target.half";
  let line = Math.max(1, Math.ceil(size / 2));
  if (rank <= 0.2 && league.tier >= 2) {
    label = "target.title";
    line = 1;
  } else if (rank <= 0.35) {
    label = "target.four";
    line = Math.min(4, line);
  } else if (rank >= 0.72) {
    label = "target.stay";
    line = Math.max(1, size - 2);
  }
  if (career.role === "Star" && line > 1) {
    label = line <= 4 ? "target.win" : "target.four";
    line = line <= 4 ? 1 : 4;
  }
  return { label: `@${label}`, line };
}

function freshSeason(career: Career, rng: () => number) {
  const built = buildFixtures(career, rng);
  const target = boardTarget(career);
  return {
    training: emptyAttrs(),
    apps: 0,
    sumRating: 0,
    goals: 0,
    assists: 0,
    leagueGoals: 0,
    fixturesPlayed: [] as MatchLog[],
    cursor: 0,
    fixtures: built.fixtures,
    table: built.table,
    prep: "none" as const,
    outFor: 0,
    targetLabel: target.label,
    targetLine: target.line,
    phase: "first" as const,
    breakAt: built.breakAt,
    breakDone: false,
    leagueId: leagueOf(career, career.clubId),
  };
}

export function createCareer(name: string, position: PositionId, countryId: string, salt: number, difficulty: Difficulty = "normal"): Career {
  const trimmed = name.trim().slice(0, 16);
  const country = COUNTRIES.some((item) => item.id === countryId) ? countryId : "eng";
  const rolled = previewPlayer(trimmed, position, salt);
  const rng = makeRng(rolled.rng);
  const league = entryLeague(country);
  const starters = clubsIn(league.id);
  const from = Math.floor(starters.length * 0.4);
  const span = Math.max(1, starters.length - from - 1);
  const home = starters[from + Math.floor(rng.next() * span)] ?? starters[starters.length - 1];
  const draft: Career = {
    version: SAVE_VERSION,
    rng: rng.state(),
    screen: "camp",
    player: {
      name: trimmed,
      position,
      age: 16,
      attrs: rolled.attrs,
      potential: rolled.potential,
      fitness: 92,
      form: 64,
      morale: 70,
    },
    reputation: 6,
    countryId: country,
    clubId: home.id,
    difficulty,
    year: 2026,
    wage: 900,
    role: "Starter",
    contractLeft: moveEvery(difficulty),
    lastFinish: 3,
    europeComp: null,
    divisions: initialDivisions(),
    shuffle: null,
    season: {
      training: emptyAttrs(),
      apps: 0,
      sumRating: 0,
      goals: 0,
      assists: 0,
      leagueGoals: 0,
      fixturesPlayed: [],
      cursor: 0,
      fixtures: [],
      table: [],
      prep: "none",
      outFor: 0,
      targetLabel: "Finish in the top half",
      targetLine: 12,
      phase: "first",
      breakAt: 1,
      breakDone: false,
      leagueId: entryLeague(country).id,
    },
    summer: null,
    totals: { seasons: 0, apps: 0, goals: 0, assists: 0, trophies: 0, ratingSum: 0, caps: 0, intlGoals: 0 },
    trophies: [],
    history: [],
    pendingOffers: null,
    growthPreview: null,
    activeReport: null,
    recentDeltas: null,
    daily: null,
    race: null,
    retired: false,
    news: [],
  };
  const seasonRng = makeRng(draft.rng);
  draft.season = freshSeason(draft, () => seasonRng.next());
  draft.rng = seasonRng.state();
  draft.news = pushNews([], `${trimmed}, 16, joins ${home.name}. Pre-season before the first whistle.`);
  return draft;
}

export function nextFixture(career: Career) {
  return career.season.fixtures[career.season.cursor] ?? null;
}

function shouldBench(career: Career, rng: () => number) {
  if (career.role === "Star" || career.role === "Starter") return false;
  if (career.role === "Rotation") return rng() < 0.22;
  return rng() < 0.42;
}

function logFrom(report: MatchReport): MatchLog {
  return {
    opponentName: report.opponentName,
    competition: report.competition,
    roundLabel: report.roundLabel,
    us: report.us,
    them: report.them,
    rating: report.rating,
    goals: report.goals,
    assists: report.assists,
    missed: report.missed,
    events: report.events,
    headline: report.headline,
  };
}

function simulateAgainst(career: Career, fixture: Fixture, playing: boolean, rng: () => number): MatchReport {
  const attack = sideStrength(career, playing);
  const [us, them] = sampleScore(attack, fixture.opponentStrength, fixture.home, rng);
  const built = buildEvents(career.player.position, career.player.attrs, us, them, fixture.opponentStrength, playing, rng);
  const rating = playing
    ? rateMatch(career.player.position, career.player.attrs, {
        ...built,
        us,
        them,
        fitness: career.player.fitness,
      })
    : 0;
  const deltas = playing ? microGrowth(career.player.position, career.player.attrs, career.player.potential, career.player.age, rating, rng) : emptyAttrs();
  const injured = playing && career.player.fitness < 64 && rng() < (64 - career.player.fitness) / 150;
  const report: MatchReport = {
    fixtureId: fixture.id,
    competition: fixture.competition,
    round: fixture.round,
    roundLabel: fixture.roundLabel,
    opponentName: fixture.opponentName,
    home: fixture.home,
    us,
    them,
    missed: !playing,
    rating,
    goals: built.goals,
    assists: built.assists,
    tackles: built.tackles,
    keyPasses: built.keyPasses,
    saves: built.saves,
    shots: built.shots,
    errors: built.errors,
    injured,
    events: built.events,
    deltas,
    headline: "",
  };
  report.headline = headlineFor(report);
  return report;
}

function insertFixture(career: Career, fixture: Fixture) {
  if (career.season.fixtures.some((item) => item.id === fixture.id)) return;
  career.season.fixtures.splice(career.season.cursor, 0, fixture);
}

function followUp(career: Career, report: MatchReport, rng: () => number) {
  const won = report.us > report.them;
  const league = getLeague(leagueOf(career, career.clubId));
  if (!won || report.missed) return;
  if (report.round === "cup-sf") {
    const oppPool = divisionClubs(career, league.id).filter((club) => club.id !== career.clubId);
    const opp = pick(rng, oppPool);
    insertFixture(
      career,
      makeFixture(
        {
          id: `C-f-${career.year}`,
          competition: "cup",
          round: "cup-f",
          opponentId: opp.id,
          opponentName: opp.name,
          opponentStrength: clubStrength(opp.id) + 2,
          home: false,
        },
        league.cup,
        league.europe,
      ),
    );
  }
}

function simBystanders(table: TableRow[], ourId: string, roundIndex: number, rng: () => number) {
  const others = table.filter((row) => row.clubId !== ourId);
  if (others.length < 2) return;
  const shift = roundIndex % others.length;
  const rotated = others.map((_, index) => others[(index + shift) % others.length]);
  for (let i = 0; i + 1 < rotated.length; i += 2) {
    const home = rotated[i];
    const away = rotated[i + 1];
    const [gf, ga] = sampleScore(clubStrength(home.clubId), clubStrength(away.clubId), roundIndex % 2 === 0, rng);
    applyScore(table, home.clubId, away.clubId, gf, ga);
  }
}

function applyDeltas(attrs: Attrs, deltas: Attrs) {
  const next = { ...attrs };
  for (const key of ATTR_KEYS) next[key] = clamp(next[key] + deltas[key], 28, 99);
  return next;
}

export function applyReport(career: Career, report: MatchReport, rng: () => number, screen: Career["screen"]): Career {
  const next: Career = {
    ...career,
    player: { ...career.player, attrs: { ...career.player.attrs } },
    season: {
      ...career.season,
      training: { ...career.season.training },
      fixtures: career.season.fixtures.map((item) => ({ ...item })),
      table: career.season.table.map((row) => ({ ...row })),
      fixturesPlayed: [...career.season.fixturesPlayed],
    },
    totals: { ...career.totals },
    news: [...career.news],
  };

  if (!report.missed) {
    next.player.attrs = applyDeltas(next.player.attrs, report.deltas);
    next.player.fitness = clamp(next.player.fitness - (14 + Math.floor(rng() * 5)), 24, 100);
    next.player.form = clamp(next.player.form * 0.5 + report.rating * 10 * 0.5, 8, 100);
    const swing = report.us > report.them ? 8 : report.us === report.them ? 2 : -7;
    next.player.morale = clamp(next.player.morale + swing, 5, 100);
    next.reputation = clamp(next.reputation + (report.rating - 6.2) * 0.9 + (report.competition === "europe" ? 1.4 : 0), 0, 100);
    next.season.apps += 1;
    next.season.sumRating += report.rating;
    next.season.goals += report.goals;
    next.season.assists += report.assists;
    if (report.competition === "league") next.season.leagueGoals += report.goals;
    next.totals.apps += 1;
    next.totals.goals += report.goals;
    next.totals.assists += report.assists;
    next.totals.ratingSum += report.rating;
  } else {
    next.player.form = clamp(next.player.form - 6, 8, 100);
    next.player.morale = clamp(next.player.morale - 4, 5, 100);
    if (report.missReason === "injury") next.player.fitness = 74;
  }

  if (report.competition === "league") {
    const fixture = next.season.fixtures.find((item) => item.id === report.fixtureId);
    if (fixture) {
      if (fixture.home) applyScore(next.season.table, next.clubId, fixture.opponentId, report.us, report.them);
      else applyScore(next.season.table, fixture.opponentId, next.clubId, report.them, report.us);
    }
    simBystanders(next.season.table, next.clubId, next.season.cursor, rng);
  }

  next.season.fixturesPlayed.push(logFrom(report));
  next.season.cursor += 1;
  next.season.prep = "none";
  if (report.missReason === "injury") next.season.outFor = Math.max(0, career.season.outFor - 1);
  else if (!report.missed && report.injured) {
    const spell = career.player.age >= 33 ? (rng() < 0.4 ? 5 : 4) : rng() < 0.5 ? 2 : rng() < 0.85 ? 3 : 4;
    next.season.outFor = spell;
    next.news = pushNews(next.news, `Injured. Out for the next ${spell} matches.`);
  } else next.season.outFor = 0;
  followUp(next, report, rng);
  const deltaText = ATTR_KEYS.filter((key) => report.deltas[key] > 0)
    .map((key) => `${ATTR_LABEL[key]} +${report.deltas[key]}`)
    .join(" · ");
  const scoreBit = `${report.us}–${report.them} vs ${report.opponentName}`;
  next.news = pushNews(next.news, report.missed ? `${report.headline}` : `${scoreBit}. Rating ${report.rating.toFixed(1)}${deltaText ? ` · ${deltaText}` : ""}`);
  next.activeReport = report;
  next.screen = screen;
  if (report.competition === "national" && !report.missed && report.rating >= 7) {
    next.reputation = clamp(next.reputation + 3, 0, 100);
  }
  return next;
}

export function playNext(career: Career): Career {
  const fixture = nextFixture(career);
  if (!career || career.retired || !fixture) return career;
  const rng = makeRng(career.rng);
  const roll = () => rng.next();
  let playing = true;
  let missReason: MatchReport["missReason"];
  if (career.season.outFor > 0) {
    playing = false;
    missReason = "injury";
  } else if (shouldBench(career, roll)) {
    playing = false;
    missReason = "bench";
  }
  const report = simulateAgainst(career, fixture, playing, roll);
  if (!playing) {
    report.missed = true;
    report.missReason = missReason;
    report.headline = headlineFor(report);
    report.events = [
      { minute: 0, tone: "neutral", text: report.headline, us: 0, them: 0 },
      ...report.events.filter((event) => event.minute === 90),
    ];
  }
  const applied = applyReport(career, report, roll, "match");
  applied.rng = rng.state();
  return applied;
}

export function playStep(career: Career): Career {
  if (career.retired || career.screen === "camp" || career.screen === "break" || career.screen === "season" || career.screen === "summer" || career.screen === "offers") return career;
  const fixture = nextFixture(career);
  if (!fixture) return openSeason(career);
  const rng = makeRng(career.rng);
  const roll = () => rng.next();
  let playing = true;
  let missReason: MatchReport["missReason"];
  if (career.season.outFor > 0) {
    playing = false;
    missReason = "injury";
  } else if (shouldBench(career, roll)) {
    playing = false;
    missReason = "bench";
  }
  const report = simulateAgainst(career, fixture, playing, roll);
  if (!playing) {
    report.missed = true;
    report.missReason = missReason;
    report.headline = headlineFor(report);
  }
  const applied = applyReport(career, report, roll, "run");
  applied.rng = rng.state();
  applied.recentDeltas = null;
  if (!applied.season.breakDone && applied.season.cursor >= applied.season.breakAt) {
    applied.screen = "break";
    applied.season = { ...applied.season, phase: "first" };
    return applied;
  }
  if (!nextFixture(applied)) return openSeason(applied);
  applied.screen = "run";
  return applied;
}

export function runToStop(career: Career): Career {
  let current = career;
  let guard = 0;
  while (current.screen === "run" && nextFixture(current) && guard < 80) {
    current = playStep(current);
    guard += 1;
  }
  return current;
}

export function breakGain(career: Career, key: AttrKey) {
  const cap = statCap(career.player.position, career.player.potential, key);
  const room = cap - career.player.attrs[key];
  if (room <= 0) return 0;
  const raw = career.player.age <= 21 ? 3 : career.player.age <= 28 ? 2 : 1;
  const pace = career.difficulty === "easy" ? 1 : career.difficulty === "hard" ? -1 : 0;
  return Math.min(room, Math.max(0, raw + pace));
}

export function answerCamp(career: Career, key: AttrKey): Career {
  if (career.screen !== "camp") return career;
  const gain = breakGain(career, key);
  const attrs = { ...career.player.attrs, [key]: career.player.attrs[key] + gain };
  const training = { ...career.season.training, [key]: career.season.training[key] + 2 };
  const deltas = emptyAttrs();
  deltas[key] = gain;
  const note = gain
    ? `Pre-season. ${ATTR_LABEL[key]} +${gain}, now ${attrs[key]}. The league starts.`
    : `Pre-season. ${ATTR_LABEL[key]} is already at its ceiling. The league starts.`;
  return {
    ...career,
    player: { ...career.player, attrs, morale: clamp(career.player.morale + 4, 5, 100) },
    season: { ...career.season, training, prep: "train" },
    recentDeltas: deltas,
    screen: "run",
    news: pushNews(career.news, note),
  };
}

export function answerBreak(career: Career, key: AttrKey): Career {
  if (career.screen !== "break") return career;
  const gain = breakGain(career, key);
  const attrs = { ...career.player.attrs, [key]: career.player.attrs[key] + gain };
  const training = { ...career.season.training, [key]: career.season.training[key] + 2 };
  const deltas = emptyAttrs();
  deltas[key] = gain;
  const note = gain
    ? `Winter break. ${ATTR_LABEL[key]} +${gain}, now ${attrs[key]}. The second half starts.`
    : `Winter break. ${ATTR_LABEL[key]} is already at its ceiling. The second half starts.`;
  return {
    ...career,
    player: { ...career.player, attrs, morale: clamp(career.player.morale + 6, 5, 100), fitness: clamp(career.player.fitness + 8, 0, 100) },
    season: { ...career.season, training, phase: "second", breakDone: true, prep: "train" },
    recentDeltas: deltas,
    screen: "run",
    news: pushNews(career.news, note),
  };
}

export function train(career: Career, key: AttrKey): Career {
  if (career.season.prep !== "none" || !nextFixture(career)) return career;
  const next = {
    ...career,
    player: { ...career.player },
    season: { ...career.season, training: { ...career.season.training } },
    news: [...career.news],
  };
  next.player.fitness = clamp(next.player.fitness - 8, 20, 100);
  next.player.morale = clamp(next.player.morale + 2, 5, 100);
  next.season.training[key] += 1;
  next.season.prep = "train";
  next.news = pushNews(next.news, `${ATTR_LABEL[key]} session. Fitness dips. It counts at the end of the season.`);
  return next;
}

export function rest(career: Career): Career {
  if (career.season.prep !== "none" || !nextFixture(career)) return career;
  const next = { ...career, player: { ...career.player }, season: { ...career.season }, news: [...career.news] };
  next.player.fitness = clamp(next.player.fitness + 22, 0, 100);
  next.player.form = clamp(next.player.form - 3, 8, 100);
  next.season.prep = "rest";
  next.news = pushNews(next.news, "A rest day. The legs come back, the rhythm sleeps a little.");
  return next;
}

export function computeGrowth(career: Career): GrowthPreview {
  const age = career.player.age;
  const apps = career.season.apps;
  const scheduled = Math.max(1, career.season.fixturesPlayed.length);
  const appsRatio = apps / scheduled;
  const avg = apps ? career.season.sumRating / apps : 0;
  const deltas = emptyAttrs();
  const before = { ...career.player.attrs };

  for (const key of ATTR_KEYS) {
    const cap = statCap(career.player.position, career.player.potential, key);
    const room = cap - before[key];
    const rel = RELEVANCE[career.player.position][key];
    if (room <= 0) continue;
    const perf = Math.max(0, avg - 6.4);
    const base = ageGrowth(age) * rel * (0.85 + perf * 1.2) * (0.35 + 0.65 * (apps ? appsRatio : 0));
    const fromTrain = career.season.training[key] * (age <= 21 ? 0.48 : 0.32) * rel;
    let gain = base + fromTrain;
    const ovrNow = overall(career.player.position, before);
    if (career.player.potential - ovrNow >= 14 && age <= 23) gain *= 1.35;
    if (room < 8) gain *= room / 8;
    let rounded = Math.round(gain);
    if (rel >= 1 && age <= 19 && apps >= 4 && avg >= 6.5 && room > 2) rounded = Math.max(rounded, 3);
    else if (rel >= 1 && age <= 22 && apps >= 4 && avg >= 6.7 && room > 1) rounded = Math.max(rounded, 2);
    else if (avg >= 7.3 && rel >= 0.9 && age <= 28 && apps > 0) rounded = Math.max(rounded, 1);
    if (avg > 0 && avg < 6.15 && career.season.training[key] === 0) rounded = Math.min(rounded, age <= 18 ? 1 : 0);
    if (apps === 0 && career.season.training[key] === 0) rounded = 0;
    const factor = career.difficulty === "easy" ? 1.5 : career.difficulty === "hard" ? 0.65 : 1;
    if (factor !== 1 && rounded > 0) rounded = Math.max(1, Math.round(rounded * factor));
    deltas[key] = clamp(rounded, 0, Math.min(room, gainCap(age, career.difficulty)));
  }

  if (age >= 33) {
    deltas.pace -= age >= 36 ? 3 : 2;
    deltas.physical -= age >= 36 ? 2 : 1;
  }
  if (age >= 35) {
    deltas.tackle -= 1;
    deltas.passing -= 1;
    deltas.shooting -= 1;
  }

  const after = applyDeltas(before, deltas);
  const lines: string[] = [];
  if (career.difficulty === "easy") lines.push("@line.easy");
  else if (career.difficulty === "hard") lines.push("@line.hard");
  else lines.push("@line.mid");
  if (age <= 19) lines.push("@line.youth");
  else if (age <= 23) lines.push("@line.jump");
  else if (age <= 29) lines.push("@line.prime");
  else if (age >= 33) lines.push("@line.body");
  else lines.push("@line.hold");

  if (apps === 0) lines.push("@line.none");
  else if (avg >= 7.5) lines.push(`@line.hot|${avg.toFixed(1)}`);
  else if (avg >= 6.6) lines.push(`@line.fair|${avg.toFixed(1)}`);
  else lines.push(`@line.poor|${avg.toFixed(1)}`);

  const trained = [...ATTR_KEYS].sort((a, b) => career.season.training[b] - career.season.training[a])[0];
  if (trained && career.season.training[trained] > 0) {
    lines.push(`@line.train|attr.${trained}|${career.season.training[trained]}`);
  }

  const pos = tablePosition(career);
  const targetHit = pos > 0 && pos <= career.season.targetLine;
  const europe = silentEurope(career);
  const ballon = ballonName(career, avg, pos, europe, overall(career.player.position, career.player.attrs));
  const awards = collectAwards(career, avg, pos, europe, ballon.yours);
  const targetKey = career.season.targetLabel.replace(/^@/, "");
  lines.push(targetHit ? `@line.met|${targetKey}` : `@line.miss|${targetKey}`);
  if (europe) {
    const comp = europe.comp === "cl" ? "comp.cl" : "comp.el";
    lines.push(europe.stage === "Winners" ? `@line.euWin|${comp}` : `@line.euOut|${comp}|${europe.stage}`);
  }
  lines.push(ballon.yours ? "@ballon.you" : `@ballon.other|${ballon.name}`);
  return {
    before,
    deltas,
    after,
    ovrBefore: overall(career.player.position, before),
    ovrAfter: overall(career.player.position, after),
    avg: Math.round(avg * 10) / 10,
    lines,
    awards,
    tablePos: pos,
    age,
    targetLabel: career.season.targetLabel,
    targetHit,
    europe,
    ballon: ballon.name,
    ballonYours: ballon.yours,
  };
}

function isFinal(label: string) {
  return label.startsWith("@round.cupF");
}

const BALLON_FIELD = ["Mbappé", "Haaland", "Bellingham", "Vinícius", "Yamal", "Rodri", "Salah", "Kane", "Musiala", "Wirtz"];

function ballonName(career: Career, avg: number, pos: number, europe: EuropeRun | null, ovr: number) {
  const league = getLeague(leagueOf(career, career.clubId));
  const yours =
    career.player.age >= 18 &&
    isTopLeague(league.id) &&
    ovr >= 84 &&
    avg >= 7.3 &&
    career.season.apps >= 10 &&
    (pos <= 2 || europe?.stage === "Winners" || europe?.stage === "Final" || career.season.leagueGoals >= 18);
  if (yours) return { name: career.player.name, yours: true };
  const pool = BALLON_FIELD.filter((name) => name.toLowerCase() !== career.player.name.trim().toLowerCase());
  return { name: pool[hashString(`${career.year}|ballon`) % pool.length] ?? "Haaland", yours: false };
}

function collectAwards(career: Career, avg: number, pos: number, europe: EuropeRun | null, ballonYours: boolean): Award[] {
  const awards: Award[] = [];
  const league = getLeague(leagueOf(career, career.clubId));
  const logs = career.season.fixturesPlayed;
  if (pos === 1 && logs.some((item) => item.competition === "league")) {
    awards.push({ id: `league-${career.year}`, name: `@award.league|${league.name}`, detail: "@award.leagueD" });
  }
  if (logs.some((item) => item.competition === "cup" && isFinal(item.roundLabel) && item.us > item.them)) {
    awards.push({ id: `cup-${career.year}`, name: league.cup, detail: "@award.cupD" });
  }
  if (europe?.stage === "Winners") {
    awards.push({
      id: `eu-${career.year}`,
      name: europe.comp === "cl" ? "@comp.cl" : "@comp.el",
      detail: europe.comp === "cl" ? "@award.cl" : "@award.el",
    });
  }
  if (career.season.leagueGoals >= 12) {
    awards.push({ id: `boot-${career.year}`, name: "@award.boot", detail: `@award.bootD|${career.season.leagueGoals}` });
  }
  if (avg >= 7.6 && career.season.apps >= 6 && pos <= 3) {
    awards.push({ id: `poty-${career.year}`, name: "@award.poty", detail: `@award.potyD|${avg.toFixed(1)}|${pos}` });
  }
  if (career.player.age <= 19 && avg >= 7.2 && career.season.apps >= 5) {
    awards.push({ id: `youth-${career.year}`, name: "@award.youth", detail: "@award.youthD" });
  }
  if (ballonYours) {
    awards.push({ id: `ballon-${career.year}`, name: "@award.ballon", detail: career.player.name });
  }
  return awards;
}

export function openSeason(career: Career): Career {
  if (nextFixture(career)) return career;
  const growthPreview = computeGrowth(career);
  if (career.shuffle?.year === career.year) {
    return { ...career, screen: "season", growthPreview, activeReport: null };
  }
  const moved = shufflePyramid(career);
  const clubName = getClub(career.clubId).name;
  const before = leagueOf(career, career.clubId);
  const after = moved.divisions[career.clubId] ?? before;
  const line =
    before === after
      ? `${clubName} stay in ${getLeague(before).name}.`
      : getLeague(after).tier > getLeague(before).tier
        ? `${clubName} are promoted to ${getLeague(after).name}.`
        : `${clubName} are relegated to ${getLeague(after).name}.`;
  return {
    ...career,
    divisions: moved.divisions,
    shuffle: moved.shuffle,
    screen: "season",
    growthPreview,
    activeReport: null,
    news: pushNews(career.news, line),
  };
}

function wageFor(tier: number, ovr: number) {
  const base = [900, 2800, 9000, 48000, 120000, 180000, 240000][tier] ?? 900;
  return Math.round((base * (0.65 + ovr / 90)) / 100) * 100;
}

function roleFor(ovr: number, tier: number, age: number): Role {
  const gap = ovr - TIER_STRENGTH[tier];
  if (gap >= 5) return "Star";
  if (gap >= -7 || (age <= 21 && gap >= -12)) return "Starter";
  if (gap >= -14 || age <= 22) return "Rotation";
  return "Bench";
}

function noteFor(role: Role, kind: Offer["kind"]) {
  if (role === "Bench") return "@note.bench";
  if (role === "Rotation") return "@note.rotation";
  if (kind === "side") return "@note.side";
  if (kind === "up") return "@note.up";
  if (role === "Star") return "@note.star";
  return "@note.xi";
}

function offerFor(career: Career, club: Club, ovr: number, age: number, kind: Offer["kind"], years: number): Offer {
  const league = getLeague(leagueOf(career, club.id));
  let role = roleFor(ovr, league.tier, age);
  if (age >= 36 && role === "Bench") role = "Rotation";
  let wage = wageFor(league.tier, ovr);
  if (age >= 37) wage = Math.round(wage * 0.45);
  else if (age >= 35) wage = Math.round(wage * 0.72);
  let note = noteFor(role, kind);
  if (age >= 37) note = "@note.last";
  else if (age >= 35) note = `@note.old|${note.slice(1)}`;
  return { clubId: club.id, leagueId: league.id, wage, role, kind, years, note };
}

function clubBySalt(career: Career, leagueId: string, salt: string, bias: "top" | "mid" | "low") {
  const list = divisionClubs(career, leagueId);
  const third = Math.max(1, Math.floor(list.length / 3));
  const pool = bias === "top" ? list.slice(0, third) : bias === "low" ? list.slice(-third) : list.slice(third, Math.max(third + 1, list.length - third));
  const options = pool.length ? pool : list;
  return options[hashString(salt) % options.length] ?? list[0];
}

export function buildOffers(career: Career, ovr: number, tablePos: number): Offer[] {
  const club = getClub(career.clubId);
  const league = getLeague(leagueOf(career, club.id));
  const age = career.player.age;
  const years = age >= farewellAge(career.player.position) ? 1 : moveEvery(career.difficulty);
  const offers: Offer[] = [offerFor(career, club, ovr, age, "stay", years)];
  if (career.shuffle?.promoted.includes(club.id)) offers[0].note = `@note.promoted|${league.name}|${offers[0].note.replace(/^@/, "")}`;
  if (career.shuffle?.relegated.includes(club.id)) offers[0].note = `@note.relegated|${league.name}|${offers[0].note.replace(/^@/, "")}`;
  const avg = career.season.apps ? career.season.sumRating / career.season.apps : 0;
  const strong = tablePos <= 2;
  const sharp = avg >= 7.1 && career.season.apps >= 4;
  const above = ovr >= TIER_STRENGTH[league.tier] + 2;
  const salt = `${career.player.name}|${career.year}|${ovr}`;

  const pushClub = (leagueId: string, kind: Offer["kind"], bias: "top" | "mid" | "low") => {
    let dest = clubBySalt(career, leagueId, `${salt}|${leagueId}|${kind}`, bias);
    if (dest.id === club.id) {
      const alt = divisionClubs(career, leagueId).find((item) => item.id !== club.id);
      if (alt) dest = alt;
    }
    const offer = offerFor(career, dest, ovr, age, kind, years);
    if ((kind === "up" || kind === "pro") && offer.role === "Bench") return;
    offers.push(offer);
  };

  const up = nextLeague(league);
  const limit = farewellAge(career.player.position);
  if (age >= limit) {
    offers[0].years = 1;
    return offers.slice(0, 1);
  }
  if (career.contractLeft > 0) {
    offers[0].years = career.contractLeft;
    offers[0].note = career.contractLeft === 1 ? "@note.locked1" : `@note.locked|${career.contractLeft}`;
    return offers.slice(0, 1);
  }

  const mates = divisionClubs(career, league.id).filter((item) => item.id !== club.id);
  const sideCount = age >= 36 ? 1 : 2;
  const start = hashString(`${salt}|side`) % mates.length;
  for (let i = 0; i < sideCount; i++) {
    const dest = mates[(start + i * 5) % mates.length];
    if (dest && !offers.some((item) => item.clubId === dest.id)) offers.push(offerFor(career, dest, ovr, age, "side", years));
  }

  if (age < 36 && up && (strong || sharp || above || tablePos <= 6)) pushClub(up.id, "up", above ? "top" : "mid");
  else if (age < 36 && !up && (strong || above || sharp)) {
    const abroad = LEAGUES.filter((item) => item.countryId !== league.countryId && item.tier >= Math.max(2, league.tier)).sort((a, b) => b.tier - a.tier)[0];
    if (abroad) pushClub(abroad.id, "up", "mid");
  }

  const down = prevLeague(league);
  const size = divisionClubs(career, league.id).length;
  if (down && tablePos >= size - 2 && avg > 0 && avg < 6.3) {
    pushClub(down.id, "down", "top");
  }

  const unique: Offer[] = [];
  for (const offer of offers) {
    if (!unique.some((item) => item.clubId === offer.clubId)) unique.push(offer);
  }
  const hit = career.growthPreview?.targetHit;
  for (const offer of unique) {
    if (hit === true) offer.wage = Math.round(offer.wage * 1.12);
    if (hit === false) offer.wage = Math.round(offer.wage * 0.9);
  }
  return unique.slice(0, 5);
}

export function commitSeason(career: Career): Career {
  if (career.screen === "offers" || career.screen === "retired") return career;
  const preview = career.growthPreview ?? computeGrowth(career);
  const attrs = applyDeltas(career.player.attrs, preview.deltas);
  const ovr = overall(career.player.position, attrs);
  const trophies = [
    ...career.trophies,
    ...preview.awards.map((award) => ({ ...award, year: career.year })),
  ];
  const history = [
    ...career.history,
    {
      year: career.year,
      clubId: career.clubId,
      leagueId: career.season.leagueId,
      pos: preview.tablePos,
      apps: career.season.apps,
      goals: career.season.goals,
      avg: preview.avg,
      ovr,
    },
  ];
  const left = Math.max(0, career.contractLeft - 1);
  const boardSwing = preview.targetHit ? 6 : -8;
  const aged: Career = {
    ...career,
    player: {
      ...career.player,
      attrs,
      age: career.player.age + 1,
      morale: clamp(career.player.morale + boardSwing, 5, 100),
    },
    trophies,
    history,
    contractLeft: left,
    totals: {
      ...career.totals,
      seasons: career.totals.seasons + 1,
      trophies: trophies.length,
    },
    reputation: clamp(career.reputation + preview.awards.length * 4 + (preview.targetHit ? 5 : -3), 0, 100),
    lastFinish: preview.tablePos,
    growthPreview: preview,
    pendingOffers: null,
    summer: null,
    screen: "offers",
    news: pushNews(career.news, preview.targetHit ? "The board is pleased with the season." : "The board wanted a higher finish."),
  };
  aged.pendingOffers = buildOffers(aged, ovr, preview.tablePos);
  if (aged.player.age > farewellAge(aged.player.position)) {
    return {
      ...aged,
      retired: true,
      screen: "retired",
      pendingOffers: null,
      news: pushNews(aged.news, `At ${aged.player.age} nobody offers a contract. The career ends.`),
    };
  }
  return aged;
}

function euroSpotFor(career: Career, clubId: string) {
  return europeTicket(career, clubId);
}

export function acceptOffer(career: Career, clubId: string): Career {
  const offer = career.pendingOffers?.find((item) => item.clubId === clubId);
  if (!offer) return career;
  const preview = career.growthPreview;
  const next: Career = {
    ...career,
    clubId: offer.clubId,
    wage: offer.wage,
    role: offer.role,
    contractLeft: offer.years,
    year: career.year + 1,
    player: {
      ...career.player,
      fitness: 90,
      form: clamp(career.player.form, 50, 80),
      morale: offer.kind === "down" ? 48 : 74,
    },
    reputation: clamp(career.reputation + (offer.kind === "up" || offer.kind === "pro" ? 6 : offer.kind === "down" ? -4 : 1), 0, 100),
    europeComp: euroSpotFor(career, offer.clubId),
    recentDeltas: preview?.deltas ?? null,
    pendingOffers: null,
    growthPreview: null,
    activeReport: null,
    summer: null,
    screen: "camp",
    news: [...career.news],
  };
  const rng = makeRng(next.rng);
  next.season = freshSeason(next, () => rng.next());
  next.rng = rng.state();
  const club = getClub(offer.clubId);
  const country = getCountry(getLeague(club.leagueId).countryId);
  next.countryId = country.id;
  next.news = pushNews(next.news, `You sign for ${club.name} on a ${offer.years}-year deal. Pre-season, then ${seasonLabel(next.year)}. Age ${next.player.age}.`);
  return next;
}

function summerKind(year: number): "friendly" | "euros" | "world-cup" {
  if (year % 4 === 2) return "world-cup";
  if (year % 4 === 0) return "euros";
  return "friendly";
}

function intlFixture(id: string, label: string, opponent: string, strength: number, home: boolean): Fixture {
  return {
    id,
    competition: "national",
    round: "national",
    roundLabel: label,
    opponentId: id,
    opponentName: opponent,
    opponentStrength: strength,
    home,
  };
}

export function startSummer(career: Career): Career {
  if (career.screen !== "season") return career;
  const kind = summerKind(career.year);
  const country = getCountry(career.countryId);
  const ovr = overall(career.player.position, career.player.attrs);
  const bar = career.countryId === "isr" ? 60 : career.countryId === "ned" || career.countryId === "por" ? 68 : 74;
  const called = career.player.age >= 17 && (ovr >= bar || (career.reputation >= 50 && ovr >= bar - 6));
  const tag = kind === "world-cup" ? "summer.wc" : kind === "euros" ? "summer.euros" : "summer.friendly";
  const reason = called ? `@summer.in|${country.national}|${tag}` : `@summer.out|${country.national}|${bar}`;
  const rng = makeRng(hashString(`${career.player.name}|summer|${career.year}`) || 1);
  const rivals = NATIONS.filter((name) => name !== country.national);
  const pickName = () => rivals[Math.floor(rng.next() * rivals.length)] ?? "A national team";
  const fixtures: Fixture[] = [];
  if (called && kind === "friendly") {
    fixtures.push(intlFixture(`f1-${career.year}`, "@summer.friendly", pickName(), 70 + rng.next() * 10, true));
    fixtures.push(intlFixture(`f2-${career.year}`, "@summer.friendly", pickName(), 72 + rng.next() * 8, false));
  } else if (called) {
    fixtures.push(intlFixture(`t1-${career.year}`, `@summer.group|${tag}`, pickName(), 76 + rng.next() * 8, true));
  }
  return {
    ...career,
    screen: "summer",
    summer: { kind, called, reason, fixtures, cursor: 0, played: [], done: !called },
    news: pushNews(career.news, reason),
  };
}

export function playSummer(career: Career): Career {
  if (career.screen !== "summer" || !career.summer || career.summer.done || !career.summer.called) return career;
  const fx = career.summer.fixtures[career.summer.cursor];
  if (!fx) return { ...career, summer: { ...career.summer, done: true } };
  const rng = makeRng(career.rng || 1);
  const roll = () => rng.next();
  const report = simulateAgainst({ ...career, player: { ...career.player, fitness: 92, form: 70, morale: 74 } }, fx, true, roll);
  report.deltas = emptyAttrs();
  const fixtures = [...career.summer.fixtures];
  const won = report.us > report.them;
  const tag = career.summer.kind === "world-cup" ? "summer.wc" : "summer.euros";
  if (career.summer.kind !== "friendly" && won && fx.id.startsWith("t1")) {
    const rivals = NATIONS.filter((name) => name !== getCountry(career.countryId).national && name !== fx.opponentName);
    fixtures.push(intlFixture(`t2-${career.year}`, `@summer.semi|${tag}`, rivals[Math.floor(roll() * rivals.length)] ?? "A national team", 80 + roll() * 6, false));
  }
  if (career.summer.kind !== "friendly" && won && fx.id.startsWith("t2")) {
    const rivals = NATIONS.filter((name) => name !== getCountry(career.countryId).national && name !== fx.opponentName);
    fixtures.push(intlFixture(`t3-${career.year}`, `@summer.final|${tag}`, rivals[Math.floor(roll() * rivals.length)] ?? "A national team", 84, true));
  }
  let trophies = career.trophies;
  let news = pushNews(career.news, `${fx.roundLabel}: ${report.us}–${report.them} vs ${report.opponentName}. ${report.rating.toFixed(1)}.`);
  if (won && fx.id.startsWith("t3")) {
    trophies = [...trophies, { id: `${career.summer.kind}-${career.year}`, name: `@${tag}`, year: career.year, detail: getCountry(career.countryId).national }];
    news = pushNews(news, `${tag} winners.`);
  }
  const cursor = career.summer.cursor + 1;
  return {
    ...career,
    rng: rng.state(),
    trophies,
    summer: {
      ...career.summer,
      fixtures,
      played: [...career.summer.played, logFrom(report)],
      cursor,
      done: cursor >= fixtures.length,
    },
    totals: {
      ...career.totals,
      caps: career.totals.caps + 1,
      intlGoals: career.totals.intlGoals + report.goals,
      trophies: trophies.length,
    },
    reputation: clamp(career.reputation + (report.rating - 6.2) * 0.7 + (won && fx.id.startsWith("t3") ? 8 : 0), 0, 100),
    news,
  };
}

export function retireCareer(career: Career): Career {
  const preview = career.growthPreview ?? (nextFixture(career) ? null : computeGrowth(career));
  const attrs = preview ? applyDeltas(career.player.attrs, preview.deltas) : career.player.attrs;
  return {
    ...career,
    retired: true,
    screen: "retired",
    player: { ...career.player, attrs },
    pendingOffers: null,
    activeReport: null,
    news: pushNews(career.news, `${career.player.name} hangs up the boots at ${career.player.age}.`),
  };
}

export function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export type DailyBoard = {
  date: string;
  position: PositionId;
  clubId: string;
  attrs: Attrs;
  potential: number;
};

export function dailyBoard(date = todayKey()): DailyBoard {
  const rng = makeRng(hashString(`star-daily|${date}`) || 1);
  const position = POSITIONS[Math.floor(rng.next() * POSITIONS.length)]?.id ?? "ST";
  const pool = CLUBS.filter((club) => isTopLeague(club.leagueId));
  const club = pool[Math.floor(rng.next() * pool.length)] ?? CLUBS[0];
  const attrs = emptyAttrs();
  for (const key of ATTR_KEYS) {
    const rel = RELEVANCE[position][key];
    attrs[key] = clamp(Math.round(70 + rel * 8), 62, 84);
  }
  return { date, position, clubId: club.id, attrs, potential: 94 };
}

export function createDailyCareer(name: string, date = todayKey()): Career {
  const board = dailyBoard(date);
  const club = getClub(board.clubId);
  const league = getLeague(club.leagueId);
  const trimmed = (name.trim() || "Star").slice(0, 16);
  const rng = makeRng(hashString(`star-daily-run|${date}`) || 1);
  const ranked = [...clubsIn(league.id)].sort((a, b) => clubStrength(b.id) - clubStrength(a.id));
  const place = Math.max(1, ranked.findIndex((item) => item.id === club.id) + 1);
  const draft: Career = {
    version: SAVE_VERSION,
    rng: rng.state(),
    screen: "camp",
    player: {
      name: trimmed,
      position: board.position,
      age: 16,
      attrs: board.attrs,
      potential: board.potential,
      fitness: 96,
      form: 72,
      morale: 74,
    },
    reputation: 24,
    countryId: league.countryId,
    clubId: club.id,
    difficulty: "normal",
    year: 2026,
    wage: 5000,
    role: "Starter",
    contractLeft: 1,
    lastFinish: place,
    europeComp: null,
    divisions: initialDivisions(),
    shuffle: null,
    season: {
      training: emptyAttrs(),
      apps: 0,
      sumRating: 0,
      goals: 0,
      assists: 0,
      leagueGoals: 0,
      fixturesPlayed: [],
      cursor: 0,
      fixtures: [],
      table: [],
      prep: "none",
      outFor: 0,
      targetLabel: "@target.half",
      targetLine: 12,
      phase: "first",
      breakAt: 1,
      breakDone: false,
      leagueId: league.id,
    },
    summer: null,
    totals: { seasons: 0, apps: 0, goals: 0, assists: 0, trophies: 0, ratingSum: 0, caps: 0, intlGoals: 0 },
    trophies: [],
    history: [],
    pendingOffers: null,
    growthPreview: null,
    activeReport: null,
    recentDeltas: null,
    daily: null,
    race: date,
    retired: false,
    news: [],
  };
  draft.europeComp = europeTicket(draft, club.id);
  const seasonRng = makeRng(draft.rng);
  draft.season = freshSeason(draft, () => seasonRng.next());
  draft.rng = seasonRng.state();
  return draft;
}

export function careerAim(career: Career): "division" | "overall" | "age" | "finish" {
  if (!isTopLeague(leagueOf(career, career.clubId))) return "division";
  if (overall(career.player.position, career.player.attrs) < 84) return "overall";
  if (career.player.age < 18) return "age";
  return "finish";
}

export function rewardedBoost(career: Career, key: AttrKey): Career {
  const cap = statCap(career.player.position, career.player.potential, key);
  if (career.player.attrs[key] >= cap) return career;
  const attrs = { ...career.player.attrs, [key]: career.player.attrs[key] + 1 };
  return {
    ...career,
    player: { ...career.player, attrs },
    news: pushNews(career.news, `${ATTR_LABEL[key]} +1 from a rewarded break.`),
  };
}
export function shirtNumber(position: PositionId) {
  return positionMeta(position).shirt;
}

export function primaryKeys(position: PositionId): AttrKey[] {
  return [...ATTR_KEYS].sort((a, b) => RELEVANCE[position][b] - RELEVANCE[position][a]).slice(0, 2);
}
