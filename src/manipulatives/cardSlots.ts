import type { Fraction } from '../lib/fraction';

export type Card = { id: string; value: Fraction };
export type Slot = { id: string; label: string };
export type Placement = Readonly<Record<string, string | null>>;

export const PILE = 'pile';

export function emptyPlacement(slotIds: readonly string[]): Placement {
  return Object.fromEntries(slotIds.map((id) => [id, null]));
}

export function slotOf(placement: Placement, cardId: string): string | null {
  for (const [slot, card] of Object.entries(placement)) {
    if (card === cardId) return slot;
  }
  return null;
}

export function placeCard(placement: Placement, cardId: string, targetId: string): Placement {
  const next: Record<string, string | null> = { ...placement };
  const from = slotOf(placement, cardId);
  if (targetId === PILE) {
    if (from) next[from] = null;
    return next;
  }
  if (!Object.hasOwn(placement, targetId)) throw new RangeError(`unknown slot: ${targetId}`);
  if (from === targetId) return next;
  const displaced = placement[targetId];
  next[targetId] = cardId;
  if (from) next[from] = displaced;
  return next;
}

export function pileCards(cardIds: readonly string[], placement: Placement): string[] {
  const placed = new Set(Object.values(placement).filter((id): id is string => id !== null));
  return cardIds.filter((id) => !placed.has(id));
}
