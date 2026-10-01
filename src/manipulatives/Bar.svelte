<script lang="ts">
  import { tick } from 'svelte';
  import { draggable, dropTarget } from '../lib/drag/actions';
  import { announce } from '../lib/drag/announce';
  import { DragController } from '../lib/drag/controller';
  import { prefersReducedMotion } from '../lib/motion';
  import { spokenFraction } from '../lib/spoken';
  import { BAR, hitBox, normalizeStacking, notePlacement, pieceWidth, piecePosition, rowY, viewHeight, type BarRow, type Stacking } from './bar';

  type Props = {
    rows: BarRow[];
    stacking: Stacking;
    draggable?: boolean;
    note?: string;
    onstack?: (stacking: Stacking) => void;
  };

  let { rows, stacking, draggable: canDrag = false, note = '', onstack }: Props = $props();

  const PIECE = 'piece-';
  let instant = false;
  const lastPositions = new Map<string, { x: number; y: number }>();
  let svgWidth = $state(0);
  let root: HTMLElement | undefined = $state();

  const controller = new DragController({
    announce,
    onDrop: ({ itemId, targetId }) => {
      const pieceId = itemId.slice(PIECE.length);
      const hadFocus = document.activeElement?.closest('[data-piece]')?.getAttribute('data-piece') === pieceId;
      instant = true;
      onstack?.(normalizeStacking({ pieceOf: pieceId, onto: targetId }));
      tick().then(() => (instant = false));
      if (hadFocus) {
        tick().then(() => {
          const el = root?.querySelector<SVGElement>(`[data-piece="${pieceId}"]`);
          if (el && document.activeElement !== el) el.focus();
        });
      }
    },
  });

  $effect(() => {
    const skip = instant || prefersReducedMotion();
    for (const row of rows) {
      const next = piecePosition(rows, row.id, stacking);
      const previous = lastPositions.get(row.id);
      lastPositions.set(row.id, next);
      if (skip || !previous || (previous.x === next.x && previous.y === next.y)) continue;
      root?.querySelector(`[data-piece-pos="${row.id}"]`)?.animate(
        [
          { transform: `translate(${previous.x}px, ${previous.y}px)` },
          { transform: `translate(${next.x}px, ${next.y}px)` },
        ],
        { duration: 250, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      );
    }
  });

  function accepts(rowId: string): (itemId: string) => boolean {
    return (itemId) => itemId !== PIECE + rowId || stacking?.pieceOf === rowId;
  }

  const ordered = $derived(
    stacking
      ? [...rows.filter((row) => row.id !== stacking.pieceOf), ...rows.filter((row) => row.id === stacking.pieceOf)]
      : rows,
  );
  const stackedRow = $derived(stacking ? rows.find((row) => row.id === stacking.pieceOf) : undefined);
  const placedNote = $derived(
    stacking && stackedRow && note
      ? notePlacement(piecePosition(rows, stackedRow.id, stacking), pieceWidth(stackedRow.value), note)
      : null,
  );
</script>

<div class="bar-wrap" bind:this={root} bind:clientWidth={svgWidth}>
<svg
  class="bar"
  class:interactive={canDrag}
  viewBox={`0 0 ${BAR.viewWidth} ${viewHeight(rows.length)}`}
  role="group"
  aria-label="Pita pecahan"
>
  {#each rows as row, i (row.id)}
    {@const y = rowY(i)}
    <g data-row={row.id}>
      <rect
        class="whole"
        x={BAR.x0}
        {y}
        width={BAR.width}
        height={BAR.rowHeight}
        data-testid={`bar-target-${row.id}`}
        use:dropTarget={{ controller, id: row.id, label: `pita ${spokenFraction(row.value)}`, accepts: accepts(row.id) }}
      />
      {#each Array.from({ length: row.value.d - 1 }, (_, k) => k + 1) as k (k)}
        {@const x = BAR.x0 + (BAR.width * k) / row.value.d}
        <line class="divider" x1={x} x2={x} y1={y} y2={y + BAR.rowHeight} />
      {/each}
      {#if stacking?.pieceOf === row.id}
        <rect class="ghost" data-ghost x={BAR.x0 + 6} y={y + 6} width={Math.max(pieceWidth(row.value) - 12, 0)} height={BAR.rowHeight - 12} />
      {/if}
      <g class="label" aria-hidden="true">
        <text x={BAR.labelX} y={y + BAR.rowHeight / 2 - 8}>{row.value.n}</text>
        <line x1={BAR.labelX - 24} x2={BAR.labelX + 24} y1={y + BAR.rowHeight / 2} y2={y + BAR.rowHeight / 2} />
        <text x={BAR.labelX} y={y + BAR.rowHeight / 2 + 34}>{row.value.d}</text>
      </g>
    </g>
  {/each}

  {#each ordered as row (row.id)}
    {@const pos = piecePosition(rows, row.id, stacking)}
    {@const hit = hitBox(row.value, svgWidth)}
    <g class="piece-pos" data-piece-pos={row.id} style:transform={`translate(${pos.x}px, ${pos.y}px)`}>
      <g
        class="piece"
        data-piece={row.id}
        class:grab={canDrag}
        use:draggable={{ controller, id: PIECE + row.id, label: `Potongan ${spokenFraction(row.value)}`, disabled: !canDrag }}
      >
        <rect class="hit" x={hit.x} y={hit.y} width={hit.width} height={hit.height} />
        <rect width={pieceWidth(row.value)} height={BAR.rowHeight} style:fill={row.color} />
        {#each Array.from({ length: row.value.n - 1 }, (_, k) => k + 1) as k (k)}
          {@const x = (BAR.width * k) / row.value.d}
          <line class="divider" x1={x} x2={x} y1={0} y2={BAR.rowHeight} />
        {/each}
      </g>
    </g>
  {/each}

  {#if placedNote}
    <text class="note" class:inside={placedNote.anchor === 'end'} x={placedNote.x} y={placedNote.y} text-anchor={placedNote.anchor}>{note}</text>
  {/if}
</svg>
</div>

<style>
  .bar {
    display: block;
    width: 100%;
    height: auto;
    max-height: 62vh;
    overflow: visible;
  }
  .bar.interactive {
    touch-action: none;
  }
  .whole {
    fill: #fff;
    stroke: var(--ink);
    stroke-width: 4;
  }
  .whole:global([data-drop-hover]) {
    stroke: var(--blue);
    stroke-width: 6;
    stroke-dasharray: 14 6;
  }
  .divider {
    stroke: var(--ink);
    stroke-width: 3;
    stroke-dasharray: 8 8;
  }
  .ghost {
    fill: none;
    stroke: var(--red);
    stroke-width: 3;
    stroke-dasharray: 6 8;
  }
  .piece rect:not(.hit) {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .hit {
    fill: transparent;
    stroke: none;
    pointer-events: all;
  }
  .bar:has(:global([data-dragging])) .piece:not(:global([data-dragging])) rect:not(.hit) {
    opacity: 0.5;
  }
  .piece.grab {
    cursor: grab;
  }
  .piece:focus-visible rect:not(.hit) {
    stroke: var(--blue);
    stroke-width: 7;
  }
  .piece:global([data-dragging]) {
    cursor: grabbing;
    opacity: 0.92;
  }
  .label text {
    font: 700 36px var(--font-body);
    fill: var(--ink);
    text-anchor: middle;
  }
  .label line {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .note {
    font: 700 42px var(--font-hand);
    fill: var(--red);
  }
  .note.inside {
    stroke: #fff;
    stroke-width: 8px;
    paint-order: stroke;
    stroke-linejoin: round;
  }
</style>
