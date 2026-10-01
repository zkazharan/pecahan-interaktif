<script lang="ts">
  let { step, total, onstep }: { step: number; total: number; onstep: (step: number) => void } = $props();
</script>

<div class="step-nav">
  <button type="button" class="btn" disabled={step === 0} onclick={() => onstep(step - 1)}>← Sebelumnya</button>
  <ol class="dots" aria-label={`Langkah ${step + 1} dari ${total}`}>
    {#each Array.from({ length: total }, (_, i) => i) as i (i)}
      <li class:done={i <= step}></li>
    {/each}
  </ol>
  <button type="button" class="btn primary" disabled={step === total - 1} onclick={() => onstep(step + 1)}>Lanjut →</button>
</div>

<style>
  .step-nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8em;
  }
  @media (max-width: 600px) {
    .step-nav {
      flex: 1 1 100%;
    }
    .step-nav .btn {
      flex: 1 1 0;
      min-width: 0;
    }
    .dots {
      order: 3;
      flex-basis: 100%;
      justify-content: center;
    }
  }
  .dots {
    display: flex;
    gap: 0.4em;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .dots li {
    width: 0.7em;
    height: 0.7em;
    border: 2px solid var(--ink);
    border-radius: 50%;
  }
  .dots li.done {
    background: var(--ink);
  }
</style>
