<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { CATALOG } from '../content/catalog';
  import { stampText } from '../content/latihan';
  import { findModule } from '../content/registry';
  import type { ProgressStore } from '../lib/progress';
  import { progress } from '../lib/progress-instance';

  let { store = progress }: { store?: ProgressStore } = $props();

  let records = $state(untrack(() => store.all()));
  let confirming = $state(false);
  const hasStamps = $derived(Object.keys(records).length > 0);

  onMount(() => store.subscribe(() => (records = store.all())));

  function clearAll(): void {
    store.clear();
    records = store.all();
    confirming = false;
  }
</script>

<main class="home">
  <header>
    <h1>Pecahan</h1>
    <p class="sub">Kelas 4–6 · 8 modul</p>
  </header>

  <ol class="pages">
    {#each CATALOG as entry (entry.slug)}
      {@const ready = findModule(entry.slug) !== undefined}
      {@const record = records[entry.slug]}
      <li class="page" class:ready>
        {#if ready}
          <a href={`#/${entry.slug}/peraga`}>
            <span class="num">{entry.number}</span>
            <span class="title">{entry.title}</span>
          </a>
        {:else}
          <span class="num">{entry.number}</span>
          <span class="title">{entry.title}</span>
          <span class="soon">sedang disiapkan</span>
        {/if}
        {#if record}
          <span class="mini-stamp" role="img" aria-label={`Stempel: ${stampText(record.bestFirstTry)}`}>
            {stampText(record.bestFirstTry)}
          </span>
        {/if}
      </li>
    {/each}
  </ol>

  {#if hasStamps}
    <div class="reset">
      {#if confirming}
        <span>Hapus semua stempel di perangkat ini?</span>
        <button type="button" class="btn" onclick={clearAll}>Ya, hapus</button>
        <button type="button" class="btn" onclick={() => (confirming = false)}>Batal</button>
      {:else}
        <button type="button" class="btn" onclick={() => (confirming = true)}>Hapus semua stempel</button>
      {/if}
    </div>
  {/if}
</main>

<style>
  .home {
    position: relative;
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5em 1em 3em 3.2em;
  }
  .home::before {
    content: '';
    position: absolute;
    left: 2em;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--margin);
  }
  h1 {
    margin: 0;
    font-size: 2.6em;
    line-height: 1.1;
  }
  .sub {
    margin: 0.2em 0 1.5em;
    color: var(--ink-soft);
  }
  .pages {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .page {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.8em;
    min-height: 64px;
    border-bottom: 2px solid var(--grid);
  }
  .page a {
    display: flex;
    align-items: center;
    gap: 0.8em;
    flex: 1;
    min-height: 64px;
    text-decoration: none;
  }
  .page a:hover .title {
    text-decoration: underline;
    text-decoration-thickness: 3px;
    text-decoration-color: var(--highlight);
  }
  .num {
    display: grid;
    place-items: center;
    width: 2em;
    height: 2em;
    flex: none;
    border: var(--line) solid var(--ink);
    border-radius: 50%;
    font-weight: 700;
    background: #fff;
  }
  .title {
    font-weight: 600;
    font-size: 1.15em;
  }
  .page:not(.ready) {
    color: var(--ink-soft);
  }
  .page:not(.ready) .num {
    border-style: dashed;
    background: transparent;
  }
  .soon {
    margin-left: auto;
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: 1.3em;
    color: var(--pencil);
  }
  .mini-stamp {
    margin-left: auto;
    padding: 0.1em 0.6em;
    border: 3px double var(--red);
    border-radius: 999px;
    color: var(--red);
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: 1.3em;
    rotate: -8deg;
    mix-blend-mode: multiply;
  }
  .reset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8em;
    margin-top: 2em;
  }
</style>
