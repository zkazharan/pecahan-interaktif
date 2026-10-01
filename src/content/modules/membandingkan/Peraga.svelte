<script lang="ts">
  import FractionStepper from '../../../components/FractionStepper.svelte';
  import FractionText from '../../../components/FractionText.svelte';
  import { compare, type Fraction } from '../../../lib/fraction';
  import Bar from '../../../manipulatives/Bar.svelte';
  import { stackNote, type BarRow, type Stacking } from '../../../manipulatives/bar';
  import PeragaFrame from '../../../pages/PeragaFrame.svelte';
  import type { PeragaProps } from '../../types';
  import { COMPARE_LIMITS, type CompareParams } from './params';

  let { params, onparams }: PeragaProps<CompareParams> = $props();

  const TOTAL_STEPS = 4;
  const A_ON_B: Stacking = { pieceOf: 'a', onto: 'b' };

  let step = $state(0);
  let stacking = $state<Stacking>(null);

  const rows: BarRow[] = $derived([
    { id: 'a', value: params.a, color: 'var(--frac-1)' },
    { id: 'b', value: params.b, color: 'var(--frac-2)' },
  ]);
  const relation = $derived(compare(params.a, params.b));
  const relationText = $derived(relation > 0 ? 'lebih besar dari' : relation < 0 ? 'lebih kecil dari' : 'sama dengan');

  function goTo(next: number): void {
    step = next;
    if (next === 0) stacking = null;
    if (next >= 2 && stacking === null) stacking = A_ON_B;
  }

  function setA(a: Fraction): void {
    onparams({ ...params, a });
  }

  function setB(b: Fraction): void {
    onparams({ ...params, b });
  }
</script>

<PeragaFrame {step} total={TOTAL_STEPS} onstep={goTo} onshow={step === 1 ? () => (stacking = A_ON_B) : undefined}>
  {#snippet caption()}
    {#if step === 0}
      Ini pita <FractionText value={params.a} /> dan pita <FractionText value={params.b} />. Panjang pita utuhnya sama.
    {:else if step === 1}
      Ambil potongan <FractionText value={params.a} />, lalu tumpuk di atas pita <FractionText value={params.b} />.
    {:else if step === 2}
      Mana yang <span class="hl">lebih panjang?</span>
    {:else}
      Jadi, <span class="hl"><FractionText value={params.a} /> {relationText} <FractionText value={params.b} /></span>.
    {/if}
  {/snippet}
  {#snippet stage()}
    <Bar {rows} {stacking} draggable={step >= 1} note={stackNote(rows, stacking)} onstack={(next) => (stacking = next)} />
  {/snippet}
  {#snippet controls()}
    <FractionStepper label="Pecahan A" value={params.a} limits={COMPARE_LIMITS} onchange={setA} />
    <FractionStepper label="Pecahan B" value={params.b} limits={COMPARE_LIMITS} onchange={setB} />
  {/snippet}
</PeragaFrame>
