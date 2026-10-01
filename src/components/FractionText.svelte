<script lang="ts">
  import type { Fraction } from '../lib/fraction';
  import { spokenFraction } from '../lib/spoken';

  let { value, size = 'md' }: { value: Fraction; size?: 'sm' | 'md' | 'lg' } = $props();
</script>

<span class="frac {size}" role="img" aria-label={spokenFraction(value)}>
  <span class="n" aria-hidden="true">{value.n}</span>
  <span class="d" aria-hidden="true">{value.d}</span>
</span>

<style>
  .frac {
    display: inline-grid;
    justify-items: center;
    vertical-align: middle;
    line-height: 1;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    margin: 0 0.1em;
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
