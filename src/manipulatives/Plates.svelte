<script lang="ts">
  import { tick } from 'svelte';
  import { draggable, dropTarget } from '../lib/drag/actions';
  import { announce } from '../lib/drag/announce';
  import { DragController } from '../lib/drag/controller';
  import { frac } from '../lib/fraction';
  import { spokenFraction } from '../lib/spoken';
  import { CIRCLE, equalSlices, sliceAngles, wedgePath } from './circle';
  import { popIn } from './flip';
  import { TRAY, movePiece, plateId, plateItemId, sourceOf, trayItemId, type PlatesState } from './plates';

  type Props = {
    capacity: number;
    state: PlatesState;
    onmove: (state: PlatesState) => void;
    locked?: boolean;
    color?: string;
    flagged?: readonly boolean[];
  };

  let { capacity, state: placement, onmove, locked = false, color = 'var(--frac-1)', flagged = [] }: Props = $props();

  let root: HTMLElement | undefined = $state();
  let userMove = false;

  const controller = new DragController({
    announce,
    onDrop: ({ itemId, targetId }) => {
      const hadFocus = document.activeElement?.closest('[data-piece-item]')?.getAttribute('data-piece-item') === itemId;
      userMove = true;
      onmove(movePiece(placement, sourceOf(itemId), targetId, capacity));
      tick().then(() => (userMove = false));
      if (hadFocus) {
        tick().then(() => {
          const items = root?.querySelectorAll<HTMLElement | SVGElement>(`[data-container="${targetId}"] [data-piece-item]`);
          items?.[items.length - 1]?.focus();
        });
      }
    },
  });

  let previous: readonly number[] | null = null;

  $effect(() => {
    const counts = placement.plates;
    if (previous && !userMove && root) {
      counts.forEach((count, i) => {
        const before = previous?.[i] ?? 0;
        if (count <= before) return;
        const wedges = root?.querySelectorAll(`[data-testid="plate-${i}"] [data-plate-piece]`) ?? [];
        popIn(Array.from(wedges).slice(before, Math.min(count, capacity)));
      });
    }
    previous = [...counts];
  });

  const arcs = $derived(sliceAngles(equalSlices(capacity)));
  const pieceName = $derived(`Potongan ${spokenFraction(frac(1, capacity))}`);

  function shown(count: number): number {
    return Math.min(count, capacity);
  }

  function plateAccepts(index: number): (itemId: string) => boolean {
    return (itemId) => sourceOf(itemId) !== plateId(index) && placement.plates[index] < capacity;
  }
</script>

<div class="plates" bind:this={root}>
  <div class="row">
    {#each placement.plates as count, i (i)}
      <div
        class="plate"
        class:flagged={flagged[i]}
        data-flagged={flagged[i] ? '' : undefined}
        data-container={plateId(i)}
        data-testid={plateId(i)}
        use:dropTarget={{ controller, id: plateId(i), label: `piring ${i + 1}`, accepts: plateAccepts(i) }}
      >
        <svg class="layer" viewBox={`0 0 ${CIRCLE.view} ${CIRCLE.view}`} aria-hidden="true">
          <circle class="rim" cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r + 6} />
          {#each arcs as arc, k (k)}
            <path class="slot" d={wedgePath(arc.start, arc.end)} />
          {/each}
        </svg>
        <svg class="layer" viewBox={`0 0 ${CIRCLE.view} ${CIRCLE.view}`}>
          {#each Array.from({ length: shown(count) - 1 }, (_, k) => k) as k (k)}
            <path class="piece fixed" data-plate-piece d={wedgePath(arcs[k].start, arcs[k].end)} style:fill={color} />
          {/each}
          {#if shown(count) > 0}
            <g
              class="handle"
              data-plate-handle
              data-piece-item={plateItemId(i, shown(count) - 1)}
              use:draggable={{ controller, id: plateItemId(i, shown(count) - 1), label: `${pieceName} di piring ${i + 1}`, disabled: locked }}
            >
              <circle class="hit" cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r + 6} />
              <path
                class="piece"
                data-plate-piece
                d={wedgePath(arcs[shown(count) - 1].start, arcs[shown(count) - 1].end)}
                style:fill={color}
              />
            </g>
          {/if}
        </svg>
      </div>
    {/each}
  </div>
  <div
    class="tray"
    data-container={TRAY}
    data-testid="tray"
    use:dropTarget={{ controller, id: TRAY, label: 'nampan potongan', accepts: (itemId) => sourceOf(itemId) !== TRAY }}
  >
    {#each Array.from({ length: placement.tray }, (_, k) => k) as k (k)}
      <svg
        class="tray-piece"
        viewBox={`0 0 ${CIRCLE.view} ${CIRCLE.view}`}
        data-tray-piece
        data-piece-item={trayItemId(k)}
        use:draggable={{ controller, id: trayItemId(k), label: pieceName, disabled: locked }}
      >
        <path class="piece" d={wedgePath(arcs[0].start, arcs[0].end)} style:fill={color} />
      </svg>
    {/each}
  </div>
</div>

<style>
  .plates {
    display: grid;
    gap: 1em;
  }
  .row {
    display: flex;
    flex-wrap: nowrap;
    gap: 1em;
  }
  .plate {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    max-width: 220px;
    aspect-ratio: 1;
  }
  .layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .rim {
    fill: #fff;
    stroke: var(--ink);
    stroke-width: 4;
  }
  .plate.flagged .rim {
    stroke: var(--red);
    stroke-dasharray: 12 8;
  }
  .slot {
    fill: none;
    stroke: var(--ink-soft);
    stroke-width: 2;
    stroke-dasharray: 6 6;
  }
  .piece {
    transform-box: fill-box;
    transform-origin: center;
    stroke: var(--ink);
    stroke-width: 3;
    stroke-linejoin: round;
    cursor: grab;
  }
  .piece.fixed {
    cursor: default;
  }
  .hit {
    fill: transparent;
    pointer-events: all;
    cursor: grab;
  }
  .handle {
    outline: none;
  }
  .handle:focus-visible .piece {
    stroke: var(--blue);
    stroke-width: 6;
  }
  .tray {
    min-height: 96px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    align-items: center;
    padding: 0.5em;
    border: 3px dashed var(--ink-soft);
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.55);
  }
  .tray-piece {
    width: 56px;
    height: 56px;
    overflow: visible;
    cursor: grab;
  }
  .tray-piece:focus-visible {
    outline: 3px solid var(--blue);
  }
  .tray-piece:global([data-dragging]),
  .handle:global([data-dragging]) .hit {
    cursor: grabbing;
  }
  @media (min-width: 600px) {
    .tray-piece {
      width: 72px;
      height: 72px;
    }
  }
  @media (min-width: 1600px) {
    .plate {
      max-width: 300px;
    }
    .tray-piece {
      width: 96px;
      height: 96px;
    }
  }
</style>
