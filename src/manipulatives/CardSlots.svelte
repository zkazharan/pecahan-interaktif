<script lang="ts">
  import { dropTarget } from '../lib/drag/actions';
  import DragCard from './DragCard.svelte';
  import { createCardDrop } from './cardDrop';
  import { useCardFlip } from './cardFlip.svelte';
  import { PILE, pileCards, type Card, type Placement, type Slot } from './cardSlots';

  type Props = {
    cards: Card[];
    slots: Slot[];
    placement: Placement;
    onplace: (placement: Placement) => void;
    locked?: boolean;
  };

  let { cards, slots, placement, onplace, locked = false }: Props = $props();

  let root: HTMLElement | undefined = $state();
  const flip = useCardFlip(() => root, () => placement);

  const controller = createCardDrop({
    getPlacement: () => placement,
    onplace: (next) => onplace(next),
    getRoot: () => root,
    onUserDrop: flip.markUserDrop,
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
    row-gap: 0.5em;
    padding: 0.4em 0.3em 0.9em;
    border: 3px dashed var(--ink-soft);
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.55);
  }
  .slot-label {
    position: relative;
    z-index: 1;
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
