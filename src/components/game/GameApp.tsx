import { PRIVACY_EMAIL } from "@/game/contact";
import { Fragment, useContext, useEffect, useMemo, useRef, useState, createContext, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Check,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Dumbbell,
  Flame,
  House,
  Footprints,
  Medal,
  Play,
  RotateCcw,
  Shield,
  ShoppingBag,
  Target,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  Zap,
  Paintbrush,
} from "lucide-react";
import { Crest } from "@/components/game/crest";
import { STAR_THEME, clubTheme, keepHyphens, type ClubTheme } from "@/components/game/kit";
import { HAIR_COLOR_IDS, HAIR_COLORS, HAIR_STYLES, SKIN_TONES, resolveLook, type HairColor, type HairStyle } from "@/game/look";

/** The two clubs' colours meeting along the top of the score box. */
function ScoreFields({ left, right }: { left: string; right: string }) {
  const colour = (name: string) => {
    const club = CLUBS.find((c) => c.name === name);
    return club ? clubTheme(club.id).club : "var(--color-surface-2)";
  };
  return (
    <span className="scorebox-fields" aria-hidden="true" dir="ltr">
      <i style={{ background: colour(left) }} />
      <i style={{ background: colour(right) }} />
    </span>
  );
}

function NameCrest({ name, className = "mx-auto mb-1 block h-10 w-10" }: { name: string; className?: string }) {
  const club = CLUBS.find((c) => c.name === name);
  return club ? <Crest clubId={club.id} name={club.name} className={className} /> : null;
}
import { playGoal, playWhistle, setAudioEnabled, unlockAudio } from "@/game/audio";
import { CLUBS, COUNTRIES, LEAGUES, NATIONS, POSITIONS, entryLeague, getClub, getCountry, getLeague, nationById } from "@/game/data";
import {
  acceptOffer,
  afterReport,
  answerBreak,
  answerCamp,
  careerAim,
  commitSeason,
  composeReport,
  createCareer,
  createDailyCareer,
  dailyBoard,
  farewellAge,
  finishBigMatch,
  money,
  nextFixture,
  openSeason,
  overall,
  playStep,
  playSummer,
  potentialLabel,
  previewPlayer,
  primaryKeys,
  resolveMoment,
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
import { loadCareer, loadDailyAttempt, loadSound, saveCareer, saveDailyAttempt, saveSound, touchStreak, type DailyAttempt } from "@/game/save";
import { loadLang, setLang, show, t, type Lang } from "@/game/i18n";
import { authEnabled } from "@/lib/auth/client";
import { STORIES, answerStory, storyAttr } from "@/game/stories";
import { ACHIEVEMENTS, checkAchievements, loadUnlocked } from "@/game/achievements";
import { adsEnabled, adsSuppressed, initAds, setAdsSuppressed, showInterstitial, showRewarded } from "@/game/ads";
import {
  CATALOG,
  COSMETIC_IDS,
  ECONOMY,
  HALFTIME_INTERSTITIAL,
  canBuy,
  canShowSeasonInterstitial,
  countInterstitial,
  formatCoins,
  grantDiscount,
  grantDoubleCoins,
  earnSeasonCoins,
  grantFreeCamp,
  itemPrice,
  rewardAvailable,
  buy,
  type StoreItemId,
} from "@/game/economy";
import { chestToday, countryOpen, loadDevice, markChest, ownCosmetic, settleRetirement, unlockCountry, withDeviceCosmetics } from "@/game/legacy";
import { GEAR_SLOTS, GEAR_TIERS, buyGear, canBuyGear, dailyGearOffer, gearBonus, gearPrice, grantGearOfferAd, grantTryGold, slotFor, slotTier, tierInfo } from "@/game/gear";
import { attemptBigTrial, boostBigTrial, effectiveAttrs, isTopLeague, keyFixtureIds, leagueOf, retryMoment } from "@/game/engine";
import { getIsAdmin, getViewerAccess, type ViewerAccess } from "@/lib/access";
import { PERKS, adminGrant, adminUnlockAll, applyPerks, buyPerk, canDouble, doubleLegacy, loadLegacy, payLegacy, perkState, type Legacy, type PerkId } from "@/game/legacy";
import { ATTR_KEYS, type AttrKey, type Career, type Difficulty, type GearTierId, type MatchLog, type MatchReport, type Role } from "@/game/types";

type View = "boot" | "home" | "create" | "game" | "collection" | "summary" | "daily" | "privacy" | "legacy" | "admin" | "achievements";

const LangContext = createContext<Lang>("en");
/** Admin (decided on the server): everything open, no interstitials, rewards without a clip. */
const AdminContext = createContext(false);
/** Applies a change to the CURRENT run (functional), for rewards that land after an ad closes. */
const ApplyContext = createContext<(fn: (c: Career) => Career) => void>(() => {});

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
  /** The loading screen stays at least LOADING_MIN_MS; it never waits on anything else (and never shows ads). */
  const [minShown, setMinShown] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setMinShown(true), LOADING_MIN_MS);
    return () => window.clearTimeout(timer);
  }, []);
  const [career, setCareer] = useState<Career | null>(null);
  const [daily, setDaily] = useState<DailyAttempt | null>(null);
  const [playing, setPlaying] = useState<"main" | "daily">("main");
  const [view, setView] = useState<View>("home");
  const [streak, setStreak] = useState(1);
  const [sound, setSound] = useState(true);
  // Starts as "en" to match the server render (no hydration mismatch); the saved language is applied right after
  // hydration, while the loading screen keeps its text hidden (see LoadingScreen `ready`).
  const [lang, setLangState] = useState<Lang>("en");
  const [access, setAccess] = useState<ViewerAccess | null>(null);
  const [toasts, setToasts] = useState<string[]>([]);
  const [admin, setAdmin] = useState(false);
  const [storeOpen, setStoreOpen] = useState<boolean | "player">(false);
  /** Set while the season-end interstitial is running, so a second tap cannot replay an old state. */
  const summerLock = useRef(false);

  useEffect(() => {
    if (!toasts.length) return;
    const id = window.setTimeout(() => setToasts((list) => list.slice(1)), 3400);
    return () => window.clearTimeout(id);
  }, [toasts]);

  useEffect(() => {
    if (!authEnabled) return;
    getIsAdmin()
      .then((res) => {
        setAdmin(res.isAdmin);
        setAdsSuppressed(res.isAdmin);
      })
      .catch(() => setAdmin(false));
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
    initAds();
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

  /** Functional update on whichever run is active, so ad rewards never restore a stale snapshot. */
  function apply(fn: (c: Career) => Career) {
    if (playing === "daily") {
      setDaily((prev) => {
        if (!prev?.career) return prev;
        const attempt: DailyAttempt = { ...prev, career: fn(prev.career) };
        saveDailyAttempt(attempt);
        return attempt;
      });
      return;
    }
    setCareer((prev) => (prev ? fn(prev) : prev));
  }

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
    if (next) {
      const fresh = checkAchievements(next);
      if (fresh.length) setToasts((list) => [...list, ...fresh]);
    }
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
  const themeClub = (view === "game" ? run : career)?.clubId ?? null;

  // The whole game wears the player's current club colours; a transfer repaints it.
  useEffect(() => {
    applyTheme(themeClub ? clubTheme(themeClub) : STAR_THEME);
  }, [themeClub]);

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
        onAchievements={() => setView("achievements")}
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
        admin={admin}
        onBack={() => setView("home")}
        onStart={(name, position, countryId, nationId, salt, difficulty) => {
          setPlaying("main");
          unlockAudio();
          const fresh = withDeviceCosmetics(applyPerks(createCareer(name, position, countryId, salt, difficulty, nationId), loadLegacy().perks));
          setCareer(fresh); // coins are per career and start from zero
          setView("game");
        }}
      />
    );
  } else if (view === "collection") {
    screen = (
      <Collection
        career={career}
        onBack={() => setView("home")}
        onPlay={() => {
          if (!career) return setView("create");
          setPlaying("main");
          unlockAudio();
          setView("game");
        }}
      />
    );
  }
  else if (view === "summary") screen = <Summary career={career} onBack={() => setView("home")} />;
  else if (view === "daily") {
    screen = <DailyLobby attempt={daily} onBack={() => setView("home")} onBegin={beginDaily} />;
  } else if (view === "privacy") screen = <Privacy onBack={() => setView("home")} />;
  else if (view === "legacy") screen = <LegacyScreen onBack={() => setView("home")} />;
  else if (view === "achievements") screen = <AchievementsScreen onBack={() => setView("home")} />;
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
  else if (storeOpen && playing === "main" && run.screen !== "bigmatch" && run.screen !== "match") {
    screen =
      storeOpen === "player" ? (
        <MyPlayerScreen career={run} onChange={update} onBack={() => setStoreOpen(true)} onStore={() => setStoreOpen(true)} />
      ) : (
        <StoreScreen career={run} onChange={update} onBack={() => setStoreOpen(false)} onPlayer={() => setStoreOpen("player")} />
      );
  } else if (run.screen === "camp" || run.screen === "break") {
    screen = <TrainingScreen career={run} onChange={update} onMenu={menu} />;
  } else if (run.screen === "bigmatch" && run.pending) {
    screen = <BigMatchScreen career={run} onChange={update} onMenu={menu} />;
  } else if (run.screen === "match" && run.activeReport) {
    screen = <MatchScreen career={run} onReport={() => update({ ...run, screen: "report" })} onMenu={menu} />;
  } else if (run.screen === "report" && run.activeReport) {
    screen = (
      <ReportScreen
        career={run}
        report={run.activeReport}
        onNext={() => update(afterReport(run))}
        onMenu={menu}
        extra={playing === "main" ? <DoubleCoins career={run} onChange={update} /> : null}
      />
    );
  } else if (run.screen === "season") {
    const wonRace = playing === "daily" && !!run.growthPreview?.ballonYours;
    screen = (
      <SeasonScreen
        career={run}
        claimRace={wonRace}
        onStore={playing === "main" ? () => setStoreOpen(true) : undefined}
        onSummer={() => {
          if (wonRace) return finishDaily(run);
          if (playing === "daily" || admin || !canShowSeasonInterstitial(run)) return update(startSummer(run));
          if (summerLock.current) return;
          summerLock.current = true;
          let counted = run;
          showInterstitial(
            "season-end",
            () => {
              // Idempotent: only move on if the career is still on this season screen.
              setCareer((current) => {
                summerLock.current = false;
                if (!current || current.screen !== "season" || current.year !== counted.year) return current;
                return startSummer(counted);
              });
            },
            () => {
              counted = countInterstitial(run);
            },
          );
        }}
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
        onBoost={(key) => update(rewardedBoost({ ...run, adState: { ...run.adState, boostTaken: true } }, key))}
        onChange={update}
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
  } else screen = <RunScreen career={run} onChange={update} onMenu={menu} onStore={playing === "main" ? () => setStoreOpen(true) : undefined} />;

  const signals = useMemo(() => storeSignals(playing === "main" ? career : null, admin), [career, playing, admin]);
  const [storeSeen, setStoreSeen] = useState<string[]>([]);
  useEffect(() => setStoreSeen(loadStoreSeen()), []);
  const storeIsOpen = view === "game" && storeOpen === true && playing === "main";
  useEffect(() => {
    // Opening the store marks everything available now as seen; the dot returns only for something new.
    if (!storeIsOpen || !signals.length) return;
    setStoreSeen((seen) => {
      const merged = Array.from(new Set([...signals, ...seen]));
      if (merged.length === seen.length) return seen;
      saveStoreSeen(merged);
      return merged;
    });
  }, [storeIsOpen, signals]);
  const inMatch = view === "game" && !!run && (run.screen === "match" || run.screen === "bigmatch");
  const showNav = booted && minShown && !inMatch && ["home", "game", "collection", "summary", "achievements"].includes(view);
  const storeDot = booted && playing === "main" && !inMatch && !storeIsOpen && signals.some((key) => !storeSeen.includes(key));
  const navActive: NavTab | null =
    view === "home"
      ? "home"
      : view === "collection" || view === "achievements"
        ? "trophies"
        : view === "game"
          ? storeOpen === "player" && playing === "main"
            ? "player"
            : storeOpen === true && playing === "main"
              ? "store"
              : "season"
          : null;

  return (
    <LangContext.Provider value={lang}>
      <ApplyContext.Provider value={apply}>
      <AdminContext.Provider value={admin}>
        <div className={showNav ? "has-bottom-nav" : undefined}>
        {screen}
        {showNav ? (
          <BottomNav
            active={navActive}
            hasCareer={!!career && playing === "main"}
            storeDot={storeDot}
            onTab={(tab) => {
              if (tab === "home") {
                setStoreOpen(false);
                return menu();
              }
              if (tab === "trophies") {
                setStoreOpen(false);
                setPlaying("main");
                return setView("collection");
              }
              if (!career) return;
              setPlaying("main");
              unlockAudio();
              setView("game");
              setStoreOpen(tab === "player" ? "player" : tab === "store");
            }}
          />
        ) : null}
        {toasts.length ? <AchievementToast id={toasts[0]} /> : null}
        </div>
        {!booted || !minShown ? <LoadingScreen ready={booted} /> : null}
      </AdminContext.Provider>
    </ApplyContext.Provider>
    </LangContext.Provider>
  );
}

