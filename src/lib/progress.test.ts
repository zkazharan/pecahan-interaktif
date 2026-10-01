import { describe, expect, it } from 'vitest';
import { PROGRESS_KEY, createProgressStore, type StorageLike } from './progress';

function memoryStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial };
  const storage: StorageLike = {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
  return { storage, data };
}

const NOW = new Date('2026-10-01T08:00:00.000Z');
const LATER = new Date('2026-10-02T08:00:00.000Z');

describe('createProgressStore', () => {
  it('starts empty', () => {
    expect(createProgressStore(memoryStorage().storage).all()).toEqual({});
  });

  it('persists a record that a new store can read back', () => {
    const { storage, data } = memoryStorage();
    createProgressStore(storage).record('membandingkan', 4, NOW);
    expect(JSON.parse(data[PROGRESS_KEY])).toEqual({
      membandingkan: { bestFirstTry: 4, completedAt: NOW.toISOString() },
    });
    expect(createProgressStore(storage).all().membandingkan.bestFirstTry).toBe(4);
  });

  it('keeps the best first-try count and the latest date', () => {
    const store = createProgressStore(memoryStorage().storage);
    store.record('membandingkan', 4, NOW);
    expect(store.record('membandingkan', 2, LATER)).toEqual({ bestFirstTry: 4, completedAt: LATER.toISOString() });
    expect(store.record('membandingkan', 5, LATER).bestFirstTry).toBe(5);
  });

  it('rejects first-try counts outside 0–5', () => {
    const store = createProgressStore(null);
    expect(() => store.record('membandingkan', 6)).toThrow(RangeError);
    expect(() => store.record('membandingkan', -1)).toThrow(RangeError);
  });

  it('treats corrupt JSON as empty and still records', () => {
    const { storage } = memoryStorage({ [PROGRESS_KEY]: '{not json' });
    const store = createProgressStore(storage);
    expect(store.all()).toEqual({});
    store.record('membandingkan', 3, NOW);
    expect(store.all().membandingkan.bestFirstTry).toBe(3);
  });

  it('treats data with the wrong shape as empty', () => {
    const bad = [
      JSON.stringify({ membandingkan: { bestFirstTry: 9, completedAt: 'x' } }),
      JSON.stringify({ membandingkan: { bestFirstTry: 2 } }),
      JSON.stringify([1, 2, 3]),
      JSON.stringify('hello'),
    ];
    for (const raw of bad) {
      expect(createProgressStore(memoryStorage({ [PROGRESS_KEY]: raw }).storage).all()).toEqual({});
    }
  });

  it('works in memory when storage is unavailable', () => {
    const store = createProgressStore(null);
    store.record('membandingkan', 5, NOW);
    expect(store.all().membandingkan.bestFirstTry).toBe(5);
  });

  it('survives a storage that throws on every call', () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const store = createProgressStore(throwing);
    expect(store.all()).toEqual({});
    expect(store.record('membandingkan', 2, NOW).bestFirstTry).toBe(2);
    expect(store.all().membandingkan.bestFirstTry).toBe(2);
    expect(() => store.clear()).not.toThrow();
    expect(store.all()).toEqual({});
  });

  it('clear removes the saved data', () => {
    const { storage, data } = memoryStorage();
    const store = createProgressStore(storage);
    store.record('membandingkan', 5, NOW);
    store.clear();
    expect(store.all()).toEqual({});
    expect(PROGRESS_KEY in data).toBe(false);
  });

  it('all() returns a copy', () => {
    const store = createProgressStore(null);
    store.record('membandingkan', 1, NOW);
    const snapshot = store.all();
    delete snapshot.membandingkan;
    expect(store.all().membandingkan).toBeDefined();
  });
});
