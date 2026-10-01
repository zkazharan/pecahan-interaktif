import type { ModuleDef } from '../../types';
import Peraga from './Peraga.svelte';
import TaskView from './TaskView.svelte';
import { formatSameParams, parseSameParams, type SameParams } from './params';
import { CONCLUSION, checkTask, emptyAnswer, generateTasks, isComplete, solution, type SamaAnswer, type SamaTask } from './tasks';

export const jumlahPenyebutSama: ModuleDef<SameParams, SamaTask, SamaAnswer> = {
  slug: 'jumlah-penyebut-sama',
  peraga: { parseParams: parseSameParams, formatParams: formatSameParams, View: Peraga },
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
