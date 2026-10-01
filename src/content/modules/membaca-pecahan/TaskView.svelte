<script lang="ts">
  import FractionText from '../../../components/FractionText.svelte';
  import { formatFraction } from '../../../lib/fraction';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import Circle from '../../../manipulatives/Circle.svelte';
  import NumberLine from '../../../manipulatives/NumberLine.svelte';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import { equalSlices } from '../../../manipulatives/circle';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import type { MembacaAnswer, MembacaTask } from './tasks';

  let { task, answer, onanswer, feedback }: TaskViewProps<MembacaTask, MembacaAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const hooks = $derived(
    task.kind === 'shade'
      ? { 'data-target': formatFraction(task.target) }
      : task.kind === 'line'
        ? { 'data-per-unit': String(task.perUnit) }
        : { 'data-correct': task.correctId },
  );

  function toggle(index: number): void {
    onanswer({ ...answer, shaded: answer.shaded.map((value, i) => (i === index ? !value : value)) });
  }

  function place(placement: Placement): void {
    onanswer({ ...answer, placement });
  }
</script>

<div class="task" data-task-kind={task.kind} {...hooks}>
  {#if task.kind === 'shade'}
    <p class="question">Arsir <FractionText value={task.target} /> martabak.</p>
    <Circle
      slices={equalSlices(task.target.d)}
      shaded={answer.shaded}
      onshade={locked ? undefined : toggle}
      label={`Martabak dipotong ${task.target.d} sama besar`}
      size="lg"
    />
  {:else if task.kind === 'line'}
    <p class="question">Taruh kartunya di <span class="hl">garis bilangan</span>.</p>
    <NumberLine max={1} perUnit={task.perUnit} cards={[task.card]} placement={answer.placement} onplace={place} {locked} />
  {:else}
    <p class="question">Berapa bagian martabak yang <span class="hl">diarsir</span>?</p>
    <div class="read">
      <Circle
        slices={equalSlices(task.shaded.d)}
        shaded={Array.from({ length: task.shaded.d }, (_, i) => i < task.shaded.n)}
        label={`Martabak dipotong ${task.shaded.d} sama besar, ${task.shaded.n} diarsir`}
        size="md"
      />
      <CardSlots cards={task.cards} slots={PICK_SLOTS} placement={answer.placement} onplace={place} {locked} />
    </div>
  {/if}
</div>

<style>
  .question {
    margin: 0 0 0.6em;
    font-size: 1.25em;
    font-weight: 600;
  }
  .read {
    display: grid;
    gap: 1em;
    justify-items: start;
  }
</style>
