import type { ModuleDef } from '../../types';
import Peraga from './Peraga.svelte';
import TaskView from './TaskView.svelte';
import { formatDiffParams, parseDiffParams, type DiffParams } from './params';
import { CONCLUSION, checkTask, emptyAnswer, generateTasks, isComplete, solution, type BedaAnswer, type BedaTask } from './tasks';

export const jumlahPenyebutBeda: ModuleDef<DiffParams, BedaTask, BedaAnswer> = {
  slug: 'jumlah-penyebut-beda',
  peraga: { parseParams: parseDiffParams, formatParams: formatDiffParams, View: Peraga },
  latihan: {
    generate: generateTasks,
    emptyAnswer,
    isComplete,
    solution,
    check: checkTask,
    graded: (answer) => answer.placement,
    conclusion: CONCLUSION,
    TaskView,
  },
};
