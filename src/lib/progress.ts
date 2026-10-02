export type ModuleProgress = { bestFirstTry: number; completedAt: string };
export type ProgressMap = Record<string, ModuleProgress>;
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const PROGRESS_KEY = 'pecahan:v1:progress';
export const MIN_FIRST_TRY = 0;
export const MAX_FIRST_TRY = 5;

function isValidFirstTry(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_FIRST_TRY && (value as number) <= MAX_FIRST_TRY;
}

function isModuleProgress(value: unknown): value is ModuleProgress {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return isValidFirstTry(record.bestFirstTry) && typeof record.completedAt === 'string';
}

function isProgressMap(value: unknown): value is ProgressMap {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value).every(isModuleProgress);
}

function copyMap(map: ProgressMap): ProgressMap {
  return Object.fromEntries(Object.entries(map).map(([slug, entry]) => [slug, { ...entry }]));
}

function mergeMaps(base: ProgressMap, extra: ProgressMap): ProgressMap {
  const out = copyMap(base);
  for (const [slug, entry] of Object.entries(extra)) {
    const existing = Object.hasOwn(out, slug) ? out[slug] : undefined;
    out[slug] = existing
      ? {
          bestFirstTry: Math.max(existing.bestFirstTry, entry.bestFirstTry),
          completedAt: existing.completedAt > entry.completedAt ? existing.completedAt : entry.completedAt,
        }
      : { ...entry };
  }
  return out;
}

export function createProgressStore(storage: StorageLike | null) {
  let memory: ProgressMap = read() ?? {};
  const listeners = new Set<() => void>();

  function read(): ProgressMap | null {
    try {
      const raw = storage?.getItem(PROGRESS_KEY);
      if (!raw) return null;
      const data: unknown = JSON.parse(raw);
      return isProgressMap(data) ? data : null;
    } catch {
      return null;
    }
  }

  function persist(): void {
    try {
      storage?.setItem(PROGRESS_KEY, JSON.stringify(memory));
    } catch {
      return;
    }
  }

  function onStorage(event: StorageEvent): void {
    if (event.key !== null && event.key !== PROGRESS_KEY) return;
    memory = read() ?? {};
    for (const listener of [...listeners]) listener();
  }

  return {
    all(): ProgressMap {
      return copyMap(memory);
    },
    record(slug: string, firstTry: number, now: Date = new Date()): ModuleProgress {
      if (!isValidFirstTry(firstTry)) {
        throw new RangeError(`firstTry out of range: ${firstTry}`);
      }
      memory = mergeMaps(memory, read() ?? {});
      const previous = Object.hasOwn(memory, slug) ? memory[slug].bestFirstTry : MIN_FIRST_TRY;
      const entry: ModuleProgress = {
        bestFirstTry: Math.max(previous, firstTry),
        completedAt: now.toISOString(),
      };
      memory = { ...memory, [slug]: entry };
      persist();
      return { ...entry };
    },
    clear(): void {
      memory = {};
      try {
        storage?.removeItem(PROGRESS_KEY);
      } catch {
        return;
      }
    },
    subscribe(listener: () => void): () => void {
      if (typeof window === 'undefined') return () => {};
      if (listeners.size === 0) window.addEventListener('storage', onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener('storage', onStorage);
      };
    },
  };
}

export type ProgressStore = ReturnType<typeof createProgressStore>;

export function safeLocalStorage(): StorageLike | null {
  try {
    const storage = window.localStorage;
    const probe = '__pecahan_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
