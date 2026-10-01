<script lang="ts">
  import { tick } from 'svelte';
  import { dropTarget } from '../lib/drag/actions';
  import { announce } from '../lib/drag/announce';
  import { DragController } from '../lib/drag/controller';
  import { prefersReducedMotion } from '../lib/motion';
  import DragCard from './DragCard.svelte';
  import { PILE, pileCards, placeCard, type Card, type Placement, type Slot } from './cardSlots';

  type Props = {
    cards: Card[];
    slots: Slot[];
    placement: Placement;
    onplace: (placement: Placement) => void;
    locked?: boolean;
  };

  let { cards, slots, placement, onplace, locked = false }: Props = $props();

  let root: HTMLElement | undefined = $state();
  const before = new Map<string, DOMRect>();

  const controller = new DragController({
    announce,
    onDrop: ({ itemId, targetId }) => {
      const hadFocus = document.activeElement?.closest('[data-card]')?.getAttribute('data-card') === itemId;
      onplace(placeCard(placement, itemId, targetId));
      if (hadFocus) {
        tick().then(() => {
          const el = root?.querySelector<HTMLElement>(`[data-card="${itemId}"]`);
          if (el && document.activeElement !== el) el.focus();
        });
      }
    },
  });

  $effect.pre(() => {
    void placement;
    before.clear();
    if (!locked || !root) return;
    for (const el of root.querySelectorAll('[data-card]')) {
      before.set(el.getAttribute('data-card')!, el.getBoundingClientRect());
    }
  });

  $effect(() => {
    void placement;
    if (!locked || !root || before.size === 0) return;
    const skip = prefersReducedMotion();
    for (const el of root.querySelectorAll('[data-card]')) {
      const from = before.get(el.getAttribute('data-card')!);
      if (!from || skip) continue;
      const to = el.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 250, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      );
    }
    before.clear();
  });

  const byId = $derived(new Map(cards.map((card) => [card.id, card])));
  const pile = $derived(pileCards(cards.map((card) => card.id), placement));
</script>

{#snippet cardView(card: Card)}
  <DragCard {card} {controller} {locked} />
{/snippet}

<div class="card-slots" bind:this={root}>
  <ol class="slots">
    {#each slots as slot (slot.id)}
      {@const cardId = placement[slot.id]}
      {@const card = cardId ? byId.get(cardId) : undefined}
      <li class="slot" data-testid={`slot-${slot.id}`} use:dropTarget={{ controller, id: slot.id, label: slot.label }}>
        <span class="slot-label">{slot.label}</span>
        {#if card}
          {@render cardView(card)}
        {/if}
      </li>
    {/each}
  </ol>
  <div class="pile" data-testid="pile" use:dropTarget={{ controller, id: PILE, label: 'tumpukan kartu' }}>
    {#each pile as id (id)}
      {@const card = byId.get(id)}
      {#if card}
        {@render cardView(card)}
      {/if}
    {/each}
  </div>
</div>

<style>
  .card-slots {
    display: grid;
    gap: 1em;
  }
  .slots {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6em;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .slot {
    flex: 1 1 96px;
    min-height: 128px;
    display: grid;
    grid-template-rows: auto 1fr;
    justify-items: center;
    align-items: center;
    padding: 0.3em;
    border: 3px dashed var(--ink-soft);
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.55);
  }
  .slot-label {
    font-size: 0.75em;
    font-weight: 600;
    color: var(--ink-soft);
  }
  .pile {
    min-height: 120px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.8em;
    align-items: center;
    padding: 0.5em;
    border: 2px dashed var(--grid);
    border-radius: var(--radius);
  }
  @media (min-width: 1600px) {
    .slot {
      min-height: 170px;
    }
  }
</style>
