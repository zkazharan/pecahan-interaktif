<script lang="ts">
  import FractionText from '../components/FractionText.svelte';
  import MixedText from '../components/MixedText.svelte';
  import { draggable } from '../lib/drag/actions';
  import type { DragController } from '../lib/drag/controller';
  import { formatFraction, toMixed } from '../lib/fraction';
  import Circle from './Circle.svelte';
  import { cardLabel, type Card } from './cardSlots';

  type Props = { card: Card; controller: DragController; locked?: boolean; small?: boolean };

  let { card, controller, locked = false, small = false }: Props = $props();

  const face = $derived(card.face ?? { kind: 'fraction' as const });
  const mixed = $derived(toMixed(card.value));
</script>

<div
  class="card"
  class:small
  class:shape={face.kind === 'shape'}
  class:accented={!!card.accent}
  style:--accent={card.accent}
  data-card={card.id}
  data-value={formatFraction(card.value)}
  use:draggable={{ controller, id: card.id, label: cardLabel(card), disabled: locked }}
>
  {#if face.kind === 'shape'}
    <Circle slices={face.slices} shaded={face.shaded} label={face.description} size="fill" decorative />
  {:else if face.kind === 'mixed'}
    <MixedText whole={mixed.whole} rest={mixed.rest} size={small ? 'md' : 'lg'} />
  {:else}
    <FractionText value={card.value} size={small ? 'md' : 'lg'} />
  {/if}
</div>

<style>
  .card {
    width: 80px;
    height: 96px;
    display: grid;
    place-items: center;
    border: var(--line) solid var(--ink);
    border-radius: var(--radius);
    background: #fff;
    box-shadow: 4px 4px 0 var(--ink);
    cursor: grab;
    user-select: none;
  }
  .card.small {
    width: 64px;
    height: 80px;
  }
  .card.shape {
    width: 128px;
    height: 128px;
    padding: 6px;
  }
  .card.accented {
    border-top: 10px solid var(--accent);
  }
  .card:global([aria-disabled='true']) {
    cursor: default;
    box-shadow: none;
  }
  .card:global([data-dragging]) {
    cursor: grabbing;
    box-shadow: 8px 10px 0 rgba(27, 42, 68, 0.35);
    rotate: 4deg;
    z-index: 10;
    position: relative;
  }
  @media (min-width: 1600px) {
    .card {
      width: 112px;
      height: 132px;
    }
    .card.small {
      width: 88px;
      height: 108px;
    }
    .card.shape {
      width: 200px;
      height: 200px;
      padding: 8px;
    }
  }
</style>
