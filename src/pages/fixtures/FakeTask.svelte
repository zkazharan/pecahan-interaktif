<script lang="ts">
  import type { TaskViewProps } from '../../content/types';

  let { task, answer, onanswer, feedback, diff = false }: TaskViewProps<{ target: number }, number | null> = $props();
</script>

<p>Target {task.target} · Jawaban {answer ?? '-'} · Umpan balik {feedback} · Beda {diff ? 'ya' : 'tidak'}</p>
<button type="button" onclick={() => onanswer(task.target)}>Jawab benar</button>
<button type="button" onclick={() => onanswer(-1)}>Jawab salah</button>
<button type="button" onclick={() => onanswer(-2)}>Jawab salah lain</button>
<button type="button" onclick={() => onanswer(answer === null ? null : answer - 100)}>Ubah bantuan</button>
{#if diff}<div data-testid="diff"></div>{/if}
