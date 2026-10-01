<script lang="ts">
  import Bar from '../../../manipulatives/Bar.svelte';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import NumberLine from '../../../manipulatives/NumberLine.svelte';
  import { stackNote, type BarRow, type Stacking } from '../../../manipulatives/bar';
  import { compare } from '../../../lib/fraction';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import type { TaskViewProps } from '../../types';
  import { slotsFor, type MembandingkanTask } from './tasks';

  let { task, answer, onanswer, feedback }: TaskViewProps<MembandingkanTask, Placement> = $props();

  const COLORS = ['var(--frac-1)', 'var(--frac-2)', 'var(--frac-3)'];

  let aidOpen = $state(false);
  let stacking = $state<Stacking | undefined>(undefined);

  const rows: BarRow[] = $derived(
    task.cards.map((card, i) => ({ id: card.id, value: card.value, color: COLORS[i % COLORS.length] })),
  );
  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const showAid = $derived(aidOpen || feedback === 'wrong' || feedback === 'shown');
  const solutionStacking: Stacking = $derived.by(() => {
    if (task.kind !== 'compare') return null;
    const [small, large] = [...task.cards].sort((x, y) => compare(x.value, y.value));
    return { pieceOf: large.id, onto: small.id };
  });
  const shownStacking: Stacking = $derived.by(() => {
    if (feedback === 'shown') return solutionStacking ?? stacking ?? null;
    if (stacking !== undefined) return stacking;
    return feedback === 'wrong' && task.kind === 'compare' ? { pieceOf: task.cards[0].id, onto: task.cards[1].id } : null;
  });
</script>

<div class="task" data-task-kind={task.kind} data-per-unit={task.kind === 'line' ? String(task.perUnit) : undefined}>
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
    <NumberLine max={1} perUnit={task.perUnit} cards={task.cards} placement={answer} onplace={onanswer} {locked} />
  {:else}
    <CardSlots cards={task.cards} slots={slotsFor(task)} placement={answer} onplace={onanswer} {locked} />
  {/if}

  {#if showAid}
    <div class="aid">
      <Bar {rows} stacking={shownStacking} draggable={!locked} note={stackNote(rows, shownStacking)} onstack={(next) => (stacking = next)} />
    </div>
  {:else}
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
