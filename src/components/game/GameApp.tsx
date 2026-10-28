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
import { CLUBS, COUNTRIES, LEAGUES, POSITIONS, entryLeague, getClub, getCountry, getLeague } from "@/game/data";
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
import { boostId, boostTaken, loadCareer, loadDailyAttempt, loadSound, markBoost, saveCareer, saveDailyAttempt, saveSound, touchStreak, type DailyAttempt } from "@/game/save";
import { loadLang, setLang, show, t, type Lang } from "@/game/i18n";
import { ATTR_KEYS, type AttrKey, type Career, type Difficulty, type MatchLog, type MatchReport, type Role } from "@/game/types";

type View = "boot" | "home" | "create" | "game" | "collection" | "summary" | "daily" | "privacy";

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
        onStart={(name, position, countryId, salt, difficulty) => {
          setPlaying("main");
          unlockAudio();
          setCareer(createCareer(name, position, countryId, salt, difficulty));
          setView("game");
        }}
      />
    );
  } else if (view === "collection") screen = <Collection career={career} onBack={() => setView("home")} />;
  else if (view === "summary") screen = <Summary career={career} onBack={() => setView("home")} />;
  else if (view === "daily") {
    screen = <DailyLobby attempt={daily} onBack={() => setView("home")} onBegin={beginDaily} />;
  } else if (view === "privacy") screen = <Privacy onBack={() => setView("home")} />; else if (!run) screen = <Splash />;
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

