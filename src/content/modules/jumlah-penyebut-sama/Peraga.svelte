<script lang="ts">
  import { untrack } from 'svelte';
  import CountStepper from '../../../components/CountStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import { frac } from '../../../lib/fraction';
  import Circle from '../../../manipulatives/Circle.svelte';
  import Plates from '../../../manipulatives/Plates.svelte';
  import { equalSlices } from '../../../manipulatives/circle';
  import { fillGreedy, startPlates, type PlatesState } from '../../../manipulatives/plates';
  import PeragaFrame from '../../../pages/PeragaFrame.svelte';
  import type { PeragaProps } from '../../types';
  import { SAME_D_MAX, SAME_D_MIN, withDenominator, type SameParams } from './params';

  let { params, onparams }: PeragaProps<SameParams> = $props();

  const TOTAL_STEPS = 4;

  let step = $state(0);
  let moved = $state<PlatesState | null>(null);

  const d = $derived(params.d);
  const a = $derived(params.a);
  const b = $derived(params.b);
  const total = $derived(a + b);
  const plateCount = $derived(Math.ceil(total / d));
  const filled = $derived(fillGreedy(total, plateCount, d));
  const platesNow = $derived(
    step === 1 ? (moved ?? startPlates(total, plateCount)) : step === 2 ? filled : (moved ?? filled),
  );

  $effect.pre(() => {
    void d;
    void a;
    void b;
    untrack(() => (moved = null));
  });

  function goTo(next: number): void {
    step = next;
    moved = null;
  }

  function show(): void {
    if (step === 1) moved = filled;
    if (step === 3) moved = { plates: fillGreedy(a, plateCount, d).plates, tray: b };
  }

  function shading(count: number): boolean[] {
    return Array.from({ length: d }, (_, i) => i < count);
  }
</script>

<PeragaFrame {step} total={TOTAL_STEPS} onstep={goTo} onshow={step === 1 || step === 3 ? show : undefined}>
  {#snippet caption()}
    {#if step === 0}
      Ini <FractionText value={frac(a, d)} /> dan <FractionText value={frac(b, d)} /> martabak.
    {:else if step === 1}
      Gabungkan semua potongannya di <span class="hl">loyang</span>.
    {:else if step === 2}
      <span class="hl"><FractionText value={frac(a, d)} /> + <FractionText value={frac(b, d)} /> = <FractionText value={frac(total, d)} /></span>.
      Penyebutnya tetap {d}, pembilangnya dijumlah.
    {:else}
      Kebalikannya: <span class="hl"><FractionText value={frac(total, d)} /> − <FractionText value={frac(b, d)} /> = <FractionText value={frac(a, d)} /></span>.
      Ambil {b} potong dari loyang.
    {/if}
  {/snippet}
  {#snippet stage()}
    {#if step === 0}
      <div class="pair">
        <Circle slices={equalSlices(d)} shaded={shading(a)} label={`Martabak dipotong ${d}, ${a} diarsir`} size="md" />
        <Circle slices={equalSlices(d)} shaded={shading(b)} color="var(--frac-2)" label={`Martabak dipotong ${d}, ${b} diarsir`} size="md" />
      </div>
    {:else}
      <Plates capacity={d} state={platesNow} onmove={(next) => (moved = next)} locked={step === 2} />
    {/if}
  {/snippet}
  {#snippet controls()}
    <CountStepper label="Penyebut" value={d} min={SAME_D_MIN} max={SAME_D_MAX} onchange={(value) => onparams(withDenominator(params, value))} />
    <CountStepper label="Potong pertama" value={a} min={1} max={d} onchange={(value) => onparams({ ...params, a: value })} />
    <CountStepper label="Potong kedua" value={b} min={1} max={d} onchange={(value) => onparams({ ...params, b: value })} />
  {/snippet}
</PeragaFrame>

<style>
  .pair {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5em;
  }
</style>
