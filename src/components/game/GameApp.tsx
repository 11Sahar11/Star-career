import { Fragment, useContext, useEffect, useMemo, useState, createContext, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  Footprints,
  Medal,
  Play,
  RotateCcw,
  Shield,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Crest } from "@/components/game/crest";
import { playGoal, playWhistle, setAudioEnabled, unlockAudio } from "@/game/audio";
import { CLUBS, COUNTRIES, LEAGUES, NATIONS, POSITIONS, entryLeague, getClub, getCountry, getLeague, nationById } from "@/game/data";
import {
  acceptOffer,
  answerBreak,
  answerCamp,
  careerAim,
  commitSeason,
  createCareer,
  createDailyCareer,
  dailyBoard,
  farewellAge,
  money,
  nextFixture,
  openSeason,
  overall,
  playStep,
  playSummer,
  potentialLabel,
  previewPlayer,
  primaryKeys,
  retireCareer,
  statCap,
  rewardedBoost,
  runToStop,
  seasonLabel,
  shirtNumber,
  sortTable,
  startSummer,
  tablePosition,
  todayKey,
  trainOdds,
} from "@/game/engine";
import { boostId, boostTaken, healTaken, loadCareer, markHeal, loadDailyAttempt, loadSound, markBoost, saveCareer, saveDailyAttempt, saveSound, touchStreak, type DailyAttempt } from "@/game/save";
import { loadLang, setLang, show, t, type Lang } from "@/game/i18n";
import { authEnabled } from "@/lib/auth/client";
import { getViewerAccess, type ViewerAccess } from "@/lib/access";
import { PERKS, adminGrant, adminUnlockAll, applyPerks, buyPerk, canDouble, doubleLegacy, loadLegacy, payLegacy, perkState, type Legacy, type PerkId } from "@/game/legacy";
import { ATTR_KEYS, type AttrKey, type Career, type Difficulty, type MatchLog, type MatchReport, type Role } from "@/game/types";

type View = "boot" | "home" | "create" | "game" | "collection" | "summary" | "daily" | "privacy" | "legacy" | "admin";

const LangContext = createContext<Lang>("en");

function useTx() {
  const lang = useContext(LangContext);
  return {
    lang,
    tr: (key: string, vars?: Record<string, string | number>) => t(key, vars, lang),
    text: (raw: string) => show(raw, lang),
  };
}

const ATTR_ICON = {
  pace: Zap,
  tackle: Shield,
  passing: ArrowLeftRight,
  dribbling: Footprints,
  shooting: Target,
  physical: Dumbbell,
} as const;

export function GameApp() {
  const [booted, setBooted] = useState(false);
  const [career, setCareer] = useState<Career | null>(null);
  const [daily, setDaily] = useState<DailyAttempt | null>(null);
  const [playing, setPlaying] = useState<"main" | "daily">("main");
  const [view, setView] = useState<View>("home");
  const [streak, setStreak] = useState(1);
  const [sound, setSound] = useState(true);
  const [lang, setLangState] = useState<Lang>("en");
  const [access, setAccess] = useState<ViewerAccess | null>(null);

  useEffect(() => {
    if (!authEnabled) return;
    getViewerAccess()
      .then(setAccess)
      .catch(() => setAccess(null));
  }, []);

  useEffect(() => {
    const loaded = loadCareer();
    const audio = loadSound();
    const chosen = loadLang();
    const attempt = loadDailyAttempt();
    setCareer(loaded);
    if (attempt?.date === todayKey()) setDaily(attempt);
    setSound(audio);
    setAudioEnabled(audio);
    setLangState(chosen);
    document.documentElement.lang = chosen;
    document.documentElement.dir = chosen === "he" ? "rtl" : "ltr";
    setBooted(true);
    setStreak(touchStreak());
  }, []);

  function chooseLang(next: Lang) {
    setLang(next);
    setLangState(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
  }

  useEffect(() => {
    if (booted) saveCareer(career);
  }, [career, booted]);

  function update(next: Career | null) {
    if (playing === "daily") {
      setDaily((prev) => {
        const attempt: DailyAttempt = {
          date: todayKey(),
          career: next,
          seasons: prev?.date === todayKey() ? prev.seasons : null,
        };
        saveDailyAttempt(attempt);
        return attempt;
      });
      return;
    }
    setCareer(next);
  }

  function beginDaily(next: Career) {
    const attempt: DailyAttempt = {
      date: todayKey(),
      career: next,
      seasons: daily?.date === todayKey() ? daily.seasons : null,
    };
    setDaily(attempt);
    saveDailyAttempt(attempt);
    setPlaying("daily");
    setView("game");
    unlockAudio();
  }

  function finishDaily(done: Career) {
    const taken = done.year - 2026 + 1;
    const best = daily?.date === todayKey() && daily.seasons != null ? Math.min(daily.seasons, taken) : taken;
    const attempt: DailyAttempt = { date: todayKey(), career: null, seasons: best };
    setDaily(attempt);
    saveDailyAttempt(attempt);
    setPlaying("main");
    setView("daily");
  }

  function leaveDaily() {
    setPlaying("main");
    setView("home");
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setAudioEnabled(next);
    saveSound(next);
    unlockAudio();
  }

  const run = playing === "daily" ? (daily?.career ?? null) : career;
  const menu = () => (playing === "daily" ? leaveDaily() : setView("home"));

  let screen: ReactNode = null;
  if (view === "home") {
    screen = (
      <Home
        career={career}
        dailyBest={daily?.date === todayKey() ? daily.seasons : null}
        sound={sound}
        onSound={toggleSound}
        onLang={chooseLang}
        onCreate={() => setView("create")}
        onContinue={() => {
          if (!career) return;
          setPlaying("main");
          unlockAudio();
          setView("game");
        }}
        onCollection={() => setView("collection")}
        onSummary={() => setView("summary")}
        onDaily={() => setView("daily")}
        onPrivacy={() => setView("privacy")}
        onLegacy={() => setView("legacy")}
        access={access}
        onAdmin={() => setView("admin")}
        streak={streak}
        onNew={() => {
          setPlaying("main");
          setCareer(null);
          setView("create");
        }}
      />
    );
  } else if (view === "create") {
    screen = (
      <Create
        onBack={() => setView("home")}
        onStart={(name, position, countryId, nationId, salt, difficulty) => {
          setPlaying("main");
          unlockAudio();
          setCareer(applyPerks(createCareer(name, position, countryId, salt, difficulty, nationId), loadLegacy().perks));
          setView("game");
        }}
      />
    );
  } else if (view === "collection") screen = <Collection career={career} onBack={() => setView("home")} />;
  else if (view === "summary") screen = <Summary career={career} onBack={() => setView("home")} />;
  else if (view === "daily") {
    screen = <DailyLobby attempt={daily} onBack={() => setView("home")} onBegin={beginDaily} />;
  } else if (view === "privacy") screen = <Privacy onBack={() => setView("home")} />;
  else if (view === "legacy") screen = <LegacyScreen onBack={() => setView("home")} />;
  else if (view === "admin" && access?.admin) {
    screen = (
      <AdminScreen
        career={career}
        onCareer={setCareer}
        onResetDaily={() => {
          const cleared: DailyAttempt = { date: todayKey(), career: null, seasons: null };
          saveDailyAttempt(cleared);
          setDaily(cleared);
        }}
        onBack={() => setView("home")}
      />
    );
  } else if (view === "admin") screen = <Splash />; else if (!run) screen = <Splash />;
  else if (run.screen === "camp" || run.screen === "break") {
    screen = <TrainingScreen career={run} onChange={update} onMenu={menu} />;
  } else if (run.screen === "match" && run.activeReport) {
    screen = <MatchScreen career={run} onReport={() => update({ ...run, screen: "report" })} onMenu={menu} />;
  } else if (run.screen === "report" && run.activeReport) {
    screen = (
      <ReportScreen
        career={run}
        report={run.activeReport}
        onNext={() => {
          const cleared = { ...run, activeReport: null };
          update(nextFixture(cleared) ? { ...cleared, screen: "run" } : openSeason(cleared));
        }}
        onMenu={menu}
      />
    );
  } else if (run.screen === "season") {
    const wonRace = playing === "daily" && !!run.growthPreview?.ballonYours;
    screen = (
      <SeasonScreen
        career={run}
        claimRace={wonRace}
        onSummer={() => (wonRace ? finishDaily(run) : update(startSummer(run)))}
        onMenu={menu}
      />
    );
  } else if (run.screen === "summer" && run.summer) {
    screen = <SummerScreen career={run} onChange={update} onOffers={() => update(commitSeason(run))} onMenu={menu} />;
  } else if (run.screen === "offers") {
    screen = (
      <OffersScreen
        career={run}
        onAccept={(clubId) => update(acceptOffer(run, clubId))}
        onRetire={() => update(retireCareer(run))}
        onBoost={(key) => update(rewardedBoost(run, key))}
        onMenu={menu}
      />
    );
  } else if (run.screen === "retired" || run.retired) {
    screen = (
      <Retired
        career={run}
        legacyOn={playing === "main"}
        onHome={menu}
        onNew={() => {
          if (playing === "daily") {
            setPlaying("main");
            setView("daily");
            return;
          }
          setCareer(null);
          setView("create");
        }}
      />
    );
  } else screen = <RunScreen career={run} onChange={update} onMenu={menu} />;

  return <LangContext.Provider value={lang}>{screen}</LangContext.Provider>;
}

function ScreenHeader({
  title,
  sub,
  onBack,
  backLabel,
  right,
}: {
  title: string;
  sub?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
}) {
  const { tr } = useTx();
  return (
    <header className="topbar">
      {onBack ? (
        <button type="button" className="topbar-back" aria-label={backLabel ?? tr("menu")} onClick={onBack}>
          <ChevronLeft className="size-5 rtl:-scale-x-100" />
        </button>
      ) : (
        <span className="w-3" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[1.05rem] font-bold leading-tight">{title}</h1>
        {sub ? <p className="truncate text-xs text-muted">{sub}</p> : null}
      </div>
      {right ?? null}
    </header>
  );
}

function Splash() {
  const { tr } = useTx();
  return (
    <Shell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Crest />
        <p className="mt-4 text-sm font-semibold text-accent">{tr("splash")}</p>
        <h1 className="wordmark mt-2 text-3xl">STAR</h1>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <main className="app-shell mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-5">{children}</main>;
}

function band(value: number) {
  if (value >= 85) return "elite";
  if (value >= 75) return "high";
  if (value >= 65) return "good";
  if (value >= 55) return "mid";
  return "low";
}

/** 0.5–5 stars in halves: 45 or lower is half a star, 95 is five. */
function starsFor(value: number) {
  return Math.min(5, Math.max(0.5, Math.round(((value - 45) / 50) * 10) / 2));
}

const STAR_PATH = "M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z";

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="stars" role="img" aria-label={`${label}: ${value} / 5`}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, value - index));
        return (
          <svg key={index} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d={STAR_PATH} className="star-empty" />
            {fill > 0 ? <path d={STAR_PATH} className="star-full" style={fill < 1 ? { clipPath: "inset(0 50% 0 0)" } : undefined} /> : null}
          </svg>
        );
      })}
    </span>
  );
}

