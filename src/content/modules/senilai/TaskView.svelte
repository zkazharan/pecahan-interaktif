<script lang="ts">
  import CountStepper from '../../../components/CountStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import Bar from '../../../manipulatives/Bar.svelte';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import { maxCut } from '../../../manipulatives/bar';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import type { SenilaiAnswer, SenilaiTask } from './tasks';

  let { task, answer, onanswer, feedback }: TaskViewProps<SenilaiTask, SenilaiAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const hooks = $derived(
    task.kind === 'recut'
      ? { 'data-k': String(task.k) }
      : task.kind === 'pair'
        ? { 'data-solution': JSON.stringify(task.solution) }
        : { 'data-correct': task.correctId },
  );

  function place(placement: Placement): void {
    onanswer({ ...answer, placement });
  }
</script>

<div class="task" data-task-kind={task.kind} {...hooks}>
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
  {:else if task.kind === 'pair'}
    <p class="question">Pasangkan setiap kartu dengan pecahan yang <span class="hl">senilai</span>.</p>
    <CardSlots cards={task.cards} slots={task.slots} placement={answer.placement} onplace={place} {locked} />
  {:else}
    <p class="question">Bentuk <span class="hl">paling sederhana</span> dari <FractionText value={task.value} /> adalah ...</p>
    <CardSlots cards={task.cards} slots={PICK_SLOTS} placement={answer.placement} onplace={place} {locked} />
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
</style>