type NavTab = "home" | "player" | "store" | "season" | "trophies";
const NAV_TABS: { id: NavTab; Icon: typeof Trophy }[] = [
  { id: "home", Icon: House },
  { id: "player", Icon: UserRound },
  { id: "store", Icon: ShoppingBag },
  { id: "season", Icon: CalendarDays },
  { id: "trophies", Icon: Trophy },
];

/** Icon from /public/nav/{id}.svg (swappable art), falling back to a built-in icon if the file is missing. */
function NavIcon({ id, Icon }: { id: NavTab; Icon: typeof Trophy }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    // A CSS mask fails silently, so probe the file once and fall back to the built-in icon if it is missing.
    const probe = new Image();
    probe.onerror = () => setFailed(true);
    probe.src = `/nav/${id}.svg`;
  }, [id]);
  if (failed) return <Icon aria-hidden="true" />;
  // Masked span painted with currentColor, so the tab colour (active/inactive) applies to the art.
  return <span className="nav-icon" aria-hidden="true" style={{ WebkitMaskImage: `url(/nav/${id}.svg)`, maskImage: `url(/nav/${id}.svg)` }} />;
}

/** Bottom tab bar. DOM order Home→Trophies; in RTL the grid mirrors, so Home sits on the right. */
const STORE_SEEN_KEY = "star-store-seen";

/** Keys for everything the store could offer right now: affordable items/upgrades, today's chest, today's gear offer. */
function storeSignals(career: Career | null, admin: boolean): string[] {
  if (!career || career.race) return [];
  const today = todayKey();
  const top = gearTopLeague(career);
  const keys: string[] = [];
  for (const item of CATALOG) if (canBuy(career, item.id, today, admin) === "ok") keys.push(`item:${item.id}`);
  for (const slot of GEAR_SLOTS) {
    const tier = slotTier(career, slot.id);
    const next = tier ? GEAR_TIERS[GEAR_TIERS.indexOf(tier) + 1] : "bronze";
    if (next && canBuyGear(career, slot.id, next, today, top, admin) === "ok") keys.push(`gear:${slot.id}:${next}`);
  }
  if (chestToday(today)) keys.push(`chest:${today}`);
  const offer = dailyGearOffer(career, today, top); // null while the offer flag is off
  if (offer && career.adState.gearOfferBoughtDate !== today) keys.push(`offer:${today}:${offer.slot}:${offer.tier}`);
  return keys;
}

