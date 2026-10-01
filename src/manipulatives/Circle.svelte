<script lang="ts">
  import { prefersReducedMotion } from '../lib/motion';
  import { CIRCLE, guidePoints, sliceAngles, wedgePath } from './circle';

  type Props = {
    slices: readonly number[];
    shaded?: readonly boolean[];
    onshade?: (index: number) => void;
    label: string;
    size?: 'fill' | 'md' | 'lg';
    color?: string;
    decorative?: boolean;
    guides?: number;
    outlined?: readonly boolean[];
  };

  let { slices, shaded = [], onshade, label, size = 'md', color = 'var(--frac-1)', decorative = false, guides = 0, outlined = [] }: Props = $props();

  let svg: SVGSVGElement | undefined = $state();
  let lastCount = 0;

  $effect(() => {
    const count = slices.length;
    if (lastCount !== 0 && count !== lastCount && svg && !prefersReducedMotion()) {
      svg.animate([{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' });
    }
    lastCount = count;
  });

  const arcs = $derived(sliceAngles(slices));

  function onKey(event: KeyboardEvent, index: number): void {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    onshade?.(index);
  }
</script>

<svg
  bind:this={svg}
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
  {#each arcs as arc, i (i)}
    {#if outlined[i]}
      <path class="outlined" data-outlined d={wedgePath(arc.start, arc.end)} />
    {/if}
  {/each}
  {#each guidePoints(guides) as point, i (i)}
    <line class="guide" data-guide x1={CIRCLE.cx} y1={CIRCLE.cy} x2={point.x} y2={point.y} />
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
    transition: fill 200ms ease-out;
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
  .outlined {
    fill: none;
    stroke: var(--red);
    stroke-width: 7;
    stroke-dasharray: 12 8;
    stroke-linejoin: round;
    pointer-events: none;
  }
  .guide {
    stroke: var(--red);
    stroke-width: 4;
    stroke-dasharray: 10 8;
    stroke-linecap: round;
    pointer-events: none;
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
