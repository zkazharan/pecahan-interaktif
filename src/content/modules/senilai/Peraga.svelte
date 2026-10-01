<script lang="ts">
  import CountStepper from '../../../components/CountStepper.svelte';
  import FractionStepper from '../../../components/FractionStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import HandNote from '../../../components/HandNote.svelte';
  import { frac } from '../../../lib/fraction';
  import Bar from '../../../manipulatives/Bar.svelte';
  import { maxCut, type BarRow } from '../../../manipulatives/bar';
  import PeragaFrame from '../../../pages/PeragaFrame.svelte';
  import type { PeragaProps } from '../../types';
  import { EQUIV_LIMITS, type EquivParams } from './params';

  let { params, onparams }: PeragaProps<EquivParams> = $props();

  const TOTAL_STEPS = 4;

  let step = $state(0);
  let cuts = $state(1);

  const limit = $derived(maxCut(params.f.d));
  const cutsNow = $derived(Math.min(cuts, limit));
  const rows: BarRow[] = $derived([
    { id: 'asal', value: params.f, color: 'var(--frac-1)' },
    { id: 'ulang', value: params.f, color: 'var(--frac-2)', cut: cutsNow },
  ]);
  const forms = $derived(
    [1, 2, 3].filter((k) => k <= limit).map((k) => frac(params.f.n * k, params.f.d * k)),
  );

  function goTo(next: number): void {
    step = next;
    if (next <= 1) cuts = 1;
    if (next === 2) cuts = Math.min(2, limit);
    if (next === 3) cuts = Math.min(3, limit);
  }

  function show(): void {
    cuts = Math.min(step === 1 ? 2 : 3, limit);
  }
</script>

<PeragaFrame {step} total={TOTAL_STEPS} onstep={goTo} onshow={step === 1 || step === 2 ? show : undefined}>
  {#snippet caption()}
    {#if step === 0}
      Dua pita <FractionText value={params.f} /> yang sama panjang.
    {:else if step === 1}
      Potong ulang setiap bagian pita bawah jadi <span class="hl">2</span>.
    {:else if step === 2}
      Potong ulang jadi <span class="hl">3</span>.
    {:else}
      Jadi
      <span class="hl">
        {#each forms as form, i (i)}
          {#if i > 0}={/if}
          <FractionText value={form} />
        {/each}
      </span>. Angkanya berubah, nilainya sama.
    {/if}
  {/snippet}
  {#snippet stage()}
    <div class="stage">
      <Bar {rows} stacking={null} />
      {#if cutsNow > 1}
        <HandNote color="blue">panjangnya tetap sama!</HandNote>
      {/if}
    </div>
  {/snippet}
  {#snippet controls()}
    <FractionStepper label="Pecahan" value={params.f} limits={EQUIV_LIMITS} onchange={(f) => onparams({ f })} />
    <CountStepper label="Potong ulang" value={cutsNow} min={1} max={limit} onchange={(value) => (cuts = value)} />
  {/snippet}
</PeragaFrame>

<style>
  .stage {
    display: grid;
    gap: 0.6em;
  }
</style>
