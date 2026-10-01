<script lang="ts" generics="T, A">
  import { untrack } from 'svelte';
  import HandNote from '../components/HandNote.svelte';
  import Stamp from '../components/Stamp.svelte';
  import TaskChecks from '../components/TaskChecks.svelte';
  import type { CatalogEntry } from '../content/catalog';
  import {
    TASKS_PER_LATIHAN,
    canShowSolution,
    feedbackFor,
    firstTryCount,
    nextTask,
    showSolution,
    stampText,
    startLatihan,
    submitAnswer,
  } from '../content/latihan';
  import type { LatihanDef } from '../content/types';
  import type { ProgressStore } from '../lib/progress';
  import { progress } from '../lib/progress-instance';
  import { createRng, randomSeed } from '../lib/random';

  type Props = {
    latihan: LatihanDef<T, A>;
    slug: string;
    number: number;
    next?: CatalogEntry;
    seed?: number;
    store?: ProgressStore;
  };

  let { latihan, slug, number, next, seed = randomSeed(), store = progress }: Props = $props();

  let round = $state(0);
  const tasks = $derived(latihan.generate(createRng(seed + round)));
  let flow = $state(startLatihan());
  let answer = $state<A>(untrack(() => latihan.emptyAnswer(latihan.generate(createRng(seed))[0])));
  let hint = $state('');

  const task = $derived(tasks[flow.index]);
  const firstTry = $derived(firstTryCount(flow.outcomes));
  const complete = $derived(latihan.isComplete(task, answer));
  const settled = $derived(flow.status === 'correct' || flow.status === 'shown');

  function check(): void {
    const result = latihan.check(task, answer);
    flow = submitAnswer(flow, result.correct);
    hint = result.correct ? '' : result.hint;
  }

  function reveal(): void {
    flow = showSolution(flow);
    answer = latihan.solution(task);
    hint = '';
  }

  function advance(): void {
    flow = nextTask(flow);
    hint = '';
    if (flow.status === 'done') {
      store.record(slug, firstTryCount(flow.outcomes));
      return;
    }
    answer = latihan.emptyAnswer(tasks[flow.index]);
  }

  function restart(): void {
    round += 1;
    flow = startLatihan();
    answer = latihan.emptyAnswer(tasks[0]);
    hint = '';
  }
</script>

<section class="latihan">
  <TaskChecks outcomes={flow.outcomes} total={TASKS_PER_LATIHAN} />

  {#if flow.status === 'done'}
    <div class="done">
      <p class="result">{firstTry} dari {TASKS_PER_LATIHAN} langsung benar.</p>
      <p class="conclusion"><HandNote color="blue" tilt={-1}>{latihan.conclusion}</HandNote></p>
      <Stamp text={stampText(firstTry)} score={firstTry * 20} caption={`MODUL ${number} SELESAI`} />
      <div class="actions">
        <button type="button" class="btn" onclick={restart}>Ulangi latihan</button>
        {#if next}
          <a class="btn primary" href={`#/${next.slug}/peraga`}>Lanjut ke Modul {next.number} →</a>
        {:else}
          <a class="btn primary" href="#/">Kembali ke daftar modul</a>
        {/if}
      </div>
    </div>
  {:else}
    <p class="counter">Soal {flow.index + 1} dari {TASKS_PER_LATIHAN}</p>
    {#key `${round}-${flow.index}`}
      <div class="task">
        <latihan.TaskView {task} {answer} onanswer={(value: A) => (answer = value)} feedback={feedbackFor(flow.status)} />
      </div>
    {/key}
    <p class="feedback" aria-live="polite">
      {#if hint}
        <HandNote>{hint}</HandNote>
      {:else if flow.status === 'correct'}
        <HandNote color="blue">Betul!</HandNote>
      {/if}
    </p>
    <div class="actions">
      {#if settled}
        <button type="button" class="btn primary" onclick={advance}>
          {flow.index + 1 === TASKS_PER_LATIHAN ? 'Lihat hasil' : 'Soal berikutnya →'}
        </button>
      {:else}
        {#if canShowSolution(flow)}
          <button type="button" class="btn" onclick={reveal}>Tunjukkan caranya</button>
        {/if}
        <button type="button" class="btn primary" disabled={!complete} onclick={check}>Cek jawaban</button>
      {/if}
    </div>
  {/if}
</section>

<style>
  .latihan {
    display: grid;
    gap: 0.8em;
    max-width: 1100px;
  }
  .counter,
  .result {
    margin: 0;
    font-weight: 600;
  }
  .feedback {
    min-height: 1.8em;
    margin: 0;
  }
  .actions {
    position: sticky;
    bottom: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.8em;
    padding: 0.8em 0;
    background: rgba(251, 247, 236, 0.96);
  }
  .done {
    display: grid;
    gap: 1em;
    justify-items: start;
  }
  .conclusion {
    margin: 0;
  }
  @media (max-width: 599px) {
    .actions .btn {
      flex: 1 1 100%;
    }
  }
</style>
