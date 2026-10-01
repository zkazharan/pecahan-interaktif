<script lang="ts">
  type Props = {
    label: string;
    value: number;
    min: number;
    max: number;
    onchange: (value: number) => void;
    disabled?: boolean;
  };

  let { label, value, min, max, onchange, disabled = false }: Props = $props();
  const lower = $derived(label.toLowerCase());
</script>

<div class="count" role="group" aria-label={label}>
  <span class="label">{label}</span>
  <button type="button" class="step" aria-label={`Kurangi ${lower}`} disabled={disabled || value <= min} onclick={() => onchange(value - 1)}>−</button>
  <output class="value" role="status">{value}</output>
  <button type="button" class="step" aria-label={`Tambah ${lower}`} disabled={disabled || value >= max} onclick={() => onchange(value + 1)}>+</button>
</div>

<style>
  .count {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.3em 0.6em;
    border: var(--line) solid var(--ink);
    border-radius: var(--radius);
    background: #fff;
  }
  .label {
    font-size: 0.85em;
    font-weight: 600;
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
  .value {
    min-width: 1.8em;
    text-align: center;
    font-weight: 700;
    font-size: 1.4em;
  }
</style>
