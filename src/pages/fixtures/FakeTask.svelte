<script lang="ts">
  import type { TaskViewProps } from '../../content/types';

  let { task, answer, onanswer, feedback }: TaskViewProps<{ target: number }, number | null> = $props();
</script>

<p>Target {task.target} · Jawaban {answer ?? '-'} · Umpan balik {feedback}</p>
<button type="button" onclick={() => onanswer(task.target)}>Jawab benar</button>
<button type="button" onclick={() => onanswer(-1)}>Jawab salah</button>
<button type="button" onclick={() => onanswer(-2)}>Jawab salah lain</button>
