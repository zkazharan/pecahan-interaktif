<script lang="ts">
  import { onDestroy } from 'svelte';
  import { CATALOG } from '../content/catalog';
  import { nextReadyModule } from '../content/registry';
  import type { ModuleDef } from '../content/types';
  import { clearAnnouncer } from '../lib/drag/announce';
  import { router } from '../lib/route.svelte';
  import type { Tab } from '../lib/router';
  import LatihanView from './LatihanView.svelte';

  let { module, tab, params }: { module: ModuleDef; tab: Tab; params: Record<string, string> } = $props();

  const entry = $derived(CATALOG.find((e) => e.slug === module.slug));
  const next = $derived(nextReadyModule(module.slug));
  const peragaParams = $derived(module.peraga.parseParams(params));
  const Peraga = $derived(module.peraga.View);
  const canFullscreen = typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function';
  let resetKey = $state(0);

  $effect(() => {
    void tab;
    clearAnnouncer();
  });

  onDestroy(clearAnnouncer);

  function toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }
</script>

<div class="module">
  <header class="top">
    <a class="back" href="#/">← Daftar modul</a>
    <h1>{entry?.number} · {entry?.title}</h1>
    <nav class="tabs" aria-label="Bagian modul">
      <a href={router.peragaHref(module.slug)} aria-current={tab === 'peraga' ? 'page' : undefined}>Peraga</a>
      <a href={`#/${module.slug}/latihan`} aria-current={tab === 'latihan' ? 'page' : undefined}>Latihan</a>
    </nav>
    <div class="tools">
      <button type="button" class="icon" aria-label="Ulangi dari awal" onclick={() => (resetKey += 1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" /></svg>
      </button>
      {#if canFullscreen}
        <button type="button" class="icon" aria-label="Layar penuh" onclick={toggleFullscreen}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>
        </button>
      {/if}
    </div>
  </header>

  <main class="body">
    {#key resetKey}
      {#if tab === 'peraga'}
        <Peraga params={peragaParams} onparams={(p) => router.replaceParams(module.peraga.formatParams(p))} />
      {:else}
        <LatihanView latihan={module.latihan} slug={module.slug} number={entry?.number ?? 0} {next} />
      {/if}
    {/key}
  </main>
</div>

<style>
  .module {
    position: relative;
    min-height: 100dvh;
    padding: 0.8em 1em 0 3.2em;
  }
  .module::before {
    content: '';
    position: absolute;
    left: 2em;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--margin);
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6em 1.2em;
    margin-bottom: 1em;
  }
  .back {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    color: var(--ink-soft);
    text-decoration: none;
  }
  h1 {
    margin: 0;
    font-size: 1.5em;
  }
  .tabs {
    display: flex;
    gap: 0.4em;
    margin-left: auto;
  }
  .tabs a {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    padding: 0 1.1em;
    border: var(--line) solid var(--ink);
    border-radius: var(--radius) var(--radius) 0 0;
    background: #fff;
    font-weight: 600;
    text-decoration: none;
  }
  .tabs a[aria-current='page'] {
    background: var(--ink);
    color: var(--paper);
  }
  .tools {
    display: flex;
    gap: 0.4em;
  }
  .icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border: var(--line) solid var(--ink);
    border-radius: var(--radius);
    background: #fff;
    cursor: pointer;
  }
  .icon svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: var(--ink);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @media (max-width: 699px) {
    .module {
      padding-left: 2.2em;
    }
    .module::before {
      left: 1.2em;
    }
    .tabs {
      margin-left: 0;
      order: 3;
      width: 100%;
    }
    .tabs a {
      flex: 1;
      justify-content: center;
    }
  }
</style>
