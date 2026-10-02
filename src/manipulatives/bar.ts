import { compare, type Fraction } from '../lib/fraction';

export type BarRow = { id: string; value: Fraction; color: string; cut?: number; wholes?: number; hideLabel?: boolean; caption?: string };
export type Stacking = { pieceOf: string; onto: string } | null;

export const MAX_PARTS = 24;

export function maxCut(d: number): number {
  return Math.min(6, Math.floor(MAX_PARTS / d));
}

export const BAR = {
  x0: 10,
  width: 820,
  rowHeight: 80,
  gap: 70,
  top: 40,
  labelX: 910,
  viewWidth: 1000,
} as const;

function round(value: number): number {
  return Number(value.toFixed(3));
}

const CAPTION_LEAD = 44;
const CAPTION_EXTRA_GAP = 20;
const CAPTION_BASE_SIZE = 30;
const CAPTION_MIN_PX = 16;
const CAPTION_MAX_SIZE = 56;
const CAPTION_BASELINE = 34;
const CAPTION_CHAR_RATIO = 0.6;

export function rowY(index: number, captioned = false): number {
  return BAR.top + (captioned ? CAPTION_LEAD : 0) + index * (BAR.rowHeight + BAR.gap + (captioned ? CAPTION_EXTRA_GAP : 0));
}

export function viewHeight(rowCount: number, captioned = false): number {
  return rowY(rowCount - 1, captioned) + BAR.rowHeight + 20;
}

export function hasCaptions(rows: readonly BarRow[]): boolean {
  return rows.some((row) => row.caption);
}

export function captionMetrics(renderedWidth: number): { fontSize: number; baseline: number } {
  const wanted = renderedWidth > 0 ? Math.ceil((CAPTION_MIN_PX * BAR.viewWidth) / renderedWidth) : CAPTION_BASE_SIZE;
  return { fontSize: Math.min(CAPTION_MAX_SIZE, Math.max(CAPTION_BASE_SIZE, wanted)), baseline: CAPTION_BASELINE };
}

export function captionEnd(caption: string, fontSize: number): number {
  return BAR.x0 + caption.length * fontSize * CAPTION_CHAR_RATIO;
}

function atLeastOne(count: number | undefined): number {
  return count !== undefined && Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
}

export function cutOf(row: BarRow): number {
  return atLeastOne(row.cut);
}

export function wholesOf(row: BarRow): number {
  return atLeastOne(row.wholes);
}

export function barUnits(rows: readonly BarRow[]): number {
  return Math.max(1, ...rows.map(wholesOf));
}

export function unitWidth(units: number): number {
  return BAR.width / units;
}

export function pieceWidth(value: Fraction, units = 1): number {
  return (unitWidth(units) * value.n) / value.d;
}

export function shownValue(row: BarRow): Fraction {
  const k = cutOf(row);
  return { n: row.value.n * k, d: row.value.d * k };
}

export function dividerXs(row: BarRow, units: number): number[] {
  const parts = shownValue(row).d;
  const step = unitWidth(units) / parts;
  const total = parts * wholesOf(row);
  return Array.from({ length: total - 1 }, (_, i) => i + 1)
    .filter((j) => j % parts !== 0)
    .map((j) => round(step * j));
}

export function wholeXs(row: BarRow, units: number): number[] {
  return Array.from({ length: wholesOf(row) - 1 }, (_, i) => round(unitWidth(units) * (i + 1)));
}

export function pieceDividerXs(row: BarRow, units: number): number[] {
  const shown = shownValue(row);
  const step = unitWidth(units) / shown.d;
  return Array.from({ length: Math.max(shown.n - 1, 0) }, (_, i) => round(step * (i + 1)));
}

export function piecePosition(rows: readonly BarRow[], rowId: string, stacking: Stacking): { x: number; y: number } {
  const captioned = hasCaptions(rows);
  if (stacking && stacking.pieceOf === rowId) {
    const onto = rows.findIndex((row) => row.id === stacking.onto);
    if (onto >= 0) return { x: BAR.x0 + 8, y: rowY(onto, captioned) - 18 };
  }
  return { x: BAR.x0, y: rowY(rows.findIndex((row) => row.id === rowId), captioned) };
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

const LABEL_BASE_SIZE = 36;
const LABEL_MIN_PX = 18;
const LABEL_MAX_SIZE = 64;

export function labelMetrics(renderedWidth: number): { fontSize: number; gapAbove: number; gapBelow: number; half: number } {
  const wanted = renderedWidth > 0 ? Math.ceil((LABEL_MIN_PX * BAR.viewWidth) / renderedWidth) : LABEL_BASE_SIZE;
  const fontSize = Math.min(LABEL_MAX_SIZE, Math.max(LABEL_BASE_SIZE, wanted));
  const scale = fontSize / LABEL_BASE_SIZE;
  return { fontSize, gapAbove: 8 * scale, gapBelow: 34 * scale, half: 24 * scale };
}

const MIN_TOUCH = 48;

export type BarSize = { width: number; height: number; rows: number; captioned?: boolean };

function renderScale(size: BarSize): number {
  const scales = [size.width / BAR.viewWidth];
  if (size.height > 0 && size.rows > 0) scales.push(size.height / viewHeight(size.rows, size.captioned));
  const positive = scales.filter((scale) => scale > 0);
  return positive.length > 0 ? Math.min(...positive) : 0;
}

export function hitBox(
  value: Fraction,
  size: BarSize,
  units = 1,
): { x: number; y: number; width: number; height: number } {
  const scale = renderScale(size);
  const minUnits = scale > 0 ? MIN_TOUCH / scale : 0;
  const base = pieceWidth(value, units);
  const width = Math.max(base, minUnits);
  const height = Math.max(BAR.rowHeight, minUnits);
  return { x: (base - width) / 2, y: (BAR.rowHeight - height) / 2, width, height };
}

export function visibleTranslate(transform: string): { x: number; y: number } | null {
  const match = /^matrix(3d)?\(([^)]*)\)$/.exec(transform.trim());
  if (!match) return null;
  const values = match[2].split(',').map(Number);
  const [x, y] = match[1] ? [values[12], values[13]] : [values[4], values[5]];
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

const NOTE_BASE_SIZE = 42;
const NOTE_MIN_PX = 18;
const NOTE_MAX_SIZE = 72;
const NOTE_CHAR_WIDTH = 22;

export function noteMetrics(renderedWidth: number): { fontSize: number; charWidth: number } {
  const wanted = renderedWidth > 0 ? Math.ceil((NOTE_MIN_PX * BAR.viewWidth) / renderedWidth) + 1 : NOTE_BASE_SIZE;
  const fontSize = Math.min(NOTE_MAX_SIZE, Math.max(NOTE_BASE_SIZE, wanted));
  return { fontSize, charWidth: (NOTE_CHAR_WIDTH * fontSize) / NOTE_BASE_SIZE };
}

export function notePlacement(
  position: { x: number; y: number },
  pieceW: number,
  note: string,
  charWidth = NOTE_CHAR_WIDTH,
  minX = 0,
): { x: number; y: number; anchor: 'start' | 'end' } {
  const after = Math.max(position.x + pieceW + 18, minX);
  if (after + note.length * charWidth <= BAR.labelX - 30) return { x: after, y: position.y + 4, anchor: 'start' };
  return { x: position.x + pieceW - 14, y: position.y + BAR.rowHeight / 2 + (14 * charWidth) / NOTE_CHAR_WIDTH, anchor: 'end' };
}
