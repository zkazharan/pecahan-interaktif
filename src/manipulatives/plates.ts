export type PlatesState = { readonly plates: readonly number[]; readonly tray: number };

export const TRAY = 'tray';

export function plateId(index: number): string {
  return `plate-${index}`;
}

export function trayItemId(k: number): string {
  return `tray-${k}`;
}

export function plateItemId(plate: number, k: number): string {
  return `plate-${plate}-${k}`;
}

export function sourceOf(itemId: string): string {
  const match = /^plate-(\d+)-\d+$/.exec(itemId);
  return match ? plateId(Number(match[1])) : TRAY;
}

export function startPlates(pieces: number, plateCount: number): PlatesState {
  if (!Number.isInteger(pieces) || pieces < 0) throw new RangeError(`invalid piece count: ${pieces}`);
  if (!Number.isInteger(plateCount) || plateCount < 1) throw new RangeError(`invalid plate count: ${plateCount}`);
  return { plates: new Array<number>(plateCount).fill(0), tray: pieces };
}

function plateIndexOf(place: string): number {
  const match = /^plate-(\d+)$/.exec(place);
  return match ? Number(match[1]) : -1;
}

function countIn(state: PlatesState, place: string): number {
  if (place === TRAY) return state.tray;
  const index = plateIndexOf(place);
  return index >= 0 && index < state.plates.length ? state.plates[index] : -1;
}

export function canMove(state: PlatesState, from: string, to: string, capacity: number): boolean {
  if (from === to || countIn(state, from) <= 0) return false;
  if (to === TRAY) return true;
  const count = countIn(state, to);
  return count >= 0 && count < capacity;
}

export function movePiece(state: PlatesState, from: string, to: string, capacity: number): PlatesState {
  if (!canMove(state, from, to, capacity)) return state;
  const plates = [...state.plates];
  let tray = state.tray;
  if (from === TRAY) tray -= 1;
  else plates[plateIndexOf(from)] -= 1;
  if (to === TRAY) tray += 1;
  else plates[plateIndexOf(to)] += 1;
  return { plates, tray };
}

export function fullPlates(state: PlatesState, capacity: number): number {
  return state.plates.filter((count) => count === capacity).length;
}

export function totalPieces(state: PlatesState): number {
  return state.plates.reduce((sum, count) => sum + count, state.tray);
}

export function fillGreedy(pieces: number, plateCount: number, capacity: number): PlatesState {
  let remaining = pieces;
  const plates = Array.from({ length: plateCount }, () => {
    const count = Math.min(capacity, remaining);
    remaining -= count;
    return count;
  });
  return { plates, tray: remaining };
}
