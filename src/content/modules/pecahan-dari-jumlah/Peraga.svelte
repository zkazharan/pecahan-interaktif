<script lang="ts">
  import { untrack } from 'svelte';
  import CountStepper from '../../../components/CountStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import { frac } from '../../../lib/fraction';
  import Collection from '../../../manipulatives/Collection.svelte';
  import { dealAll, startCollection, type CollectionState } from '../../../manipulatives/collection';
  import PeragaFrame from '../../../pages/PeragaFrame.svelte';
  import type { PeragaProps } from '../../types';
  import { SHARE_K_MAX, SHARE_K_MIN, maxTotal, stepTotal, withBags, type ShareParams } from './params';

  let { params, onparams }: PeragaProps<ShareParams> = $props();

  const TOTAL_STEPS = 4;

  let step = $state(0);
  let moved = $state<CollectionState | null>(null);

  const n = $derived(params.n);
  const k = $derived(params.k);
  const take = $derived(params.take);
  const per = $derived(n / k);
  const start = $derived(startCollection(n, k));
  const shared = $derived(dealAll(n, k));
  const takenBags = $derived(Array.from({ length: k }, (_, i) => i < take));

  $effect.pre(() => {
    void n;
    void k;
    void take;
    untrack(() => (moved = null));
  });

  function goTo(next: number): void {
    step = next;
    moved = null;
  }

  function show(): void {
    moved = shared;
  }
</script>

<PeragaFrame {step} total={TOTAL_STEPS} onstep={goTo} onshow={step === 1 ? show : undefined}>
  {#snippet caption()}
    {#if step === 0}
      Ada {n} kelereng dan {k} kantong.
    {:else if step === 1}
      Bagikan kelereng ke {k} kantong <span class="hl">sama banyak</span>.
    {:else if step === 2}
      Satu kantong = <FractionText value={frac(1, k)} /> dari {n} = <span class="hl">{per} kelereng</span>.
    {:else}
      <span class="hl"><FractionText value={frac(take, k)} /> dari {n} = {take * per}</span>. Ambil {take} kantong.
    {/if}
  {/snippet}
  {#snippet stage()}
    {#if step === 0}
      <Collection state={start} onmove={() => {}} locked />
    {:else if step === 1}
      <Collection state={moved ?? start} onmove={(next) => (moved = next)} />
    {:else if step === 2}
      <Collection state={shared} onmove={() => {}} locked counts />
    {:else}
      <Collection state={shared} onmove={() => {}} locked counts taken={takenBags} />
    {/if}
  {/snippet}
  {#snippet controls()}
    <CountStepper label="Banyak kantong" value={k} min={SHARE_K_MIN} max={SHARE_K_MAX} onchange={(value) => onparams(withBags(params, value))} />
    <CountStepper label="Banyak kelereng" value={n} min={k} max={maxTotal(k)} onchange={(value) => onparams(stepTotal(params, value))} />
    <CountStepper label="Kantong diambil" value={take} min={1} max={k} onchange={(value) => onparams({ ...params, take: value })} />
  {/snippet}
</PeragaFrame>