function loadStoreSeen(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_SEEN_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveStoreSeen(keys: string[]) {
  try {
    localStorage.setItem(STORE_SEEN_KEY, JSON.stringify(keys.slice(0, 200)));
  } catch {
    /* private mode */
  }
}

function BottomNav({ active, hasCareer, storeDot, onTab }: { active: NavTab | null; hasCareer: boolean; storeDot: boolean; onTab: (tab: NavTab) => void }) {
  const { tr } = useTx();
  return (
    <nav className="bottom-nav" aria-label={tr("nav.label")} data-no-ads>
      {NAV_TABS.map(({ id, Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={active === id ? "page" : undefined}
          className={id === "store" ? "nav-store" : undefined}
          disabled={id !== "home" && id !== "trophies" && !hasCareer}
          onClick={() => onTab(id)}
        >
          <span className="nav-icon-wrap">
            <NavIcon id={id} Icon={Icon} />
            {id === "store" && storeDot ? <span className="nav-dot" data-store-dot aria-label={tr("nav.storeNew")} /> : null}
          </span>
          <span>{tr(`nav.${id}`)}</span>
        </button>
      ))}
    </nav>
  );
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
        <h1 dir="auto" className="line-clamp-2 text-start text-[1.05rem] font-bold leading-tight">{title}</h1>
        {sub ? <p dir="auto" className="line-clamp-2 text-start text-xs text-muted">{sub}</p> : null}
      </div>
      {right ?? null}
    </header>
  );
}

const LOADING_MIN_MS = 600;
const LOADING_TIPS = 5;

/** Boot screen over the app while it hydrates. Ads may load in the background; none is ever shown here. */
function LoadingScreen({ ready }: { ready: boolean }) {
  const { tr } = useTx();
  const [tip, setTip] = useState(0);
  useEffect(() => {
    setTip(Math.floor(Math.random() * LOADING_TIPS));
  }, []);
  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-label={tr("loading")} data-no-ads>
      <img className="loading-bg" src="/loading-bg.webp" alt="" width={576} height={1024} decoding="async" fetchPriority="high" />
      <div className="loading-top">
        <h1 className="loading-logo">STAR</h1>
        <p className="loading-sub" style={ready ? undefined : { visibility: "hidden" }}>{tr("loadingSub")}</p>
      </div>
      <div className="loading-bottom">
        <p className="loading-tip" style={ready ? undefined : { visibility: "hidden" }}>
          {tr(`loadTip.${tip + 1}`)}
        </p>
        <div className="loading-bar" aria-hidden="true">
          <span className="loading-fill" />
          <span className="loading-star">★</span>
        </div>
      </div>
    </div>
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

function applyTheme(theme: ClubTheme) {
  const root = document.documentElement.style;
  root.setProperty("--club", theme.club);
  root.setProperty("--club-2", theme.club2);
  root.setProperty("--club-ink", theme.ink);
  root.setProperty("--club-text", theme.text);
}

/** Inline style that paints a block in another club's colours (offers, opponents). */
function clubVars(clubId: string, prefix = "offer") {
  const theme = clubTheme(clubId);
  return { [`--${prefix}-club`]: theme.club, [`--${prefix}-ink`]: theme.ink, [`--${prefix}-text`]: theme.text } as CSSProperties;
}

/**
 * The club's announcement graphic for the player: the hero of home, the hub and the summary.
 * The shirt number and the player share the end side; the player is cropped by the 8° cut.
 * The name keeps the start side so it begins at the reading edge in Hebrew and in Latin scripts.
 */
function SigningHero({ career, children }: { career: Career; children?: ReactNode }) {
  const { tr } = useTx();
  const player = career.player;
  const club = getClub(career.clubId);
  const league = getLeague(career.season.leagueId);
  const ovr = overall(player.position, effectiveAttrs(career));
  const parts = player.name.trim().split(/\s+/);
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const last = parts[parts.length - 1] ?? player.name;
  return (
    <section className="hero" aria-label={player.name}>
      <span className="hero-stripe" aria-hidden="true" />
      <div className="hero-field">
        <span className="hero-number" data-digits={String(shirtNumber(player.position)).length} aria-hidden="true">
          {shirtNumber(player.position)}
        </span>
        <div className="hero-figure" aria-hidden="true">
          <PlayerCharacter career={career} />
        </div>
        <div className="hero-copy">
          <Crest clubId={club.id} name={club.name} className="h-11 w-11 shrink-0" />
          <h1 className="hero-name">
            {first ? (
              <>
                <span className="block text-[0.62em] leading-none opacity-85">{first}</span>
                {last}
              </>
            ) : (
              last
            )}
          </h1>
          <p className="hero-meta">
            <bdi className="hero-club">{keepHyphens(club.name)}</bdi>
            <bdi className="block">{league.name}</bdi>
            <span className="block">
              {tr(`pos.${player.position}`)} · #{shirtNumber(player.position)} · {tr("ageN", { n: player.age })}
            </span>
          </p>
          <div className="flex items-end gap-3">
            <span className="hero-ovr">
              <b className="num">{ovr}</b>
              <span>OVR</span>
            </span>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlayerHeader({ career }: { career: Career }) {
  const { tr } = useTx();
  const player = career.player;
  const ovr = overall(player.position, player.attrs);
  return (
    <>
      <SigningHero career={career} />
      <section className="card mt-3 overflow-hidden">
        <div className="grid grid-cols-2">
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
    </>
  );
}

function leagueCount(career: Career) {
  const total = career.season.fixtures.filter((item) => item.competition === "league").length;
  const played = career.season.fixturesPlayed.filter((item) => item.competition === "league").length;
  return { played, total };
}

/**
 * Season strip under the hero: matchday on the start side, the board target and league place on the end side.
 * The hub's top bar already names the season, so it passes withYear={false}.
 */
function SeasonProgress({ career, withYear = true }: { career: Career; withYear?: boolean }) {
  const { tr, text } = useTx();
  const { played, total } = leagueCount(career);
  const place = tablePosition(career);
  const onTrack = place <= career.season.targetLine;
  return (
    <div className="season-strip">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted">
          {withYear ? `${seasonLabel(career.year)} · ` : ""}
          {tr("matchday", { n: played, m: total })}
        </span>
        <span className={`text-end font-bold ${played ? (onTrack ? "text-good" : "text-bad") : "text-muted"}`}>
          {text(career.season.targetLabel)}
          {played ? <> · {tr("placeN", { n: place })}</> : null}
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
        <h2 className="section-title">{tr("table")}</h2>
        {compact && rows.length > 7 ? (
          <button type="button" className="min-h-12 text-sm font-bold text-accent" onClick={() => setFull((value) => !value)}>
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
              <span className="flex min-w-0 items-center gap-1.5"><Crest clubId={row.clubId} name={getClub(row.clubId).name} monogram={false} className="h-5 w-5 shrink-0" /><span className="truncate">{getClub(row.clubId).name}</span></span>
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
  const [pick, setPick] = useState(false);
  const used = career.adState.boostTaken;
  return (
    <div className="mt-4 grid gap-2">
      {used ? (
        <p className="text-xs text-muted">{tr("adRewardDone")}</p>
      ) : pick ? (
        // The clip was already chosen with the gold button; the six attributes are plain choices.
        <div className="grid grid-cols-2 gap-2">
          {ATTR_KEYS.map((key) => (
            <RewardButton key={key} name="attribute-boost" className="reward-quiet h-12 text-sm" label={tr(`attr.${key}`)} onReward={() => onBoost(key)} />
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
        <p>{tr("privacyAdsData")}</p>
        <p>{tr("privacyContact", { email: PRIVACY_EMAIL })}</p>
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
    <select className="lang-select" aria-label={tr("kicker")} value={lang} onChange={(e) => onLang(e.target.value as Lang)}>
      {langs.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </select>
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
  onAchievements,
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
  onAchievements: () => void;
  access: ViewerAccess | null;
  onAdmin: () => void;
  onNew: () => void;
  dailyBest: number | null;
  streak: number;
}) {
  const { tr } = useTx();
  const [confirm, setConfirm] = useState(false);
  const [legacyPts, setLegacyPts] = useState(0);
  const [achCount, setAchCount] = useState(0);
  useEffect(() => {
    setLegacyPts(loadLegacy().points);
    setAchCount(Object.keys(loadUnlocked()).filter((id) => ACHIEVEMENTS.some((item) => item.id === id)).length);
  }, []);
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
          <SigningHero career={career} />
          <SeasonProgress career={career} />
        </>
      ) : (
        <section className="grid gap-3">
          <div className="hero">
            <span className="hero-stripe" aria-hidden="true" />
            <div className="hero-field hero-intro">
              <span className="hero-number" aria-hidden="true">
                16
              </span>
              <h1 className="hero-name relative max-w-[85%]">
                {tr("title1")}
                <span className="mt-1 block">{tr("title2")}</span>
              </h1>
            </div>
          </div>
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

      <button type="button" className="btn-primary mt-4 flex h-14 w-full items-center justify-center gap-2" onClick={career ? onContinue : onCreate}>
        {career ? tr("continue") : tr("start")}
        <Play className="size-4 rtl:-scale-x-100" />
      </button>

      <nav className="list ledger mt-5" aria-label={tr("menu")}>
        <button type="button" className="list-row" onClick={onDaily}>
          <span className="list-icon text-trophy">
            <Medal className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="ledger-label block truncate">{tr("dailyTitle")}</span>
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
          <span className="ledger-label flex-1">{tr("trophies")}</span>
          <span className="num text-muted">{career ? career.trophies.length : 0}</span>
          <ChevronLeft className="size-4 -scale-x-100 text-muted rtl:scale-x-100" />
        </button>
        <button type="button" className="list-row" onClick={onAchievements}>
          <span className="list-icon">
            <Medal className="size-5" />
          </span>
          <span className="ledger-label flex-1">{tr("achievements")}</span>
          <span className="num text-muted">
            {achCount}/{ACHIEVEMENTS.length}
          </span>
        </button>
        <button type="button" className="list-row" onClick={onSummary}>
          <span className="list-icon">
            <Play className="size-5" />
          </span>
          <span className="ledger-label min-w-0 flex-1 truncate">{career ? tr("seasonOf", { name: career.player.name }) : tr("season")}</span>
          <ChevronLeft className="size-4 -scale-x-100 text-muted rtl:scale-x-100" />
        </button>
        <button type="button" className="list-row" onClick={onLegacy}>
          <span className="list-icon">
            <Shield className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="ledger-label block">{tr("legacy")}</span>
            <span className="block text-xs leading-snug text-muted">{tr("legacyShort")}</span>
          </span>
          <span className="num font-semibold text-trophy">{legacyPts}</span>
        </button>
        {access?.admin ? (
          <button type="button" className="list-row" onClick={onAdmin}>
            <span className="list-icon">
              <Shield className="size-5" />
            </span>
            <span className="ledger-label flex-1">{tr("admin.open")}</span>
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
          <a href="/login" className="flex min-h-12 items-center text-muted underline-offset-4 hover:underline">
            {access?.signedIn ? tr("acct.signedInShort", { email: access.email ?? "" }) : tr("acct.cta")}
          </a>
        ) : null}
        {career ? (
          confirm ? (
            <div className="card px-4 py-3">
              <p>{tr("resetAsk", { name: career.player.name })}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" className="btn-ghost h-12" onClick={() => setConfirm(false)}>
                  {tr("cancel")}
                </button>
                <button type="button" className="btn-danger h-12" onClick={onNew}>
                  {tr("newCareer")}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="flex min-h-12 items-center text-start text-muted" onClick={() => setConfirm(true)}>
              {tr("reset")}
            </button>
          )
        ) : null}
        <button type="button" className="flex min-h-12 items-center text-start text-muted" onClick={onPrivacy}>
          {tr("privacy")}
        </button>
      </div>
    </Shell>
  );
}

function Create({
  admin,
  onBack,
  onStart,
}: {
  admin: boolean;
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
  const [device] = useState(() => loadDevice());

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

      <h2 className="section-title mt-6">{tr("startCountry")}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {COUNTRIES.map((item) => {
          const selected = countryId === item.id;
          const open = countryOpen(device, item.id, admin);
          return (
            <button
              key={item.id}
              type="button"
              disabled={!open}
              aria-disabled={!open}
              onClick={() => {
                if (!open) return;
                setCountryId(item.id);
                setNationId((current) => current ?? item.id);
              }}
              className={`min-h-12 rounded-md border px-3 py-3 text-start ${selected ? "border-accent bg-surface-2" : "border-line bg-surface"} ${open ? "" : "opacity-60"}`}
            >
              <span className="block font-semibold">{tr(`country.${item.id}`)}</span>
              <span className="mt-1 block text-xs text-muted">{open ? entryLeague(item.id).name : tr("eco.lockedCountry", { n: formatCoins(ECONOMY.prices["unlock-country"]) })}</span>
            </button>
          );
        })}
      </div>

      <h2 className="section-title mt-6">{tr("nation")}</h2>
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
        <h2 className="section-title">{tr("position")}</h2>
        <button type="button" className="flex min-h-12 items-center gap-1 text-sm text-accent" onClick={() => setSalt((value) => value + 1)}>
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

      <h2 className="section-title mt-6">{tr("difficulty")}</h2>
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
  if (!rewardAvailable(career, "injury-return", todayKey())) return null;
  // Is a key match among the games the injury would cost?
  const keys = keyFixtureIds(career.season, career.clubId);
  const missesKey = career.season.fixtures.slice(career.season.cursor, career.season.cursor + career.season.outFor).some((item) => keys.includes(item.id));
  return (
    <RewardButton
      name="injury-return"
      className="reward-quiet mt-3 h-12 w-full px-3 text-sm"
      label={missesKey ? tr("eco.healKey") : tr("healClip", { n: career.season.outFor })}
      onReward={() => onChange({ ...career, season: { ...career.season, outFor: 0 }, adState: { ...career.adState, healTaken: true } })}
    />
  );
}

function RunScreen({ career, onChange, onMenu, onStore }: { career: Career; onChange: (c: Career) => void; onMenu: () => void; onStore?: () => void }) {
  const [paused, setPaused] = useState(() => Boolean(career.lastTrain));
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const league = getLeague(career.season.leagueId);
  const latest = career.season.fixturesPlayed[career.season.fixturesPlayed.length - 1];
  const log = career.season.fixturesPlayed.slice(-6).reverse();
  const { tr, text } = useTx();

  useEffect(() => {
    if (paused || career.screen !== "run" || career.story) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setTimeout(() => onChange(playStep(career)), 460 / speed);
    return () => window.clearTimeout(id);
  }, [career, paused, onChange, speed]);

  return (
    <Shell>
      {/* The hero carries club and league, so the bar names the season: short, one line beside the skip button. */}
      <ScreenHeader
        title={`${tr("season")} ${seasonLabel(career.year)}`}
        onBack={onMenu}
        right={
          <button
            type="button"
            className="btn-ghost flex h-12 min-w-12 shrink-0 items-center justify-center gap-1.5 px-3 text-sm"
            aria-label={career.season.breakDone ? tr("skipEnd") : tr("skipBreak")}
            onClick={() => {
              unlockAudio();
              playWhistle();
              onChange(runToStop(career));
            }}
          >
            <span className="max-[380px]:sr-only">{career.season.breakDone ? tr("skipEnd") : tr("skipBreak")}</span>
            <Play className="size-3.5 rtl:-scale-x-100" />
          </button>
        }
      />

      <SigningHero career={career}>
        {career.race ? <span className="chip chip-trophy">{tr("raceTag")}</span> : null}
      </SigningHero>
      <SeasonProgress career={career} withYear={false} />
      <section className="scorebox mt-3 px-4 py-3.5">
        <p className="goal-strip mt-0">{tr(`aim.${careerAim(career)}`)}</p>
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

      {onStore && !career.race && career.activeReport && career.coinsFixtureId === career.activeReport.fixtureId ? <DoubleCoins career={career} onChange={onChange} /> : null}
      {onStore && !career.race ? <EconomyBar career={career} onChange={onChange} onStore={onStore} /> : null}

      <div className="card mt-3 flex items-center gap-3 px-3 py-3">
        <span className="shrink-0 text-xs font-bold text-muted">{tr("formLast")}</span>
        <div className="min-w-0 flex-1">
          <RateTiles logs={career.season.fixturesPlayed} />
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

      {career.story ? <StoryCard career={career} onChange={onChange} /> : null}

      {career.season.outFor > 0 && !career.race ? <HealClip career={career} onChange={onChange} /> : null}

      <div className="seg seg-grow mt-3" role="group" aria-label={tr("speed")}>
        {([1, 2, 4] as const).map((value) => (
          <button key={value} type="button" aria-pressed={speed === value} onClick={() => setSpeed(value)}>
            x{value}
          </button>
        ))}
      </div>

      {/* Paused, resuming is the one thing to do here, so it takes the white action. */}
      <button type="button" className={`${paused ? "btn-primary" : "btn-ghost"} mt-3 h-12 w-full`} onClick={() => setPaused((value) => !value)}>
        {paused ? tr("resume") : tr("pause")}
      </button>

      <section className="mt-4">
        <h2 className="section-title mb-2">{tr("results")}</h2>
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
      {career.premiumCamp ? <p className="mt-2 text-sm font-semibold text-accent">{tr("eco.premiumPick")}</p> : null}
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

function effectLines(career: Career, choice: "a" | "b", storyId: string, tr: (key: string, vars?: Record<string, string | number>) => string) {
  const story = STORIES.find((item) => item.id === storyId);
  if (!story) return [];
  const effect = story[choice];
  // LTR isolate so "+3" never flips to "3+" inside Hebrew text.
  const sign = (n: number) => `\u2066${n > 0 ? `+${n}` : String(n)}\u2069`;
  const lines: { text: string; good: boolean }[] = [];
  if (effect.attrDelta) lines.push({ text: `${tr(`attr.${storyAttr(career, effect)}`)} ${sign(effect.attrDelta)}`, good: effect.attrDelta > 0 });
  for (const key of ["morale", "form", "fitness", "reputation"] as const) {
    const value = effect[key];
    if (value) lines.push({ text: tr(`eff.${key}`, { n: sign(value) }), good: value > 0 });
  }
  return lines;
}

function StoryCard({ career, onChange }: { career: Career; onChange: (c: Career) => void }) {
  const { tr } = useTx();
  const id = career.story?.id;
  if (!id) return null;
  return (
    <section className="card mt-3 overflow-hidden" aria-live="polite">
      <h2 className="px-4 pt-3.5 pb-3 font-semibold leading-snug">{tr(`story.${id}.q`)}</h2>
      <div className="grid grid-cols-2 border-t border-line">
        {(["a", "b"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            className={`grid content-start gap-1.5 px-4 py-3 text-start hover:bg-surface-2 ${choice === "b" ? "border-s border-line" : ""}`}
            onClick={() => onChange(answerStory(career, choice))}
          >
            <span className="font-semibold">{tr(`story.${id}.${choice}`)}</span>
            <span className="flex flex-wrap gap-1">
              {effectLines(career, choice, id, tr).map((line) => (
                <span key={line.text} className={`chip ${line.good ? "chip-good" : "chip-bad"}`}>
                  {line.text}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function BigMatchScreen({ career, onChange, onMenu }: { career: Career; onChange: (c: Career) => void; onMenu: () => void }) {
  const { tr, text } = useTx();
  const admin = useContext(AdminContext);
  const pending = career.pending!;
  const [reveal, setReveal] = useState<number | null>(null);
  const report = composeReport(pending);
  const active = pending.moments.findIndex((moment) => !moment.picked);
  const focus = reveal ?? (active >= 0 ? active : null);
  const focusMoment = focus !== null ? pending.moments[focus] : null;
  const minute = focusMoment ? focusMoment.minute : 90;
  const shown = report.events.filter((event) => (focusMoment ? event.minute < minute || (reveal !== null && event.minute === minute) : true));
  const current = shown[shown.length - 1];
  const ours = getClub(career.clubId).name;
  const theirs = text(pending.base.opponentName);
  const left = pending.base.home ? ours : theirs;
  const right = pending.base.home ? theirs : ours;
  const us = current?.us ?? 0;
  const them = current?.them ?? 0;
  const leftGoals = pending.base.home ? us : them;
  const rightGoals = pending.base.home ? them : us;
  const done = active < 0 && reveal === null;

  useEffect(() => {
    playWhistle();
  }, []);

  function choose(index: number, optionId: string) {
    const next = resolveMoment(career, index, optionId);
    const moment = next.pending?.moments[index];
    const option = moment?.options.find((item) => item.id === optionId);
    if (moment?.success && option && option.reward !== "stop") playGoal();
    setReveal(index);
    const following = pending.moments[index + 1];
    // Halftime slot: off behind HALFTIME_INTERSTITIAL until the owner approves it.
    if (HALFTIME_INTERSTITIAL && !admin && !career.race && following && pending.moments[index].minute <= 45 && following.minute > 45 && !career.adState.halftimeShownFixtureIds.includes(pending.base.fixtureId) && canShowSeasonInterstitial(career)) {
      const marked = { ...countInterstitial(next), adState: { ...countInterstitial(next).adState, halftimeShownFixtureIds: [...next.adState.halftimeShownFixtureIds, pending.base.fixtureId] } };
      showInterstitial("keymatch-half", () => onChange(marked));
      return;
    }
    onChange(next);
  }

  return (
    <Shell>
      <ScreenHeader
        title={text(pending.base.roundLabel)}
        sub={tr("mo.big")}
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

      <div className="scorebox px-4 pt-5 pb-3">
        <ScoreFields left={left} right={right} />
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-center" dir="ltr">
          <span className={`team-name ${left === ours ? "text-accent-2" : ""}`} dir="auto">
            <NameCrest name={left} />
            {keepHyphens(left)}
          </span>
          <span className="score-big">
            {leftGoals}
            <span className="px-2 text-accent">:</span>
            {rightGoals}
          </span>
          <span className={`team-name ${right === ours ? "text-accent-2" : ""}`} dir="auto">
            <NameCrest name={right} />
            {keepHyphens(right)}
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

      {focusMoment && focus !== null ? (
        <section className="card moment-card mt-3 overflow-hidden" aria-live="polite" aria-label={tr("mo.title")}>
          <h2 className="moment-head">{tr(focusMoment.situation ? `mo.sit.${focusMoment.situation}` : `mo.${focusMoment.kind}`, { min: focusMoment.minute })}</h2>
          {focusMoment.picked ? (
            <div className="grid gap-3 border-t border-line px-4 py-3.5">
              <p className={`text-lg font-bold ${focusMoment.success ? "text-good" : "text-bad"}`}>{focusMoment.success ? tr("mo.yes") : tr("mo.no")}</p>
              <p className="text-sm">
                {text(
                  report.events.find((event) => event.minute === focusMoment.minute && event.text.startsWith("@mo."))?.text ?? "",
                )}
              </p>
              <button
                type="button"
                className="btn-primary h-12 w-full"
                onClick={() => (active < 0 ? onChange(finishBigMatch(career)) : setReveal(null))}
              >
                {active < 0 ? tr("mo.finish") : tr("mo.next")}
              </button>
              {focusMoment.success === false && focus !== null && rewardAvailable(career, "retry-moment", todayKey(), pending.base.fixtureId) ? (
                <RewardButton name="retry-moment" className="btn-ghost h-12 w-full text-sm" label={tr("eco.retry")} onReward={() => onChange(retryMoment(career, focus))} />
              ) : null}
            </div>
          ) : (
            <div className="list rounded-none border-x-0 border-b-0">
              {focusMoment.options.map((option) => (
                <button key={option.id} type="button" className="list-row" onClick={() => choose(focus, option.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{tr(`mo.opt.${option.id}`)}</span>
                    <span className="block text-xs text-muted">
                      {tr(`attr.${option.attr}`)} {career.player.attrs[option.attr]}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-1.5">
                    {option.gear && option.gearItem ? (
                      <span className="text-xs font-bold text-accent">
                        <bdi dir="ltr">(+{option.gear}%</bdi> {tr(`gear.short.${option.gearItem}`)})
                      </span>
                    ) : null}
                    {option.odds >= 92 ? (
                      <span className="text-xs font-bold text-good">{tr("mo.max")}</span>
                    ) : option.gain ? (
                      <span className="num text-sm font-bold text-good">+{option.gain}%</span>
                    ) : null}
                    <span className={`num text-lg font-bold band-${option.odds >= 65 ? "high" : option.odds >= 45 ? "good" : option.odds >= 30 ? "mid" : "low"}`}>{option.odds}%</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <ol className="card mt-3 flex flex-col">
        {[...shown].reverse().map((event, index) => (
          <li key={`${event.minute}-${event.text}-${index}`} className={`event ${event.tone === "neutral" ? "" : event.tone}`}>
            <span className="min">{event.minute}'</span>
            <span>{text(event.text)}</span>
          </li>
        ))}
      </ol>

      {done ? (
        <div className="dock">
          <button type="button" className="btn-primary h-13 w-full text-base" onClick={() => onChange(finishBigMatch(career))}>
            {tr("report")}
          </button>
        </div>
      ) : null}
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

      <div className="scorebox px-4 pt-5 pb-3">
        <ScoreFields left={left} right={right} />
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-center" dir="ltr">
          <span className={`team-name ${left === ours ? "text-accent-2" : ""}`} dir="auto">
            <NameCrest name={left} />
            {keepHyphens(left)}
          </span>
          <span className="score-big">
            {leftGoals}
            <span className="px-2 text-accent">:</span>
            {rightGoals}
          </span>
          <span className={`team-name ${right === ours ? "text-accent-2" : ""}`} dir="auto">
            <NameCrest name={right} />
            {keepHyphens(right)}
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
  extra,
}: {
  career: Career;
  report: MatchReport;
  onNext: () => void;
  onMenu: () => void;
  extra?: ReactNode;
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
      {extra}
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
          <span className="block truncate text-xs text-muted">
            {item.key ? <span className="font-semibold text-accent">{tr("keyTag")} · </span> : null}
            {text(item.roundLabel)}
          </span>
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

/** True when rewarded clips can actually run: an ad client is configured, not admin, and no remove-ads entitlement. */
function useAdsShown() {
  const [shown] = useState(() => {
    if (!adsEnabled || adsSuppressed()) return false;
    try {
      return !loadDevice().removeAds.owned;
    } catch {
      return false;
    }
  });
  return shown;
}

function SeasonScreen({
  career,
  onStore,
  onSummer,
  onMenu,
  claimRace,
}: {
  career: Career;
  onStore?: () => void;
  onSummer: () => void;
  onMenu: () => void;
  claimRace?: boolean;
}) {
  const preview = career.growthPreview;
  const club = getClub(career.clubId);
  const league = getLeague(career.season.leagueId);
  const rows = sortTable(career.season.table);
  const { tr, text } = useTx();
  const [showResults, setShowResults] = useState(false);
  const logs = career.season.fixturesPlayed;
  const keyLogs = logs.filter((log) => log.key);
  const sc = career.seasonCoins ?? { matches: 0, bonuses: 0, salary: 0, ads: 0 };
  const earnedTotal = sc.matches + sc.bonuses + (sc.salary ?? 0) + sc.ads;
  const earnedAds = sc.ads;
  const adsShown = useAdsShown();
  const record = { w: 0, d: 0, l: 0 };
  for (const log of logs) record[log.us > log.them ? "w" : log.us < log.them ? "l" : "d"] += 1;
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
      {/* The verdict is announced, not tagged: a club-colour band when the target is met. */}
      <p className={`verdict ${preview.targetHit ? "is-met" : "is-missed"}`}>{preview.targetHit ? tr("targetMet") : tr("targetMiss")}</p>
      <div className="card mt-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-bold">
            {preview.tablePos}
            {rows.length ? ` ${tr("of", { n: rows.length })}` : ""} · {league.name}
          </p>
          <p className="truncate text-xs text-muted">{text(preview.targetLabel)}</p>
          <p className="text-xs text-muted" dir="auto">
            {tr("seasonRecord", { w: record.w, d: record.d, l: record.l })} · {tr("goals")} <span className="num">{career.season.goals}</span> · {tr("assists")} <span className="num">{career.season.assists}</span>
          </p>
          {!career.race ? (
            <p className="text-xs font-semibold text-trophy" data-season-coins>
              {tr("seasonCoins", { n: formatCoins(earnedTotal) })}
              {earnedAds > 0 ? ` ${tr("seasonCoinsAds", { n: formatCoins(earnedAds) })}` : ""}
            </p>
          ) : null}
          {!career.race && sc.salary > 0 ? (
            <p className="text-xs text-muted" data-season-salary>
              {tr("seasonSalary", { n: formatCoins(sc.salary) })}
            </p>
          ) : null}
          {!career.race && earnedAds === 0 && adsShown ? (
            <p className="text-xs text-muted" data-doubling-hint>
              {tr("seasonCoinsHint")}
            </p>
          ) : null}
        </div>
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
            {ovrGain === 0 ? tr("ovrSame") : tr("ovrUp", { n: `\u2066${ovrGain > 0 ? `+${ovrGain}` : String(ovrGain)}\u2069` })}
          </span>
        </div>
      </div>

      <dl className="stat-row mt-3">
        <div>
          <dt>{tr("apps")}</dt>
          <dd>
            <span className="num">{career.season.apps}</span>
          </dd>
        </div>
        <div>
          <dt>{tr("goals")}</dt>
          <dd>
            <span className="num">{career.season.goals}</span>
          </dd>
        </div>
        <div>
          <dt>{tr("assists")}</dt>
          <dd>
            <span className="num">{career.season.assists}</span>
          </dd>
        </div>
        <div>
          <dt>{tr("average")}</dt>
          <dd className={preview.avg >= 7 ? "text-good" : ""}>
            <span className="num">{preview.avg ? preview.avg.toFixed(1) : "–"}</span>
          </dd>
        </div>
      </dl>

      {preview.europe ? (
        <p className="card mt-3 px-4 py-3 text-sm font-semibold">
          {tr(preview.europe.comp === "cl" ? "comp.cl" : "comp.el")} · {tr(`stage.${preview.europe.stage}`)}
        </p>
      ) : null}

      {onStore && !career.race ? (
        <button type="button" className="btn-ghost mt-4 h-12 w-full text-sm" onClick={onStore}>
          {tr("eco.store")} · <span className="num text-trophy">{formatCoins(career.coins)}</span>
        </button>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-muted">{tr("keyBonusNote", { n: career.season.keyWins ?? 0 })}</p>
      {keyLogs.length ? (
        <div className="results-list results-key mt-3">
          {keyLogs.map((log, index) => (
            <ResultRow key={`key-${log.opponentName}-${index}`} item={log} />
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="mt-3 flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-line bg-surface px-3.5 text-start text-base font-semibold"
        aria-expanded={showResults}
        aria-controls="season-results"
        onClick={() => setShowResults((value) => !value)}
      >
        <span>{tr("seasonResultsN", { n: logs.length })}</span>
        <ChevronDown className={`size-5 shrink-0 transition-transform ${showResults ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {showResults ? (
        <div id="season-results" className="results-list mt-3">
          {logs.map((log, index) => (
            <ResultRow key={`${log.opponentName}-${index}`} item={log} />
          ))}
        </div>
      ) : null}

      <h2 className="section-title mt-6">{tr("attrsMoved")}</h2>
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
                <span className={delta > 0 ? "text-good" : delta < 0 ? "text-bad" : "text-muted"}>{delta > 0 ? `+${delta}` : delta}</span>
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

      <h2 className="section-title mt-6">{tr("awardsHead")}</h2>
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
          <span className="min-w-0 flex-1 font-semibold">{tr("award.ballon")}</span>
          <span className={`min-w-0 shrink truncate text-end text-sm ${preview.ballonYours ? "font-bold text-trophy" : "text-muted"}`}>{preview.ballon}</span>
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
  onChange,
}: {
  career: Career;
  onAccept: (clubId: string) => void;
  onRetire: () => void;
  onBoost: (key: AttrKey) => void;
  onMenu: () => void;
  onChange: (c: Career) => void;
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
      {!offers.some((offer) => offer.kind === "stay") ? <p className="mt-3 text-sm font-bold text-bad">{tr("noRenew")}</p> : null}
      {!career.race ? <BigTrialCard career={career} onChange={onChange} /> : null}
      <div className="mt-4 grid gap-3">
        {offers.map((offer) => {
          const club = getClub(offer.clubId);
          const league = getLeague(offer.leagueId);
          const offerCountry = getCountry(league.countryId);
          const mins = ROLE_MINUTES[offer.role];
          return (
            <article key={offer.clubId} className="offer-plain" style={clubVars(club.id)}>
              <header className="offer-head">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Crest clubId={club.id} name={club.name} className="h-11 w-11 shrink-0" />
                    <div className="min-w-0">
                      <h2>{keepHyphens(club.name)}</h2>
                      <p className="text-sm font-semibold opacity-80">
                        <bdi>{league.name}</bdi> · <bdi>{offerCountry.name}</bdi>
                      </p>
                    </div>
                  </div>
                  <span className="offer-chip">{tr(`role${offer.role}`)}</span>
                </div>
              </header>
              <div className="offer-in">
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
                {/* Signing is done in the signing club's colours; the choices weigh the same. */}
                <button type="button" className="btn-club h-12 w-full" onClick={() => onAccept(offer.clubId)}>
                  {offer.kind === "stay" ? tr("stay") : offer.kind === "side" ? tr("move") : tr("sign")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!career.race ? <SeasonBreak career={career} onBoost={onBoost} /> : null}
      <div className="mt-5">
        {ask ? (
          <div className="card px-4 py-3">
            <p className="text-sm">{tr("retireAt", { n: career.player.age })}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-ghost h-12" onClick={() => setAsk(false)}>
                {tr("oneMore")}
              </button>
              <button type="button" className="btn-primary h-12" onClick={onRetire}>
                {tr("retireBtn")}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="min-h-12 text-sm text-muted underline" onClick={() => setAsk(true)}>
            {tr("retire")}
          </button>
        )}
      </div>
    </Shell>
  );
}

function Collection({ career, onBack, onPlay }: { career: Career | null; onBack: () => void; onPlay: () => void }) {
  const { tr, text } = useTx();
  return (
    <Shell>
      <ScreenHeader title={tr("collection")} onBack={onBack} />
      {!career || career.trophies.length === 0 ? (
        <div className="card grid gap-4 px-4 py-6 text-center">
          <p className="text-sm leading-6 text-muted">{tr("emptyCabinet")}</p>
          <button type="button" className="btn-primary h-12 w-full" onClick={onPlay}>
            {career ? tr("continue") : tr("start")}
          </button>
        </div>
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

function AchievementToast({ id }: { id: string }) {
  const { tr } = useTx();
  return (
    <div className="toast" role="status" key={id}>
      <span className="list-icon text-trophy">
        <Trophy className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted">{tr("ach.unlocked")}</span>
        <span dir="auto" className="block line-clamp-2 font-semibold">{tr(`ach.${id}`)}</span>
      </span>
    </div>
  );
}

function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const { tr } = useTx();
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  useEffect(() => setUnlocked(loadUnlocked()), []);
  const done = ACHIEVEMENTS.filter((item) => unlocked[item.id]).length;
  return (
    <Shell>
      <ScreenHeader title={tr("achievements")} sub={tr("ach.count", { n: done, m: ACHIEVEMENTS.length })} onBack={onBack} />
      <div className="meter mb-4">
        <i style={{ width: `${Math.round((done / ACHIEVEMENTS.length) * 100)}%` }} />
      </div>
      <div className="list">
        {ACHIEVEMENTS.map((item) => {
          const at = unlocked[item.id];
          return (
            <div key={item.id} className={`list-row ${at ? "" : "opacity-60"}`}>
              <span className={`list-icon ${at ? "text-trophy" : ""}`}>{at ? <Trophy className="size-5" /> : <Medal className="size-5" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{tr(`ach.${item.id}`)}</span>
                <span className="block text-xs text-muted">{tr(`ach.${item.id}.d`)}</span>
              </span>
              {at ? <Check className="size-4 shrink-0 text-good" /> : null}
            </div>
          );
        })}
      </div>
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
                  className="btn-ghost h-12 shrink-0 px-4 text-sm"
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
    if (!career.race) settleRetirement(career, COUNTRIES.map((item) => item.id).find((id) => !countryOpen(loadDevice(), id)) ?? null);
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
            <RewardButton
              name="legacy-double"
              className="btn-ghost h-12 w-full text-sm"
              label={tr("legacyDouble")}
              onReward={() => {
                if (!canDouble(career)) return;
                const next = doubleLegacy(career);
                setGain({ gained: gain.gained * 2, total: next.points, double: false });
              }}
            />
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


// ---------- economy UI ----------

/** Runs a rewarded clip with feedback: spinner while waiting, a message when none is available or it was closed early. */
function RewardButton({ name, label, onReward, className }: { name: string; label: string; onReward: () => void; className: string }) {
  const { tr } = useTx();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="grid gap-1">
      <button
        type="button"
        className={`${className} min-h-12`}
        data-ad-slot="rewarded"
        disabled={busy}
        aria-busy={busy}
        onClick={() => {
          setBusy(true);
          setNote(null);
          showRewarded(
            name,
            () => {
              setBusy(false);
              onReward();
            },
            () => {
              setBusy(false);
              setNote(tr("adUnavailable"));
            },
            () => {
              setBusy(false);
              setNote(tr("adDismissed"));
            },
          );
        }}
      >
        {busy ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" aria-hidden="true" /> : null}
        <span className={busy ? "ms-2" : ""}>{label}</span>
      </button>
      {note ? (
        <p className="text-xs text-bad" role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}

/** The gold coin mark, drawn in CSS so it matches at every size. */
function Coin() {
  return <i className="coin" aria-hidden="true" />;
}

function CoinChip({ n }: { n: number }) {
  const { tr } = useTx();
  return (
    <span className="chip chip-trophy num shrink-0" aria-label={tr("coinsN", { n: formatCoins(n) })}>
      <Coin />
      {formatCoins(n)}
    </span>
  );
}

/** Buying with coins: an outline button carrying the coin and the price (the old price struck when discounted). */
function PriceButton({
  price,
  was,
  label,
  disabled,
  onClick,
  className = "h-12 min-w-20 shrink-0 px-3",
}: {
  price: number;
  was?: number;
  label?: string;
  disabled?: boolean;
  onClick: () => void;
  /** Size classes; replaces the default rather than adding to it. */
  className?: string;
}) {
  const { tr } = useTx();
  const off = was != null && was > price;
  return (
    <button
      type="button"
      className={`btn-price ${className}`}
      disabled={disabled}
      aria-label={label ? `${label} · ${tr("coinsN", { n: formatCoins(price) })}` : undefined}
      onClick={onClick}
    >
      <Coin />
      <span className="num">{formatCoins(price)}</span>
      {off ? <s className="num price-was">{formatCoins(was)}</s> : null}
    </button>
  );
}

function EconomyBar({ career, onChange, onStore }: { career: Career; onChange: (c: Career) => void; onStore: () => void }) {
  const { tr } = useTx();
  const today = todayKey();
  const [chest, setChest] = useState(() => chestToday(today));
  const legend = career.cosmetics.includes("cos-legend");
  const open = (double: boolean) => {
    if (!chest) return;
    markChest(today);
    setChest(null);
    if (chest.kind === "coins") {
      const withBase = { ...career, seasonCoins: earnSeasonCoins(career, "bonuses", chest.coins) };
      onChange({ ...withBase, coins: career.coins + chest.coins * (double ? 2 : 1), seasonCoins: double ? earnSeasonCoins(withBase, "ads", chest.coins) : withBase.seasonCoins });
    }
    else onChange({ ...grantFreeCamp(career, career.adState.freeCampDate ?? ""), keyCampBonus: ECONOMY.keyCampBonus * (double ? 2 : 1) });
  };
  return (
    <section className="card mt-3 grid gap-2 px-3 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <CoinChip n={career.coins} />
        {legend ? <span className="chip chip-trophy">{tr("eco.legendTag")}</span> : null}
        {career.keyCampBonus > 0 ? <span className="chip chip-good">{tr("eco.campActive", { n: career.keyCampBonus })}</span> : null}
        <button type="button" className="btn-ghost ms-auto h-12 px-4 text-sm" onClick={onStore}>
          {tr("eco.store")}
        </button>
      </div>
      {chest ? (
        <div className="grid gap-2 border-t border-line pt-2">
          <p className="text-sm font-semibold">{chest.kind === "coins" ? tr("eco.chestCoins", { n: chest.coins }) : tr("eco.chestCamp")}</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-ghost h-12 text-sm" onClick={() => open(false)}>
              {tr("eco.chestOpen")}
            </button>
            <RewardButton name="daily-chest" className="h-12 w-full text-sm" label={tr("eco.chestDouble")} onReward={() => open(true)} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DoubleCoins({ career }: { career: Career; onChange: (c: Career) => void }) {
  const { tr } = useTx();
  const apply = useContext(ApplyContext);
  const earned = career.coinsEarnedLast ?? 0;
  if (career.race || !earned) return null;
  const available = rewardAvailable(career, "double-coins", todayKey());
  return (
    <div className="mt-4 grid gap-2">
      <p className="text-sm">
        {tr("eco.earned", { n: formatCoins(earned) })} · <CoinChip n={career.coins} />
      </p>
      {available ? (
        <RewardButton name="double-coins" className="btn-ghost h-12 w-full text-sm" label={tr("eco.double", { n: formatCoins(earned) })} onReward={() => apply(grantDoubleCoins)} />
      ) : career.coinsFixtureId && career.adState.doubledFixtureIds.includes(career.coinsFixtureId) ? (
        <p className="text-xs text-good">{tr("eco.doubled")}</p>
      ) : (
        <p className="text-xs text-muted">{tr("eco.doubleCap", { n: ECONOMY.caps.doubleCoinsPerSeason })}</p>
      )}
    </div>
  );
}

function BigTrialCard({ career, onChange }: { career: Career; onChange: (c: Career) => void }) {
  const { tr } = useTx();
  const trial = career.bigTrial;
  if (!trial || trial.year !== career.year) return null;
  const club = getClub(trial.clubId);
  // The bigger club's own announcement: its colours, its name as the heading, the chance as the tag.
  return (
    <article className="offer-plain mt-4" style={clubVars(club.id)}>
      <header className="offer-head">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Crest clubId={club.id} name={club.name} className="h-11 w-11 shrink-0" />
            <div className="min-w-0">
              <h2>{keepHyphens(club.name)}</h2>
              {/* Two lines, so the Latin league name never wraps around the Hebrew phrase. */}
              <p className="text-sm font-semibold opacity-80">{tr("eco.trialTitle")}</p>
              <p className="text-sm font-semibold opacity-80">
                <bdi>{getLeague(club.leagueId).name}</bdi>
              </p>
            </div>
          </div>
          <span className="offer-chip num">{trial.chance}%</span>
        </div>
      </header>
      <div className="offer-in">
        {trial.result === "open" ? (
          <>
            <button type="button" className="btn-club h-12 w-full" onClick={() => onChange(attemptBigTrial(career))}>
              {tr("eco.trialGo")}
            </button>
            {!trial.boosted && trial.chance < ECONOMY.bigTrial.boostCap ? (
              <RewardButton name="trial-boost" className="h-12 w-full text-sm" label={tr("eco.trialBoost", { n: Math.min(ECONOMY.bigTrial.boostCap, trial.chance * 2) })} onReward={() => onChange(boostBigTrial(career))} />
            ) : null}
          </>
        ) : (
          <p className={`text-sm font-semibold ${trial.result === "won" ? "text-good" : "text-bad"}`}>{trial.result === "won" ? tr("eco.trialWon") : tr("eco.trialLost")}</p>
        )}
      </div>
    </article>
  );
}

function StoreScreen({ career, onChange, onBack, onPlayer }: { career: Career; onChange: (c: Career) => void; onBack: () => void; onPlayer?: () => void }) {
  const { tr } = useTx();
  const admin = useContext(AdminContext);
  const today = todayKey();
  const [device, setDevice] = useState(() => loadDevice());
  const [discountPick, setDiscountPick] = useState(false);
  const nextLocked = COUNTRIES.find((item) => !countryOpen(device, item.id, admin));
  const reasonText: Record<string, string> = { coins: tr("eco.short"), owned: tr("eco.owned"), full: tr("eco.full"), notNeeded: tr("eco.notNeeded"), daily: tr("eco.short") };
  const purchase = (id: StoreItemId) => {
    const next = buy(career, id, today, { admin });
    if (next === career) return;
    if (id === "unlock-country" && nextLocked) setDevice(unlockCountry(nextLocked.id));
    if (COSMETIC_IDS.includes(id)) setDevice(ownCosmetic(id));
    onChange(next);
  };
  return (
    <Shell>
      <ScreenHeader title={tr("eco.store")} sub={admin ? tr("eco.adminFree") : tr("eco.storeSub")} onBack={onBack} right={<CoinChip n={career.coins} />} />
      <GearOfferCard career={career} onChange={onChange} />
      {/* One rewarded clip at a time: the free camp first, then the discount once the camp is taken. */}
      {discountPick ? (
        <p className="mt-3 text-sm text-accent">{tr("eco.discountPick", { n: Math.round(ECONOMY.discount * 100) })}</p>
      ) : rewardAvailable(career, "free-camp", today) ? (
        <div className="mt-3">
          <RewardButton name="free-camp" className="h-12 w-full text-sm" label={tr("eco.freeCamp", { n: ECONOMY.keyCampBonus })} onReward={() => onChange(grantFreeCamp(career, today))} />
        </div>
      ) : rewardAvailable(career, "store-discount", today) ? (
        <div className="mt-3">
          <RewardButton name="store-discount" className="h-12 w-full text-sm" label={tr("eco.discount", { n: Math.round(ECONOMY.discount * 100) })} onReward={() => setDiscountPick(true)} />
        </div>
      ) : null}
      {onPlayer ? (
        <button type="button" className="btn-ghost mt-3 h-12 w-full text-sm" onClick={onPlayer}>
          {tr("gear.myPlayer")}
        </button>
      ) : null}
      <div className="mt-4 grid gap-2">
        {CATALOG.map((item) => {
          if (item.id === "unlock-country" && !nextLocked) return null;
          const price = itemPrice(career, item.id, today, admin);
          const check = item.id === "unlock-country" ? (career.coins >= price ? "ok" : "coins") : canBuy(career, item.id, today, admin);
          const label = item.id === "unlock-country" && nextLocked ? tr("eco.item.unlock-country", { country: tr(`country.${nextLocked.id}`) }) : tr(`eco.item.${item.id}`);
          return (
            <div key={item.id} className="rounded-md border border-line bg-surface px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-xs text-muted">{tr(`eco.desc.${item.id}`)}</span>
                </span>
                {discountPick ? (
                  <button
                    type="button"
                    className="btn-ghost h-12 shrink-0 px-3 text-sm"
                    onClick={() => {
                      onChange(grantDiscount(career, today, item.id));
                      setDiscountPick(false);
                    }}
                  >
                    -{Math.round(ECONOMY.discount * 100)}%
                  </button>
                ) : (
                  <PriceButton price={price} was={item.price} label={label} disabled={check !== "ok"} onClick={() => purchase(item.id)} />
                )}
              </div>
              {check !== "ok" && !discountPick ? <p className="mt-1 text-xs text-muted">{reasonText[check] ?? ""}</p> : null}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

// ---------- equipment ("My Player") ----------
// Functional layout only: the designer restyles it. All rules come from @/game/gear by slot/tier id.

function gearTopLeague(career: Career) {
  return isTopLeague(leagueOf(career, career.clubId));
}

/** Gear art from /public/gear/{item}-{tier}.webp; hides itself if the file is missing (text-only card stays). */
function GearIcon({ item, tier, dim = false, className = "h-12 w-12" }: { item: string; tier: GearTierId; dim?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={`/gear/${item}-${tier}.webp`}
      alt=""
      aria-hidden="true"
      width={128}
      height={128}
      loading="lazy"
      decoding="async"
      className={`${className} shrink-0 object-contain ${dim ? "opacity-35 grayscale" : ""}`}
      onError={() => setFailed(true)}
    />
  );
}

function GearOfferCard({ career, onChange }: { career: Career; onChange: (c: Career) => void }) {
  const { tr } = useTx();
  const admin = useContext(AdminContext);
  const apply = useContext(ApplyContext);
  const buying = useRef(false);
  const today = todayKey();
  const top = gearTopLeague(career);
  const offer = dailyGearOffer(career, today, top);
  if (career.race || !offer || career.adState.gearOfferBoughtDate === today) return null;
  const slot = GEAR_SLOTS.find((item) => item.id === offer.slot)!;
  const worn = slotFor(slot, career.player.position);
  const price = gearPrice(career, offer.slot, offer.tier, today, admin, top);
  const check = canBuyGear(career, offer.slot, offer.tier, today, top, admin);
  const off = Math.round((ECONOMY.gear.dailyOff + (career.adState.gearOfferAdDate === today ? ECONOMY.gear.dailyAdOff : 0)) * 100);
  return (
    <section className="card mt-3 grid gap-2 px-3 py-2.5" data-gear-offer={`${offer.slot}:${offer.tier}`}>
      <div className="flex items-center gap-3">
        <GearIcon key={`${worn.item}-${offer.tier}`} item={worn.item} tier={offer.tier} className="gear-well h-14 w-14 p-1" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">
            {tr(`gear.item.${worn.item}`)} · {tr(`gear.tier.${offer.tier}`)}
          </span>
          <span className="block text-xs text-muted">
            {tr(`attr.${worn.attr}`)} <bdi dir="ltr">+{tierInfo(offer.tier).bonus}</bdi> · <span className="font-semibold text-accent-2">{tr("gear.offer", { n: off })}</span>
          </span>
        </span>
        <PriceButton
          price={price}
          label={`${tr(`gear.item.${worn.item}`)} · ${tr(`gear.tier.${offer.tier}`)}`}
          disabled={check !== "ok"}
          onClick={() => {
            if (buying.current) return;
            buying.current = true;
            window.setTimeout(() => (buying.current = false), 600);
            onChange(buyGear(career, offer.slot, offer.tier, today, top, admin));
          }}
        />
      </div>
      {rewardAvailable(career, "gear-offer", today) ? (
        <RewardButton name="gear-offer" className="reward-quiet h-12 w-full text-sm" label={tr("gear.offerAd", { n: Math.round(ECONOMY.gear.dailyAdOff * 100) })} onReward={() => apply((current) => grantGearOfferAd(current, today))} />
      ) : null}
    </section>
  );
}

/** Free look picker opened from the character: skin tone, hair style and hair colour. */
function LookSheet({ career, onChange, onClose }: { career: Career; onChange: (c: Career) => void; onClose: () => void }) {
  const { tr } = useTx();
  const start = resolveLook(career.player);
  const [skin, setSkin] = useState<number>(start.skin);
  const [hair, setHair] = useState<HairStyle>(start.hair);
  const [hairColor, setHairColor] = useState<HairColor>(start.hairColor);
  const preview = { ...career, player: { ...career.player, skin, hair, hairColor } };
  return (
    <div className="look-backdrop" role="presentation" onClick={onClose}>
      <div className="look-sheet" role="dialog" aria-modal="true" aria-label={tr("look.title")} onClick={(e) => e.stopPropagation()}>
        <div className="look-handle" aria-hidden="true" />
        <h2 className="text-lg font-bold">{tr("look.title")}</h2>
        <div className="mx-auto my-2 w-24">
          <PlayerCharacter career={preview} />
        </div>
        <p className="mb-1 text-sm font-semibold">{tr("look.skin")}</p>
        <div className="flex justify-between gap-1" role="radiogroup" aria-label={tr("look.skin")}>
          {SKIN_TONES.map((hex, i) => (
            <button key={hex} type="button" role="radio" aria-checked={skin === i + 1} aria-label={tr("look.tone", { n: i + 1 })} data-skin={i + 1} className="skin-swatch" style={{ background: hex }} onClick={() => setSkin(i + 1)} />
          ))}
        </div>
        <p className="mb-1 mt-3 text-sm font-semibold">{tr("look.hair")}</p>
        <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label={tr("look.hair")}>
          {HAIR_STYLES.map((id) => (
            <button key={id} type="button" role="radio" aria-checked={hair === id} data-hair={id} className="look-chip" onClick={() => setHair(id)}>
              {tr(`look.hair.${id}`)}
            </button>
          ))}
        </div>
        <p className="mb-1 mt-3 text-sm font-semibold">{tr("look.hairColor")}</p>
        <div className="flex justify-between gap-1" role="radiogroup" aria-label={tr("look.hairColor")}>
          {HAIR_COLOR_IDS.map((id) => (
            <button key={id} type="button" role="radio" aria-checked={hairColor === id} aria-label={tr(`look.color.${id}`)} data-hair-color={id} className="skin-swatch" style={{ background: HAIR_COLORS[id] }} onClick={() => setHairColor(id)} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost h-12" onClick={onClose}>{tr("look.cancel")}</button>
          <button type="button" className="btn-primary h-12" data-look-save onClick={() => { onChange(preview); onClose(); }}>{tr("look.save")}</button>
        </div>
      </div>
    </div>
  );
}

/** One stacked layer on the character canvas; a missing file just hides itself. */
function CharacterLayer({ src, layer, maskSrc }: { src: string; layer: string; maskSrc?: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  const style = maskSrc ? { WebkitMaskImage: `url(${maskSrc})`, maskImage: `url(${maskSrc})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" } : undefined;
  return <img src={src} alt="" data-layer={layer} className="character-layer" style={style} decoding="async" onError={() => setMissing(true)} />;
}

/** Hair fill tinted by multiply (fill x colour), clipped to the fill's own alpha. */
function HairFill({ style, color }: { style: HairStyle; color: string }) {
  const url = `/character/hair/${style}-fill.webp`;
  return (
    <div
      data-layer={`hair-fill-${style}`}
      className="character-layer"
      style={{ backgroundImage: `url(${url})`, backgroundColor: color, backgroundSize: "100% 100%", backgroundBlendMode: "multiply", WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}
    />
  );
}

/** Higher tier wins; ties go to the first slot. Boots/gloves never draw both. */
function topOf(a: { item: string; tier: GearTierId | null }, b: { item: string; tier: GearTierId | null }) {
  if (!b.tier) return a.tier ? a : null;
  if (!a.tier) return b;
  return GEAR_TIERS.indexOf(b.tier) > GEAR_TIERS.indexOf(a.tier) ? b : a;
}

/**
 * My Player character: stacked layers on one canvas (order per star-art README-overlays.md).
 * bald body (masked under boots/gloves) -> gold glows -> shin -> boots -> sleeve -> wristband -> gloves -> hair fill -> hair line -> headband.
 * Files: /character/gear/<slot>-<tier>.webp, /character/hair/<style>-fill|line.webp. Missing files are skipped.
 */
function PlayerCharacter({ career, children }: { career: Career; children?: ReactNode }) {
  const look = resolveLook(career.player);
  const gk = career.player.position === "GK";
  const worn = Object.fromEntries(GEAR_SLOTS.map((slot) => [slot.id, { item: slotFor(slot, career.player.position).item, tier: slotTier(career, slot.id) }]));
  const allGold = GEAR_SLOTS.every((slot) => worn[slot.id].tier === "gold");
  // Outfield: kick/dribble are both boots. Keeper: they are the two gloves.
  const feetOrHands = topOf(worn.kick, worn.dribble);
  const boots = gk ? null : feetOrHands;
  const gloves = gk ? feetOrHands : null;
  const mask = boots && gloves ? "boots-hands" : boots ? "boots" : gloves ? "hands" : null;
  const stack = [worn.shin, boots, worn.sleeve, worn.wristband, gloves].filter((g): g is { item: string; tier: GearTierId } => !!g?.tier);
  const head = worn.headband.tier ? worn.headband : null;
  const glows = [...stack, ...(head ? [head] : [])].filter((g) => g.tier === "gold");
  const body = `/character/hair/base-bald-skin${look.skin}.webp`;
  return (
    <div className="player-figure" data-all-gold={allGold || undefined} data-hair={look.hair} data-hair-color={look.hairColor}>
      {allGold ? <div className="character-aura" aria-hidden="true" /> : null}
      <div className="character-canvas">
        <CharacterLayer key={`${body}-${mask}`} src={body} layer="body" maskSrc={mask ? `/character/gear/keep-${mask}.webp` : undefined} />
        {glows.map((g) => <CharacterLayer key={`glow-${g.item}`} src={`/character/gear/${g.item}-gold-glow.webp`} layer={`glow-${g.item}`} />)}
        {stack.map((g) => <CharacterLayer key={`${g.item}-${g.tier}`} src={`/character/gear/${g.item}-${g.tier}.webp`} layer={`gear-${g.item}`} />)}
        <HairFill style={look.hair} color={HAIR_COLORS[look.hairColor]} />
        <CharacterLayer key={`hair-${look.hair}`} src={`/character/hair/${look.hair}-line.webp`} layer={`hair-line-${look.hair}`} />
        {head ? <CharacterLayer key={`headband-${head.tier}`} src={`/character/gear/headband-${head.tier}.webp`} layer="gear-headband" /> : null}
      </div>
      {children}
    </div>
  );
}

function MyPlayerScreen({ career, onChange, onBack, onStore }: { career: Career; onChange: (c: Career) => void; onBack: () => void; onStore: () => void }) {
  const { tr } = useTx();
  const admin = useContext(AdminContext);
  const today = todayKey();
  const top = gearTopLeague(career);
  const bonus = gearBonus(career);
  const [picking, setPicking] = useState(false);
  const [look, setLook] = useState(false);
  // Same rule as canBuyGear: gold needs a top league unless admin.
  const goldLocked = ECONOMY.gear.goldNeedsTopLeague && !top && !admin;
  const allGold = GEAR_SLOTS.every((slot) => slotTier(career, slot.id) === "gold");
  /** Blocks a fast second tap from buying the next tier off the same render. */
  const buying = useRef(false);
  const reason: Record<string, string> = { coins: tr("eco.short"), owned: tr("eco.owned"), locked: tr("gear.goldLocked"), daily: tr("eco.short") };
  const slotCard = (index: number) => {
    const slot = GEAR_SLOTS[index];
    const worn = slotFor(slot, career.player.position);
    const tier = slotTier(career, slot.id);
    const nextTier = tier ? GEAR_TIERS[GEAR_TIERS.indexOf(tier) + 1] : "bronze";
    const check = nextTier ? canBuyGear(career, slot.id, nextTier, today, top, admin) : "owned";
    return (
      <div key={slot.id} className="gear-slot rounded-md border border-line bg-surface px-1.5 py-1.5 text-center" data-gear-slot={slot.id} data-gear-tier={tier ?? "none"}>
        <GearIcon key={`${worn.item}-${tier ?? "bronze"}`} item={worn.item} tier={tier ?? "bronze"} dim={!tier} className="gear-well mx-auto h-12 w-12 p-1" />
        <p className="mt-1 text-xs font-semibold leading-tight">{tr(`gear.item.${worn.item}`)}</p>
        {/* Status trails the name: the tier worn (or empty), then the attribute it feeds. */}
        <p className="text-[11px] leading-tight text-muted">
          <span className={`gear-tier-label font-bold ${tier ? "" : "text-muted"}`}>
            {tier ? tr(`gear.tier.${tier}`) : tr("gear.empty")}
            {tier ? <>{" "}<bdi dir="ltr" className="num">+{tierInfo(tier).bonus}</bdi></> : null}
          </span>
          {" · "}
          {tr(`attr.${worn.attr}`)}
        </p>
        {career.gearTrial === slot.id ? <p className="text-[11px] text-trophy">{tr("gear.trialOn")}</p> : null}
        {worn.injury && tier ? <p className="text-[11px] text-good">{tr("gear.injury", { n: Math.round(ECONOMY.gear.injuryCut[tier] * 100) })}</p> : null}
        {picking ? (
          <button
            type="button"
            className="btn-ghost mt-1 h-11 w-full px-1 text-xs"
            onClick={() => {
              onChange(grantTryGold(career, slot.id));
              setPicking(false);
            }}
          >
            {tr("gear.tier.gold")}
          </button>
        ) : nextTier ? (
          <PriceButton
            className="mt-1 h-11 w-full px-1"
            price={gearPrice(career, slot.id, nextTier, today, admin, top)}
            label={`${tr(`gear.tier.${nextTier}`)} ${tr(`gear.item.${worn.item}`)}`}
            disabled={check !== "ok"}
            onClick={() => {
              if (buying.current) return;
              buying.current = true;
              window.setTimeout(() => (buying.current = false), 600);
              onChange(buyGear(career, slot.id, nextTier, today, top, admin));
            }}
          />
        ) : (
          <p className="mt-1 text-[11px] text-good">{tr("gear.maxed")}</p>
        )}
        {!picking && nextTier && check !== "ok" && check !== "coins" ? <p className="mt-0.5 text-[11px] leading-tight text-muted">{reason[check]}</p> : null}
      </div>
    );
  };
  return (
    <Shell>
      <ScreenHeader title={tr("gear.myPlayer")} sub={tr("gear.sub", { n: ECONOMY.gear.attrCap })} onBack={onBack} right={<CoinChip n={career.coins} />} />
      <div className="myplayer-grid">
        <div className="grid content-start gap-2">{[0, 1, 2].map(slotCard)}</div>
        <div className="flex flex-col items-center text-center">
          <button type="button" className="look-open myplayer-stage" data-look-open aria-label={tr("look.edit")} onClick={() => setLook(true)}>
          <PlayerCharacter career={career}>
            <div className="ovr-badge player-ovr">
              <span className="num">{overall(career.player.position, effectiveAttrs(career))}</span>
            </div>
            <span className="look-badge" aria-hidden="true"><Paintbrush className="size-3.5" /></span>
          </PlayerCharacter>
          </button>
          <p className="mt-1 text-sm font-bold leading-tight">{career.player.name}</p>
          <p className="text-xs text-muted">
            {tr(`pos.${career.player.position}`)} · {tr("ageN", { n: career.player.age })}
          </p>
        </div>
        <div className="grid content-start gap-2">{[3, 4, 5].map(slotCard)}</div>
      </div>
      <div className="mt-3 grid gap-2 rounded-md border border-line bg-surface p-3" data-myplayer-attrs>
        {ATTR_KEYS.map((key) => (
          <AttrBar key={key} attr={key} value={effectiveAttrs(career)[key]} delta={bonus[key] || undefined} />
        ))}
      </div>
      <GearOfferCard career={career} onChange={onChange} />
      {rewardAvailable(career, "try-gold", today) ? (
        picking ? (
          <p className="mt-3 text-sm text-accent">{tr("gear.tryPick")}</p>
        ) : (
          <div className="mt-3">
            <RewardButton name="try-gold" className="h-12 w-full text-sm" label={tr("gear.tryGold")} onReward={() => setPicking(true)} />
          </div>
        )
      ) : null}
      {goldLocked && !allGold ? <p className="mt-3 text-xs text-muted">{tr("gear.goldLocked")}</p> : null}
      {look ? <LookSheet career={career} onChange={onChange} onClose={() => setLook(false)} /> : null}
    </Shell>
  );
}
