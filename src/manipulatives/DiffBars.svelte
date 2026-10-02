<script lang="ts">
  import type { Fraction } from '../lib/fraction';
  import Bar from './Bar.svelte';
  import { stackNote, type BarRow, type Stacking } from './bar';

  type Props = { goal: Fraction; mine: Fraction; hideGoal?: boolean };

  let { goal, mine, hideGoal = false }: Props = $props();

  const wholes = $derived(Math.max(1, Math.ceil(goal.n / goal.d), Math.ceil(mine.n / mine.d)));
  const rows = $derived<BarRow[]>([
    { id: 'goal', value: goal, color: 'var(--frac-2)', wholes, hideLabel: hideGoal, caption: 'Tujuan' },
    { id: 'mine', value: mine, color: 'var(--frac-1)', wholes, caption: 'Pilihanmu' },
  ]);
  const stacking: Stacking = { pieceOf: 'mine', onto: 'goal' };
</script>

<div class="diff-bars" data-testid="diff-bars">
  <Bar {rows} {stacking} note={stackNote(rows, stacking)} />
</div>
