<script lang="ts">
  import { frac, type Fraction } from '../lib/fraction';
  import { parseField, type FractionLimits } from '../lib/limits';

  let {
    label,
    value,
    limits,
    onchange,
  }: { label: string; value: Fraction; limits: FractionLimits; onchange: (value: Fraction) => void } = $props();

  function setN(n: number): boolean {
    if (n < limits.nMin || n > limits.nMax(value.d)) return false;
    onchange(frac(n, value.d));
    return true;
  }

  function setD(d: number): boolean {
    if (d < limits.dMin || d > limits.dMax) return false;
    const n = Math.min(Math.max(value.n, limits.nMin), limits.nMax(d));
    onchange(frac(n, d));
    return true;
  }

  function typed(event: Event, apply: (x: number) => boolean, current: number): void {
    const input = event.currentTarget as HTMLInputElement;
    const parsed = parseField(input.value);
    if (parsed === null || parsed === current || !apply(parsed)) input.value = String(current);
  }
</script>

<fieldset class="stepper">
  <legend>{label}</legend>
  <div class="row">
    <button type="button" class="step" aria-label={`Kurangi pembilang ${label}`} disabled={value.n <= limits.nMin} onclick={() => setN(value.n - 1)}>−</button>
    <input aria-label={`Pembilang ${label}`} inputmode="numeric" value={value.n} onchange={(e) => typed(e, setN, value.n)} />
    <button type="button" class="step" aria-label={`Tambah pembilang ${label}`} disabled={value.n >= limits.nMax(value.d)} onclick={() => setN(value.n + 1)}>+</button>
  </div>
  <div class="bar" aria-hidden="true"></div>
  <div class="row">
    <button type="button" class="step" aria-label={`Kurangi penyebut ${label}`} disabled={value.d <= limits.dMin} onclick={() => setD(value.d - 1)}>−</button>
    <input aria-label={`Penyebut ${label}`} inputmode="numeric" value={value.d} onchange={(e) => typed(e, setD, value.d)} />
    <button type="button" class="step" aria-label={`Tambah penyebut ${label}`} disabled={value.d >= limits.dMax} onclick={() => setD(value.d + 1)}>+</button>
  </div>
</fieldset>

<style>
  .stepper {
    display: inline-grid;
    gap: 0.2em;
    margin: 0;
    padding: 0.2em 0.6em 0.4em;
    border: var(--line) solid var(--ink);
    border-radius: var(--radius);
    background: #fff;
  }
  legend {
    font-size: 0.8em;
    font-weight: 600;
    padding: 0 0.3em;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.3em;
  }
  .step {
    width: 48px;
    height: 48px;
    border: var(--line) solid var(--ink);
    border-radius: 50%;
    background: var(--paper);
    font-weight: 700;
    font-size: 1.2em;
    cursor: pointer;
  }
  .step:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  input {
    width: 2.4em;
    height: 48px;
    text-align: center;
    font-weight: 700;
    font-size: 1.3em;
    border: 2px dashed var(--ink-soft);
    border-radius: 8px;
    background: transparent;
  }
  .bar {
    height: 4px;
    margin: 0 52px;
    background: var(--ink);
    border-radius: 2px;
  }
</style>