function PlayerHeader({ career }: { career: Career }) {
  const { tr } = useTx();
  const player = career.player;
  const ovr = overall(player.position, player.attrs);
  const club = getClub(career.clubId);
  const league = getLeague(career.season.leagueId);
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className={`ovr-badge band-${band(ovr)}`}>
          <span className="num">{ovr}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold leading-tight">{player.name}</p>
          <p className="truncate text-sm text-muted">
            {tr(`pos.${player.position}`)} · {club.name}
          </p>
          <p className="truncate text-xs text-muted">
            {tr("ageN", { n: player.age })} · {league.name}
          </p>
        </div>
        <span className="num self-start text-sm font-semibold text-muted">#{shirtNumber(player.position)}</span>
      </div>
      <div className="grid grid-cols-2 border-t border-line">
        <div className="grid gap-1 px-4 py-2.5">
          <span className="text-xs text-muted">{tr("ability")}</span>
          <Stars value={starsFor(ovr)} label={tr("ability")} />
        </div>
        <div className="grid gap-1 border-s border-line px-4 py-2.5">
          <span className="text-xs text-muted">{tr("potentialWord")}</span>
          <Stars value={starsFor(player.potential)} label={tr("potentialWord")} />
        </div>
      </div>
      <dl className="attr-grid">
        {ATTR_KEYS.map((key) => (
          <div key={key} className="attr-row">
            <dt>{tr(`attr.${key}`)}</dt>
            <dd className={`num band-${band(player.attrs[key])}`}>{player.attrs[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function leagueCount(career: Career) {
  const total = career.season.fixtures.filter((item) => item.competition === "league").length;
  const played = career.season.fixturesPlayed.filter((item) => item.competition === "league").length;
  return { played, total };
}

function SeasonProgress({ career }: { career: Career }) {
  const { tr, text } = useTx();
  const { played, total } = leagueCount(career);
  const place = tablePosition(career);
  const onTrack = place <= career.season.targetLine;
  return (
    <div className="mt-3 grid gap-2 px-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted">
          {seasonLabel(career.year)} · {tr("matchday", { n: played, m: total })}
        </span>
        <span className={`font-bold ${onTrack ? "text-good" : "text-bad"}`}>
          {text(career.season.targetLabel)}
        </span>
      </div>
      <div className="meter">
        <i style={{ width: `${total ? Math.round((played / total) * 100) : 0}%` }} />
      </div>
    </div>
  );
}

function RateTiles({ logs }: { logs: MatchLog[] }) {
  const last = logs.filter((item) => item.competition === "league").slice(-5);
  if (!last.length) return <p className="text-xs text-muted">—</p>;
  return (
    <div className="flex gap-1">
      {last.map((item, index) => (
        <span
          key={`${item.opponentName}-${index}`}
          className={`rate ${item.missed ? "out" : item.rating >= 7.2 ? "hot" : item.rating >= 6.4 ? "" : "cold"}`}
        >
          {item.missed ? "–" : item.rating.toFixed(1)}
        </span>
      ))}
    </div>
  );
}

function LeagueTable({ career, compact }: { career: Career; compact?: boolean }) {
  const { tr } = useTx();
  const [full, setFull] = useState(!compact);
  const rows = sortTable(career.season.table);
  const mine = rows.findIndex((row) => row.clubId === career.clubId);
  let picked = rows.map((row, index) => ({ row, index }));
  if (!full && rows.length > 7) {
    const start = Math.max(0, Math.min(mine - 2, rows.length - 5));
    const around = picked.slice(start, start + 5);
    picked = start > 0 ? [picked[0], ...around] : around;
  }
  return (
    <section className="mt-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{tr("table")}</h2>
        {compact && rows.length > 7 ? (
          <button type="button" className="min-h-9 text-sm font-bold text-accent" onClick={() => setFull((value) => !value)}>
            {full ? tr("shortTable") : tr("fullTable")}
          </button>
        ) : null}
      </div>
      <div className="card overflow-hidden">
        <div className="ltable-row text-xs font-bold text-muted">
          <span>#</span>
          <span />
          <span className="text-center">{tr("gd")}</span>
          <span className="text-center">{tr("pts")}</span>
        </div>
        {picked.map(({ row, index }, at) => {
          const me = row.clubId === career.clubId;
          const gap = at > 0 && picked[at - 1].index !== index - 1;
          const diff = row.gf - row.ga;
          return (
            <div key={row.clubId} className={`ltable-row ${me ? "is-me" : ""} ${gap ? "ltable-gap" : ""}`}>
              <span className="font-num text-muted">{index + 1}</span>
              <span className="min-w-0 truncate">{getClub(row.clubId).name}</span>
              <span className="num text-center text-muted">{diff > 0 ? `+${diff}` : diff}</span>
              <span className="font-num text-center font-bold">{row.pts}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SeasonBreak({ career, onBoost }: { career: Career; onBoost: (key: AttrKey) => void }) {
  const { tr } = useTx();
  const id = boostId(career.player.name, career.year);
  const [used, setUsed] = useState(() => boostTaken(id));
  const [pick, setPick] = useState(false);
  return (
    <div className="mt-4 grid gap-2">
      {used ? (
        <p className="text-xs text-muted">{tr("adRewardDone")}</p>
      ) : pick ? (
        <div className="grid grid-cols-2 gap-2" data-ad-slot="rewarded">
          {ATTR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className="btn-ghost h-11 text-sm"
              onClick={() => {
                markBoost(id);
                setUsed(true);
                onBoost(key);
              }}
            >
              {tr(`attr.${key}`)}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="btn-ghost h-12 px-3 text-sm" data-ad-slot="rewarded" onClick={() => setPick(true)}>
          {tr("adReward")}
        </button>
      )}
    </div>
  );
}

function Privacy({ onBack }: { onBack: () => void }) {
  const { tr } = useTx();
  return (
    <Shell>
      <ScreenHeader title={tr("privacy")} onBack={onBack} />
      <div className="privacy-copy grid gap-3 text-sm leading-6">
        <p>{tr("privacyLead")}</p>
        <p>{tr("privacyData")}</p>
        <p>{tr("privacyAds")}</p>
      </div>
    </Shell>
  );
}

function LangSwitch({ onLang }: { onLang: (lang: Lang) => void }) {
  const { lang, tr } = useTx();
  const langs: { id: Lang; label: string }[] = [
    { id: "en", label: "EN" },
    { id: "he", label: "עב" },
    { id: "es", label: "ES" },
    { id: "fr", label: "FR" },
  ];
  return (
    <div className="lang-switch" role="group" aria-label={tr("kicker")}>
      {langs.map((item) => (
        <button key={item.id} type="button" aria-pressed={lang === item.id} className={lang === item.id ? "is-on" : ""} onClick={() => onLang(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function useClosesIn() {
  const [text, setText] = useState("0:00");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const ms = Math.max(0, end.getTime() - now.getTime());
      const hours = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      setText(`${hours}:${String(mins).padStart(2, "0")}`);
    };
    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, []);
  return text;
}

function Home({
  career,
  sound,
  onSound,
  onLang,
  onCreate,
  onContinue,
  onCollection,
  onSummary,
  onDaily,
  onPrivacy,
  onLegacy,
  access,
  onAdmin,
  onNew,
  dailyBest,
  streak,
}: {
  career: Career | null;
  sound: boolean;
  onSound: () => void;
  onLang: (lang: Lang) => void;
  onCreate: () => void;
  onContinue: () => void;
  onCollection: () => void;
  onSummary: () => void;
  onDaily: () => void;
  onPrivacy: () => void;
  onLegacy: () => void;
  access: ViewerAccess | null;
  onAdmin: () => void;
  onNew: () => void;
  dailyBest: number | null;
  streak: number;
}) {
  const { tr } = useTx();
  const [confirm, setConfirm] = useState(false);
  const [legacyPts, setLegacyPts] = useState(0);
  useEffect(() => setLegacyPts(loadLegacy().points), []);
  const closes = useClosesIn();
  const board = useMemo(() => dailyBoard(), []);
  const dailyClub = getClub(board.clubId);
  const dailyPos = tr(`pos.${board.position}`);

  return (
    <Shell>
      <header className="topbar">
        <span className="wordmark">
          <Crest className="h-6 w-6" />
          STAR
        </span>
        <div className="flex-1" />
        <LangSwitch onLang={onLang} />
        <button type="button" className="icon-btn" onClick={onSound} aria-label={sound ? tr("mute") : tr("sound")}>
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
      </header>

      {career ? (
        <>
          <PlayerHeader career={career} />
          <SeasonProgress career={career} />
        </>
      ) : (
        <section className="grid gap-3 pt-2">
          <h1 className="text-[1.7rem] font-bold leading-tight">
            {tr("title1")}
            <br />
            <span className="text-accent-2">{tr("title2")}</span>
          </h1>
          <p className="max-w-[34rem] text-[0.95rem] leading-6 text-muted">{tr("homeCopy")}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span>
              <b className="num text-fg">{COUNTRIES.length}</b> {tr("countries")}
            </span>
            <span>
              <b className="num text-fg">{LEAGUES.length}</b> {tr("leagues")}
            </span>
            <span>
              <b className="num text-fg">{CLUBS.length}</b> {tr("clubs")}
            </span>
          </p>
        </section>
      )}

      <button type="button" className="btn-primary mt-4 flex h-13 w-full items-center justify-center gap-2 text-base" onClick={career ? onContinue : onCreate}>
        {career ? tr("continue") : tr("start")}
        <Play className="size-4 rtl:-scale-x-100" />
      </button>

      <nav className="list mt-5" aria-label={tr("menu")}>
        <button type="button" className="list-row" onClick={onDaily}>
          <span className="list-icon text-trophy">
            <Medal className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{tr("dailyTitle")}</span>
            <span className="block truncate text-xs text-muted">
              {tr("today", { pos: dailyPos, club: dailyClub.name })}
            </span>
          </span>
          <span className="shrink-0 whitespace-nowrap text-end text-xs text-muted">
            <span className="block num">{tr("closes", { n: closes })}</span>
            {dailyBest != null ? <span className="block text-good">{tr("dailyDone", { n: dailyBest })}</span> : null}
          </span>
        </button>
        <button type="button" className="list-row" onClick={onCollection}>
          <span className="list-icon">
            <Trophy className="size-5" />
          </span>
          <span className="flex-1 font-semibold">{tr("trophies")}</span>
          <span className="num text-muted">{career ? career.trophies.length : 0}</span>
          <ChevronLeft className="size-4 -scale-x-100 text-muted rtl:scale-x-100" />
        </button>
        <button type="button" className="list-row" onClick={onSummary}>
          <span className="list-icon">
            <Play className="size-5" />
          </span>
          <span className="flex-1 font-semibold">{career ? tr("seasonOf", { name: career.player.name }) : tr("season")}</span>
          <ChevronLeft className="size-4 -scale-x-100 text-muted rtl:scale-x-100" />
        </button>
        <button type="button" className="list-row" onClick={onLegacy}>
          <span className="list-icon">
            <Shield className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{tr("legacy")}</span>
            <span className="block text-xs leading-snug text-muted">{tr("legacyShort")}</span>
          </span>
          <span className="num font-semibold text-trophy">{legacyPts}</span>
        </button>
        {access?.admin ? (
          <button type="button" className="list-row" onClick={onAdmin}>
            <span className="list-icon">
              <Shield className="size-5" />
            </span>
            <span className="flex-1 font-semibold">{tr("admin.open")}</span>
            <ChevronLeft className="size-4 -scale-x-100 text-muted rtl:scale-x-100" />
          </button>
        ) : null}
      </nav>

      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Flame className="size-3.5 text-accent-2" />
        {tr("streak", { n: streak })}
      </p>

      <div className="mt-6 grid gap-1 border-t border-line pt-3 text-sm">
        {authEnabled ? (
          <a href="/login" className="flex min-h-11 items-center text-muted underline-offset-4 hover:underline">
            {access?.signedIn ? tr("acct.signedInShort", { email: access.email ?? "" }) : tr("acct.cta")}
          </a>
        ) : null}
        {career ? (
          confirm ? (
            <div className="card px-4 py-3">
              <p>{tr("resetAsk", { name: career.player.name })}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" className="btn-ghost h-11" onClick={() => setConfirm(false)}>
                  {tr("cancel")}
                </button>
                <button type="button" className="btn-danger h-11" onClick={onNew}>
                  {tr("newCareer")}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="flex min-h-11 items-center text-start text-muted" onClick={() => setConfirm(true)}>
              {tr("reset")}
            </button>
          )
        ) : null}
        <button type="button" className="flex min-h-11 items-center text-start text-muted" onClick={onPrivacy}>
          {tr("privacy")}
        </button>
      </div>
    </Shell>
  );
}

function Create({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: (name: string, position: Career["player"]["position"], countryId: string, nationId: string, salt: number, difficulty: Difficulty) => void;
}) {
  const [name, setName] = useState("Alex");
  const [countryId, setCountryId] = useState<string | null>(null);
  const [nationId, setNationId] = useState<string | null>(null);
  const [position, setPosition] = useState<Career["player"]["position"] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [salt, setSalt] = useState(1);
  const preview = useMemo(() => (position ? previewPlayer(name || "Player", position, salt) : null), [name, position, salt]);
  const country = COUNTRIES.find((item) => item.id === countryId);
  const ready = name.trim().length >= 2 && position && countryId && nationId;
  const { tr } = useTx();

  return (
    <Shell>
      <ScreenHeader title={tr("build")} sub={tr("age16")} onBack={onBack} backLabel={tr("back")} />
      <label className="block text-sm font-semibold" htmlFor="player-name">
        {tr("name")}
      </label>
      <input
        id="player-name"
        value={name}
        maxLength={16}
        enterKeyHint="done"
        autoComplete="name"
        onChange={(event) => setName(event.target.value)}
        className="mt-2 h-12 w-full rounded-md border border-line bg-surface px-4 text-base text-fg"
        placeholder={tr("namePh")}
      />

      <h2 className="mt-5 text-base font-semibold">{tr("startCountry")}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {COUNTRIES.map((item) => {
          const selected = countryId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCountryId(item.id);
                setNationId((current) => current ?? item.id);
              }}
              className={`rounded-md border px-3 py-3 text-start ${selected ? "border-accent bg-surface-2" : "border-line bg-surface"}`}
            >
              <span className="block font-semibold">{tr(`country.${item.id}`)}</span>
              <span className="mt-1 block text-xs text-muted">{entryLeague(item.id).name}</span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-5 text-base font-semibold">{tr("nation")}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {NATIONS.map((item) => {
          const selected = nationId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setNationId(item.id)}
              className={`rounded-md border px-3 py-3 text-start ${selected ? "border-accent bg-surface-2" : "border-line bg-surface"}`}
            >
              <span className="block font-semibold">{tr(`country.${item.id}`)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-base font-semibold">{tr("position")}</h2>
        <button type="button" className="flex min-h-11 items-center gap-1 text-sm text-accent" onClick={() => setSalt((value) => value + 1)}>
          <RotateCcw className="size-4" />
          {tr("reroll")}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {POSITIONS.map((item) => {
          const selected = position === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPosition(item.id)}
              className={`rounded-md border px-3 py-3 text-start ${selected ? "border-accent bg-surface-2" : "border-line bg-surface"}`}
            >
              <span className="flex items-center justify-between">
                <span className="font-semibold">{tr(`pos.${item.id}`)}</span>
                <span className="num text-xs text-muted">{item.shirt}</span>
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">{tr(`posblurb.${item.id}`)}</span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-5 text-base font-semibold">{tr("difficulty")}</h2>
      <div className="mt-3 grid gap-2">
        {(
          [
            ["easy", "diff.easy", "diffblurb.easy"],
            ["normal", "diff.normal", "diffblurb.normal"],
            ["hard", "diff.hard", "diffblurb.hard"],
          ] as const
        ).map(([id, label, blurb]) => (
          <button
            key={id}
            type="button"
            onClick={() => setDifficulty(id)}
            className={`rounded-md border px-3 py-3 text-start ${difficulty === id ? "border-accent bg-surface-2" : "border-line bg-surface"}`}
          >
            <span className="block font-semibold">{tr(label)}</span>
            <span className="mt-1 block text-xs leading-5 text-muted">{tr(blurb)}</span>
          </button>
        ))}
      </div>

      {preview && position ? (
        <div className="panel mt-4 px-4 py-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted">{country ? country.name : tr("starting")}</p>
              <p className="text-sm">{tr("potential", { n: tr(`pot.${potentialLabel(preview.potential)}`) })}</p>
            </div>
            <p className="num text-4xl font-semibold text-accent">{preview.ovr}</p>
          </div>
          <div className="mt-3 grid gap-2">
            {ATTR_KEYS.map((key) => (
              <AttrBar key={key} attr={key} value={preview.attrs[key]} hot={primaryKeys(position).includes(key)} />
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">{tr("pickBoth")}</p>
      )}

      <button
        type="button"
        className="btn-primary mt-5 h-13 w-full text-base"
        disabled={!ready || !position || !countryId || !nationId}
        onClick={() => position && countryId && nationId && onStart(name.trim(), position, countryId, nationId, salt, difficulty)}
      >
        {tr("startSeason")}
      </button>
    </Shell>
  );
}

function AttrBar({ attr, value, delta }: { attr: AttrKey; value: number; hot?: boolean; delta?: number }) {
  const { tr } = useTx();
  const Icon = ATTR_ICON[attr];
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <Icon className="size-3.5 text-muted" />
          {tr(`attr.${attr}`)}
        </span>
        <span className={`num font-bold band-${band(value)}`}>
          {value}
          {delta ? (
            <span className={delta > 0 ? "text-accent" : "text-bad"}>
              {" "}
              {delta > 0 ? `+${delta}` : delta}
            </span>
          ) : null}
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${value}%`, background: `var(--color-band-${band(value)})` }} />
      </div>
    </div>
  );
}

function HealClip({ career, onChange }: { career: Career; onChange: (c: Career) => void }) {
  const { tr } = useTx();
  const id = `${boostId(career.player.name, career.year)}|heal`;
  const [used, setUsed] = useState(() => healTaken(id));
  if (used) return null;
  return (
    <button
      type="button"
      className="btn-ghost mt-3 h-12 w-full px-3 text-sm"
      data-ad-slot="rewarded"
      onClick={() => {
        markHeal(id);
        setUsed(true);
        onChange({ ...career, season: { ...career.season, outFor: 0 } });
      }}
    >
      {tr("healClip", { n: career.season.outFor })}
    </button>
  );
}

function RunScreen({ career, onChange, onMenu }: { career: Career; onChange: (c: Career) => void; onMenu: () => void }) {
  const [paused, setPaused] = useState(() => Boolean(career.lastTrain));
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const club = getClub(career.clubId);
  const league = getLeague(career.season.leagueId);
  const country = getCountry(career.countryId);
  const ovr = overall(career.player.position, career.player.attrs);
  const rows = sortTable(career.season.table);
  const place = tablePosition(career);
  const onTrack = place <= career.season.targetLine;
  const latest = career.season.fixturesPlayed[career.season.fixturesPlayed.length - 1];
  const log = career.season.fixturesPlayed.slice(-6).reverse();
  const { played, total } = leagueCount(career);
  const { tr, text } = useTx();

  useEffect(() => {
    if (paused || career.screen !== "run") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setTimeout(() => onChange(playStep(career)), 460 / speed);
    return () => window.clearTimeout(id);
  }, [career, paused, onChange, speed]);

  return (
    <Shell>
      <ScreenHeader
        title={league.name}
        sub={`${seasonLabel(career.year)} · ${tr("matchday", { n: played, m: total })}`}
        onBack={onMenu}
        right={
          <button
            type="button"
            className="btn-primary flex h-10 shrink-0 items-center gap-1.5 px-3 text-sm"
            onClick={() => {
              unlockAudio();
              playWhistle();
              onChange(runToStop(career));
            }}
          >
            {career.season.breakDone ? tr("skipEnd") : tr("skipBreak")}
            <Play className="size-3.5 rtl:-scale-x-100" />
          </button>
        }
      />

      <section className="scorebox px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`ovr-badge band-${band(ovr)}`}>
            <span className="num">{ovr}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold leading-tight">{career.player.name}</h2>
            <p className="truncate text-sm text-muted">
              #{shirtNumber(career.player.position)} · {club.name} · {tr(`country.${nationById(career.nationId || career.countryId).id}`)}
            </p>
            <p className="truncate text-xs text-muted">{career.season.breakDone ? tr("second") : tr("first")}</p>
          </div>
          {career.race ? <span className="chip chip-trophy shrink-0 self-start">{tr("raceTag")}</span> : null}
        </div>
        <p className="goal-strip">{tr(`aim.${careerAim(career)}`)}</p>
        <p className="mt-1 text-xs text-muted">
          {tr(career.difficulty === "easy" ? "diff.easy" : career.difficulty === "hard" ? "diff.hard" : "diff.normal")}
          {" · "}
          {career.contractLeft === 1 ? tr("year1") : tr("years", { n: career.contractLeft })}
          {career.season.outFor > 0 ? <span className="text-bad"> · {tr("injured", { n: career.season.outFor })}</span> : null}
        </p>
        {career.europeComp ? (
          <p className="mt-1 text-xs text-muted">{tr("europeOn", { name: tr(career.europeComp === "cl" ? "comp.cl" : "comp.el") })}</p>
        ) : null}

        <div className="card-rule my-3" />
        {latest ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">
                {tr("lastResult")} · {text(latest.roundLabel)}
              </p>
              <p className="truncate text-sm font-bold">{text(latest.opponentName)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-num text-2xl font-bold" dir="ltr">
                {latest.us}–{latest.them}
              </span>
              {latest.missed ? (
                <span className="chip">{tr("bench")}</span>
              ) : (
                <span className={`chip ${latest.rating >= 7.2 ? "chip-good" : latest.rating < 6.4 ? "chip-bad" : ""} font-num`}>
                  {latest.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">{tr("kickoff")}</p>
        )}
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="card grid gap-2 px-3 py-3">
          <span className="text-xs font-bold text-muted">{tr("formLast")}</span>
          <RateTiles logs={career.season.fixturesPlayed} />
        </div>
        <div className="card grid content-start gap-1 px-3 py-3">
          <span className="text-xs font-bold text-muted">{tr("boardHead")}</span>
          <span className="text-sm font-bold leading-snug">{text(career.season.targetLabel)}</span>
          {rows.length && played ? (
            <span className={`flex items-center gap-1 text-xs font-bold ${onTrack ? "text-good" : "text-bad"}`}>
              {onTrack ? <Check className="size-3.5" /> : null}
              {tr(onTrack ? "onTrack" : "offTrack", { n: place })}
            </span>
          ) : null}
        </div>
      </div>

      {career.lastTrain ? (
        <p
          className={`card mt-3 px-4 py-3 text-sm font-semibold ${
            career.lastTrain.delta < 0 || career.lastTrain.outFor > 0 ? "text-bad" : career.lastTrain.delta > 0 ? "text-good" : "text-muted"
          }`}
        >
          {career.lastTrain.outFor > 0
            ? tr("trainHurt", { attr: tr(`attr.${career.lastTrain.key}`), n: career.lastTrain.delta, m: career.lastTrain.outFor })
            : career.lastTrain.delta > 0
              ? tr("trainUp", { attr: tr(`attr.${career.lastTrain.key}`), n: career.lastTrain.delta })
              : tr("trainFlat", { attr: tr(`attr.${career.lastTrain.key}`) })}
        </p>
      ) : null}

      {career.season.outFor > 0 && !career.race ? <HealClip career={career} onChange={onChange} /> : null}

      <div className="seg seg-grow mt-3" role="group" aria-label={tr("speed")}>
        {([1, 2, 4] as const).map((value) => (
          <button key={value} type="button" aria-pressed={speed === value} onClick={() => setSpeed(value)}>
            x{value}
          </button>
        ))}
      </div>

      <button type="button" className="btn-ghost mt-3 h-12 w-full" onClick={() => setPaused((value) => !value)}>
        {paused ? tr("resume") : tr("pause")}
      </button>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">{tr("results")}</h2>
        {log.length === 0 ? <p className="text-sm text-muted">{tr("soon")}</p> : null}
        <div className="results-list">
          {log.filter((item) => item.competition !== "europe").map((item, index) => (
            <ResultRow key={`${item.opponentName}-${index}`} item={item} />
          ))}
        </div>
      </section>

      <LeagueTable career={career} compact />
    </Shell>
  );
}

function TrainingScreen({ career, onChange, onMenu }: { career: Career; onChange: (c: Career) => void; onMenu: () => void }) {
  const club = getClub(career.clubId);
  const camp = career.screen === "camp";
  const apps = career.season.apps;
  const avg = apps ? career.season.sumRating / apps : 0;
  const { tr } = useTx();
  return (
    <Shell>
      <ScreenHeader title={tr("coach")} sub={`${camp ? tr("preseason") : tr("winter")} · ${club.name}`} onBack={onMenu} right={career.race ? <span className="chip chip-trophy">{tr("raceTag")}</span> : undefined} />
      <p className="text-sm leading-6 text-muted">
        {camp ? tr("campAsk") : tr("breakAsk", { avg: avg ? tr("avgBit", { n: avg.toFixed(1) }) : "" })}
      </p>
      <div className="mt-4 grid gap-2">
        {ATTR_KEYS.map((key) => {
          const odds = trainOdds(career, key);
          const chance = odds.big
            ? tr("trainChance", { big: odds.big, up: odds.up, down: odds.down })
            : odds.up
              ? tr("trainRise", { up: odds.up, down: odds.down })
              : tr("ceiling");
          return (
            <button
              key={key}
              type="button"
              className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-3 text-start"
              onClick={() => {
                unlockAudio();
                onChange(camp ? answerCamp(career, key) : answerBreak(career, key));
              }}
            >
              <span>
                <span className="block text-xs font-semibold tracking-wide text-accent">{tr(`q.${key}`)}</span>
                <span className="block font-semibold">{tr(`drill.${key}`)}</span>
                <span className="block text-xs text-muted">
                  {tr(`attr.${key}`)} {career.player.attrs[key]}
                  {` · ${chance}`}
                </span>
              </span>
              <span className="num text-lg font-semibold text-accent">{odds.big ? "+3" : odds.up ? "+1" : "—"}</span>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

function MatchScreen({ career, onReport, onMenu }: { career: Career; onReport: () => void; onMenu: () => void }) {
  const report = career.activeReport as MatchReport;
  const { tr, text } = useTx();
  const [step, setStep] = useState(1);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const shown = report.events.slice(0, step);
  const current = shown[shown.length - 1];
  const done = step >= report.events.length;
  const minute = current?.minute ?? 0;
  const ours = getClub(career.clubId).name;
  const left = report.home ? ours : text(report.opponentName);
  const right = report.home ? text(report.opponentName) : ours;
  const leftGoals = report.home ? (current?.us ?? 0) : (current?.them ?? 0);
  const rightGoals = report.home ? (current?.them ?? 0) : (current?.us ?? 0);

  useEffect(() => {
    playWhistle();
  }, [report]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStep(report.events.length);
      return;
    }
    const id = window.setInterval(() => {
      setStep((value) => (value >= report.events.length ? value : value + 1));
    }, 820 / speed);
    return () => window.clearInterval(id);
  }, [report, speed]);

  useEffect(() => {
    const event = report.events[step - 1];
    if (event?.tone === "goal") playGoal();
  }, [step, report.events]);

  return (
    <Shell>
      <ScreenHeader
        title={text(report.roundLabel)}
        onBack={onMenu}
        right={
          done ? undefined : (
            <span className="live-tag">
              <span className="live-dot" />
              {tr("live")}
            </span>
          )
        }
      />

      <div className="scorebox px-4 pt-4 pb-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-center" dir="ltr">
          <span className={`team-name ${left === ours ? "text-accent-2" : ""}`} dir="auto">
            {left}
          </span>
          <span className="score-big">
            {leftGoals}
            <span className="px-2 text-accent">:</span>
            {rightGoals}
          </span>
          <span className={`team-name ${right === ours ? "text-accent-2" : ""}`} dir="auto">
            {right}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="meter flex-1" dir="ltr">
            <i style={{ width: `${Math.min(100, Math.round((minute / 90) * 100))}%` }} />
          </div>
          <span className="font-num text-sm text-muted" dir="ltr">
            {minute}'
          </span>
        </div>
      </div>

      <ol className="card mt-4 flex flex-col">
        {[...shown].reverse().map((event, index) => (
          <li
            key={`${event.minute}-${shown.length - index}`}
            className={`event ${event.tone === "neutral" ? "" : event.tone} ${index === 0 && !done ? "event-new" : ""}`}
          >
            <span className="min">{event.minute}'</span>
            <span>{text(event.text)}</span>
          </li>
        ))}
      </ol>

      <div className="dock">
      {done ? (
        <button type="button" className="btn-primary h-13 w-full text-base" onClick={onReport}>
          {tr("report")}
        </button>
      ) : (
        <div className="flex gap-2">
          <div className="seg" role="group" aria-label={tr("speed")}>
            {([1, 2, 4] as const).map((value) => (
              <button key={value} type="button" aria-pressed={speed === value} onClick={() => setSpeed(value)}>
                x{value}
              </button>
            ))}
          </div>
          <button type="button" className="btn-ghost h-12 flex-1" onClick={() => setStep(report.events.length)}>
            {tr("skipEnd")}
          </button>
        </div>
      )}
      </div>
    </Shell>
  );
}

function ReportScreen({
  career,
  report,
  onNext,
  onMenu,
}: {
  career: Career;
  report: MatchReport;
  onNext: () => void;
  onMenu: () => void;
}) {
  const last = !nextFixture(career);
  const ups = ATTR_KEYS.filter((key) => report.deltas[key] > 0);
  const { tr, text } = useTx();
  return (
    <Shell>
      <ScreenHeader title={report.missed ? tr("unused") : tr("matchReport")} sub={text(report.roundLabel)} onBack={onMenu} />
      <p className="text-base font-medium">{text(report.headline)}</p>
      <div className="panel mt-4 px-4 py-5 text-center">
        <p className="text-sm text-muted">{report.home ? tr("home") : tr("away")} vs {text(report.opponentName)}</p>
        <p className="num mt-1 text-4xl font-bold">
          {report.us}
          <span className="px-2 text-accent">–</span>
          {report.them}
        </p>
        {!report.missed ? <p className="num mt-2 text-2xl font-bold text-accent-2">{report.rating.toFixed(1)}</p> : null}
        {!report.missed ? <p className="text-xs text-muted">{tr("rating")}</p> : null}
      </div>
      {!report.missed ? (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Mini n={report.goals} l={tr("goals")} />
          <Mini n={report.assists} l={tr("assists")} />
          <Mini n={career.player.position === "GK" ? report.saves : report.tackles} l={career.player.position === "GK" ? tr("saves") : tr("tackles")} />
        </div>
      ) : null}
      {ups.length ? (
        <p className="panel mt-4 px-4 py-3 text-sm text-accent">
          {tr("bigGame", { n: ups.map((key) => `${tr(`attr.${key}`)} +${report.deltas[key]}`).join(" · ") })}
        </p>
      ) : null}
      {report.injured ? <p className="mt-3 text-sm text-bad">{tr("creaked")}</p> : null}
      <button type="button" className="btn-primary mt-5 h-13 w-full text-base" onClick={onNext}>
        {last ? tr("seasonReview") : tr("backRun")}
      </button>
    </Shell>
  );
}

function Mini({ n, l }: { n: number; l: string }) {
  return (
    <div className="panel px-2 py-3">
      <p className="num text-2xl font-semibold">{n}</p>
      <p className="text-xs text-muted">{l}</p>
    </div>
  );
}

function ResultRow({ item }: { item: MatchLog }) {
  const [open, setOpen] = useState(false);
  const { tr, text } = useTx();
  const outcome = item.us > item.them ? "w" : item.us < item.them ? "l" : "d";
  return (
    <div className="result-row">
      <button type="button" className="flex min-h-12 w-full items-center gap-3 px-3.5 py-2 text-sm" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className={`wdl wdl-${outcome}`}>{tr(`wdl.${outcome}`)}</span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block truncate font-medium">{text(item.opponentName)}</span>
          <span className="block truncate text-xs text-muted">{text(item.roundLabel)}</span>
        </span>
        <span className="num shrink-0 font-semibold">
          {item.us}–{item.them}
        </span>
        <span className={`num w-9 shrink-0 text-end text-sm ${item.missed ? "text-dim" : `band-${item.rating >= 7.5 ? "high" : item.rating >= 6.8 ? "good" : item.rating >= 6.2 ? "mid" : "low"}`}`}>
          {item.missed ? "–" : item.rating.toFixed(1)}
        </span>
      </button>
      {open ? (
        <div className="border-t border-line px-3.5 py-2.5">
          <p className="text-sm">{text(item.headline)}</p>
          <div className="mt-2 grid gap-1">
            {item.events.map((event, index) => (
              <p key={`${event.minute}-${index}`} className="text-xs leading-5 text-muted">
                <span className="num">{event.minute}'</span> {text(event.text)}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummerScreen({
  career,
  onChange,
  onOffers,
  onMenu,
}: {
  career: Career;
  onChange: (c: Career) => void;
  onOffers: () => void;
  onMenu: () => void;
}) {
  const summer = career.summer;
  const { tr, text } = useTx();
  useEffect(() => {
    if (!summer?.called || summer.done) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      let current = career;
      let guard = 0;
      while (current.summer && !current.summer.done && guard < 8) {
        current = playSummer(current);
        guard += 1;
      }
      onChange(current);
      return;
    }
    const id = window.setTimeout(() => onChange(playSummer(career)), 700);
    return () => window.clearTimeout(id);
  }, [career, summer, onChange]);
  if (!summer) return null;
  const title = tr(summer.kind === "world-cup" ? "summer.wc" : summer.kind === "euros" ? "summer.euros" : summer.kind === "copa" ? "summer.copa" : "summer.friendly");
  const nation = nationById(career.nationId || career.countryId);
  return (
    <Shell>
      <ScreenHeader title={title} sub={tr(`country.${nation.id}`)} onBack={onMenu} />
      <p className="text-sm leading-6 text-muted">{text(summer.reason)}</p>
      <p className="mt-2 text-sm text-muted">{tr("summer.caps", { n: career.totals.caps, g: career.totals.intlGoals })}</p>
      <div className="results-list mt-4">
        {summer.played.map((item, index) => (
          <ResultRow key={`${item.opponentName}-${index}`} item={item} />
        ))}
      </div>
      {summer.called && !summer.done ? (
        <button
          type="button"
          className="btn-ghost mt-4 h-12 w-full"
          onClick={() => {
            let current = career;
            let guard = 0;
            while (current.summer && !current.summer.done && guard < 8) {
              current = playSummer(current);
              guard += 1;
            }
            onChange(current);
          }}
        >
          {tr("skipWindow")}
        </button>
      ) : (
        <button type="button" className="btn-primary mt-5 h-13 w-full text-base" onClick={onOffers}>
          {tr("offersNext")}
        </button>
      )}
    </Shell>
  );
}

function SeasonScreen({
  career,
  onSummer,
  onMenu,
  claimRace,
}: {
  career: Career;
  onSummer: () => void;
  onMenu: () => void;
  claimRace?: boolean;
}) {
  const preview = career.growthPreview;
  const club = getClub(career.clubId);
  const league = getLeague(career.season.leagueId);
  const rows = sortTable(career.season.table);
  const { tr, text } = useTx();
  if (!preview) {
    return (
      <Shell>
        <p>{tr("noReview")}</p>
        <button type="button" className="btn-ghost mt-4 h-12" onClick={onMenu}>
          {tr("menu")}
        </button>
      </Shell>
    );
  }
  const names = (ids: string[]) => ids.map((id) => getClub(id).name).join(", ") || tr("none");
  const ovrGain = preview.ovrAfter - preview.ovrBefore;
  return (
    <Shell>
      <ScreenHeader title={`${tr("season")} ${seasonLabel(career.year)}`} sub={club.name} onBack={onMenu} />
      <div className="card flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-bold">
            {preview.tablePos}
            {rows.length ? ` ${tr("of", { n: rows.length })}` : ""} · {league.name}
          </p>
          <p className="truncate text-xs text-muted">{text(preview.targetLabel)}</p>
        </div>
        <span className={`chip shrink-0 ${preview.targetHit ? "chip-good" : "chip-bad"}`}>{preview.targetHit ? tr("targetMet") : tr("targetMiss")}</span>
      </div>

      <div className="card mt-4 flex items-center justify-center gap-5 px-4 py-4">
        <div className="grid justify-items-center">
          <span className="font-num text-4xl font-semibold text-dim">{preview.ovrBefore}</span>
          <span className="text-xs text-muted">{tr("seasonStart")}</span>
        </div>
        <svg width="40" height="18" viewBox="0 0 40 18" aria-hidden="true" className="rtl:-scale-x-100">
          <path d="M2 9h32M27 3l7 6-7 6" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="grid justify-items-center">
          <span className="font-num text-5xl font-bold leading-none">{preview.ovrAfter}</span>
          <span className={`text-xs font-semibold ${ovrGain > 0 ? "text-good" : ovrGain < 0 ? "text-bad" : "text-muted"}`}>
            {tr("ovrUp", { n: ovrGain > 0 ? `+${ovrGain}` : String(ovrGain) })}
          </span>
        </div>
      </div>

      <dl className="stat-row mt-3">
        <div>
          <dt>{tr("apps")}</dt>
          <dd className="num">{career.season.apps}</dd>
        </div>
        <div>
          <dt>{tr("goals")}</dt>
          <dd className="num">{career.season.goals}</dd>
        </div>
        <div>
          <dt>{tr("assists")}</dt>
          <dd className="num">{career.season.assists}</dd>
        </div>
        <div>
          <dt>{tr("average")}</dt>
          <dd className={`num ${preview.avg >= 7 ? "text-good" : ""}`}>{preview.avg ? preview.avg.toFixed(1) : "–"}</dd>
        </div>
      </dl>

      {preview.europe ? (
        <p className="card mt-3 px-4 py-3 text-sm font-semibold">
          {tr(preview.europe.comp === "cl" ? "comp.cl" : "comp.el")} · {tr(`stage.${preview.europe.stage}`)}
        </p>
      ) : null}

      <h2 className="mt-5 text-base font-semibold">{tr("attrsMoved")}</h2>
      <div className="mt-3 grid grid-cols-[4.5rem_minmax(0,1fr)_3.2rem] items-center gap-x-3 gap-y-2.5 text-sm">
        {ATTR_KEYS.map((key) => {
          const before = preview.before[key];
          const delta = preview.deltas[key];
          const base = delta >= 0 ? before : preview.after[key];
          return (
            <Fragment key={key}>
              <span className="truncate">{tr(`attr.${key}`)}</span>
              <div className="split-bar" dir="ltr">
                <i className="base" style={{ width: `${base}%` }} />
                {delta !== 0 ? <i className={delta > 0 ? "gain" : "loss"} style={{ width: `${Math.abs(delta)}%` }} /> : null}
              </div>
              <span className="font-num text-end" dir="ltr">
                {preview.after[key]}{" "}
                <span className={delta > 0 ? "text-good" : delta < 0 ? "text-bad" : "text-dim"}>{delta > 0 ? `+${delta}` : delta}</span>
              </span>
            </Fragment>
          );
        })}
      </div>
      <div className="mt-3 grid gap-2">
        {preview.lines.map((line) => (
          <p key={line} className="text-sm leading-6 text-muted">
            {text(line)}
          </p>
        ))}
      </div>

      <h2 className="mt-5 text-base font-semibold">{tr("awardsHead")}</h2>
      <div className="list mt-2">
        {preview.awards.map((award) => (
          <div key={award.id} className="list-row">
            <span className="list-icon text-trophy">
              <Trophy className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{text(award.name)}</span>
              <span className="block text-xs text-muted">{text(award.detail)}</span>
            </span>
          </div>
        ))}
        {preview.awards.length === 0 ? <p className="list-row text-sm text-muted">{tr("noTrophy")}</p> : null}
        <div className="list-row">
          <span className={`list-icon ${preview.ballonYours ? "text-trophy" : ""}`}>
            <Medal className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted">{tr("award.ballon")}</span>
            <span className={`block font-semibold ${preview.ballonYours ? "text-trophy" : ""}`}>{preview.ballon}</span>
          </span>
        </div>
      </div>

      {career.shuffle?.year === career.year ? (
        <div className="card mt-3 px-4 py-3 text-sm leading-6">
          <p className="font-semibold">{tr("who")}</p>
          <p className="mt-1">{tr("up", { n: names(career.shuffle.promoted) })}</p>
          <p>{tr("down", { n: names(career.shuffle.relegated) })}</p>
          {career.shuffle.arrivedDown.length ? <p className="text-muted">{tr("relegatedIn", { n: names(career.shuffle.arrivedDown) })}</p> : null}
          {career.shuffle.arrivedUp.length ? <p className="text-muted">{tr("promotedIn", { n: names(career.shuffle.arrivedUp) })}</p> : null}
        </div>
      ) : null}

      <LeagueTable career={career} compact />

      <button type="button" className="btn-primary mt-5 h-13 w-full text-base" onClick={onSummer}>
        {claimRace ? tr("dailyClaim") : tr("summerBtn")}
      </button>
    </Shell>
  );
}

const ROLE_MINUTES: Record<Role, number> = { Star: 100, Starter: 100, Rotation: 78, Bench: 58 };

function OffersScreen({
  career,
  onAccept,
  onRetire,
  onBoost,
  onMenu,
}: {
  career: Career;
  onAccept: (clubId: string) => void;
  onRetire: () => void;
  onBoost: (key: AttrKey) => void;
  onMenu: () => void;
}) {
  const [ask, setAsk] = useState(false);
  const offers = career.pendingOffers ?? [];
  const currency = getCountry(career.countryId).currency;
  const { tr, text } = useTx();
  return (
    <Shell>
      <ScreenHeader title={tr("where")} sub={`${career.player.name} · ${tr("ageN", { n: career.player.age })}`} onBack={onMenu} />
      <p className="text-sm leading-6 text-muted">
        {career.player.age >= farewellAge(career.player.position)
          ? tr("offerLast")
          : career.player.age >= 35
            ? tr("offerOld")
            : tr("whereCopy")}
      </p>
      {!career.race ? <SeasonBreak career={career} onBoost={onBoost} /> : null}
      {!offers.some((offer) => offer.kind === "stay") ? <p className="mt-3 text-sm font-bold text-bad">{tr("noRenew")}</p> : null}
      <div className="mt-4 grid gap-3">
        {offers.map((offer) => {
          const club = getClub(offer.clubId);
          const league = getLeague(offer.leagueId);
          const offerCountry = getCountry(league.countryId);
          const mins = ROLE_MINUTES[offer.role];
          return (
            <article key={offer.clubId} className="offer-plain">
              <div className="offer-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold">{club.name}</h2>
                    <p className="text-sm text-muted">
                      {league.name} · {offerCountry.name}
                    </p>
                  </div>
                  <span className={`chip shrink-0 ${offer.role === "Star" ? "chip-trophy" : offer.role === "Bench" ? "chip-bad" : ""}`}>
                    {tr(`role${offer.role}`)}
                  </span>
                </div>
                <dl className="terms">
                  <div>
                    <dt>{tr("perMonth")}</dt>
                    <dd className="num">{money(offer.wage, offerCountry.currency || currency)}</dd>
                  </div>
                  <div>
                    <dt>{tr("yearsShort")}</dt>
                    <dd className="num">{offer.years}</dd>
                  </div>
                  <div>
                    <dt>{tr("minutes")}</dt>
                    <dd className={`num ${mins >= 90 ? "text-good" : mins < 70 ? "text-bad" : ""}`}>~{mins}%</dd>
                  </div>
                </dl>
                <p className="text-sm leading-6">{text(offer.note)}</p>
                <button type="button" className={`${offer.kind === "stay" ? "btn-ghost" : "btn-primary"} h-12 w-full`} onClick={() => onAccept(offer.clubId)}>
                  {offer.kind === "stay" ? tr("stay") : offer.kind === "side" ? tr("move") : tr("sign")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-5">
        {ask ? (
          <div className="card px-4 py-3">
            <p className="text-sm">{tr("retireAt", { n: career.player.age })}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-ghost h-11" onClick={() => setAsk(false)}>
                {tr("oneMore")}
              </button>
              <button type="button" className="btn-primary h-11" onClick={onRetire}>
                {tr("retireBtn")}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="min-h-11 text-sm text-muted underline" onClick={() => setAsk(true)}>
            {tr("retire")}
          </button>
        )}
      </div>
    </Shell>
  );
}

function Collection({ career, onBack }: { career: Career | null; onBack: () => void }) {
  const { tr, text } = useTx();
  return (
    <Shell>
      <ScreenHeader title={tr("collection")} onBack={onBack} />
      {!career || career.trophies.length === 0 ? (
        <p className="card px-4 py-6 text-center text-sm leading-6 text-muted">{tr("emptyCabinet")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {career.trophies.map((trophy) => (
            <article key={trophy.id} className="award-card">
              <Trophy className="size-6 text-trophy" />
              <span className="text-sm font-semibold">{text(trophy.name)}</span>
              <span className="text-xs text-muted">
                {seasonLabel(trophy.year)} · {text(trophy.detail)}
              </span>
            </article>
          ))}
        </div>
      )}
      {career && career.history.length ? (
        <div className="mt-5">
          <h2 className="mb-2 font-semibold">{tr("seasonsHead")}</h2>
          <div className="card overflow-hidden">
            {career.history.map((row) => (
              <div key={`${row.year}-${row.clubId}`} className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 text-sm last:border-b-0">
                <span className="truncate">
                  {seasonLabel(row.year)} · {getClub(row.clubId).name}
                </span>
                <span className="num text-muted">
                  #{row.pos} · {tr("goalsN", { n: row.goals })} · {row.ovr}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

function Summary({ career, onBack }: { career: Career | null; onBack: () => void }) {
  const { tr } = useTx();
  if (!career) {
    return (
      <Shell>
        <ScreenHeader title={tr("season")} onBack={onBack} />
        <p className="text-sm text-muted">{tr("noCareer")}</p>
      </Shell>
    );
  }
  const club = getClub(career.clubId);
  const rows = sortTable(career.season.table);
  const apps = career.season.apps;
  const avg = apps ? career.season.sumRating / apps : 0;
  return (
    <Shell>
      <ScreenHeader title={career.player.name} sub={seasonLabel(career.year)} onBack={onBack} />
      <p className="text-sm text-muted">
        {club.name} · {tablePosition(career)}
        {rows.length ? ` ${tr("of", { n: rows.length })}` : ""} · {tr("appsN", { n: apps })} · {tr("goalsN", { n: career.season.goals })}
        {avg ? ` · ${tr("avgN", { n: avg.toFixed(1) })}` : ""}
      </p>
      <div className="mt-4">
        <PlayerHeader career={career} />
      </div>
      <LeagueTable career={career} />
      <div className="results-list mt-4">
        {career.season.fixturesPlayed
          .filter((log) => log.competition !== "europe")
          .map((log, index) => (
            <ResultRow key={`${log.opponentName}-${index}`} item={log} />
          ))}
      </div>
    </Shell>
  );
}

function shareLine(seasons: number) {
  return `${"⚽".repeat(Math.max(0, seasons - 1))}🏆`;
}

function ShareResult({ seasons, date, pos, club }: { seasons: number; date: string; pos: string; club: string }) {
  const { tr } = useTx();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const message = tr("shareText", {
    date,
    n: seasons,
    pos,
    club,
    line: shareLine(seasons),
    url: typeof window === "undefined" ? "" : window.location.origin,
  });

  async function share() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text: message });
        return;
      }
      await navigator.clipboard.writeText(message);
      setState("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState("failed");
    }
  }

  return (
    <div className="award-card mt-4 text-center">
      <p className="text-sm font-semibold text-trophy">{tr("dailyWon", { n: seasons })}</p>
      <p className="text-2xl" dir="ltr" aria-hidden="true">
        {shareLine(seasons)}
      </p>
      <button type="button" className="btn-primary mt-1 h-12 w-full" onClick={share}>
        {state === "copied" ? tr("copied") : tr("shareBtn")}
      </button>
      {state === "failed" ? <p className="select-all whitespace-pre-line text-start text-xs text-muted">{message}</p> : null}
    </div>
  );
}

function DailyLobby({ attempt, onBack, onBegin }: { attempt: DailyAttempt | null; onBack: () => void; onBegin: (career: Career) => void }) {
  const board = useMemo(() => dailyBoard(), []);
  const { tr } = useTx();
  const [name, setName] = useState("Star");
  const club = getClub(board.clubId);
  const league = getLeague(club.leagueId);
  const sameDay = attempt?.date === board.date;
  const running = sameDay ? attempt?.career : null;
  const best = sameDay ? attempt?.seasons : null;
  return (
    <Shell>
      <ScreenHeader title={tr("dailyTitle")} sub={tr("dailyKicker")} onBack={onBack} />
      <p className="text-sm leading-6 text-muted">{tr("dailyCopy", { pos: tr(`pos.${board.position}`), club: club.name, league: league.name })}</p>
      {best != null ? <ShareResult seasons={best} date={board.date} pos={tr(`pos.${board.position}`)} club={club.name} /> : null}
      <div className="panel mt-4 px-4 py-4">
        <p className="text-xs font-semibold text-muted">{tr("starting")}</p>
        <div className="mt-3 grid gap-2">
          {ATTR_KEYS.map((key) => (
            <AttrBar key={key} attr={key} value={board.attrs[key]} />
          ))}
        </div>
      </div>
      {running ? (
        <button type="button" className="btn-primary mt-4 h-13 w-full text-base" onClick={() => onBegin(running)}>
          {tr("dailyContinue")}
        </button>
      ) : (
        <>
          <label className="mt-5 block text-sm font-bold" htmlFor="daily-name">
            {tr("dailyName")}
          </label>
          <input
            id="daily-name"
            value={name}
            maxLength={16}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-12 w-full rounded-md border border-line bg-surface px-4 text-base text-fg"
            placeholder={tr("namePh")}
          />
          <button type="button" className="btn-primary mt-4 h-13 w-full text-base" onClick={() => onBegin(createDailyCareer(name, board.date))}>
            {best != null ? tr("dailyAgain") : tr("dailyStart")}
          </button>
        </>
      )}
      {running && best == null ? (
        <button type="button" className="btn-ghost mt-2 h-12 w-full" onClick={() => onBegin(createDailyCareer(name || running.player.name, board.date))}>
          {tr("dailyAgain")}
        </button>
      ) : null}
      <p className="mt-4 text-xs text-muted">{tr("dailyTomorrow")}</p>
    </Shell>
  );
}

function AdminScreen({
  career,
  onCareer,
  onResetDaily,
  onBack,
}: {
  career: Career | null;
  onCareer: (career: Career) => void;
  onResetDaily: () => void;
  onBack: () => void;
}) {
  const { tr } = useTx();
  const [note, setNote] = useState<string | null>(null);
  const tools: { id: string; label: string; run: () => string }[] = [
    { id: "points", label: tr("admin.points"), run: () => tr("legacyPts", { n: adminGrant(500).points }) },
    { id: "perks", label: tr("admin.perks"), run: () => (adminUnlockAll(), tr("admin.done")) },
    {
      id: "max",
      label: tr("admin.max"),
      run: () => {
        if (!career) return tr("noCareer");
        const player = career.player;
        const attrs = { ...player.attrs };
        for (const key of ATTR_KEYS) attrs[key] = statCap(player.position, 99, key);
        onCareer({ ...career, player: { ...player, potential: 99, attrs } });
        return tr("admin.done");
      },
    },
    { id: "daily", label: tr("admin.daily"), run: () => (onResetDaily(), tr("admin.done")) },
  ];
  return (
    <Shell>
      <ScreenHeader title={tr("admin.title")} onBack={onBack} />
      <p className="text-sm leading-6 text-muted">{tr("admin.copy")}</p>
      <div className="mt-4 grid gap-2">
        {tools.map((tool) => (
          <button key={tool.id} type="button" className="btn-ghost h-12 px-4 text-sm" onClick={() => setNote(tool.run())}>
            {tool.label}
          </button>
        ))}
      </div>
      {note ? (
        <p role="status" className="card mt-4 px-4 py-3 text-sm font-bold text-good">
          {note}
        </p>
      ) : null}
    </Shell>
  );
}

function LegacyScreen({ onBack }: { onBack: () => void }) {
  const { tr } = useTx();
  const [legacy, setLegacy] = useState<Legacy | null>(null);
  useEffect(() => setLegacy(loadLegacy()), []);
  if (!legacy) return <Splash />;
  return (
    <Shell>
      <ScreenHeader title={tr("legacy")} sub={tr("legacyEarned", { n: legacy.earned })} onBack={onBack} />
      <p className="text-sm leading-6 text-muted">{tr("legacyHow")}</p>
      <div className="award-card mt-4 justify-items-center text-center">
        <span className="font-num text-4xl font-bold text-trophy">{legacy.points}</span>
        <span className="text-xs text-muted">{tr("legacyAvail")}</span>
      </div>
      <div className="mt-4 grid gap-2">
        {PERKS.map((perk) => {
          const state = perkState(legacy, perk.id);
          return (
            <article key={perk.id} className="card flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{tr(`perk.${perk.id}`)}</p>
                <p className="text-xs leading-5 text-muted">{tr(`perkD.${perk.id}`)}</p>
                {state === "locked" && perk.needs ? <p className="text-xs text-bad">{tr("perkNeeds", { name: tr(`perk.${perk.needs}`) })}</p> : null}
              </div>
              {state === "owned" ? (
                <span className="chip chip-good shrink-0">
                  <Check className="size-3.5" />
                  {tr("perkOwned")}
                </span>
              ) : (
                <button
                  type="button"
                  className={`${state === "ready" ? "btn-primary" : "btn-ghost"} h-11 shrink-0 px-4 text-sm`}
                  disabled={state !== "ready"}
                  onClick={() => setLegacy(buyPerk(perk.id as PerkId))}
                >
                  {tr("perkBuy", { n: perk.cost })}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </Shell>
  );
}

function Retired({ career, legacyOn, onHome, onNew }: { career: Career; legacyOn: boolean; onHome: () => void; onNew: () => void }) {
  const { tr, text } = useTx();
  const [gain, setGain] = useState<{ gained: number; total: number; double: boolean } | null>(null);
  useEffect(() => {
    if (!legacyOn) return;
    const paid = payLegacy(career);
    setGain({ gained: paid.gained, total: paid.legacy.points, double: canDouble(career) });
  }, [career, legacyOn]);
  const peak = career.history.reduce((best, row) => Math.max(best, row.ovr), overall(career.player.position, career.player.attrs));
  return (
    <Shell>
      <ScreenHeader title={career.player.name} sub={tr("endRoad")} />
      <p className="text-sm leading-6 text-muted">
        {career.released
          ? tr("releasedLine", { age: career.player.age })
          : tr("retiredLine", {
              age: career.player.age,
              seasons: career.totals.seasons,
              goals: career.totals.goals,
              trophies: career.trophies.length,
              peak,
            })}
      </p>
      {gain ? (
        <div className="card mt-4 grid gap-2 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">{tr("legacyGain", { n: gain.gained })}</span>
            <span className="text-xs text-muted">{tr("legacyPts", { n: gain.total })}</span>
          </div>
          {gain.double ? (
            <button
              type="button"
              className="btn-ghost h-12 text-sm"
              data-ad-slot="rewarded"
              onClick={() => {
                const next = doubleLegacy(career);
                setGain({ gained: gain.gained * 2, total: next.points, double: false });
              }}
            >
              {tr("legacyDouble")}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {career.trophies.length ? (
          career.trophies.map((trophy) => (
            <div key={trophy.id} className="award-card">
              <Trophy className="size-5 text-trophy" />
              <span className="text-sm font-bold">{text(trophy.name)}</span>
            </div>
          ))
        ) : (
          <p className="col-span-2 text-sm text-muted">{tr("noTrophyCareer")}</p>
        )}
      </div>
      <button type="button" className="btn-primary mt-5 h-13 w-full" onClick={onNew}>
        {tr("newCareer")}
      </button>
      <button type="button" className="btn-ghost mt-2 h-12 w-full" onClick={onHome}>
        {tr("menu")}
      </button>
    </Shell>
  );
}
