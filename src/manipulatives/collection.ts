export type CollectionState = { readonly bags: readonly number[]; readonly tray: number };

export const MARBLE_TRAY = 'marble-tray';
export const MAX_MARBLES = 24;
export const MAX_BAGS = 6;

export function bagId(index: number): string {
  return `bag-${index}`;
}

export function trayMarbleId(k: number): string {
  return `marble-${k}`;
}

export function bagMarbleId(bag: number): string {
  return `bag-${bag}-top`;
}

export function marbleSource(itemId: string): string {
  const match = /^bag-(\d+)-top$/.exec(itemId);
  return match ? bagId(Number(match[1])) : MARBLE_TRAY;
}

export function startCollection(total: number, bagCount: number): CollectionState {
  if (!Number.isInteger(total) || total < 0 || total > MAX_MARBLES) throw new RangeError(`invalid marble count: ${total}`);
  if (!Number.isInteger(bagCount) || bagCount < 1 || bagCount > MAX_BAGS) throw new RangeError(`invalid bag count: ${bagCount}`);
  return { bags: new Array<number>(bagCount).fill(0), tray: total };
}

function bagIndexOf(place: string): number {
  const match = /^bag-(\d+)$/.exec(place);
  return match ? Number(match[1]) : -1;
}

function countIn(state: CollectionState, place: string): number {
  if (place === MARBLE_TRAY) return state.tray;
  const index = bagIndexOf(place);
  return index >= 0 && index < state.bags.length ? state.bags[index] : -1;
}

export function canMoveMarble(state: CollectionState, from: string, to: string): boolean {
  return from !== to && countIn(state, from) > 0 && countIn(state, to) >= 0;
}

export function moveMarble(state: CollectionState, from: string, to: string): CollectionState {
  if (!canMoveMarble(state, from, to)) return state;
  const bags = [...state.bags];
  let tray = state.tray;
  if (from === MARBLE_TRAY) tray -= 1;
  else bags[bagIndexOf(from)] -= 1;
  if (to === MARBLE_TRAY) tray += 1;
  else bags[bagIndexOf(to)] += 1;
  return { bags, tray };
}

export function dealAll(total: number, bagCount: number): CollectionState {
  const start = startCollection(total, bagCount);
  if (total % bagCount !== 0) throw new RangeError(`${total} marbles do not split into ${bagCount} bags`);
  return { bags: start.bags.map(() => total / bagCount), tray: 0 };
}

export function isFairShare(state: CollectionState): boolean {
  return state.tray === 0 && state.bags.length > 0 && state.bags.every((count) => count === state.bags[0]);
}

export function takenCount(taken: readonly boolean[]): number {
  return taken.filter(Boolean).length;
}
