<script lang="ts">
  import CountStepper from '../../../components/CountStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import HandNote from '../../../components/HandNote.svelte';
  import Bar from '../../../manipulatives/Bar.svelte';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import type { BarRow } from '../../../manipulatives/bar';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import { maxCut } from '../senilai/params';
  import { targetCuts, type BedaAnswer, type BedaTask } from './tasks';

  let { task, answer, onanswer, feedback }: TaskViewProps<BedaTask, BedaAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const equalParts = $derived(task.a.d * answer.cuts[0] === task.b.d * answer.cuts[1]);
  const rows: BarRow[] = $derived([
    { id: 'a', value: task.a, color: 'var(--frac-1)', cut: answer.cuts[0] },
    { id: 'b', value: task.b, color: 'var(--frac-2)', cut: answer.cuts[1] },
  ]);

  function setCut(index: 0 | 1, value: number): void {
    const cuts: [number, number] = index === 0 ? [value, answer.cuts[1]] : [answer.cuts[0], value];
    onanswer({ ...answer, cuts });
  }
</script>

<div class="task" data-task-kind={task.kind} data-cuts={targetCuts(task).join(',')} data-correct={task.correctId}>
  <p class="question">
    <FractionText value={task.a} />
    {task.kind === 'add-recut' ? '+' : '−'}
    <FractionText value={task.b} /> = ?
  </p>
  <Bar {rows} stacking={null} />
  <div class="cuts">
    <CountStepper label="Potong ulang pita pertama" value={answer.cuts[0]} min={1} max={maxCut(task.a.d)} disabled={locked} onchange={(value) => setCut(0, value)} />
    <CountStepper label="Potong ulang pita kedua" value={answer.cuts[1]} min={1} max={maxCut(task.b.d)} disabled={locked} onchange={(value) => setCut(1, value)} />
    {#if equalParts}
      <HandNote color="blue">sama besar!</HandNote>
    {:else}
      <HandNote color="pencil">samakan dulu potongannya</HandNote>
    {/if}
  </div>
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
  .cuts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8em;
  }
</style>
