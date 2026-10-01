<script lang="ts">
  import type { Snippet } from 'svelte';
  import StepNav from '../components/StepNav.svelte';

  type Props = {
    step: number;
    total: number;
    onstep: (step: number) => void;
    caption: Snippet;
    stage: Snippet;
    controls?: Snippet;
    onshow?: () => void;
  };

  let { step, total, onstep, caption, stage, controls, onshow }: Props = $props();
</script>

<section class="peraga">
  <p class="caption" aria-live="polite">{@render caption()}</p>
  <div class="stage">{@render stage()}</div>
  <footer class="strip">
    {#if controls}
      <div class="controls">{@render controls()}</div>
    {/if}
    <div class="nav">
      {#if onshow}
        <button type="button" class="btn" onclick={onshow}>Tunjukkan</button>
      {/if}
      <StepNav {step} {total} {onstep} />
    </div>
  </footer>
</section>

<style>
  .peraga {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 1em;
    min-height: calc(100dvh - 110px);
  }
  .caption {
    margin: 0;
    font-size: 1.3em;
    font-weight: 500;
    line-height: 1.5;
  }
  .stage {
    display: grid;
    align-content: center;
    min-height: 0;
  }
  .strip {
    position: sticky;
    bottom: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1em;
    padding: 0.8em 0;
    border-top: var(--line) solid var(--ink);
    background: rgba(251, 247, 236, 0.96);
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
  }
  .nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1em;
    margin-left: auto;
  }
</style>
