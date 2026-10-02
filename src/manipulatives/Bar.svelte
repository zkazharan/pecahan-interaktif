<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { draggable, dropTarget } from '../lib/drag/actions';
  import { announce } from '../lib/drag/announce';
  import { DragController } from '../lib/drag/controller';
  import { prefersReducedMotion } from '../lib/motion';
  import { spokenFraction } from '../lib/spoken';
  import {
    BAR,
    barUnits,
    captionEnd,
    captionMetrics,
    hasCaptions,
    labelMetrics,
    dividerXs,
    hitBox,
    noteMetrics,
    normalizeStacking,
    notePlacement,
    pieceDividerXs,
    pieceWidth,
    piecePosition,
    rowY,
    shownValue,
    stackNote,
    unitWidth,
    viewHeight,
    visibleTranslate,
    wholeXs,
    wholesOf,
    type BarRow,
    type Stacking,
  } from './bar';

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
  const fade = { on: false };
  let svgWidth = $state(0);
  let svgHeight = $state(0);
  let root: HTMLElement | undefined = $state();

  const units = $derived(barUnits(rows));
  const captioned = $derived(hasCaptions(rows));
  const size = $derived({ width: svgWidth, height: svgHeight, rows: rows.length, captioned });
  const label = $derived(labelMetrics(svgWidth));
  const caption = $derived(captionMetrics(svgWidth));
  const noteSize = $derived(noteMetrics(svgWidth));

  onMount(() => {
    fade.on = true;
  });

  let stackMessage = '';

  function spokenRow(row: BarRow, noun: string): string {
    return row.hideLabel ? noun : `${noun} ${spokenFraction(shownValue(row))}`;
  }

  function stackAnnouncement(next: Stacking): string {
    const comparison = stackNote(rows, next).replace(/!$/, '');
    const piece = rows.find((row) => row.id === next?.pieceOf);
    const onto = rows.find((row) => row.id === next?.onto);
    return comparison && piece && onto ? `${spokenRow(piece, 'Potongan')} ditaruh di atas ${spokenRow(onto, 'pita')}, ${comparison}.` : '';
  }

  const controller = new DragController({
    announce: (message) => {
      announce(stackMessage || message);
      stackMessage = '';
    },
    onDrop: ({ itemId, targetId }) => {
      const pieceId = itemId.slice(PIECE.length);
      const hadFocus = document.activeElement?.closest('[data-piece]')?.getAttribute('data-piece') === pieceId;
      const next = normalizeStacking({ pieceOf: pieceId, onto: targetId });
      stackMessage = stackAnnouncement(next);
      queueMicrotask(() => (stackMessage = ''));
      instant = true;
      onstack?.(next);
      tick().then(() => (instant = false));
      if (hadFocus) {
        tick().then(() => {
          const el = root?.querySelector<SVGElement>(`[data-piece="${pieceId}"]`);
          if (el && document.activeElement !== el) el.focus();
        });
      }
    },
  });

  function runningOn(element: Element | null | undefined): Animation[] {
    return typeof element?.getAnimations === 'function' ? element.getAnimations() : [];
  }

  $effect(() => {
    const skip = instant || prefersReducedMotion();
    const ids = new Set(rows.map((row) => row.id));
    for (const id of lastPositions.keys()) if (!ids.has(id)) lastPositions.delete(id);
    for (const row of rows) {
      const next = piecePosition(rows, row.id, stacking);
      let previous = lastPositions.get(row.id);
      lastPositions.set(row.id, next);
      const element = root?.querySelector(`[data-piece-pos="${row.id}"]`);
      const active = runningOn(element);
      if (skip) {
        for (const animation of active) animation.cancel();
        continue;
      }
      if (!previous || !element) continue;
      if (active.length > 0) {
        const seen = visibleTranslate(getComputedStyle(element).transform);
        if (seen) previous = seen;
        for (const animation of active) animation.cancel();
      }
      if (previous.x === next.x && previous.y === next.y) continue;
      element.animate(
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
  const placedNote = $derived.by(() => {
    if (!stacking || !stackedRow || !note) return null;
    const ontoCaption = rows.find((row) => row.id === stacking.onto)?.caption;
    const minX = ontoCaption ? captionEnd(ontoCaption, caption.fontSize) + 24 : 0;
    return notePlacement(piecePosition(rows, stackedRow.id, stacking), pieceWidth(stackedRow.value, units), note, noteSize.charWidth, minX);
  });
</script>

<div class="bar-wrap" bind:this={root} bind:clientWidth={svgWidth} bind:clientHeight={svgHeight}>
<svg
  class="bar"
  class:interactive={canDrag}
  viewBox={`0 0 ${BAR.viewWidth} ${viewHeight(rows.length, captioned)}`}
  role="group"
  aria-label="Pita pecahan"
>
  {#each rows as row, i (row.id)}
    {@const y = rowY(i, captioned)}
    {@const shown = shownValue(row)}
    <g data-row={row.id}>
      <rect
        class="whole"
        x={BAR.x0}
        {y}
        width={unitWidth(units) * wholesOf(row)}
        height={BAR.rowHeight}
        data-testid={`bar-target-${row.id}`}
        use:dropTarget={{ controller, id: row.id, label: row.hideLabel ? 'pita' : `pita ${spokenFraction(shown)}`, accepts: accepts(row.id) }}
      />
      {#each dividerXs(row, units) as x (x)}
        <line class="divider" class:fade={fade.on} x1={BAR.x0 + x} x2={BAR.x0 + x} y1={y} y2={y + BAR.rowHeight} />
      {/each}
      {#if stacking?.pieceOf === row.id}
        <rect class="ghost" data-ghost x={BAR.x0 + 6} y={y + 6} width={Math.max(pieceWidth(row.value, units) - 12, 0)} height={BAR.rowHeight - 12} />
      {/if}
      {#if row.caption}
        <text class="caption" aria-hidden="true" x={BAR.x0 + 4} y={y - caption.baseline} style:font-size={`${caption.fontSize}px`}>{row.caption}</text>
      {/if}
      {#if !row.hideLabel}
        <g class="label" aria-hidden="true">
          <text x={BAR.labelX} y={y + BAR.rowHeight / 2 - label.gapAbove} style:font-size={`${label.fontSize}px`}>{shown.n}</text>
          <line x1={BAR.labelX - label.half} x2={BAR.labelX + label.half} y1={y + BAR.rowHeight / 2} y2={y + BAR.rowHeight / 2} />
          <text x={BAR.labelX} y={y + BAR.rowHeight / 2 + label.gapBelow} style:font-size={`${label.fontSize}px`}>{shown.d}</text>
        </g>
      {/if}
    </g>
  {/each}

  {#each ordered as row (row.id)}
    {@const pos = piecePosition(rows, row.id, stacking)}
    {@const hit = hitBox(row.value, size, units)}
    <g class="piece-pos" data-piece-pos={row.id} style:transform={`translate(${pos.x}px, ${pos.y}px)`}>
      <g
        class="piece"
        data-piece={row.id}
        class:grab={canDrag}
        use:draggable={{ controller, id: PIECE + row.id, label: row.hideLabel ? 'Potongan' : `Potongan ${spokenFraction(shownValue(row))}`, disabled: !canDrag }}
      >
        <rect class="hit" x={hit.x} y={hit.y} width={hit.width} height={hit.height} />
        <rect width={pieceWidth(row.value, units)} height={BAR.rowHeight} style:fill={row.color} />
        {#each pieceDividerXs(row, units) as x (x)}
          <line class="divider" class:fade={fade.on} x1={x} x2={x} y1={0} y2={BAR.rowHeight} />
        {/each}
      </g>
    </g>
  {/each}

  {#each rows as row, i (row.id)}
    {@const y = rowY(i, captioned)}
    <g class="whole-lines" data-row-lines={row.id}>
      {#each wholeXs(row, units) as x (x)}
        <line class="whole-line" x1={BAR.x0 + x} x2={BAR.x0 + x} y1={y - 6} y2={y + BAR.rowHeight + 6} />
      {/each}
    </g>
  {/each}

  {#if placedNote}
    <text
      class="note"
      class:inside={placedNote.anchor === 'end'}
      x={placedNote.x}
      y={placedNote.y}
      text-anchor={placedNote.anchor}
      style:font-size={`${noteSize.fontSize}px`}>{note}</text>
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
  .divider.fade {
    animation: appear 200ms ease-out;
  }
  .whole-line {
    stroke: var(--ink);
    stroke-width: 7;
    pointer-events: none;
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
  .bar:has(:global([data-dragging])) .piece:not(:global([data-dragging])) :is(rect:not(.hit), .divider) {
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
  .caption {
    font-family: var(--font-body);
    font-weight: 600;
    fill: var(--ink-soft);
  }
  .label text {
    font-family: var(--font-body);
    font-weight: 700;
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
  @keyframes appear {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
