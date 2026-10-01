<script lang="ts">
  import { CIRCLE, sliceAngles, wedgePath } from './circle';

  type Props = {
    slices: readonly number[];
    shaded?: readonly boolean[];
    onshade?: (index: number) => void;
    label: string;
    size?: 'fill' | 'md' | 'lg';
    color?: string;
    decorative?: boolean;
  };

  let { slices, shaded = [], onshade, label, size = 'md', color = 'var(--frac-1)', decorative = false }: Props = $props();

  const arcs = $derived(sliceAngles(slices));

  function onKey(event: KeyboardEvent, index: number): void {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    onshade?.(index);
  }
</script>

<svg
  class="circle {size}"
  viewBox={`0 0 ${CIRCLE.view} ${CIRCLE.view}`}
  role={decorative ? undefined : 'group'}
  aria-label={decorative ? undefined : label}
  aria-hidden={decorative ? 'true' : undefined}
>
  <circle class="plate" cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r + 6} />
  {#each arcs as arc, i (i)}
    {#if onshade}
      <path
        class="slice toggle"
        data-slice={i}
        d={wedgePath(arc.start, arc.end)}
        style:fill={shaded[i] ? color : undefined}
        role="button"
        tabindex="0"
        aria-pressed={shaded[i] ? 'true' : 'false'}
        aria-label={`Potongan ${i + 1}`}
        onclick={() => onshade(i)}
        onkeydown={(event) => onKey(event, i)}
      />
    {:else}
      <path class="slice" data-slice={i} d={wedgePath(arc.start, arc.end)} style:fill={shaded[i] ? color : undefined} />
    {/if}
  {/each}
</svg>

<style>
  .circle {
    display: block;
    height: auto;
    overflow: visible;
  }
  .fill {
    width: 100%;
  }
  .md {
    width: min(100%, 240px);
  }
  .lg {
    width: min(100%, 340px);
  }
  .plate {
    fill: none;
    stroke: var(--ink-soft);
    stroke-width: 2;
    stroke-dasharray: 4 6;
  }
  .slice {
    fill: #fff;
    stroke: var(--ink);
    stroke-width: 3;
    stroke-linejoin: round;
  }
  .toggle {
    cursor: pointer;
    touch-action: manipulation;
  }
  .toggle:focus-visible {
    outline: none;
    stroke: var(--blue);
    stroke-width: 6;
  }
  @media (min-width: 1600px) {
    .md {
      width: 320px;
    }
    .lg {
      width: 460px;
    }
  }
</style>
