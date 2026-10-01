<script lang="ts">
  import type { Fraction } from '../lib/fraction';
  import Circle from './Circle.svelte';
  import { equalSlices } from './circle';

  type Props = { value: Fraction; color?: string; label: string };

  let { value, color = 'var(--frac-2)', label }: Props = $props();

  const count = $derived(Math.max(1, Math.ceil(value.n / value.d)));
  const shadedSets = $derived(
    Array.from({ length: count }, (_, c) =>
      Array.from({ length: value.d }, (_, i) => c * value.d + i < value.n),
    ),
  );
</script>

<div class="fraction-circles" role="img" aria-label={label} data-testid="fraction-circles">
  {#each shadedSets as shaded, c (c)}
    <div class="mini">
      <Circle slices={equalSlices(value.d)} {shaded} {color} label="" size="fill" decorative />
    </div>
  {/each}
</div>

<style>
  .fraction-circles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6em;
  }
  .mini {
    width: 96px;
  }
  @media (min-width: 600px) {
    .mini {
      width: 120px;
    }
  }
  @media (min-width: 1600px) {
    .mini {
      width: 160px;
    }
  }
</style>
