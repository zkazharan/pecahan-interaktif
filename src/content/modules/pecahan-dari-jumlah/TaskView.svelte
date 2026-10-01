<script lang="ts">
  import FractionText from '../../../components/FractionText.svelte';
  import { frac } from '../../../lib/fraction';
  import CardSlots from '../../../manipulatives/CardSlots.svelte';
  import Collection from '../../../manipulatives/Collection.svelte';
  import { takenCount } from '../../../manipulatives/collection';
  import type { TaskViewProps } from '../../types';
  import { PICK_SLOTS } from '../common';
  import type { ShareAnswer, ShareTask } from './tasks';

  let { task, answer, onanswer, feedback, diff = false }: TaskViewProps<ShareTask, ShareAnswer> = $props();

  const locked = $derived(feedback === 'correct' || feedback === 'shown');
  const showAid = $derived(diff || feedback === 'shown');
  const showCounts = $derived(showAid && (task.kind !== 'count' || task.take > 1 || feedback === 'shown'));
  const firstTaken = $derived(task.kind === 'split' ? [] : Array.from({ length: task.bags }, (_, i) => i < task.take));

  function toggle(index: number): void {
    onanswer({ ...answer, taken: answer.taken.map((on, i) => (i === index ? !on : on)) });
  }
</script>

<div
  class="task"
  data-task-kind={task.kind}
  data-total={task.kind === 'split' ? task.total : undefined}
  data-bags={task.kind === 'split' ? task.bags : undefined}
  data-take={task.kind === 'take' ? task.take : undefined}
  data-correct={task.kind === 'count' ? task.correctId : undefined}
  data-diff={diff ? 'true' : undefined}
>
  {#if task.kind === 'split'}
    <p class="question">Bagikan {task.total} kelereng ke {task.bags} kantong sama banyak.</p>
    <Collection state={answer.collection} onmove={(collection) => onanswer({ ...answer, collection })} {locked} counts={diff} />
  {:else if task.kind === 'take'}
    <p class="question">Ambil <FractionText value={frac(task.take, task.bags)} /> dari {task.total} kelereng.</p>
    <p class="help">Ketuk kantong untuk mengambilnya.</p>
    <Collection state={answer.collection} locked taken={answer.taken} ontake={locked ? undefined : toggle} onmove={() => {}} />
    {#if diff}
      <div class="diff" data-testid="diff">
        Yang kamu ambil: <FractionText value={frac(takenCount(answer.taken), task.bags)} />
      </div>
    {/if}
  {:else}
    <p class="question"><FractionText value={frac(task.take, task.bags)} /> dari {task.total} kelereng = ?</p>
    <Collection state={answer.collection} locked onmove={() => {}} taken={showAid ? firstTaken : []} counts={showCounts} />
    <CardSlots cards={task.cards} slots={PICK_SLOTS} placement={answer.placement} onplace={(placement) => onanswer({ ...answer, placement })} {locked} />
  {/if}
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
  .diff {
    margin-top: 0.8em;
    padding: 0.6em 0.8em;
    border-left: 4px dashed var(--red);
  }
</style>
