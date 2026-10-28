import { useContext, useEffect, useMemo, useState, createContext, type ReactNode } from "react";
import {
  ArrowLeftRight,
  ChevronLeft,
  Dumbbell,
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
  breakGain,
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
} from "@/game/engine";
import { boostId, boostTaken, loadCareer, loadDailyAttempt, loadSound, markBoost, saveCareer, saveDailyAttempt, saveSound, touchStreak, type DailyAttempt } from "@/game/save";
import { loadLang, setLang, show, t, type Lang } from "@/game/i18n";
import { ATTR_KEYS, type AttrKey, type Career, type Difficulty, type MatchLog, type MatchReport } from "@/game/types";

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

function FormPips({ logs }: { logs: MatchLog[] }) {
  const { tr } = useTx();
  const last = logs.filter((item) => item.competition === "league").slice(-5);
  if (!last.length) return null;
  return (
    <div className="form-pips" aria-label={tr("form")}>
      {last.map((item, index) => (
        <i key={`${item.opponentName}-${index}`} className={item.rating >= 7.2 ? "hot" : item.rating >= 6.4 ? "ok" : "cold"} />
      ))}
    </div>
  );
}

function AdBanner() {
  const { tr } = useTx();
  return (
    <aside className="ad-slot" data-ad-slot="banner" aria-label={tr("adLabel")}>
      <span className="ad-tag">{tr("adLabel")}</span>
      <span>{tr("adBanner")}</span>
    </aside>
  );
}

