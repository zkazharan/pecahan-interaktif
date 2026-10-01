<script lang="ts">
  import CountStepper from '../../../components/CountStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import { frac } from '../../../lib/fraction';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import Circle from '../../../manipulatives/Circle.svelte';
  import { equalSlices } from '../../../manipulatives/circle';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import { CUT_MAX, CUT_MIN, SORT_SLOTS, type MembagiAdilAnswer, type MembagiAdilTask } from './tasks';

  let { task, answer, onanswer, feedback, diff = false }: TaskViewProps<MembagiAdilTask, MembagiAdilAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const hooks = $derived(
    task.kind === 'sort'
      ? { 'data-fair': String(task.fair) }
      : task.kind === 'cut'
        ? { 'data-target': String(task.target) }
        : { 'data-correct': task.correctId },
  );

  const pickedShape = $derived.by(() => {
    if (task.kind !== 'pick') return null;
    const id = answer.placement.pilihan;
    const face = task.cards.find((card) => card.id === id)?.face;
    return face?.kind === 'shape' ? face : null;
  });

  function place(placement: Placement): void {
    onanswer({ ...answer, placement });
  }
</script>

<div class="task" data-task-kind={task.kind} {...hooks} data-diff={diff ? 'true' : undefined}>
  {#if task.kind === 'sort'}
    <p class="question">Martabak ini dibagi <span class="hl">adil</span> atau tidak?</p>
    <CardSlots cards={[task.card]} slots={SORT_SLOTS} placement={answer.placement} onplace={place} {locked} />
    {#if diff && task.card.face?.kind === 'shape'}
      <div class="diff" data-testid="diff">
        <Circle slices={task.card.face.slices} guides={task.card.face.slices.length} size="md" label="Garis merah: kalau dipotong sama besar" />
        <p class="caption" aria-hidden="true">Garis merah: kalau dipotong sama besar</p>
      </div>
    {/if}
  {:else if task.kind === 'cut'}
    <p class="question">Potong martabak untuk <span class="hl">{task.target} anak</span>, sama besar.</p>
    <div class="cut">
      <Circle
        slices={equalSlices(answer.cuts)}
        label={answer.cuts === 1 ? 'Martabak utuh' : `Martabak dipotong ${answer.cuts} sama besar`}
        guides={diff ? task.target : 0}
        size="lg"
      />
      <CountStepper label="Jumlah potong" value={answer.cuts} min={CUT_MIN} max={CUT_MAX} disabled={locked} onchange={(cuts) => onanswer({ ...answer, cuts })} />
    </div>
  {:else}
    <p class="question">Mana yang menunjukkan <FractionText value={frac(1, task.target)} /> martabak?</p>
    <CardSlots cards={task.cards} slots={PICK_SLOTS} placement={answer.placement} onplace={place} {locked} />
    {#if diff && pickedShape}
      <div class="diff" data-testid="diff">
        <Circle slices={pickedShape.slices} shaded={pickedShape.shaded} guides={task.target} size="md" label={`Pilihanmu, dengan garis merah untuk ${task.target} sama besar`} />
        <p class="caption" aria-hidden="true">Pilihanmu. Garis merah: kalau dipotong {task.target} sama besar.</p>
      </div>
    {/if}
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
  .cut {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5em;
  }
</style>
