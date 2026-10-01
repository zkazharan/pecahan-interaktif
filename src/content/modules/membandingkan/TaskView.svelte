<script lang="ts">
  import Bar from '../../../manipulatives/Bar.svelte';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import { stackNote, type BarRow, type Stacking } from '../../../manipulatives/bar';
  import type { Placement } from '../../../manipulatives/cardSlots';
  import type { TaskViewProps } from '../../types';
  import { slotsFor, type MembandingkanTask } from './tasks';

  let { task, answer, onanswer, feedback }: TaskViewProps<MembandingkanTask, Placement> = $props();

  const COLORS = ['var(--frac-1)', 'var(--frac-2)', 'var(--frac-3)'];

  let aidOpen = $state(false);
  let stacking = $state<Stacking>(null);

  const rows: BarRow[] = $derived(
    task.cards.map((card, i) => ({ id: card.id, value: card.value, color: COLORS[i % COLORS.length] })),
  );
  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const showAid = $derived(aidOpen || feedback === 'wrong');
  const shownStacking: Stacking = $derived(
    stacking ??
      (feedback === 'wrong' && task.kind === 'compare' ? { pieceOf: task.cards[0].id, onto: task.cards[1].id } : null),
  );
</script>

<p class="question">
  {#if task.kind === 'compare'}
    Mana yang <span class="hl">lebih besar</span>? Taruh kartunya di kotak.
  {:else}
    Urutkan dari yang <span class="hl">paling kecil</span>.
  {/if}
</p>

<CardSlots cards={task.cards} slots={slotsFor(task)} placement={answer} onplace={onanswer} {locked} />

{#if showAid}
  <div class="aid">
    <Bar {rows} stacking={shownStacking} draggable={!locked} note={stackNote(rows, shownStacking)} onstack={(next) => (stacking = next)} />
  </div>
{:else}
  <button type="button" class="aid-toggle" onclick={() => (aidOpen = true)}>bingung? buka pitanya ↓</button>
{/if}

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
