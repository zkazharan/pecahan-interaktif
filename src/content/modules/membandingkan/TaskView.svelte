<script lang="ts">
  import Bar from '../../../manipulatives/Bar.svelte';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import NumberLine from '../../../manipulatives/NumberLine.svelte';
  import { stackNote, type BarRow, type Stacking } from '../../../manipulatives/bar';
  import { compare } from '../../../lib/fraction';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import type { TaskViewProps } from '../../types';
  import { orderDiff, slotsFor, type MembandingkanTask } from './tasks';

  let { task, answer, onanswer, feedback, diff = false }: TaskViewProps<MembandingkanTask, Placement> = $props();

  const COLORS = ['var(--frac-1)', 'var(--frac-2)', 'var(--frac-3)'];

  let aidOpen = $state(false);
  let stacking = $state<Stacking | undefined>(undefined);

  const rows: BarRow[] = $derived(
    task.cards.map((card, i) => ({ id: card.id, value: card.value, color: COLORS[i % COLORS.length] })),
  );
  const lineCards = $derived(task.cards.map((card, i) => ({ ...card, accent: COLORS[i] })));
  const lineMarks = $derived(
    lineCards.map((card, i) => ({ perUnit: card.value.d, color: COLORS[i], side: i === 0 ? ('above' as const) : ('below' as const) })),
  );
  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const showAid = $derived(aidOpen || feedback === 'wrong' || feedback === 'shown');
  const solutionStacking: Stacking = $derived.by(() => {
    if (task.kind !== 'compare') return null;
    const [small, large] = [...task.cards].sort((x, y) => compare(x.value, y.value));
    return { pieceOf: large.id, onto: small.id };
  });
  const diffPair = $derived.by(() => (diff && task.kind === 'order' ? orderDiff(task, answer) : null));
  const diffStacking: Stacking = $derived.by(() => {
    if (!diff) return null;
    if (task.kind === 'compare') {
      const chosen = task.cards.find((card) => card.id === answer.besar);
      const other = task.cards.find((card) => card.id !== answer.besar);
      return chosen && other ? { pieceOf: chosen.id, onto: other.id } : null;
    }
    return diffPair ? { pieceOf: diffPair.left, onto: diffPair.right } : null;
  });
  const flagged = $derived(diffPair ? ['s1', 's2', 's3'].filter((slot) => answer[slot] === diffPair.left || answer[slot] === diffPair.right) : []);
  const shownStacking: Stacking = $derived.by(() => {
    if (feedback === 'shown') return solutionStacking ?? stacking ?? null;
    if (diff) return diffStacking;
    return stacking ?? null;
  });
</script>

<div
  class="task"
  data-task-kind={task.kind}
  data-per-unit={task.kind === 'line' ? String(task.perUnit) : undefined}
  data-diff={diff ? 'true' : undefined}
>
  <p class="question">
    {#if task.kind === 'compare'}
      Mana yang <span class="hl">lebih besar</span>? Taruh kartunya di kotak.
    {:else if task.kind === 'order'}
      Urutkan dari yang <span class="hl">paling kecil</span>.
    {:else}
      Taruh kedua kartu di <span class="hl">garis bilangan</span>.
    {/if}
  </p>

  {#if task.kind === 'line'}
    <NumberLine max={1} perUnit={task.perUnit} cards={lineCards} marks={lineMarks} placement={answer} onplace={onanswer} {locked} showValues={diff} />
  {:else}
    <CardSlots cards={task.cards} slots={slotsFor(task)} placement={answer} onplace={onanswer} {locked} {flagged} />
  {/if}

  {#if showAid}
    <div class="aid">
      <Bar {rows} stacking={shownStacking} draggable={!locked && !diff} note={stackNote(rows, shownStacking)} onstack={(next) => (stacking = next)} />
    </div>
  {:else if feedback !== 'correct'}
    <button type="button" class="aid-toggle" onclick={() => (aidOpen = true)}>bingung? buka pitanya ↓</button>
  {/if}
</div>

<style>
  .question {
    margin: 0 0 0.6em;
    font-size: 1.25em;
    font-weight: 600;
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
