<script lang="ts">
  import type { TaskOutcome } from '../content/latihan';

  let { outcomes, total }: { outcomes: TaskOutcome[]; total: number } = $props();

  function describe(outcome: TaskOutcome | undefined): string {
    if (outcome === undefined) return 'belum';
    return outcome === 'shown' ? 'dibantu' : 'benar';
  }
</script>

<ol class="checks" aria-label="Kemajuan soal">
  {#each Array.from({ length: total }, (_, i) => outcomes[i]) as outcome, i (i)}
    <li class={outcome ?? 'todo'} aria-label={`Soal ${i + 1}: ${describe(outcome)}`}>{outcome === undefined ? '○' : '✓'}</li>
  {/each}
</ol>

<style>
  .checks {
    display: flex;
    gap: 0.35em;
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: 1.7em;
    line-height: 1;
  }
  .first-try,
  .retry {
    color: var(--blue);
  }
  .shown {
    color: var(--pencil);
  }
  .todo {
    color: var(--ink-soft);
  }
</style>
