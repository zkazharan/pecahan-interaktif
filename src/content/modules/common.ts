import { parseFraction, type Fraction } from '../../lib/fraction';
import { parseField, withinLimits, type FractionLimits } from '../../lib/limits';
import type { Slot } from '../../manipulatives/cardSlots';

export const PICK_SLOTS: Slot[] = [{ id: 'pilihan', label: 'Pilihanmu' }];

export function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export function readCount(raw: string | undefined, min: number, max: number, fallback: number): number {
  const parsed = parseField(raw ?? '');
  return parsed !== null && parsed >= min && parsed <= max ? parsed : fallback;
}

export function readFraction(raw: string | undefined, limits: FractionLimits, fallback: Fraction): Fraction {
  const parsed = parseFraction(raw ?? '');
  return parsed && withinLimits(parsed, limits) ? parsed : fallback;
}
