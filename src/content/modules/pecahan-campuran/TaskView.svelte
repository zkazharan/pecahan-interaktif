<script lang="ts">
  import FractionText from '../../../components/FractionText.svelte';
  import { frac } from '../../../lib/fraction';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import DiffBars from '../../../manipulatives/DiffBars.svelte';
  import NumberLine from '../../../manipulatives/NumberLine.svelte';
  import Plates from '../../../manipulatives/Plates.svelte';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import { fillGreedy, type PlatesState } from '../../../manipulatives/plates';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import { plateCountFor } from './params';
  import { groupDiff, type CampuranAnswer, type CampuranTask } from './tasks';

  let { task, answer, onanswer, feedback, diff = false }: TaskViewProps<CampuranTask, CampuranAnswer> = $props();

  let aidOpen = $state(false);

  const showAid = $derived(aidOpen || feedback === 'wrong' || feedback === 'shown');
  const aidPlates: PlatesState | null = $derived(
    task.kind === 'mixed' ? fillGreedy(task.value.n, plateCountFor(task.value), task.value.d) : null,
  );
  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const hooks = $derived(
    task.kind === 'group'
      ? { 'data-n': String(task.value.n), 'data-d': String(task.value.d) }
      : task.kind === 'line'
        ? { 'data-per-unit': String(task.perUnit) }
        : { 'data-correct': task.correctId },
  );

  const flagged = $derived(task.kind === 'group' && diff ? groupDiff(task.value, answer.plates) : []);
  const pickedValue = $derived(task.kind === 'mixed' ? task.cards.find((card) => card.id === answer.placement.pilihan)?.value : undefined);

  function place(placement: Placement): void {
    onanswer({ ...answer, placement });
  }
</script>

<div class="task" data-task-kind={task.kind} {...hooks} data-diff={diff ? 'true' : undefined}>
  {#if task.kind === 'group'}
    <p class="question">
      Susun {task.value.n} potong <FractionText value={frac(1, task.value.d)} /> di piring. Satu piring muat <span class="hl">{task.value.d} potong</span>.
    </p>
    <Plates capacity={task.value.d} state={answer.plates} onmove={(plates) => onanswer({ ...answer, plates })} {locked} {flagged} />
  {:else if task.kind === 'line'}
    <p class="question">Taruh kartunya di <span class="hl">garis bilangan 0 sampai {task.max}</span>.</p>
    <NumberLine max={task.max} perUnit={task.perUnit} cards={[task.card]} placement={answer.placement} onplace={place} {locked} showValues={diff} />
  {:else}
    <p class="question"><FractionText value={task.value} /> sama dengan yang mana?</p>
    <CardSlots cards={task.cards} slots={PICK_SLOTS} placement={answer.placement} onplace={place} {locked} />
    {#if aidPlates}
      {#if showAid}
        <div class="aid">
          <Plates capacity={task.value.d} state={aidPlates} onmove={() => {}} locked />
        </div>
      {:else if feedback !== 'correct'}
        <button type="button" class="aid-toggle" onclick={() => (aidOpen = true)}>bingung? lihat piringnya ↓</button>
      {/if}
    {/if}
    {#if diff && pickedValue}
      <div class="diff" data-testid="diff">
        <DiffBars goal={task.value} mine={pickedValue} />
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
  .aid {
    margin-top: 1em;
    max-width: 900px;
  }
  .aid-toggle {
    margin-top: 0.8em;
    min-height: 48px;
    padding: 0 0.4em;
    border: 0;
    background: none;
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: 1.4em;
    color: var(--red);
    cursor: pointer;
  }
</style>
