<script lang="ts">
  import { tick } from 'svelte';
  import { draggable, dropTarget } from '../lib/drag/actions';
  import { announce } from '../lib/drag/announce';
  import { DragController } from '../lib/drag/controller';
  import { popIn } from './flip';
  import { MARBLE_TRAY, bagId, bagMarbleId, marbleSource, moveMarble, trayMarbleId, type CollectionState } from './collection';

  type Props = {
    state: CollectionState;
    onmove: (state: CollectionState) => void;
    locked?: boolean;
    taken?: readonly boolean[];
    ontake?: (index: number) => void;
    counts?: boolean;
  };

  let { state: placement, onmove, locked = false, taken = [], ontake, counts = false }: Props = $props();

  let root: HTMLElement | undefined = $state();
  let userMove = false;

  const controller = new DragController({
    announce,
    onDrop: ({ itemId, targetId }) => {
      const hadFocus = document.activeElement?.closest('[data-marble-item]')?.getAttribute('data-marble-item') === itemId;
      userMove = true;
      onmove(moveMarble(placement, marbleSource(itemId), targetId));
      tick().then(() => (userMove = false));
      if (hadFocus) {
        tick().then(() => {
          const items = root?.querySelectorAll<HTMLElement>(`[data-container="${targetId}"] [data-marble-item]`);
          items?.[items.length - 1]?.focus();
        });
      }
    },
  });

  let previous: readonly number[] | null = null;

  $effect(() => {
    const counts = placement.bags;
    if (previous && !userMove && root) {
      counts.forEach((count, i) => {
        const before = previous?.[i] ?? 0;
        if (count <= before) return;
        const dots = root?.querySelectorAll(`[data-testid="${bagId(i)}"] [data-marble]`) ?? [];
        popIn(Array.from(dots).slice(before, count));
      });
    }
    previous = [...counts];
  });

  const taking = $derived(ontake !== undefined);
  const trayHidden = $derived(locked && placement.tray === 0);

  function bagAccepts(index: number): (itemId: string) => boolean {
    return (itemId) => marbleSource(itemId) !== bagId(index);
  }
</script>

{#snippet sack(count: number)}
  <svg class="sack" viewBox="0 0 120 120" preserveAspectRatio="none" aria-hidden="true">
    <path class="cloth" d="M30 38 C14 54 10 84 18 100 C22 110 36 114 60 114 C84 114 98 110 102 100 C110 84 106 54 90 38 Z" />
    <path class="cloth" d="M44 12 L76 12 L90 38 L30 38 Z" />
    <path class="tie" d="M32 36 Q60 44 88 36" />
  </svg>
  <span class="fill">
    {#each Array.from({ length: count }, (_, k) => k) as k (k)}
      <span class="dot" data-marble></span>
    {/each}
  </span>
{/snippet}

<div class="collection" bind:this={root}>
  <div class="bags">
    {#each placement.bags as count, i (i)}
      <div class="cell">
        {#if taking}
          <button
            type="button"
            class="bag"
            class:taken={taken[i]}
            aria-pressed={taken[i] ?? false}
            aria-label={`Kantong ${i + 1}`}
            onclick={() => ontake?.(i)}
            data-container={bagId(i)}
            data-testid={bagId(i)}
            use:dropTarget={{ controller, id: bagId(i), label: `kantong ${i + 1}`, accepts: bagAccepts(i) }}
          >
            {@render sack(count)}
          </button>
        {:else}
          <div
            class="bag"
            class:taken={taken[i]}
            data-container={bagId(i)}
            data-testid={bagId(i)}
            use:dropTarget={{ controller, id: bagId(i), label: `kantong ${i + 1}`, accepts: bagAccepts(i) }}
          >
            {@render sack(count)}
            {#if count > 0 && !locked}
              <div
                class="handle"
                data-bag-handle
                data-marble-item={bagMarbleId(i)}
                use:draggable={{ controller, id: bagMarbleId(i), label: `Kelereng di kantong ${i + 1}` }}
              ></div>
            {/if}
          </div>
        {/if}
        {#if counts}
          <span class="count" data-bag-count>{count}</span>
        {/if}
      </div>
    {/each}
  </div>
  {#if !trayHidden}
    <div
      class="tray"
      data-container={MARBLE_TRAY}
      data-testid="marble-tray"
      use:dropTarget={{ controller, id: MARBLE_TRAY, label: 'nampan kelereng', accepts: (itemId) => marbleSource(itemId) !== MARBLE_TRAY }}
    >
      {#each Array.from({ length: placement.tray }, (_, k) => k) as k (k)}
        <span
          class="tray-marble"
          data-tray-marble
          data-marble-item={trayMarbleId(k)}
          use:draggable={{ controller, id: trayMarbleId(k), label: 'Kelereng', disabled: locked || taking }}
        >
          <span class="ball"></span>
        </span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .collection {
    display: grid;
    gap: 1em;
  }
  .bags {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
  }
  .cell {
    flex: 1 1 0;
    min-width: 96px;
    max-width: 220px;
    display: grid;
    gap: 0.25em;
    justify-items: center;
    align-content: start;
  }
  .bag {
    position: relative;
    display: block;
    box-sizing: border-box;
    width: 100%;
    aspect-ratio: 1;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
  }
  button.bag {
    cursor: pointer;
  }
  button.bag:focus-visible {
    outline: 3px solid var(--blue);
    outline-offset: 2px;
  }
  .bag.taken {
    transform: translateY(-6px);
  }
  .sack {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .cloth {
    fill: #fff;
    stroke: var(--ink);
    stroke-width: 4;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .tie {
    fill: none;
    stroke: var(--ink);
    stroke-width: 4;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .bag.taken .cloth,
  .bag.taken .tie {
    stroke: var(--blue);
    stroke-width: 5;
  }
  .fill {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-end;
    justify-content: center;
    gap: 2px;
    box-sizing: border-box;
    min-height: 100%;
    padding: 38% 16% 14%;
  }
  .dot,
  .ball {
    display: block;
    box-sizing: border-box;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--frac-2);
  }
  .dot {
    width: 16px;
    height: 16px;
  }
  .handle {
    position: absolute;
    inset: 0;
    cursor: grab;
    background: transparent;
  }
  .handle:focus-visible {
    outline: 3px solid var(--blue);
    outline-offset: 2px;
  }
  .handle:global([data-dragging]) {
    cursor: grabbing;
  }
  .handle:global([data-dragging])::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 30px;
    height: 30px;
    margin: -15px 0 0 -15px;
    box-sizing: border-box;
    border: 3px solid var(--ink);
    border-radius: 50%;
    background: var(--frac-2);
  }
  .count {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .tray {
    min-height: 64px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25em;
    align-items: center;
    padding: 0.5em;
    border: 3px dashed var(--ink-soft);
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.55);
  }
  .tray-marble {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    cursor: grab;
  }
  .ball {
    width: 36px;
    height: 36px;
  }
  .tray-marble:focus-visible {
    outline: 3px solid var(--blue);
  }
  .tray-marble:global([data-dragging]) {
    cursor: grabbing;
  }
  @media (min-width: 600px) {
    .dot {
      width: 22px;
      height: 22px;
    }
    .tray-marble {
      width: 56px;
      height: 56px;
    }
    .ball {
      width: 44px;
      height: 44px;
    }
  }
  @media (min-width: 1600px) {
    .cell {
      max-width: 300px;
    }
    .dot {
      width: 30px;
      height: 30px;
    }
    .tray-marble {
      width: 72px;
      height: 72px;
    }
    .ball {
      width: 60px;
      height: 60px;
    }
  }
</style>
