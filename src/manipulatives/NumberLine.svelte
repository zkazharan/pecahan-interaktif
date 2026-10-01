<script lang="ts">
  import { dropTarget } from '../lib/drag/actions';
  import DragCard from './DragCard.svelte';
  import { createCardDrop } from './cardDrop';
  import { PILE, pileCards, type Card, type Placement } from './cardSlots';
  import { LINE, staggerRows, tickIds, tickIndexOf, tickX } from './numberLine';

  type Props = {
    max: number;
    perUnit: number;
    cards: Card[];
    placement: Placement;
    onplace: (placement: Placement) => void;
    locked?: boolean;
  };

  let { max, perUnit, cards, placement, onplace, locked = false }: Props = $props();

  let root: HTMLElement | undefined = $state();

  const controller = createCardDrop({ getPlacement: () => placement, onplace: (next) => onplace(next), getRoot: () => root });

  const ticks = $derived(tickIds(max, perUnit));
  const total = $derived(max * perUnit);
  const byId = $derived(new Map(cards.map((card) => [card.id, card])));
  const pile = $derived(pileCards(cards.map((card) => card.id), placement));
  const placed = $derived(
    ticks.flatMap((id) => {
      const cardId = placement[id];
      const card = cardId ? byId.get(cardId) : undefined;
      return card ? [{ index: tickIndexOf(id), card }] : [];
    }),
  );
  const rows = $derived(staggerRows(placed.map((p) => p.index), total));

  function left(k: number): string {
    return `${(tickX(k, max, perUnit) / LINE.viewWidth) * 100}%`;
  }

  function targetWidth(k: number): string {
    const division = LINE.width / total / LINE.viewWidth;
    return `${(k === 0 || k === total ? division / 2 : division) * 100}%`;
  }
</script>

<div class="number-line" bind:this={root}>
  <div class="line-area">
    <div class="pins">
      {#each placed as p, i (p.card.id)}
        <div class="pin" class:high={rows[i] === 1} style:left={left(p.index)}>
          <DragCard card={p.card} {controller} {locked} small />
        </div>
      {/each}
    </div>
    <svg class="axis-svg" viewBox={`0 0 ${LINE.viewWidth} ${LINE.viewHeight}`} aria-hidden="true">
      <line class="axis" x1={LINE.x0} x2={LINE.x0 + LINE.width} y1={LINE.y} y2={LINE.y} />
      {#each ticks as id, k (id)}
        {@const x = tickX(k, max, perUnit)}
        {@const major = k % perUnit === 0}
        <line class="tick" class:major x1={x} x2={x} y1={LINE.y - (major ? LINE.majorHalf : LINE.tickHalf)} y2={LINE.y + (major ? LINE.majorHalf : LINE.tickHalf)} />
        {#if major}
          <text class="unit" {x} y={LINE.labelY}>{k / perUnit}</text>
        {/if}
      {/each}
    </svg>
    {#each ticks as id, k (id)}
      <div
        class="tick-target"
        data-tick={id}
        data-edge={k === 0 ? 'start' : k === total ? 'end' : undefined}
        style:left={left(k)}
        style:width={targetWidth(k)}
        use:dropTarget={{ controller, id, label: `tanda ke-${k} dari ${total}` }}
      ></div>
    {/each}
  </div>
  <div class="pile" data-testid="line-pile" use:dropTarget={{ controller, id: PILE, label: 'tumpukan kartu' }}>
    {#each pile as id (id)}
      {@const card = byId.get(id)}
      {#if card}
        <DragCard {card} {controller} {locked} />
      {/if}
    {/each}
  </div>
</div>

<style>
  .number-line {
    --pin-half: 32px;
    display: grid;
    gap: 1em;
    padding-inline: max(0px, calc((var(--pin-half) - 0.05 * 100%) / 0.9));
  }
  .line-area {
    --pin-card: 80px;
    position: relative;
    container-type: inline-size;
  }
  .pins {
    position: relative;
    height: calc(2 * var(--pin-card) + 40px);
    margin-bottom: -4cqw;
  }
  .pin {
    position: absolute;
    bottom: 0;
    translate: -50% 0;
    display: grid;
    justify-items: center;
  }
  .pin::after {
    content: '';
    width: 3px;
    height: 8px;
    background: var(--ink);
  }
  .pin.high::after {
    height: calc(var(--pin-card) + 24px);
  }
  .pin:has(:global([data-dragging])) {
    z-index: 20;
  }
  .axis-svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .axis {
    stroke: var(--ink);
    stroke-width: 5;
    stroke-linecap: round;
  }
  .tick {
    stroke: var(--ink);
    stroke-width: 3;
  }
  .tick.major {
    stroke-width: 5;
  }
  .unit {
    font: 700 34px var(--font-body);
    fill: var(--ink);
    text-anchor: middle;
  }
  .tick-target {
    position: absolute;
    top: 0;
    bottom: 0;
    translate: -50% 0;
    pointer-events: none;
  }
  .tick-target[data-edge='start'] {
    translate: 0;
  }
  .tick-target[data-edge='end'] {
    translate: -100% 0;
  }
  .tick-target:global([data-drop-hover]) {
    outline: none;
    background: rgba(29, 78, 216, 0.14);
  }
  @media (min-width: 1600px) {
    .number-line {
      --pin-half: 44px;
    }
    .line-area {
      --pin-card: 108px;
    }
  }
  .pile {
    min-height: 110px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.8em;
    align-items: center;
    padding: 0.5em;
    border: 2px dashed var(--grid);
    border-radius: var(--radius);
  }
</style>