function SeasonBreak({ career, onBoost }: { career: Career; onBoost: (key: AttrKey) => void }) {
  const { tr } = useTx();
  const id = boostId(career.player.name, career.year);
  const [open, setOpen] = useState(true);
  const [used, setUsed] = useState(() => boostTaken(id));
  const [pick, setPick] = useState(false);
  return (
    <div className="mt-4 grid gap-2">
      {open ? (
        <aside className="ad-slot ad-break" data-ad-slot="interstitial" aria-label={tr("adLabel")}>
          <span className="ad-tag">{tr("adLabel")}</span>
          <p>{tr("adBreak")}</p>
          <button type="button" className="btn-ghost mt-3 h-11 w-full" onClick={() => setOpen(false)}>
            {tr("adSkip")}
          </button>
        </aside>
      ) : null}
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
        <p>
          Ads have three seats. A banner lives on the menu and never covers a button. A skippable break appears after a season, before the next contract. A clip is optional: tap it to add 1 to one attribute, once a season. Nothing runs during a match. The daily race has no clip, so the Ballon d'Or time stays fair.
        </p>
        <p>
          Google Play: package this HTTPS site as a Trusted Web Activity with Bubblewrap. Publish assetlinks.json using the Play App Signing certificate, or the store build shows a browser bar. Use AdMob test ids until the listing is approved. In Data safety, declare on-device storage and advertising. Do not sell the boost outside Play Billing.
        </p>
        <p>פרסומות רק בתפריט, אחרי עונה, או בקליפ שאתה בוחר. אין פרסומת באמצע משחק. הקריירה נשמרת על המכשיר ואין חשבון.</p>
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
          <Crest className="h-9 w-9" />
          <span className="cobrand-x" aria-hidden="true">×</span>
          <span className="cobrand-word">STAR</span>
        </div>

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
              <Trophy className="size-4 text-gold" />
              {tr("trophies")}
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
          <p className="text-center text-xs font-bold text-gold">{tr("streak", { n: streak })}</p>
          <AdBanner />
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
        <ChevronLeft className="size-4" />
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
  const [paused, setPaused] = useState(false);
  const club = getClub(career.clubId);
  const league = getLeague(career.season.leagueId);
  const country = getCountry(career.countryId);
  const ovr = overall(career.player.position, career.player.attrs);
  const rows = sortTable(career.season.table);
  const place = tablePosition(career);
  const latest = career.season.fixturesPlayed[career.season.fixturesPlayed.length - 1];
  const log = career.season.fixturesPlayed.slice(-6).reverse();
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
      <header className="mb-4 flex items-center justify-between">
        <button type="button" className="btn-ghost flex h-11 items-center gap-1 px-3 text-sm" onClick={onMenu}>
          <ChevronLeft className="size-4" />
          {tr("menu")}
        </button>
        <div className="text-end">
          <p className="text-sm font-bold">{league.name}</p>
          <p className="text-xs text-muted">
            {seasonLabel(career.year)} · {place}
            {rows.length ? ` ${tr("of", { n: rows.length })}` : ""}
          </p>
        </div>
      </header>

      <section className="panel scoreboard px-4 py-4">
        <p className="text-xs font-semibold tracking-widest text-gold">
          {career.season.breakDone ? tr("second") : tr("first")} · {country.name}
        </p>
        <p className="goal-strip">{tr(`aim.${careerAim(career)}`)}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl leading-none">{career.player.name}</h1>
            <FormPips logs={career.season.fixturesPlayed} />
            <p className="mt-1 text-sm text-muted">
              #{shirtNumber(career.player.position)} · {club.name}
            </p>
            <p className="mt-1 text-xs text-muted">
              {tr(career.difficulty === "easy" ? "diff.easy" : career.difficulty === "hard" ? "diff.hard" : "diff.normal")}
              {" · "}
              {career.contractLeft === 1 ? tr("year1") : tr("years", { n: career.contractLeft })}
              {career.season.outFor > 0 ? ` · ${tr("injured", { n: career.season.outFor })}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted">{tr("board", { n: text(career.season.targetLabel) })}</p>
            {career.europeComp ? (
              <p className="mt-1 text-xs text-muted">{tr("europeOn", { name: tr(career.europeComp === "cl" ? "comp.cl" : "comp.el") })}</p>
            ) : null}
            {career.race ? <p className="mt-1 text-xs font-bold text-gold">{tr("raceTag")}</p> : null}
          </div>
          <p className="num text-4xl font-extrabold text-gold">{ovr}</p>
        </div>
        {latest ? (
          <p className="mt-3 text-sm">
            <span className="text-muted">{text(latest.roundLabel)} · </span>
            {latest.opponentName}{" "}
            <span className="num font-extrabold">
              {latest.us}–{latest.them}
            </span>
            {latest.missed ? <span className="text-muted"> · {tr("bench")}</span> : <span className="num text-gold"> {latest.rating.toFixed(1)}</span>}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">{tr("kickoff")}</p>
        )}
        {career.recentDeltas && ATTR_KEYS.some((key) => career.recentDeltas?.[key]) ? (
          <p className="mt-2 text-sm text-gold">
            {ATTR_KEYS.filter((key) => career.recentDeltas?.[key]).map((key) => `${tr(`attr.${key}`)} +${career.recentDeltas?.[key]}`).join(" · ")}
          </p>
        ) : null}
      </section>

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

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-extrabold">{tr("table")}</h2>
        <div className="panel overflow-hidden">
          {rows.map((row, index) => {
            const mine = row.clubId === career.clubId;
            return (
              <div key={row.clubId} className={`flex items-center gap-2 px-3 py-2 text-sm ${mine ? "bg-surface-2" : ""} ${index ? "border-t border-line" : ""}`}>
                <span className="num w-5 text-muted">{index + 1}</span>
                <span className={`min-w-0 flex-1 truncate font-semibold ${mine ? "text-gold" : ""}`}>{getClub(row.clubId).short}</span>
                <span className="num w-8 text-end text-muted">{row.gf - row.ga}</span>
                <span className="num w-6 text-end font-extrabold">{row.pts}</span>
              </div>
            );
          })}
        </div>
      </section>
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
          const gain = breakGain(career, key);
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
                  {gain ? ` · ${tr(`hint.${key}`)}` : ` · ${tr("ceiling")}`}
                </span>
              </span>
              <span className="num text-lg font-extrabold text-gold">{gain ? `+${gain}` : "—"}</span>
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
  const shown = report.events.slice(0, step);
  const current = shown[shown.length - 1];
  const done = step >= report.events.length;
  const { tr, text } = useTx();

  useEffect(() => {
    playWhistle();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStep(report.events.length);
      return;
    }
    const id = window.setInterval(() => {
      setStep((value) => (value >= report.events.length ? value : value + 1));
    }, 820);
    return () => window.clearInterval(id);
  }, [report]);

  useEffect(() => {
    const event = report.events[step - 1];
    if (event?.tone === "goal") playGoal();
  }, [step, report.events]);

  return (
    <Shell>
      <header className="mb-3 flex items-center justify-between">
        <button type="button" className="text-sm text-muted" onClick={onMenu}>
          {tr("menu")}
        </button>
        <p className="text-xs font-semibold text-gold">{text(report.roundLabel)}</p>
      </header>
      <div className="panel px-4 py-4 text-center">
        <p className="text-sm text-muted">{report.home ? tr("home") : tr("away")} · {report.opponentName}</p>
        <p className="num mt-1 text-5xl font-extrabold">
          {current?.us ?? 0}
          <span className="px-2 text-gold">–</span>
          {current?.them ?? 0}
        </p>
        <p className="num mt-1 text-sm text-muted">{tr("minute", { n: current?.minute ?? 0 })}</p>
      </div>
      <ol className="mt-4 flex max-h-72 flex-col gap-2 overflow-auto">
        {shown.map((event, index) => (
          <li key={`${event.minute}-${index}`} className={`rounded-2xl px-3 py-2 text-sm ${event.tone === "goal" ? "bg-surface-2 text-gold" : event.tone === "bad" ? "text-bad" : "bg-surface"}`}>
            <span className="num me-2 text-xs text-muted">{event.minute}</span>
            {text(event.text)}
          </li>
        ))}
      </ol>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost h-12" onClick={() => setStep(report.events.length)}>
          {tr("skipEnd")}
        </button>
        <button type="button" className="btn-gold h-12" disabled={!done} onClick={onReport}>
          {tr("report")}
        </button>
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
  const { tr, text } = useTx();
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
  return (
    <Shell>
      <button type="button" className="mb-3 text-sm text-muted" onClick={onMenu}>
        {tr("menu")}
      </button>
      <p className="text-sm font-semibold text-gold">{club.name}</p>
      <h1 className="font-display text-4xl">{tr("season")} {seasonLabel(career.year)}</h1>
      <p className="mt-1 text-muted">
        {preview.tablePos}
        {rows.length ? ` ${tr("of", { n: rows.length })}` : ""} · {league.name}
        {preview.avg ? ` · ${preview.avg.toFixed(1)}` : ""} · {career.season.goals}
      </p>
      <p className={`mt-2 text-sm font-semibold ${preview.targetHit ? "text-gold" : "text-bad"}`}>
        {preview.targetHit ? tr("targetMet") : tr("targetMiss")} · {text(preview.targetLabel)}
      </p>
      {preview.europe ? (
        <p className="mt-2 text-sm font-semibold">
          {tr(preview.europe.comp === "cl" ? "comp.cl" : "comp.el")} · {tr(`stage.${preview.europe.stage}`)}
        </p>
      ) : null}
      <div className={`panel mt-4 flex items-center gap-3 px-4 py-3 ${preview.ballonYours ? "border-gold" : ""}`}>
        <Trophy className="size-5 text-gold" />
        <span>
          <span className="block text-xs font-semibold tracking-wide text-gold">{tr("award.ballon")}</span>
          <span className="block font-extrabold">{preview.ballon}</span>
        </span>
      </div>
      {career.shuffle?.year === career.year ? (
        <div className="panel mt-4 px-4 py-3 text-sm leading-6">
          <p className="font-extrabold">{tr("who")}</p>
          <p className="mt-1">{tr("up", { n: names(career.shuffle.promoted) })}</p>
          <p>{tr("down", { n: names(career.shuffle.relegated) })}</p>
          {career.shuffle.arrivedDown.length ? <p className="text-muted">{tr("relegatedIn", { n: names(career.shuffle.arrivedDown) })}</p> : null}
          {career.shuffle.arrivedUp.length ? <p className="text-muted">{tr("promotedIn", { n: names(career.shuffle.arrivedUp) })}</p> : null}
        </div>
      ) : null}

      <div className="panel mt-4 overflow-hidden">
        {rows.map((row, index) => {
          const mine = row.clubId === career.clubId;
          return (
            <div key={row.clubId} className={`flex items-center px-3 py-2 text-sm ${mine ? "bg-surface-2 text-gold" : ""} ${index ? "border-t border-line" : ""}`}>
              <span className="num w-6">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{getClub(row.clubId).name}</span>
              <span className="num font-extrabold">{row.pts}</span>
            </div>
          );
        })}
      </div>

      <h2 className="mt-5 text-lg font-extrabold">{tr("attrsMoved")}</h2>
      <div className="mt-3 grid gap-3">
        {ATTR_KEYS.map((key) => (
          <AttrBar key={key} attr={key} value={preview.after[key]} delta={preview.deltas[key]} />
        ))}
      </div>
      <p className="mt-3 text-sm">
        {tr("overall")} <span className="num">{preview.ovrBefore}</span>
        <span className="text-muted"> {tr("to")} </span>
        <span className="num text-gold">{preview.ovrAfter}</span>
      </p>
      <div className="mt-3 grid gap-2">
        {preview.lines.map((line) => (
          <p key={line} className="text-sm leading-6 text-muted">
            {text(line)}
          </p>
        ))}
      </div>
      {preview.awards.length ? (
        <div className="mt-4 grid gap-2">
          {preview.awards.map((award) => (
            <div key={award.id} className="panel flex items-center gap-3 px-3 py-3">
              <Trophy className="size-5 text-gold" />
              <span>
                <span className="block font-extrabold">{text(award.name)}</span>
                <span className="block text-xs text-muted">{text(award.detail)}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">{tr("noTrophy")}</p>
      )}
      <button type="button" className="btn-gold mt-5 h-14 w-full text-lg" onClick={onSummer}>
        {claimRace ? tr("dailyClaim") : tr("summerBtn")}
      </button>
    </Shell>
  );
}

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
  return (
    <Shell>
      <button type="button" className="mb-3 text-sm text-muted" onClick={onMenu}>
        Menu
      </button>
      <p className="text-sm font-semibold text-gold">Age {career.player.age}</p>
      <h1 className="font-display text-4xl">Where you sign</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {career.player.age >= farewellAge(career.player.position)
          ? "This is the last contract anyone will offer. After it, the career ends."
          : career.player.age >= 35
            ? "The body is slower. You can still move, but clubs are pushing you toward the exit."
            : "Stay until the window, or move when it opens. A bench role means fewer minutes."}
      </p>
      {!career.race ? <SeasonBreak career={career} onBoost={onBoost} /> : null}
      <div className="mt-4 grid gap-3">
        {offers.map((offer) => {
          const club = getClub(offer.clubId);
          const league = getLeague(offer.leagueId);
          const offerCountry = getCountry(league.countryId);
          return (
            <article key={offer.clubId} className="panel px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold">{club.name}</h2>
                  <p className="text-sm text-muted">
                    {league.name} · {offerCountry.name}
                  </p>
                </div>
                <span className="rounded-full border border-line px-2 py-1 text-xs font-bold text-gold">{offer.role}</span>
              </div>
              <p className="num mt-2 text-sm">{money(offer.wage, offerCountry.currency || currency)} a month · {offer.years}-year deal</p>
              <p className="mt-2 text-sm leading-6">{offer.note}</p>
              <button type="button" className="btn-gold mt-3 h-12 w-full" onClick={() => onAccept(offer.clubId)}>
                {offer.kind === "stay" ? "Stay" : offer.kind === "side" ? "Move" : "Sign"}
              </button>
            </article>
          );
        })}
      </div>
      <div className="mt-5">
        {ask ? (
          <div className="panel px-4 py-3">
            <p className="text-sm">Hang up the boots at {career.player.age}?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-ghost h-11" onClick={() => setAsk(false)}>
                One more year
              </button>
              <button type="button" className="btn-gold h-11" onClick={onRetire}>
                Retire
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="text-sm text-muted" onClick={() => setAsk(true)}>
            Retire from the game
          </button>
        )}
      </div>
    </Shell>
  );
}

function Collection({ career, onBack }: { career: Career | null; onBack: () => void }) {
  return (
    <Shell>
      <button type="button" className="mb-3 flex items-center gap-1 text-sm text-muted" onClick={onBack}>
        <ChevronLeft className="size-4" />
        Menu
      </button>
      <h1 className="font-display text-4xl">Trophies</h1>
      {!career || career.trophies.length === 0 ? (
        <p className="panel mt-4 px-4 py-6 text-center text-sm leading-6 text-muted">The cabinet is empty. You start in the bottom division with nothing on the shelf.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {career.trophies.map((trophy) => (
            <article key={trophy.id} className="panel flex items-center gap-3 px-3 py-3">
              <Trophy className="size-5 shrink-0 text-gold" />
              <span>
                <span className="block font-extrabold">{trophy.name}</span>
                <span className="block text-xs text-muted">
                  {seasonLabel(trophy.year)} · {trophy.detail}
                </span>
              </span>
            </article>
          ))}
        </div>
      )}
      {career && career.history.length ? (
        <div className="mt-5">
          <h2 className="mb-2 font-extrabold">Seasons</h2>
          <div className="grid gap-2">
            {career.history.map((row) => (
              <div key={`${row.year}-${row.clubId}`} className="flex items-center justify-between rounded-2xl border border-line px-3 py-2 text-sm">
                <span>
                  {seasonLabel(row.year)} · {getClub(row.clubId).short}
                </span>
                <span className="num text-muted">
                  {row.pos} · {row.goals} goals · {row.ovr}
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
  if (!career) {
    return (
      <Shell>
        <button type="button" className="mb-3 text-sm text-muted" onClick={onBack}>
          Menu
        </button>
        <h1 className="font-display text-4xl">Season</h1>
        <p className="mt-3 text-sm text-muted">No career yet. Start one and come back after the first matches.</p>
      </Shell>
    );
  }
  const club = getClub(career.clubId);
  const rows = sortTable(career.season.table);
  const apps = career.season.apps;
  const avg = apps ? career.season.sumRating / apps : 0;
  return (
    <Shell>
      <button type="button" className="mb-3 flex items-center gap-1 text-sm text-muted" onClick={onBack}>
        <ChevronLeft className="size-4" />
        Menu
      </button>
      <p className="text-sm text-gold">{seasonLabel(career.year)}</p>
      <h1 className="font-display text-4xl">{career.player.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {club.name} · {tablePosition(career)}
        {rows.length ? ` of ${rows.length}` : ""} · {apps} apps · {career.season.goals} goals
        {avg ? ` · avg ${avg.toFixed(1)}` : ""}
      </p>
      <div className="mt-4 grid gap-3">
        {ATTR_KEYS.map((key) => (
          <AttrBar key={key} attr={key} value={career.player.attrs[key]} />
        ))}
      </div>
      <div className="panel mt-4 overflow-hidden">
        {rows.map((row, index) => (
          <div key={row.clubId} className={`flex px-3 py-2 text-sm ${row.clubId === career.clubId ? "text-gold" : ""} ${index ? "border-t border-line" : ""}`}>
            <span className="num w-6">{index + 1}</span>
            <span className="flex-1">{getClub(row.clubId).short}</span>
            <span className="num font-bold">{row.pts}</span>
          </div>
        ))}
      </div>
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
        <ChevronLeft className="size-4" />
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
  const peak = career.history.reduce((best, row) => Math.max(best, row.ovr), overall(career.player.position, career.player.attrs));
  return (
    <Shell>
      <p className="text-sm font-semibold tracking-widest text-gold">END OF THE ROAD</p>
      <h1 className="font-display text-4xl">{career.player.name}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Retired at {career.player.age}. {career.totals.seasons} seasons, {career.totals.goals} goals, {career.trophies.length} trophies. Peak overall: {peak}.
      </p>
      <div className="mt-4 grid gap-2">
        {career.trophies.length ? (
          career.trophies.map((trophy) => (
            <div key={trophy.id} className="panel px-3 py-3 text-sm font-bold">
              {trophy.name}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">No trophy in the cabinet, but a full career.</p>
        )}
      </div>
      <button type="button" className="btn-gold mt-5 h-14 w-full" onClick={onNew}>
        New career
      </button>
      <button type="button" className="btn-ghost mt-2 h-12 w-full" onClick={onHome}>
        Menu
      </button>
    </Shell>
  );
}
