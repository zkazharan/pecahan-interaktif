<script lang="ts">
  import FractionStepper from '../../../components/FractionStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import MixedText from '../../../components/MixedText.svelte';
  import { frac, toMixed } from '../../../lib/fraction';
  import NumberLine from '../../../manipulatives/NumberLine.svelte';
  import Plates from '../../../manipulatives/Plates.svelte';
  import type { Card } from '../../../manipulatives/cardSlots';
  import { tickId, tickIds } from '../../../manipulatives/numberLine';
  import { fillGreedy, fullPlates, startPlates, totalPieces, type PlatesState } from '../../../manipulatives/plates';
  import PeragaFrame from '../../../pages/PeragaFrame.svelte';
  import type { PeragaProps } from '../../types';
  import { MIXED_LIMITS, plateCountFor, type MixedParams } from './params';

  let { params, onparams }: PeragaProps<MixedParams> = $props();

  const TOTAL_STEPS = 4;

  let step = $state(0);
  let plates = $state<PlatesState | null>(null);

  const n = $derived(params.f.n);
  const d = $derived(params.f.d);
  const plateCount = $derived(plateCountFor(params.f));
  const mixed = $derived(toMixed(params.f));
  const platesNow = $derived(
    plates && plates.plates.length === plateCount && totalPieces(plates) === n ? plates : startPlates(n, plateCount),
  );
  const card: Card = $derived({ id: 'f', value: params.f });
  const linePlacement = $derived({ ...Object.fromEntries(tickIds(plateCount, d).map((id) => [id, null])), [tickId(n)]: 'f' });

  function fill(): void {
    plates = fillGreedy(n, plateCount, d);
  }

  function goTo(next: number): void {
    step = next;
    if (next === 0) plates = null;
    if (next >= 2 && (platesNow.tray > 0 || fullPlates(platesNow, d) !== mixed.whole)) fill();
  }
</script>

<PeragaFrame {step} total={TOTAL_STEPS} onstep={goTo} onshow={step === 1 ? fill : undefined}>
  {#snippet caption()}
    {#if step === 0}
      Ada {n} potong martabak. Setiap potong besarnya <FractionText value={frac(1, d)} />.
    {:else if step === 1}
      Susun potongannya di piring. Satu piring muat <span class="hl">{d} potong</span>.
    {:else if step === 2}
      <span class="hl">{mixed.whole} piring penuh = {mixed.whole} utuh</span>.
      {#if mixed.rest.n > 0}
        Sisanya <FractionText value={mixed.rest} />.
      {:else}
        Tidak ada sisa.
      {/if}
    {:else}
      Jadi <span class="hl"><FractionText value={params.f} /> = <MixedText whole={mixed.whole} rest={mixed.rest} /></span>.
    {/if}
  {/snippet}
  {#snippet stage()}
    {#if step < 3}
      <Plates capacity={d} state={platesNow} onmove={(next) => (plates = next)} locked={step !== 1} />
    {:else}
      <div class="final">
        <span class="big"><MixedText whole={mixed.whole} rest={mixed.rest} size="lg" /></span>
        <NumberLine max={plateCount} perUnit={d} cards={[card]} placement={linePlacement} onplace={() => {}} locked />
      </div>
    {/if}
  {/snippet}
  {#snippet controls()}
    <FractionStepper label="Pecahan" value={params.f} limits={MIXED_LIMITS} onchange={(f) => onparams({ f })} />
  {/snippet}
</PeragaFrame>

<style>
  .final {
    display: grid;
    gap: 1em;
  }
  .big {
    font-size: 2em;
  }
</style>
