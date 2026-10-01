export type ModuleProgress = { bestFirstTry: number; completedAt: string };
export type ProgressMap = Record<string, ModuleProgress>;
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const PROGRESS_KEY = 'pecahan:v1:progress';

function isModuleProgress(value: unknown): value is ModuleProgress {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  const best = record.bestFirstTry;
  return Number.isInteger(best) && (best as number) >= 0 && (best as number) <= 5 && typeof record.completedAt === 'string';
}

function isProgressMap(value: unknown): value is ProgressMap {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value).every(isModuleProgress);
}

export function createProgressStore(storage: StorageLike | null) {
  let memory: ProgressMap = load();

  function load(): ProgressMap {
    try {
      const raw = storage?.getItem(PROGRESS_KEY);
      if (!raw) return {};
      const data: unknown = JSON.parse(raw);
      return isProgressMap(data) ? data : {};
    } catch {
      return {};
    }
  }

  function persist(): void {
    try {
      storage?.setItem(PROGRESS_KEY, JSON.stringify(memory));
    } catch {
      return;
    }
  }

  return {
    all(): ProgressMap {
      return { ...memory };
    },
    record(slug: string, firstTry: number, now: Date = new Date()): ModuleProgress {
      if (!Number.isInteger(firstTry) || firstTry < 0 || firstTry > 5) {
        throw new RangeError(`firstTry out of range: ${firstTry}`);
      }
      const entry: ModuleProgress = {
        bestFirstTry: Math.max(memory[slug]?.bestFirstTry ?? 0, firstTry),
        completedAt: now.toISOString(),
      };
      memory = { ...memory, [slug]: entry };
      persist();
      return entry;
    },
    clear(): void {
      memory = {};
      try {
        storage?.removeItem(PROGRESS_KEY);
      } catch {
        return;
      }
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
