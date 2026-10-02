<script lang="ts">
  import type { Snippet } from 'svelte';
  import StepNav from '../components/StepNav.svelte';
  import { router } from '../lib/route.svelte';

  type Props = {
    step: number;
    total: number;
    onstep: (step: number) => void;
    caption: Snippet;
    stage: Snippet;
    controls?: Snippet;
    actions?: Snippet;
    onshow?: () => void;
  };

  let { step, total, onstep, caption, stage, controls, actions, onshow }: Props = $props();

  const WIDE = '(min-width: 600px)';

  function isWide(): boolean {
    return typeof matchMedia !== 'function' || matchMedia(WIDE).matches;
  }

  let open = $state(isWide());

  const latihanHref = $derived(router.route.name === 'module' ? `#/${router.route.slug}/latihan` : undefined);

  $effect(() => {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia(WIDE);
    const sync = () => (open = query.matches);
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  });
</script>

<section class="peraga">
  <p class="caption" aria-live="polite">{@render caption()}</p>
  <div class="stage">{@render stage()}</div>
  <footer class="strip">
    {#if controls}
      <details class="numbers" bind:open>
        <summary>Ubah angka</summary>
        <div class="controls">{@render controls()}</div>
      </details>
    {/if}
    {#if actions}
      <div class="actions">{@render actions()}</div>
    {/if}
    <div class="nav">
      {#if onshow}
        <button type="button" class="btn" onclick={onshow}>Tunjukkan</button>
      {/if}
      <StepNav {step} {total} {onstep} finishHref={latihanHref} />
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1em;
    padding: 0.8em 0;
    border-top: var(--line) solid var(--ink);
    background: rgba(251, 247, 236, 0.96);
  }
  .numbers {
    flex: 1 1 100%;
  }
  .numbers summary {
    display: flex;
    align-items: center;
    min-height: 48px;
    padding: 0 0.8em;
    border: var(--line) solid var(--ink);
    border-radius: var(--radius);
    background: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
  }
  .actions:empty {
    display: none;
  }
  .numbers summary::before {
    content: '';
    width: 0;
    height: 0;
    margin-right: 0.6em;
    border-left: 0.35em solid transparent;
    border-right: 0.35em solid transparent;
    border-top: 0.45em solid currentColor;
    transform: rotate(-90deg);
    transition: transform 0.2s;
  }
  .numbers[open] summary::before {
    transform: none;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    padding-top: 0.8em;
  }
  @media (min-width: 600px) {
    .numbers {
      flex: 0 1 auto;
    }
    .numbers summary {
      display: none;
    }
    .controls {
      padding-top: 0;
    }
  }
  .nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1em;
    margin-left: auto;
  }
  @media (min-width: 700px) and (min-height: 600px) {
    .strip {
      position: sticky;
      bottom: 0;
    }
  }
</style>
