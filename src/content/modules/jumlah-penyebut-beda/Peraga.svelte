<script lang="ts">
  import { untrack } from 'svelte';
  import CountStepper from '../../../components/CountStepper.svelte';
  import FractionStepper from '../../../components/FractionStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import HandNote from '../../../components/HandNote.svelte';
  import { frac, lcm, type Fraction } from '../../../lib/fraction';
  import Bar from '../../../manipulatives/Bar.svelte';
  import { maxCut, shownValue, type BarRow } from '../../../manipulatives/bar';
  import PeragaFrame from '../../../pages/PeragaFrame.svelte';
  import type { PeragaProps } from '../../types';
  import { DIFF_LIMITS, fitsCommon, type DiffParams } from './params';

  let { params, onparams }: PeragaProps<DiffParams> = $props();

  const TOTAL_STEPS = 4;

  let step = $state(0);
  let cutA = $state(1);
  let cutB = $state(1);
  let rejected = $state(false);

  const common = $derived(lcm(params.a.d, params.b.d));
  const ka = $derived(common / params.a.d);
  const kb = $derived(common / params.b.d);
  const kNowA = $derived(step >= 2 ? ka : step === 1 ? Math.min(cutA, maxCut(params.a.d)) : 1);
  const kNowB = $derived(step >= 2 ? kb : step === 1 ? Math.min(cutB, maxCut(params.b.d)) : 1);
  const equalParts = $derived(params.a.d * kNowA === params.b.d * kNowB);
  const sum = $derived(frac(params.a.n * ka + params.b.n * kb, common));
  const rowA: BarRow = $derived({ id: 'a', value: params.a, color: 'var(--frac-1)', cut: kNowA });
  const rowB: BarRow = $derived({ id: 'b', value: params.b, color: 'var(--frac-2)', cut: kNowB });
  const rows: BarRow[] = $derived(
    step === 3
      ? [rowA, rowB, { id: 'hasil', value: sum, color: 'var(--frac-3)', wholes: sum.n > sum.d ? 2 : 1 }]
      : [rowA, rowB],
  );

  $effect.pre(() => {
    void params.a.n;
    void params.a.d;
    void params.b.n;
    void params.b.d;
    untrack(() => {
      cutA = 1;
      cutB = 1;
      rejected = false;
    });
  });

  function goTo(next: number): void {
    step = next;
    rejected = false;
    cutA = 1;
    cutB = 1;
  }

  function show(): void {
    cutA = ka;
    cutB = kb;
  }

  function setA(a: Fraction): void {
    rejected = !fitsCommon(a, params.b);
    if (!rejected) onparams({ ...params, a });
  }

  function setB(b: Fraction): void {
    rejected = !fitsCommon(params.a, b);
    if (!rejected) onparams({ ...params, b });
  }
</script>

<PeragaFrame {step} total={TOTAL_STEPS} onstep={goTo} onshow={step === 1 ? show : undefined}>
  {#snippet caption()}
    {#if step === 0}
      Ini pita <FractionText value={params.a} /> dan pita <FractionText value={params.b} />.
      {params.a.d === params.b.d ? 'Potongannya sudah sama besar.' : 'Potongannya tidak sama besar.'}
    {:else if step === 1}
      Potong ulang keduanya sampai potongannya <span class="hl">sama besar</span>.
    {:else if step === 2}
      Sekarang <span class="hl"><FractionText value={shownValue(rowA)} /> + <FractionText value={shownValue(rowB)} /></span>.
    {:else}
      Jadi <span class="hl"><FractionText value={params.a} /> + <FractionText value={params.b} /> = <FractionText value={sum} /></span>.
    {/if}
  {/snippet}
  {#snippet stage()}
    <div class="stage">
      <Bar {rows} stacking={null} />
      {#if (step === 1 || step === 2) && equalParts}
        <HandNote color="blue">sama besar!</HandNote>
      {/if}
      {#if rejected}
        <HandNote>Potongannya terlalu banyak. Pilih pecahan lain.</HandNote>
      {/if}
    </div>
  {/snippet}
  {#snippet controls()}
    <FractionStepper label="Pecahan pertama" value={params.a} limits={DIFF_LIMITS} onchange={setA} />
    <FractionStepper label="Pecahan kedua" value={params.b} limits={DIFF_LIMITS} onchange={setB} />
    {#if step === 1}
      <CountStepper label="Potong ulang pita pertama" value={kNowA} min={1} max={maxCut(params.a.d)} onchange={(value) => (cutA = value)} />
      <CountStepper label="Potong ulang pita kedua" value={kNowB} min={1} max={maxCut(params.b.d)} onchange={(value) => (cutB = value)} />
    {/if}
  {/snippet}
</PeragaFrame>

<style>
  .stage {
    display: grid;
    gap: 0.6em;
  }
</style>
