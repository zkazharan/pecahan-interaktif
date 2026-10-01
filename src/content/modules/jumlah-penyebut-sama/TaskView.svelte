<script lang="ts">
  import FractionText from '../../../components/FractionText.svelte';
  import { frac } from '../../../lib/fraction';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import Plates from '../../../manipulatives/Plates.svelte';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import type { SamaAnswer, SamaTask } from './tasks';

  let { task, answer, onanswer, feedback }: TaskViewProps<SamaTask, SamaAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
</script>

<div class="task" data-task-kind={task.kind} data-correct={task.correctId}>
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
  .help {
    margin: 0;
  }
</style>
