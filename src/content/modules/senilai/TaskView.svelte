<script lang="ts">
  import CountStepper from '../../../components/CountStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import Bar from '../../../manipulatives/Bar.svelte';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import DiffBars from '../../../manipulatives/DiffBars.svelte';
  import { maxCut } from '../../../manipulatives/bar';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import { wrongPairSlots, type SenilaiAnswer, type SenilaiTask } from './tasks';

  let { task, answer, onanswer, feedback, diff = false }: TaskViewProps<SenilaiTask, SenilaiAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const hooks = $derived(
    task.kind === 'recut'
      ? { 'data-k': String(task.k) }
      : task.kind === 'pair'
        ? { 'data-solution': JSON.stringify(task.solution) }
        : { 'data-correct': task.correctId },
  );

  const cardValue = (id: string | null | undefined) => (task.kind === 'recut' ? undefined : task.cards.find((card) => card.id === id)?.value);
  const wrongSlots = $derived(task.kind === 'pair' && diff ? wrongPairSlots(task, answer.placement) : []);
  const MAX_PAIR_DIFFS = 3;
  const pairDiffs = $derived.by(() => {
    if (task.kind !== 'pair') return [];
    return task.slots
      .flatMap((slot) => {
        const mine = cardValue(answer.placement[slot.id]);
        return wrongSlots.includes(slot.id) && slot.value && mine ? [{ id: slot.id, goal: slot.value, mine }] : [];
      })
      .slice(0, MAX_PAIR_DIFFS);
  });
  const pickedValue = $derived(task.kind === 'simplify' ? cardValue(answer.placement.pilihan) : undefined);

  function place(placement: Placement): void {
    onanswer({ ...answer, placement });
  }
</script>

<div class="task" data-task-kind={task.kind} {...hooks} data-diff={diff ? 'true' : undefined}>
  {#if task.kind === 'recut'}
    <p class="question">Potong ulang pita <FractionText value={task.base} /> sampai menjadi <FractionText value={task.target} />.</p>
    <Bar rows={[{ id: 'base', value: task.base, color: 'var(--frac-1)', cut: answer.cuts }]} stacking={null} />
    <CountStepper
      label="Potong ulang"
      value={answer.cuts}
      min={1}
      max={maxCut(task.base.d)}
      disabled={locked}
      onchange={(cuts) => onanswer({ ...answer, cuts })}
    />
    {#if diff}
      <div class="diff" data-testid="diff">
        <Bar
          rows={[
            { id: 'base', value: task.base, color: 'var(--frac-1)', cut: answer.cuts },
            { id: 'target', value: task.target, color: 'var(--frac-2)' },
          ]}
          stacking={null}
        />
      </div>
    {/if}
  {:else if task.kind === 'pair'}
    <p class="question">Pasangkan setiap kartu dengan pecahan yang <span class="hl">senilai</span>.</p>
    <CardSlots cards={task.cards} slots={task.slots} placement={answer.placement} onplace={place} {locked} flagged={wrongSlots} />
    {#if pairDiffs.length > 0}
      <div class="diff" data-testid="diff">
        {#each pairDiffs as pair (pair.id)}
          <DiffBars goal={pair.goal} mine={pair.mine} />
        {/each}
      </div>
    {/if}
  {:else}
    <p class="question">Bentuk <span class="hl">paling sederhana</span> dari <FractionText value={task.value} /> adalah ...</p>
    <CardSlots cards={task.cards} slots={PICK_SLOTS} placement={answer.placement} onplace={place} {locked} />
    {#if diff && pickedValue}
      <div class="diff" data-testid="diff">
        <DiffBars goal={task.value} mine={pickedValue} />
      </div>
    {/if}
  {/if}
</div>

<style>
  .task {
    display: grid;
    gap: 0.8em;
  }
  .question {
    margin: 0;
    font-size: 1.25em;
    font-weight: 600;
  }
  .diff {
    display: grid;
    gap: 1.2em;
    margin-top: 0.8em;
    padding: 0.6em 0.8em;
    border-left: 4px dashed var(--red);
  }
  @media (min-width: 600px) {
    .diff {
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    }
  }
</style>
