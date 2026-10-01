<script lang="ts">
  import { draggable, dropTarget } from '../lib/drag/actions';
  import { announce } from '../lib/drag/announce';
  import { DragController } from '../lib/drag/controller';
  import { spokenFraction } from '../lib/spoken';
  import { BAR, normalizeStacking, pieceWidth, piecePosition, rowY, viewHeight, type BarRow, type Stacking } from './bar';

  type Props = {
    rows: BarRow[];
    stacking: Stacking;
    draggable?: boolean;
    note?: string;
    onstack?: (stacking: Stacking) => void;
  };

  let { rows, stacking, draggable: canDrag = false, note = '', onstack }: Props = $props();

  const PIECE = 'piece-';
  let instant = $state(false);

  const controller = new DragController({
    announce,
    onDrop: ({ itemId, targetId }) => {
      instant = true;
      onstack?.(normalizeStacking({ pieceOf: itemId.slice(PIECE.length), onto: targetId }));
    },
  });

  $effect(() => {
    if (!instant) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => (instant = false));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  });

  function accepts(rowId: string): (itemId: string) => boolean {
    return (itemId) => itemId !== PIECE + rowId || stacking?.pieceOf === rowId;
  }

  const stackedRow = $derived(stacking ? rows.find((row) => row.id === stacking.pieceOf) : undefined);
  const notePosition = $derived(stacking && stackedRow ? piecePosition(rows, stackedRow.id, stacking) : null);
</script>

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

  {#each rows as row (row.id)}
    {@const pos = piecePosition(rows, row.id, stacking)}
    <g class="piece-pos" class:instant style:transform={`translate(${pos.x}px, ${pos.y}px)`}>
      <g
        class="piece"
        class:grab={canDrag}
        use:draggable={{ controller, id: PIECE + row.id, label: `Potongan ${spokenFraction(row.value)}`, disabled: !canDrag }}
      >
        <rect width={pieceWidth(row.value)} height={BAR.rowHeight} style:fill={row.color} />
        {#each Array.from({ length: row.value.n - 1 }, (_, k) => k + 1) as k (k)}
          {@const x = (BAR.width * k) / row.value.d}
          <line class="divider" x1={x} x2={x} y1={0} y2={BAR.rowHeight} />
        {/each}
      </g>
    </g>
  {/each}

  {#if note && stackedRow && notePosition}
    <text class="note" x={notePosition.x + pieceWidth(stackedRow.value) + 18} y={notePosition.y + 4}>{note}</text>
  {/if}
</svg>

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
  .piece rect {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .piece.grab {
    cursor: grab;
  }
  .piece:focus-visible rect {
    stroke: var(--blue);
    stroke-width: 7;
  }
  .piece:global([data-dragging]) {
    cursor: grabbing;
    opacity: 0.92;
  }
  .piece-pos {
    transition: transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .piece-pos.instant {
    transition: none;
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
</style>
