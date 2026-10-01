<script lang="ts">
  import FractionText from '../../../components/FractionText.svelte';
  import { frac } from '../../../lib/fraction';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import DiffBars from '../../../manipulatives/DiffBars.svelte';
  import Plates from '../../../manipulatives/Plates.svelte';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import type { SamaAnswer, SamaTask } from './tasks';

  let { task, answer, onanswer, feedback, diff = false }: TaskViewProps<SamaTask, SamaAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const goal = $derived(task.cards.find((card) => card.id === task.correctId)?.value);
  const pickedValue = $derived(task.cards.find((card) => card.id === answer.placement.pilihan)?.value);
</script>

<div class="task" data-task-kind={task.kind} data-correct={task.correctId} data-diff={diff ? 'true' : undefined}>
  <p class="question">
    <FractionText value={frac(task.a, task.d)} />
    {task.kind === 'add' ? '+' : '−'}
    <FractionText value={frac(task.b, task.d)} /> = ?
  </p>
  <p class="help">
    {#if task.kind === 'add'}
      Pakai loyang untuk menggabungkan, lalu taruh kartu hasilnya.
    {:else}
      Ambil {task.b} potong dari loyang, lalu taruh kartu sisanya.
    {/if}
  </p>
  <Plates capacity={task.d} state={answer.plates} onmove={(plates) => onanswer({ ...answer, plates })} {locked} />
  <CardSlots cards={task.cards} slots={PICK_SLOTS} placement={answer.placement} onplace={(placement) => onanswer({ ...answer, placement })} {locked} />
  {#if diff && goal && pickedValue}
    <div class="diff" data-testid="diff">
      <DiffBars {goal} mine={pickedValue} hideGoal />
    </div>
  {/if}
</div>

<style>
  .task {
    display: grid;
    gap: 0.8em;
  }
  .question {
    margin: 0;
    font-size: 1.5em;
    font-weight: 700;
  }
  .diff {
    margin-top: 0.8em;
    padding: 0.6em 0.8em;
    border-left: 4px dashed var(--red);
  }
  .help {
    margin: 0;
  }
</style>
