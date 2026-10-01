<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
    color = 'red',
    tilt = -2,
  }: { children: Snippet; color?: 'red' | 'blue' | 'pencil'; tilt?: number } = $props();
</script>

<span class="note {color}" style:rotate="{tilt}deg">{@render children()}</span>

<style>
  .note {
    display: inline-block;
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: 1.45em;
    line-height: 1.1;
  }
  .red {
    color: var(--red);
  }
  .blue {
    color: var(--blue);
  }
  .pencil {
    color: var(--pencil);
  }
</style>
