<script lang="ts">
  import FractionStepper from '../../../components/FractionStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import Circle from '../../../manipulatives/Circle.svelte';
  import NumberLine from '../../../manipulatives/NumberLine.svelte';
  import type { Card, Placement } from '../../../manipulatives/cardSlots';
  import { equalSlices } from '../../../manipulatives/circle';
  import { tickId, tickIds } from '../../../manipulatives/numberLine';
  import PeragaFrame from '../../../pages/PeragaFrame.svelte';
  import type { PeragaProps } from '../../types';
  import { READ_LIMITS, type ReadParams } from './params';

  let { params, onparams }: PeragaProps<ReadParams> = $props();

  const TOTAL_STEPS = 4;

  let step = $state(0);
  let shaded = $state<boolean[]>([]);
  let placement = $state<Placement>({});

  const d = $derived(params.f.d);
  const n = $derived(params.f.n);
  const shadedNow = $derived(Array.from({ length: d }, (_, i) => shaded[i] ?? false));
  const count = $derived(shadedNow.filter(Boolean).length);
  const card: Card = $derived({ id: 'f', value: params.f });
  const linePlacement = $derived(Object.fromEntries(tickIds(1, d).map((id) => [id, placement[id] ?? null])));

  function fillFirst(): void {
    shaded = Array.from({ length: d }, (_, i) => i < n);
  }

  function toggle(index: number): void {
    shaded = shadedNow.map((value, i) => (i === index ? !value : value));
  }

  function goTo(next: number): void {
    step = next;
    if (next === 0) {
      shaded = [];
      placement = {};
    }
    if (next >= 2 && count !== n) fillFirst();
  }

  function show(): void {
    if (step === 1) fillFirst();
    if (step === 3) placement = { [tickId(n)]: 'f' };
  }
</script>

<PeragaFrame {step} total={TOTAL_STEPS} onstep={goTo} onshow={step === 1 || step === 3 ? show : undefined}>
  {#snippet caption()}
    {#if step === 0}
      Martabak dipotong {d} sama besar. Banyaknya potong ditulis di bawah: <span class="hl">penyebut = {d}</span>.
    {:else if step === 1}
      Arsir {n} potong. Yang diarsir ditulis di atas: <span class="hl">pembilang = {n}</span>.
    {:else if step === 2}
      Jadi bagian yang diarsir adalah <span class="hl"><FractionText value={params.f} /></span>.
    {:else}
      Garis 0 sampai 1 juga dibagi {d}. Taruh <FractionText value={params.f} /> di tandanya.
    {/if}
  {/snippet}
  {#snippet stage()}
    {#if step < 3}
      <div class="stage">
        <Circle
          slices={equalSlices(d)}
          shaded={shadedNow}
          onshade={step === 1 ? toggle : undefined}
          label={`Martabak dipotong ${d} sama besar, ${count} diarsir`}
          size="lg"
        />
        {#if step === 2}
          <span class="big"><FractionText value={params.f} size="lg" /></span>
        {/if}
      </div>
    {:else}
      <NumberLine max={1} perUnit={d} cards={[card]} placement={linePlacement} onplace={(next) => (placement = next)} />
    {/if}
  {/snippet}
  {#snippet controls()}
    <FractionStepper label="Pecahan" value={params.f} limits={READ_LIMITS} onchange={(f) => onparams({ f })} />
  {/snippet}
</PeragaFrame>

<style>
  .stage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5em;
  }
  .big {
    font-size: 2em;
  }
</style>
