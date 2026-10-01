<script lang="ts">
  import { scale } from 'svelte/transition';
  import { prefersReducedMotion } from '../lib/motion';

  let { text, score, caption }: { text: string; score: number; caption: string } = $props();
</script>

<div class="stamp-area" role="img" aria-label={`Stempel ${text} Nilai ${score}`}>
  <div class="stamp" in:scale={{ start: 1.5, duration: prefersReducedMotion() ? 0 : 220 }}>
    <span class="small">DIPERIKSA</span>
    <span class="word">{text}</span>
    <span class="small">{caption}</span>
  </div>
  <svg class="paraf" viewBox="0 0 120 60" aria-hidden="true">
    <path d="M5 40 C 20 5, 30 55, 45 25 S 70 10, 75 35 S 100 45, 115 15" />
  </svg>
  <span class="score" aria-hidden="true">{score}</span>
</div>

<style>
  .stamp-area {
    position: relative;
    width: 260px;
    height: 220px;
  }
  .stamp {
    position: absolute;
    left: 10px;
    top: 0;
    width: 170px;
    height: 170px;
    display: grid;
    place-content: center;
    justify-items: center;
    border: 6px double var(--red);
    border-radius: 50%;
    color: var(--red);
    rotate: -14deg;
    opacity: 0.9;
    mix-blend-mode: multiply;
    text-align: center;
  }
  .small {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
  .word {
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: 38px;
    line-height: 0.95;
  }
  .paraf {
    position: absolute;
    right: 0;
    top: 120px;
    width: 100px;
    fill: none;
    stroke: var(--red);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .score {
    position: absolute;
    left: 0;
    bottom: 0;
    padding: 0 12px;
    border: 3px solid var(--red);
    border-radius: 50%;
    color: var(--red);
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: 44px;
    rotate: -6deg;
  }
</style>
