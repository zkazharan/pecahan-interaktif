import { describe, expect, it, vi } from 'vitest';
import { MAX_FIRST_TRY, PROGRESS_KEY, createProgressStore, type StorageLike } from './progress';

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

  it('record() returns a copy', () => {
    const store = createProgressStore(null);
    const entry = store.record('membandingkan', 3, NOW);
    entry.bestFirstTry = 0;
    expect(store.all().membandingkan.bestFirstTry).toBe(3);
  });

  it('all() entries are copies too', () => {
    const store = createProgressStore(null);
    store.record('membandingkan', 3, NOW);
    store.all().membandingkan.bestFirstTry = 0;
    expect(store.all().membandingkan.bestFirstTry).toBe(3);
  });

  it('defines the 0..5 bound once', () => {
    expect(MAX_FIRST_TRY).toBe(5);
    const store = createProgressStore(null);
    expect(store.record('membandingkan', MAX_FIRST_TRY, NOW).bestFirstTry).toBe(5);
    expect(() => store.record('membandingkan', MAX_FIRST_TRY + 1)).toThrow(RangeError);
    const raw = JSON.stringify({ a: { bestFirstTry: MAX_FIRST_TRY + 1, completedAt: 'x' } });
    expect(createProgressStore(memoryStorage({ [PROGRESS_KEY]: raw }).storage).all()).toEqual({});
  });

  it('keeps both modules when two stores share one storage', () => {
    const { storage, data } = memoryStorage();
    const first = createProgressStore(storage);
    const second = createProgressStore(storage);
    first.record('membandingkan', 4, NOW);
    second.record('senilai', 2, LATER);
    expect(Object.keys(JSON.parse(data[PROGRESS_KEY])).sort()).toEqual(['membandingkan', 'senilai']);
    expect(createProgressStore(storage).all().membandingkan.bestFirstTry).toBe(4);
    expect(createProgressStore(storage).all().senilai.bestFirstTry).toBe(2);
  });

  it('does not lower a best score another store already saved', () => {
    const { storage } = memoryStorage();
    const first = createProgressStore(storage);
    const second = createProgressStore(storage);
    first.record('membandingkan', 5, NOW);
    expect(second.record('membandingkan', 2, LATER)).toEqual({ bestFirstTry: 5, completedAt: LATER.toISOString() });
  });

  it('keeps data in memory when the write throws', () => {
    const { storage } = memoryStorage();
    const full: StorageLike = {
      ...storage,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    };
    const store = createProgressStore(full);
    expect(() => store.record('membandingkan', 3, NOW)).not.toThrow();
    expect(() => store.record('senilai', 1, NOW)).not.toThrow();
    expect(Object.keys(store.all()).sort()).toEqual(['membandingkan', 'senilai']);
  });

  it('notifies subscribers when another tab changes the stored progress', () => {
    const { storage } = memoryStorage();
    const home = createProgressStore(storage);
    const other = createProgressStore(storage);
    const listener = vi.fn();
    const unsubscribe = home.subscribe(listener);
    other.record('senilai', 3, NOW);
    window.dispatchEvent(new StorageEvent('storage', { key: PROGRESS_KEY }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(home.all().senilai.bestFirstTry).toBe(3);
    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage', { key: PROGRESS_KEY }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores storage events for other keys', () => {
    const home = createProgressStore(memoryStorage().storage);
    const listener = vi.fn();
    const unsubscribe = home.subscribe(listener);
    window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }));
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('empties after another tab clears the storage', () => {
    const { storage } = memoryStorage();
    const home = createProgressStore(storage);
    home.record('senilai', 3, NOW);
    const unsubscribe = home.subscribe(() => {});
    createProgressStore(storage).clear();
    window.dispatchEvent(new StorageEvent('storage', { key: PROGRESS_KEY }));
    expect(home.all()).toEqual({});
    unsubscribe();
  });

  it('does not resurrect stamps that another store cleared', () => {
    const { storage, data } = memoryStorage();
    createProgressStore(storage).record('a', 3, NOW);
    const first = createProgressStore(storage);
    expect(Object.keys(first.all())).toEqual(['a']);
    createProgressStore(storage).clear();
    first.record('b', 2, LATER);
    expect(Object.keys(JSON.parse(data[PROGRESS_KEY]))).toEqual(['b']);
    expect(Object.keys(first.all())).toEqual(['b']);
  });

  it('all() reflects another store write without any event', () => {
    const { storage } = memoryStorage();
    const home = createProgressStore(storage);
    expect(home.all()).toEqual({});
    createProgressStore(storage).record('senilai', 4, NOW);
    expect(home.all().senilai.bestFirstTry).toBe(4);
    createProgressStore(storage).clear();
    expect(home.all()).toEqual({});
  });

  it('retries unsaved records into storage once writes work again', () => {
    const { storage, data } = memoryStorage();
    let failing = true;
    const flaky: StorageLike = {
      ...storage,
      setItem: (key, value) => {
        if (failing) throw new DOMException('full', 'QuotaExceededError');
        storage.setItem(key, value);
      },
    };
    const store = createProgressStore(flaky);
    store.record('a', 3, NOW);
    expect(PROGRESS_KEY in data).toBe(false);
    expect(store.all().a.bestFirstTry).toBe(3);
    failing = false;
    store.record('b', 1, LATER);
    expect(Object.keys(JSON.parse(data[PROGRESS_KEY])).sort()).toEqual(['a', 'b']);
  });

  it('keeps memory when the storage event arrives but reading throws', () => {
    const { storage } = memoryStorage();
    let blocked = false;
    const flaky: StorageLike = {
      ...storage,
      getItem: (key) => {
        if (blocked) throw new Error('blocked');
        return storage.getItem(key);
      },
    };
    const store = createProgressStore(flaky);
    store.record('a', 3, NOW);
    const unsubscribe = store.subscribe(() => {});
    blocked = true;
    window.dispatchEvent(new StorageEvent('storage', { key: PROGRESS_KEY }));
    expect(store.all().a.bestFirstTry).toBe(3);
    unsubscribe();
  });

  it('treats corrupt stored data as empty on re-read', () => {
    const { storage, data } = memoryStorage();
    const store = createProgressStore(storage);
    store.record('a', 3, NOW);
    data[PROGRESS_KEY] = '{not json';
    expect(store.all()).toEqual({});
  });

  it('a throwing listener does not stop the others', () => {
    const store = createProgressStore(memoryStorage().storage);
    const after = vi.fn();
    const unsubscribeBad = store.subscribe(() => {
      throw new Error('boom');
    });
    const unsubscribeGood = store.subscribe(after);
    window.dispatchEvent(new StorageEvent('storage', { key: PROGRESS_KEY }));
    expect(after).toHaveBeenCalledTimes(1);
    unsubscribeBad();
    unsubscribeGood();
  });
});
