<script lang="ts">
  import FractionText from '../../../components/FractionText.svelte';
  import { frac } from '../../../lib/fraction';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import NumberLine from '../../../manipulatives/NumberLine.svelte';
  import Plates from '../../../manipulatives/Plates.svelte';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import type { CampuranAnswer, CampuranTask } from './tasks';

  let { task, answer, onanswer, feedback }: TaskViewProps<CampuranTask, CampuranAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const hooks = $derived(
    task.kind === 'group'
      ? { 'data-n': String(task.value.n), 'data-d': String(task.value.d) }
      : task.kind === 'line'
        ? { 'data-per-unit': String(task.perUnit) }
        : { 'data-correct': task.correctId },
  );

  function place(placement: Placement): void {
    onanswer({ ...answer, placement });
  }
</script>

<div class="task" data-task-kind={task.kind} {...hooks}>
  {#if task.kind === 'group'}
    <p class="question">
      Susun {task.value.n} potong <FractionText value={frac(1, task.value.d)} /> di piring. Satu piring muat <span class="hl">{task.value.d} potong</span>.
    </p>
    <Plates capacity={task.value.d} state={answer.plates} onmove={(plates) => onanswer({ ...answer, plates })} {locked} />
  {:else if task.kind === 'line'}
    <p class="question">Taruh kartunya di <span class="hl">garis bilangan 0 sampai {task.max}</span>.</p>
    <NumberLine max={task.max} perUnit={task.perUnit} cards={[task.card]} placement={answer.placement} onplace={place} {locked} />
  {:else}
    <p class="question"><FractionText value={task.value} /> sama dengan yang mana?</p>
    <CardSlots cards={task.cards} slots={PICK_SLOTS} placement={answer.placement} onplace={place} {locked} />
  {/if}
</div>

<style>
  .question {
    margin: 0 0 0.6em;
    font-size: 1.25em;
    font-weight: 600;
  }
</style>
