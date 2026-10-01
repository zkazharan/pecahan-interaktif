<script lang="ts">
  import FractionText from '../../../components/FractionText.svelte';
  import { formatFraction } from '../../../lib/fraction';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import Circle from '../../../manipulatives/Circle.svelte';
  import FractionCircles from '../../../manipulatives/FractionCircles.svelte';
  import NumberLine from '../../../manipulatives/NumberLine.svelte';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import { equalSlices } from '../../../manipulatives/circle';
  import { spokenFraction } from '../../../lib/spoken';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import { shadeDiff, type MembacaAnswer, type MembacaTask } from './tasks';

  let { task, answer, onanswer, feedback, diff = false }: TaskViewProps<MembacaTask, MembacaAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const hooks = $derived(
    task.kind === 'shade'
      ? { 'data-target': formatFraction(task.target) }
      : task.kind === 'line'
        ? { 'data-per-unit': String(task.perUnit) }
        : { 'data-correct': task.correctId },
  );

  const outlined = $derived(diff && task.kind === 'shade' ? shadeDiff(task.target, answer.shaded) : []);
  const picked = $derived(task.kind === 'read' ? task.cards.find((card) => card.id === answer.placement.pilihan) : undefined);

  function toggle(index: number): void {
    onanswer({ ...answer, shaded: answer.shaded.map((value, i) => (i === index ? !value : value)) });
  }

  function place(placement: Placement): void {
    onanswer({ ...answer, placement });
  }
</script>

<div class="task" data-task-kind={task.kind} {...hooks} data-diff={diff ? 'true' : undefined}>
  {#if task.kind === 'shade'}
    <p class="question">Arsir <FractionText value={task.target} /> martabak.</p>
    <Circle
      slices={equalSlices(task.target.d)}
      shaded={answer.shaded}
      {outlined}
      onshade={locked ? undefined : toggle}
      label={`Martabak dipotong ${task.target.d} sama besar`}
      size="lg"
    />
  {:else if task.kind === 'line'}
    <p class="question">Taruh kartunya di <span class="hl">garis bilangan</span>.</p>
    <NumberLine max={1} perUnit={task.perUnit} cards={[task.card]} placement={answer.placement} onplace={place} {locked} showValues={diff} />
  {:else}
    <p class="question">Berapa bagian martabak yang <span class="hl">diarsir</span>?</p>
    <div class="read">
      <Circle
        slices={equalSlices(task.shaded.d)}
        shaded={Array.from({ length: task.shaded.d }, (_, i) => i < task.shaded.n)}
        label={`Martabak dipotong ${task.shaded.d} sama besar, ${task.shaded.n} diarsir`}
        size="md"
      />
      {#if diff && picked}
        <div class="diff" data-testid="diff">
          <FractionCircles value={picked.value} label={`Kartu pilihanmu: ${spokenFraction(picked.value)}`} />
          <p class="caption" aria-hidden="true">Kartu pilihanmu</p>
        </div>
      {/if}
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
  .diff {
    margin-top: 0.8em;
    padding: 0.6em 0.8em;
    border-left: 4px dashed var(--red);
  }
  .caption {
    margin: 0.4em 0 0;
  }
  .read {
    display: grid;
    gap: 1em;
    justify-items: start;
  }
</style>
