import type { ModuleDef } from '../../types';
import Peraga from './Peraga.svelte';
import TaskView from './TaskView.svelte';
import { formatShareParams, parseShareParams, type ShareParams } from './params';
import { CONCLUSION, checkTask, emptyAnswer, generateTasks, isComplete, solution, type ShareAnswer, type ShareTask } from './tasks';

export const pecahanDariJumlah: ModuleDef<ShareParams, ShareTask, ShareAnswer> = {
  slug: 'pecahan-dari-jumlah',
  peraga: { parseParams: parseShareParams, formatParams: formatShareParams, View: Peraga },
  latihan: {
    generate: generateTasks,
    emptyAnswer,
    isComplete,
    solution,
    check: checkTask,
    conclusion: CONCLUSION,
    TaskView,
  },
};
