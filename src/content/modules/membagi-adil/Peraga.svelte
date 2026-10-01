<script lang="ts">
  import CountStepper from '../../../components/CountStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import HandNote from '../../../components/HandNote.svelte';
  import { frac } from '../../../lib/fraction';
  import { createRng } from '../../../lib/random';
  import Circle from '../../../manipulatives/Circle.svelte';
  import { equalSlices, unequalSlices } from '../../../manipulatives/circle';
  import PeragaFrame from '../../../pages/PeragaFrame.svelte';
  import type { PeragaProps } from '../../types';
  import { PEOPLE_MAX, PEOPLE_MIN, type FairParams } from './params';
  import { CUT_MAX, CUT_MIN } from './tasks';

  let { params, onparams }: PeragaProps<FairParams> = $props();

  const TOTAL_STEPS = 4;

  let step = $state(0);
  let cuts = $state(1);
  let unfairShown = $state(false);

  const unfair = $derived(unequalSlices(createRng(params.n), params.n));
  const slices = $derived(step === 0 ? [1] : step === 1 ? unfair : equalSlices(step === 3 ? params.n : cuts));
  const shaded = $derived(step === 3 ? [true] : []);
  const fair = $derived(step === 2 && cuts === params.n);
  const label = $derived(
    step === 0
      ? 'Martabak utuh'
      : step === 1
        ? `Martabak dipotong ${params.n} tidak sama besar`
        : step === 3
          ? `Martabak dipotong ${params.n} sama besar, 1 diarsir`
          : cuts === 1
            ? 'Martabak utuh'
            : `Martabak dipotong ${cuts} sama besar`,
  );

  function goTo(next: number): void {
    step = next;
    unfairShown = false;
    if (next < 2) cuts = 1;
    if (next === 3) cuts = params.n;
  }
</script>

<PeragaFrame {step} total={TOTAL_STEPS} onstep={goTo} onshow={step === 1 ? () => (unfairShown = true) : step === 2 ? () => (cuts = params.n) : undefined}>
  {#snippet caption()}
    {#if step === 0}
      Martabak ini mau dibagi untuk <span class="hl">{params.n} anak</span>.
    {:else if step === 1}
      Kalau dipotong begini, adil tidak?
    {:else if step === 2}
      Potong jadi <span class="hl">{params.n} bagian yang sama besar</span>.
    {:else}
      Setiap anak dapat 1 dari {params.n} potong yang sama besar. Ditulis <span class="hl"><FractionText value={frac(1, params.n)} /></span>.
    {/if}
  {/snippet}
  {#snippet stage()}
    <div class="stage">
      <Circle {slices} {shaded} {label} size="lg" />
      <div class="side">
        {#if step === 1 && unfairShown}
          <HandNote>tidak sama besar!</HandNote>
        {/if}
        {#if step === 2}
          <CountStepper label="Jumlah potong" value={cuts} min={CUT_MIN} max={CUT_MAX} onchange={(value) => (cuts = value)} />
          {#if fair}
            <HandNote color="blue">sama besar, adil!</HandNote>
          {/if}
        {/if}
      </div>
    </div>
  {/snippet}
  {#snippet controls()}
    <CountStepper label="Jumlah anak" value={params.n} min={PEOPLE_MIN} max={PEOPLE_MAX} onchange={(n) => onparams({ n })} />
  {/snippet}
</PeragaFrame>

<style>
  .stage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5em;
  }
  .side {
    display: grid;
    gap: 1em;
    justify-items: start;
  }
</style>
