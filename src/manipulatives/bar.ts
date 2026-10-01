import { compare, type Fraction } from '../lib/fraction';

export type BarRow = { id: string; value: Fraction; color: string };
export type Stacking = { pieceOf: string; onto: string } | null;

export const BAR = {
  x0: 10,
  width: 820,
  rowHeight: 80,
  gap: 70,
  top: 40,
  labelX: 910,
  viewWidth: 1000,
} as const;

export function rowY(index: number): number {
  return BAR.top + index * (BAR.rowHeight + BAR.gap);
}

export function viewHeight(rowCount: number): number {
  return rowY(rowCount - 1) + BAR.rowHeight + 20;
}

export function pieceWidth(value: Fraction): number {
  return (BAR.width * value.n) / value.d;
}

export function piecePosition(rows: readonly BarRow[], rowId: string, stacking: Stacking): { x: number; y: number } {
  if (stacking && stacking.pieceOf === rowId) {
    const onto = rows.findIndex((row) => row.id === stacking.onto);
    if (onto >= 0) return { x: BAR.x0 + 8, y: rowY(onto) - 18 };
  }
  return { x: BAR.x0, y: rowY(rows.findIndex((row) => row.id === rowId)) };
}

export function normalizeStacking(stacking: { pieceOf: string; onto: string }): Stacking {
  return stacking.pieceOf === stacking.onto ? null : stacking;
}

export function stackNote(rows: readonly BarRow[], stacking: Stacking): string {
  if (!stacking) return '';
  const piece = rows.find((row) => row.id === stacking.pieceOf);
  const onto = rows.find((row) => row.id === stacking.onto);
  if (!piece || !onto) return '';
  const relation = compare(piece.value, onto.value);
  return relation > 0 ? 'lebih panjang!' : relation < 0 ? 'lebih pendek!' : 'pas sama!';
}

const MIN_TOUCH = 48;

export function hitBox(value: Fraction, svgWidth: number): { x: number; y: number; width: number; height: number } {
  const minUnits = svgWidth > 0 ? MIN_TOUCH / (svgWidth / BAR.viewWidth) : 0;
  const base = pieceWidth(value);
  const width = Math.max(base, minUnits);
  const height = Math.max(BAR.rowHeight, minUnits);
  return { x: (base - width) / 2, y: (BAR.rowHeight - height) / 2, width, height };
}

const NOTE_CHAR_WIDTH = 22;

export function notePlacement(
  position: { x: number; y: number },
  pieceW: number,
  note: string,
): { x: number; y: number; anchor: 'start' | 'end' } {
  const after = position.x + pieceW + 18;
  if (after + note.length * NOTE_CHAR_WIDTH <= BAR.labelX - 30) return { x: after, y: position.y + 4, anchor: 'start' };
  return { x: position.x + pieceW - 14, y: position.y + BAR.rowHeight / 2 + 14, anchor: 'end' };
}
