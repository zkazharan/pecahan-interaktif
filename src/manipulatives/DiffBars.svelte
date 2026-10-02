<script lang="ts">
  import type { Fraction } from '../lib/fraction';
  import Bar from './Bar.svelte';
  import type { BarRow } from './bar';

  type Props = { goal: Fraction; mine: Fraction; hideGoal?: boolean };

  let { goal, mine, hideGoal = false }: Props = $props();

  const wholes = $derived(Math.max(1, Math.ceil(goal.n / goal.d), Math.ceil(mine.n / mine.d)));
  const rows = $derived<BarRow[]>([
    { id: 'goal', value: goal, color: 'var(--frac-2)', wholes, hideLabel: hideGoal, caption: 'Tujuan' },
    { id: 'mine', value: mine, color: 'var(--frac-1)', wholes, caption: 'Pilihanmu' },
  ]);
</script>

<div class="diff-bars" data-testid="diff-bars">
  <Bar {rows} stacking={null} compare={{ row: 'mine', against: 'goal' }} />
</div>

<style>
  .diff-bars {
    max-width: 560px;
  }
</style>