function Splash() {
  const { tr } = useTx();
  return (
    <Shell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Crest />
        <p className="mt-4 text-sm font-semibold tracking-widest text-gold">{tr("splash")}</p>
        <h1 className="font-display mt-2 text-5xl text-fg">STAR</h1>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <main className="app-shell mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-5">{children}</main>;
}

function PlayerCard({ career }: { career: Career }) {
  const { tr } = useTx();
  const player = career.player;
  const ovr = overall(player.position, player.attrs);
  const club = getClub(career.clubId);
  const league = getLeague(career.season.leagueId);
  const hot = primaryKeys(player.position);
  return (
    <div className="player-card">
      <div className="player-card-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col items-center">
            <span className="ovr">{ovr}</span>
            <span className="font-num text-sm font-semibold tracking-widest text-gold-2">{player.position}</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="chip chip-trophy">{tr("potential", { n: tr(`pot.${potentialLabel(player.potential)}`) })}</span>
            <span className="shirt">#{shirtNumber(player.position)}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-display truncate text-2xl leading-tight">{player.name}</p>
          <p className="mt-0.5 text-sm text-muted">
            {club.name} · {league.name} · {tr("ageN", { n: player.age })}
          </p>
        </div>
        <div className="card-rule" />
        <div className="grid grid-cols-3 gap-x-2 gap-y-2">
          {ATTR_KEYS.map((key) => (
            <div key={key} className="flex min-w-0 items-baseline gap-1.5">
              <span className={`font-num text-xl font-semibold ${hot.includes(key) ? "text-gold-2" : ""}`}>{player.attrs[key]}</span>
              <span className="truncate text-xs text-muted">{tr(`attr.${key}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
    <div className="mx-auto mt-4 grid max-w-[26rem] gap-2 text-start">
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
        <h2 className="text-sm font-extrabold">{tr("table")}</h2>
        {compact && rows.length > 7 ? (
          <button type="button" className="min-h-9 text-sm font-bold text-gold" onClick={() => setFull((value) => !value)}>
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
      <button type="button" className="mb-3 text-sm text-muted" onClick={onBack}>
        {tr("menu")}
      </button>
      <h1 className="font-display text-4xl">{tr("privacy")}</h1>
      <div className="privacy-copy mt-4 grid gap-3 text-sm leading-6">
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
  onNew: () => void;
  dailyBest: number | null;
  streak: number;
}) {
  const { tr } = useTx();
  const [confirm, setConfirm] = useState(false);
  const closes = useClosesIn();
  const board = useMemo(() => dailyBoard(), []);
  const dailyClub = getClub(board.clubId);
  const dailyPos = tr(`pos.${board.position}`);

  return (
    <Shell>
      <div className="home-screen">
        <button type="button" className="home-mute" onClick={onSound} aria-label={sound ? tr("mute") : tr("sound")}>
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
        <LangSwitch onLang={onLang} />

        <div className="cobrand">
          <Crest className="h-8 w-8" />
          <span className="wordmark text-gold-2">STAR</span>
        </div>

        {career ? (
          <>
            <p className="home-kicker">{tr("kicker")}</p>
            <div className="mt-3">
              <PlayerCard career={career} />
            </div>
            <SeasonProgress career={career} />
          </>
        ) : (
          <>
            <Crest className="home-crest" />
            <p className="home-kicker">{tr("kicker")}</p>
            <h1 className="font-display home-title">
              {tr("title1")}
              <br />
              <em className="text-gold-grad">{tr("title2")}</em>
            </h1>

            <p className="home-copy">{tr("homeCopy")}</p>

            <div className="worldstat">
              <div>
                <b className="num">{COUNTRIES.length}</b>
                <span>{tr("countries")}</span>
              </div>
              <div>
                <b className="num">{LEAGUES.length}</b>
                <span>{tr("leagues")}</span>
              </div>
              <div>
                <b className="num">{CLUBS.length}</b>
                <span>{tr("clubs")}</span>
              </div>
            </div>
          </>
        )}

        <div className="home-actions">
          {career ? (
            <button type="button" className="btn-gold flex h-14 w-full items-center justify-center gap-2 text-lg" onClick={onContinue}>
              <Play className="size-5" />
              {tr("continue")}
            </button>
          ) : (
            <button type="button" className="btn-gold flex h-14 w-full items-center justify-center gap-2 text-lg" onClick={onCreate}>
              <Play className="size-5" />
              {tr("start")}
            </button>
          )}

          <div className="home-row">
            <button type="button" className="btn-ghost flex h-12 items-center justify-center gap-2 text-sm" onClick={onCollection}>
              <Trophy className="size-4 text-trophy" />
              {tr("trophies")}
              {career && career.trophies.length ? <span className="font-num text-trophy">{career.trophies.length}</span> : null}
            </button>
            <button type="button" className="btn-ghost flex h-12 items-center justify-center gap-2 text-sm" onClick={onSummary}>
              <Play className="size-4 text-gold" />
              {career ? tr("seasonOf", { name: career.player.name }) : tr("season")}
            </button>
          </div>

          <button type="button" className="daily-card" onClick={onDaily}>
            <span className="daily-head">
              <span className="daily-kick">
                <Medal className="size-3.5" />
                {tr("daily")}
              </span>
              <span className="daily-time num">{tr("closes", { n: closes })}</span>
            </span>
            <span className="daily-club">{tr("today", { pos: dailyPos, club: dailyClub.name })}</span>
            <span className="daily-foot">
              <span>{dailyBest != null ? tr("dailyDone", { n: dailyBest }) : tr("dailyGoal")}</span>
            </span>
          </button>
          <p className="flex items-center justify-center gap-1 text-xs font-bold text-gold">
            <Flame className="size-3.5" />
            {tr("streak", { n: streak })}
          </p>
        </div>

        {career ? (
          <div className="mt-4">
            {confirm ? (
              <div className="panel px-4 py-3 text-sm">
                <p>{tr("resetAsk", { name: career.player.name })}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" className="btn-ghost h-11" onClick={() => setConfirm(false)}>
                    {tr("cancel")}
                  </button>
                  <button type="button" className="btn-gold h-11" onClick={onNew}>
                    {tr("newCareer")}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="text-sm text-muted" onClick={() => setConfirm(true)}>
                {tr("reset")}
              </button>
            )}
          </div>
        ) : null}
        <button type="button" className="mx-auto mt-4 block text-xs text-muted" onClick={onPrivacy}>
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
  onStart: (name: string, position: Career["player"]["position"], countryId: string, salt: number, difficulty: Difficulty) => void;
}) {
  const [name, setName] = useState("Alex");
  const [countryId, setCountryId] = useState<string | null>(null);
  const [position, setPosition] = useState<Career["player"]["position"] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [salt, setSalt] = useState(1);
  const preview = useMemo(() => (position ? previewPlayer(name || "Player", position, salt) : null), [name, position, salt]);
  const country = COUNTRIES.find((item) => item.id === countryId);
  const ready = name.trim().length >= 2 && position && countryId;
  const { tr } = useTx();

  return (
    <Shell>
      <button type="button" className="mb-4 flex items-center gap-1 text-sm text-muted" onClick={onBack}>
        <ChevronLeft className="size-4 rtl:-scale-x-100" />
        {tr("back")}
      </button>
      <p className="text-sm font-semibold tracking-widest text-gold">{tr("age16")}</p>
      <h1 className="font-display mt-1 text-4xl">{tr("build")}</h1>
      <label className="mt-5 block text-sm font-semibold" htmlFor="player-name">
        {tr("name")}
      </label>
      <input
        id="player-name"
        value={name}
        maxLength={16}
        enterKeyHint="done"
        autoComplete="name"
        onChange={(event) => setName(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg"
        placeholder={tr("namePh")}
      />

      <h2 className="mt-5 text-base font-extrabold">{tr("country")}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {COUNTRIES.map((item) => {
          const selected = countryId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCountryId(item.id)}
              className={`rounded-2xl border px-3 py-3 text-start ${selected ? "border-gold bg-surface-2" : "border-line bg-surface"}`}
            >
              <span className="block font-extrabold">{tr(`country.${item.id}`)}</span>
              <span className="mt-1 block text-xs text-muted">{entryLeague(item.id).name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-base font-extrabold">{tr("position")}</h2>
        <button type="button" className="flex min-h-11 items-center gap-1 text-sm text-gold" onClick={() => setSalt((value) => value + 1)}>
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
              className={`rounded-2xl border px-3 py-3 text-start ${selected ? "border-gold bg-surface-2" : "border-line bg-surface"}`}
            >
              <span className="flex items-center justify-between">
                <span className="font-extrabold">{tr(`pos.${item.id}`)}</span>
                <span className="num text-xs text-muted">{item.shirt}</span>
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">{tr(`posblurb.${item.id}`)}</span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-5 text-base font-extrabold">{tr("difficulty")}</h2>
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
            className={`rounded-2xl border px-3 py-3 text-start ${difficulty === id ? "border-gold bg-surface-2" : "border-line bg-surface"}`}
          >
            <span className="block font-extrabold">{tr(label)}</span>
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
            <p className="num text-4xl font-extrabold text-gold">{preview.ovr}</p>
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
        className="btn-gold mt-5 h-14 w-full text-lg"
        disabled={!ready || !position || !countryId}
        onClick={() => position && countryId && onStart(name.trim(), position, countryId, salt, difficulty)}
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
          <Icon className="size-3.5 text-gold" />
          {tr(`attr.${attr}`)}
        </span>
        <span className="num font-bold">
          {value}
          {delta ? (
            <span className={delta > 0 ? "text-gold" : "text-bad"}>
              {" "}
              {delta > 0 ? `+${delta}` : delta}
            </span>
          ) : null}
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RunScreen({ career, onChange, onMenu }: { career: Career; onChange: (c: Career) => void; onMenu: () => void }) {
  const [paused, setPaused] = useState(() => Boolean(career.lastTrain));
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
    const id = window.setTimeout(() => onChange(playStep(career)), 460);
    return () => window.clearTimeout(id);
  }, [career, paused, onChange]);

  return (
    <Shell>
      <header className="mb-4 flex items-center justify-between gap-3">
        <button type="button" className="btn-ghost flex h-11 items-center gap-1 px-3 text-sm" onClick={onMenu}>
          <ChevronLeft className="size-4 rtl:-scale-x-100" />
          {tr("menu")}
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-extrabold">{league.name}</p>
          <p className="text-xs text-muted">
            {seasonLabel(career.year)} · {tr("matchday", { n: played, m: total })}
          </p>
        </div>
        <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-gold leading-none text-ink">
          <span className="font-num text-lg font-bold">{ovr}</span>
          <span className="text-[0.55rem] font-extrabold">OVR</span>
        </div>
      </header>

      <section className="scorebox px-4 py-4">
        <p className="eyebrow">
          {career.season.breakDone ? tr("second") : tr("first")} · {country.name}
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display truncate text-3xl leading-none">{career.player.name}</h1>
            <p className="mt-1 text-sm text-muted">
              #{shirtNumber(career.player.position)} · {club.name}
            </p>
          </div>
          {career.race ? <span className="chip chip-trophy shrink-0">{tr("raceTag")}</span> : null}
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
              <p className="truncate text-sm font-bold">{latest.opponentName}</p>
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
          className={`card mt-3 px-4 py-3 text-sm font-extrabold ${
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

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost h-12" onClick={() => setPaused((value) => !value)}>
          {paused ? tr("resume") : tr("pause")}
        </button>
        <button
          type="button"
          className="btn-gold h-12"
          onClick={() => {
            unlockAudio();
            playWhistle();
            onChange(runToStop(career));
          }}
        >
          {career.season.breakDone ? tr("skipEnd") : tr("skipBreak")}
        </button>
      </div>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-extrabold">{tr("results")}</h2>
        <div className="grid gap-1">
          {log.length === 0 ? <p className="text-sm text-muted">{tr("soon")}</p> : null}
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
      <button type="button" className="mb-3 text-sm text-muted" onClick={onMenu}>
        {tr("menu")}
      </button>
      <p className="text-sm font-semibold tracking-widest text-gold">{camp ? tr("preseason") : tr("winter")} · {club.name}</p>
      {career.race ? <p className="mt-1 text-xs font-bold text-gold">{tr("raceTag")}</p> : null}
      <h1 className="font-display mt-1 text-4xl">{tr("coach")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {camp ? tr("campAsk") : tr("breakAsk", { avg: avg ? tr("avgBit", { n: avg.toFixed(1) }) : "" })}
      </p>
      <div className="mt-4 grid gap-2">
        {ATTR_KEYS.map((key) => {
          const odds = trainOdds(career, key);
          return (
            <button
              key={key}
              type="button"
              className="flex items-center justify-between rounded-2xl border border-line bg-surface px-3 py-3 text-start"
              onClick={() => {
                unlockAudio();
                onChange(camp ? answerCamp(career, key) : answerBreak(career, key));
              }}
            >
              <span>
                <span className="block text-xs font-semibold tracking-wide text-gold">{tr(`q.${key}`)}</span>
                <span className="block font-extrabold">{tr(`drill.${key}`)}</span>
                <span className="block text-xs text-muted">
                  {tr(`attr.${key}`)} {career.player.attrs[key]}
                  {odds.gain ? ` · ${tr("trainChance", { up: odds.up, down: odds.down })}` : ` · ${tr("ceiling")}`}
                </span>
              </span>
              <span className="num text-lg font-extrabold text-gold">{odds.gain ? `${odds.up}%` : "—"}</span>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

function MatchScreen({ career, onReport, onMenu }: { career: Career; onReport: () => void; onMenu: () => void }) {
  const report = career.activeReport as MatchReport;
  const [step, setStep] = useState(1);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const shown = report.events.slice(0, step);
  const current = shown[shown.length - 1];
  const done = step >= report.events.length;
  const minute = current?.minute ?? 0;
  const ours = getClub(career.clubId).name;
  const left = report.home ? ours : report.opponentName;
  const right = report.home ? report.opponentName : ours;
  const leftGoals = report.home ? (current?.us ?? 0) : (current?.them ?? 0);
  const rightGoals = report.home ? (current?.them ?? 0) : (current?.us ?? 0);
  const { tr, text } = useTx();

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
      <header className="mb-3 flex items-center justify-between gap-3">
        <button type="button" className="min-h-11 text-sm text-muted" onClick={onMenu}>
          {tr("menu")}
        </button>
        <p className="eyebrow truncate">{text(report.roundLabel)}</p>
        {done ? (
          <span className="w-10" />
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-bad">
            <span className="live-dot" />
            {tr("live")}
          </span>
        )}
      </header>

      <div className="scorebox px-4 pt-4 pb-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-center" dir="ltr">
          <span className={`min-w-0 text-sm font-bold ${left === ours ? "text-gold-2" : ""}`} dir="auto">
            {left}
          </span>
          <span className="score-big">
            {leftGoals}
            <span className="px-2 text-gold">:</span>
            {rightGoals}
          </span>
          <span className={`min-w-0 text-sm font-bold ${right === ours ? "text-gold-2" : ""}`} dir="auto">
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

      <ol className="mt-4 flex max-h-[22rem] flex-col gap-2 overflow-auto">
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

      {done ? (
        <button type="button" className="btn-gold mt-4 h-14 w-full text-lg" onClick={onReport}>
          {tr("report")}
        </button>
      ) : (
        <div className="mt-4 flex gap-2">
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
      <button type="button" className="mb-3 text-sm text-muted" onClick={onMenu}>
        {tr("menu")}
      </button>
      <p className="text-xs font-semibold text-gold">{text(report.roundLabel)}</p>
      <h1 className="font-display mt-1 text-4xl">{report.missed ? tr("unused") : tr("matchReport")}</h1>
      <p className="mt-2 text-lg">{text(report.headline)}</p>
      <div className="panel mt-4 px-4 py-5 text-center">
        <p className="text-sm text-muted">{report.home ? tr("home") : tr("away")} vs {report.opponentName}</p>
        <p className="num mt-1 text-5xl font-extrabold">
          {report.us}
          <span className="px-2 text-gold">–</span>
          {report.them}
        </p>
        {!report.missed ? <p className="num mt-2 text-3xl font-extrabold text-gold">{report.rating.toFixed(1)}</p> : null}
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
        <p className="panel mt-4 px-4 py-3 text-sm text-gold">
          {tr("bigGame", { n: ups.map((key) => `${tr(`attr.${key}`)} +${report.deltas[key]}`).join(" · ") })}
        </p>
      ) : null}
      {report.injured ? <p className="mt-3 text-sm text-bad">{tr("creaked")}</p> : null}
      <button type="button" className="btn-gold mt-5 h-14 w-full text-lg" onClick={onNext}>
        {last ? tr("seasonReview") : tr("backRun")}
      </button>
    </Shell>
  );
}

function Mini({ n, l }: { n: number; l: string }) {
  return (
    <div className="panel px-2 py-3">
      <p className="num text-2xl font-extrabold">{n}</p>
      <p className="text-xs text-muted">{l}</p>
    </div>
  );
}

function ResultRow({ item }: { item: MatchLog }) {
  const [open, setOpen] = useState(false);
  const { text } = useTx();
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button type="button" className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-sm" onClick={() => setOpen((value) => !value)}>
        <span className="min-w-0 truncate text-start text-muted">
          {text(item.roundLabel)} · {item.opponentName}
        </span>
        <span className="num shrink-0 font-bold">
          {item.us}–{item.them}
          {item.missed ? "" : <span className="text-gold"> {item.rating.toFixed(1)}</span>}
        </span>
      </button>
      {open ? (
        <div className="border-t border-line px-3 py-2">
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
  const title = tr(summer.kind === "world-cup" ? "summer.wc" : summer.kind === "euros" ? "summer.euros" : "summer.friendly");
  return (
    <Shell>
      <button type="button" className="mb-3 text-sm text-muted" onClick={onMenu}>
        {tr("menu")}
      </button>
      <p className="text-sm font-semibold tracking-widest text-gold">{getCountry(career.countryId).national}</p>
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{text(summer.reason)}</p>
      <p className="mt-2 text-sm text-muted">{tr("summer.caps", { n: career.totals.caps, g: career.totals.intlGoals })}</p>
      <div className="mt-4 grid gap-1">
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
        <button type="button" className="btn-gold mt-5 h-14 w-full text-lg" onClick={onOffers}>
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
      <button type="button" className="mb-3 min-h-11 text-start text-sm text-muted" onClick={onMenu}>
        {tr("menu")}
      </button>
      <div className="text-center">
        <p className="eyebrow text-trophy">
          {tr("season")} {seasonLabel(career.year)}
        </p>
        <h1 className="font-display mt-1 text-3xl">{club.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {preview.tablePos}
          {rows.length ? ` ${tr("of", { n: rows.length })}` : ""} · {league.name}
        </p>
        <p className={`mt-2 inline-flex chip ${preview.targetHit ? "chip-good" : "chip-bad"}`}>
          {preview.targetHit ? tr("targetMet") : tr("targetMiss")} · {text(preview.targetLabel)}
        </p>
      </div>

      <div className="card mt-4 flex items-center justify-center gap-5 px-4 py-4">
        <div className="grid justify-items-center">
          <span className="font-num text-4xl font-semibold text-dim">{preview.ovrBefore}</span>
          <span className="text-xs text-muted">{tr("seasonStart")}</span>
        </div>
        <svg width="40" height="18" viewBox="0 0 40 18" aria-hidden="true" className="rtl:-scale-x-100">
          <path d="M2 9h32M27 3l7 6-7 6" fill="none" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="grid justify-items-center">
          <span className="font-num text-6xl font-bold leading-none">{preview.ovrAfter}</span>
          <span className={`text-xs font-extrabold ${ovrGain > 0 ? "text-good" : ovrGain < 0 ? "text-bad" : "text-muted"}`}>
            {tr("ovrUp", { n: ovrGain > 0 ? `+${ovrGain}` : String(ovrGain) })}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="tile">
          <b>{career.season.apps}</b>
          <span>{tr("apps")}</span>
        </div>
        <div className="tile">
          <b className="text-trophy">{career.season.goals}</b>
          <span>{tr("goals")}</span>
        </div>
        <div className="tile">
          <b>{career.season.assists}</b>
          <span>{tr("assists")}</span>
        </div>
        <div className="tile">
          <b className="text-good">{preview.avg ? preview.avg.toFixed(1) : "–"}</b>
          <span>{tr("average")}</span>
        </div>
      </div>

      {preview.europe ? (
        <p className="card mt-3 px-4 py-3 text-sm font-semibold">
          {tr(preview.europe.comp === "cl" ? "comp.cl" : "comp.el")} · {tr(`stage.${preview.europe.stage}`)}
        </p>
      ) : null}

      <h2 className="mt-5 text-base font-extrabold">{tr("attrsMoved")}</h2>
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

      <h2 className="mt-5 text-base font-extrabold">{tr("awardsHead")}</h2>
      {preview.awards.length ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {preview.awards.map((award) => (
            <div key={award.id} className="award-card">
              <Trophy className="size-6 text-trophy" />
              <span className="text-sm font-extrabold">{text(award.name)}</span>
              <span className="text-xs text-muted">{text(award.detail)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">{tr("noTrophy")}</p>
      )}

      <div className={`card mt-3 flex items-center gap-3 px-4 py-3 ${preview.ballonYours ? "border-trophy" : ""}`}>
        <Medal className="size-5 text-trophy" />
        <span>
          <span className="block text-xs font-bold text-trophy">{tr("award.ballon")}</span>
          <span className="block font-extrabold">{preview.ballon}</span>
        </span>
      </div>

      {career.shuffle?.year === career.year ? (
        <div className="card mt-3 px-4 py-3 text-sm leading-6">
          <p className="font-extrabold">{tr("who")}</p>
          <p className="mt-1">{tr("up", { n: names(career.shuffle.promoted) })}</p>
          <p>{tr("down", { n: names(career.shuffle.relegated) })}</p>
          {career.shuffle.arrivedDown.length ? <p className="text-muted">{tr("relegatedIn", { n: names(career.shuffle.arrivedDown) })}</p> : null}
          {career.shuffle.arrivedUp.length ? <p className="text-muted">{tr("promotedIn", { n: names(career.shuffle.arrivedUp) })}</p> : null}
        </div>
      ) : null}

      <LeagueTable career={career} compact />

      <button type="button" className="btn-gold mt-5 h-14 w-full text-lg" onClick={onSummer}>
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
      <button type="button" className="mb-3 min-h-11 text-start text-sm text-muted" onClick={onMenu}>
        {tr("menu")}
      </button>
      <p className="eyebrow">{tr("ageN", { n: career.player.age })}</p>
      <h1 className="font-display mt-1 text-4xl">{tr("where")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {career.player.age >= farewellAge(career.player.position)
          ? tr("offerLast")
          : career.player.age >= 35
            ? tr("offerOld")
            : tr("whereCopy")}
      </p>
      {!career.race ? <SeasonBreak career={career} onBoost={onBoost} /> : null}
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
                    <h2 className="truncate text-lg font-extrabold">{club.name}</h2>
                    <p className="text-sm text-muted">
                      {league.name} · {offerCountry.name}
                    </p>
                  </div>
                  <span className={`chip shrink-0 ${offer.role === "Star" ? "chip-gold" : offer.role === "Bench" ? "chip-bad" : ""}`}>
                    {tr(`role${offer.role}`)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="tile">
                    <b dir="ltr">{money(offer.wage, offerCountry.currency || currency)}</b>
                    <span>{tr("perMonth")}</span>
                  </div>
                  <div className="tile">
                    <b>{offer.years}</b>
                    <span>{tr("yearsShort")}</span>
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="flex justify-between text-xs text-muted">
                    <span>{tr("minutes")}</span>
                    <span className="num">~{mins}%</span>
                  </div>
                  <div className="meter">
                    <i className={mins >= 90 ? "good" : mins < 70 ? "bad" : ""} style={{ width: `${mins}%` }} />
                  </div>
                </div>
                <p className="text-sm leading-6">{text(offer.note)}</p>
                <button type="button" className={`${offer.kind === "stay" ? "btn-ghost" : "btn-gold"} h-12 w-full`} onClick={() => onAccept(offer.clubId)}>
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
              <button type="button" className="btn-gold h-11" onClick={onRetire}>
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
  const { tr } = useTx();
  return (
    <Shell>
      <button type="button" className="mb-3 flex min-h-11 items-center gap-1 text-sm text-muted" onClick={onBack}>
        <ChevronLeft className="size-4 rtl:-scale-x-100" />
        {tr("menu")}
      </button>
      <h1 className="font-display text-4xl">{tr("collection")}</h1>
      {!career || career.trophies.length === 0 ? (
        <p className="card mt-4 px-4 py-6 text-center text-sm leading-6 text-muted">{tr("emptyCabinet")}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {career.trophies.map((trophy) => (
            <article key={trophy.id} className="award-card">
              <Trophy className="size-6 text-trophy" />
              <span className="text-sm font-extrabold">{trophy.name}</span>
              <span className="text-xs text-muted">
                {seasonLabel(trophy.year)} · {trophy.detail}
              </span>
            </article>
          ))}
        </div>
      )}
      {career && career.history.length ? (
        <div className="mt-5">
          <h2 className="mb-2 font-extrabold">{tr("seasonsHead")}</h2>
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
        <button type="button" className="mb-3 min-h-11 text-start text-sm text-muted" onClick={onBack}>
          {tr("menu")}
        </button>
        <h1 className="font-display text-4xl">{tr("season")}</h1>
        <p className="mt-3 text-sm text-muted">{tr("noCareer")}</p>
      </Shell>
    );
  }
  const club = getClub(career.clubId);
  const rows = sortTable(career.season.table);
  const apps = career.season.apps;
  const avg = apps ? career.season.sumRating / apps : 0;
  return (
    <Shell>
      <button type="button" className="mb-3 flex min-h-11 items-center gap-1 text-sm text-muted" onClick={onBack}>
        <ChevronLeft className="size-4 rtl:-scale-x-100" />
        {tr("menu")}
      </button>
      <p className="eyebrow">{seasonLabel(career.year)}</p>
      <h1 className="font-display text-4xl">{career.player.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {club.name} · {tablePosition(career)}
        {rows.length ? ` ${tr("of", { n: rows.length })}` : ""} · {tr("appsN", { n: apps })} · {tr("goalsN", { n: career.season.goals })}
        {avg ? ` · ${tr("avgN", { n: avg.toFixed(1) })}` : ""}
      </p>
      <div className="mt-4">
        <PlayerCard career={career} />
      </div>
      <LeagueTable career={career} />
      <div className="mt-4 grid gap-2">
        {career.season.fixturesPlayed
          .filter((log) => log.competition !== "europe")
          .map((log, index) => (
            <ResultRow key={`${log.opponentName}-${index}`} item={log} />
          ))}
      </div>
    </Shell>
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
      <button type="button" className="mb-3 flex items-center gap-1 text-sm text-muted" onClick={onBack}>
        <ChevronLeft className="size-4 rtl:-scale-x-100" />
        {tr("menu")}
      </button>
      <p className="text-sm font-semibold tracking-widest text-gold">{tr("dailyKicker")}</p>
      <h1 className="font-display text-4xl">{tr("dailyTitle")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{tr("dailyCopy", { pos: tr(`pos.${board.position}`), club: club.name, league: league.name })}</p>
      {best != null ? <p className="mt-3 text-sm font-extrabold text-gold">{tr("dailyWon", { n: best })}</p> : null}
      <div className="panel mt-4 px-4 py-4">
        <p className="text-xs font-semibold tracking-widest text-muted">{tr("starting")}</p>
        <div className="mt-3 grid gap-2">
          {ATTR_KEYS.map((key) => (
            <AttrBar key={key} attr={key} value={board.attrs[key]} />
          ))}
        </div>
      </div>
      {running ? (
        <button type="button" className="btn-gold mt-4 h-14 w-full text-lg" onClick={() => onBegin(running)}>
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
            className="mt-2 h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg"
            placeholder={tr("namePh")}
          />
          <button type="button" className="btn-gold mt-4 h-14 w-full text-lg" onClick={() => onBegin(createDailyCareer(name, board.date))}>
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

function Retired({ career, onHome, onNew }: { career: Career; onHome: () => void; onNew: () => void }) {
  const { tr } = useTx();
  const peak = career.history.reduce((best, row) => Math.max(best, row.ovr), overall(career.player.position, career.player.attrs));
  return (
    <Shell>
      <p className="eyebrow text-trophy">{tr("endRoad")}</p>
      <h1 className="font-display mt-1 text-4xl">{career.player.name}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {tr("retiredLine", {
          age: career.player.age,
          seasons: career.totals.seasons,
          goals: career.totals.goals,
          trophies: career.trophies.length,
          peak,
        })}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {career.trophies.length ? (
          career.trophies.map((trophy) => (
            <div key={trophy.id} className="award-card">
              <Trophy className="size-5 text-trophy" />
              <span className="text-sm font-bold">{trophy.name}</span>
            </div>
          ))
        ) : (
          <p className="col-span-2 text-sm text-muted">{tr("noTrophyCareer")}</p>
        )}
      </div>
      <button type="button" className="btn-gold mt-5 h-14 w-full" onClick={onNew}>
        {tr("newCareer")}
      </button>
      <button type="button" className="btn-ghost mt-2 h-12 w-full" onClick={onHome}>
        {tr("menu")}
      </button>
    </Shell>
  );
}
