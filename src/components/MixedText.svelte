<script lang="ts">
  import type { Fraction } from '../lib/fraction';
  import { spokenMixed } from '../lib/spoken';

  let { whole, rest, size = 'md' }: { whole: number; rest: Fraction; size?: 'sm' | 'md' | 'lg' } = $props();
</script>

<span class="mixed {size}" role="img" aria-label={spokenMixed(whole, rest)}>
  {#if whole > 0 || rest.n === 0}
    <span class="whole" aria-hidden="true">{whole}</span>
  {/if}
  {#if rest.n > 0}
    <span class="frac" aria-hidden="true"><span class="n">{rest.n}</span><span class="d">{rest.d}</span></span>
  {/if}
</span>

<style>
  .mixed {
    display: inline-flex;
    align-items: center;
    gap: 0.08em;
    vertical-align: middle;
    line-height: 1;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    margin: 0 0.1em;
  }
  .whole {
    font-size: 1.7em;
  }
  .frac {
    display: inline-grid;
    justify-items: center;
  }
  .n {
    border-bottom: 0.12em solid currentColor;
    padding: 0 0.15em 0.08em;
  }
  .d {
    padding-top: 0.08em;
  }
  .sm {
    font-size: 0.85em;
  }
  .md {
    font-size: 1.15em;
  }
  .lg {
    font-size: 1.8em;
  }
</style>
