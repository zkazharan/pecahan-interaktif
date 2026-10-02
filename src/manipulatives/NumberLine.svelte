<script lang="ts">
  import FractionText from '../components/FractionText.svelte';
  import { formatFraction } from '../lib/fraction';
  import { dropTarget } from '../lib/drag/actions';
  import DragCard from './DragCard.svelte';
  import { createCardDrop } from './cardDrop';
  import { useCardFlip } from './cardFlip.svelte';
  import { PILE, pileCards, type Card, type Placement } from './cardSlots';
  import { LINE, staggerRows, tickIds, tickIndexOf, tickValue, tickX } from './numberLine';

  type Mark = { perUnit: number; color: string; side: 'above' | 'below' };

  type Props = {
    max: number;
    perUnit: number;
    cards: Card[];
    placement: Placement;
    onplace: (placement: Placement) => void;
    locked?: boolean;
    marks?: Mark[];
    showValues?: boolean;
  };

  let { max, perUnit, cards, placement, onplace, locked = false, marks = [], showValues = false }: Props = $props();

  let root: HTMLElement | undefined = $state();

  const flip = useCardFlip(() => root, () => placement);

  const controller = createCardDrop({
    getPlacement: () => placement,
    onplace: (next) => onplace(next),
    getRoot: () => root,
    onUserDrop: flip.markUserDrop,
  });

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

  const hasBelow = $derived(marks.some((mark) => mark.side === 'below'));
  const markSets = $derived(
    marks.map((mark) => ({
      ...mark,
      xs: Array.from({ length: max * mark.perUnit + 1 }, (_, k) => tickX(k, max, mark.perUnit)),
      y1: mark.side === 'above' ? LINE.y - LINE.majorHalf - LINE.markGap - LINE.markLength : LINE.y + LINE.majorHalf + LINE.markGap,
    })),
  );

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
      {/each}
      {#each markSets as set, i (i)}
        {#each set.xs as x (x)}
          <line class="mark" data-side={set.side} x1={x} x2={x} y1={set.y1} y2={set.y1 + LINE.markLength} style:stroke={set.color} />
        {/each}
      {/each}
    </svg>
    <div class="labels" class:tight={!hasBelow} aria-hidden="true">
      {#each ticks as id, k (id)}
        {#if k % perUnit === 0}
          <span class="unit" style:left={left(k)}>{k / perUnit}</span>
        {/if}
      {/each}
    </div>
    {#if showValues}
      <div class="placed-values" class:two-rows={rows.includes(1)} aria-hidden="true">
        {#each placed as p, i (p.card.id)}
          {@const value = tickValue(p.index, perUnit)}
          <span
            class="placed-value"
            class:low={rows[i] === 1}
            data-placed-value={formatFraction(value)}
            data-value-row={rows[i]}
            style:left={left(p.index)}
          >
            <FractionText {value} size="sm" />
          </span>
        {/each}
      </div>
    {/if}
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
  {#if !locked || pile.length > 0}
    <div class="pile" data-testid="line-pile" use:dropTarget={{ controller, id: PILE, label: 'tumpukan kartu' }}>
      {#each pile as id (id)}
        {@const card = byId.get(id)}
        {#if card}
          <DragCard {card} {controller} {locked} />
        {/if}
      {/each}
    </div>
  {/if}
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
    margin-bottom: -5.2cqw;
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
  .mark {
    stroke-width: 8;
    stroke-linecap: round;
  }
  .labels {
    position: relative;
    height: 1.5em;
    font: 700 20px/1.5 var(--font-body);
    color: var(--ink);
  }
  .labels.tight {
    margin-top: -3cqw;
  }
  .unit {
    position: absolute;
    top: 0;
    translate: -50% 0;
  }
  .placed-values {
    position: relative;
    height: 3.2em;
  }
  .placed-values.two-rows {
    height: 5em;
  }
  .placed-value {
    position: absolute;
    top: 0;
    translate: -50% 0;
    color: var(--red);
  }
  .placed-value.low {
    top: 2.2em;
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
    .labels {
      font-size: 30px;
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
