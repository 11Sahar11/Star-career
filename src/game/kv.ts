/**
 * Device saves. The game keeps a synchronous get/set API.
 *
 * Before `hydrateKv()`, reads and writes use localStorage (today's web saves,
 * and the streak unit tests). After it, Capacitor Preferences is the source of
 * truth on Android and IndexedDB is the source of truth in a browser. The first
 * successful hydrate copies existing localStorage keys across once, so a player
 * who already has a career does not lose it when the WebView storage is cleared.
 */

export const KV_MIGRATED_KEY = "star-kv-migrated-v1";

/** Every key the game has ever stored. Old career keys stay so they can be migrated. */
export const KV_KEYS = [
  "kochav-career-v10",
  "kochav-career-v9",
  "kochav-career-v8",
  "kochav-sound",
  "kochav-daily-v2",
  "star-streak",
  "star-boost",
  "star-heal",
  "star-sessions",
  "star-legacy-v1",
  "star-achievements-v1",
  "star-lang",
  "star-store-seen",
  "star-economy-v1",
  "star-first-open",
  "star-last-open",
  "star-ad-age",
] as const;

export type KvKey = (typeof KV_KEYS)[number];
export type KvSnapshot = Record<string, string | null>;

type Driver = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

const memory = new Map<string, string | null>();
let driver: Driver | null = null;
let hydrated = false;
let hydrating: Promise<void> | null = null;

function readLocal(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (typeof localStorage === "undefined") return;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode or a full WebView quota — the durable copy still updates */
  }
}

export function kvGet(key: string): string | null {
  if (hydrated && memory.has(key)) return memory.get(key) ?? null;
  return readLocal(key);
}

export function kvSet(key: string, value: string) {
  memory.set(key, value);
  writeLocal(key, value);
  if (hydrated && driver) void driver.set(key, value).catch(() => {});
}

export function kvRemove(key: string) {
  memory.set(key, null);
  writeLocal(key, null);
  if (hydrated && driver) void driver.remove(key).catch(() => {});
}

/**
 * Durable wins after the one-time copy. Before that, localStorage wins and is
 * written into the durable store (including explicit empties).
 */
export function planKvMigration(opts: { migrated: boolean; local: KvSnapshot; durable: KvSnapshot }): {
  local: KvSnapshot;
  durable: KvSnapshot;
} {
  const source = opts.migrated ? opts.durable : opts.local;
  const local: KvSnapshot = {};
  const durable: KvSnapshot = {};
  for (const key of KV_KEYS) {
    const value = source[key] ?? null;
    local[key] = value;
    durable[key] = value;
  }
  return { local, durable };
}

async function preferencesDriver(): Promise<Driver | null> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return null;
    const { Preferences } = await import("@capacitor/preferences");
    return {
      async get(key) {
        const { value } = await Preferences.get({ key });
        return value;
      },
      async set(key, value) {
        await Preferences.set({ key, value });
      },
      async remove(key) {
        await Preferences.remove({ key });
      },
    };
  } catch {
    return null;
  }
}

function idbDriver(): Driver | null {
  if (typeof indexedDB === "undefined") return null;
  const DB = "star-kv";
  const STORE = "kv";
  const open = () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  const run = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) => {
    const db = await open();
    try {
      return await new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  };
  return {
    async get(key) {
      const value = await run<string | undefined>("readonly", (store) => store.get(key));
      return value ?? null;
    },
    async set(key, value) {
      await run("readwrite", (store) => store.put(value, key));
    },
    async remove(key) {
      await run("readwrite", (store) => store.delete(key));
    },
  };
}

async function snapshot(source: Driver | "local"): Promise<KvSnapshot> {
  const out: KvSnapshot = {};
  for (const key of KV_KEYS) {
    out[key] = source === "local" ? readLocal(key) : await source.get(key);
  }
  return out;
}

async function doHydrate() {
  const next = (await preferencesDriver()) ?? idbDriver();
  if (!next) return;
  const migrated = (await next.get(KV_MIGRATED_KEY)) === "1";
  const plan = planKvMigration({
    migrated,
    local: await snapshot("local"),
    durable: migrated ? await snapshot(next) : {},
  });
  for (const key of KV_KEYS) {
    const value = plan.durable[key] ?? null;
    memory.set(key, value);
    writeLocal(key, value);
    if (!migrated) {
      if (value === null) await next.remove(key);
      else await next.set(key, value);
    }
  }
  if (!migrated) await next.set(KV_MIGRATED_KEY, "1");
  driver = next;
  hydrated = true;
}

/** Call once before the first career read. Safe to call again. */
export function hydrateKv(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    hydrating = doHydrate().catch(() => {
      /* stay on localStorage */
    });
  }
  return hydrating;
}
