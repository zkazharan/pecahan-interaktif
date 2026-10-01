import type { ModuleDef } from '../../types';
import Peraga from './Peraga.svelte';
import TaskView from './TaskView.svelte';
import { formatEquivParams, parseEquivParams, type EquivParams } from './params';
import {
  CONCLUSION,
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  solution,
  type SenilaiAnswer,
  type SenilaiTask,
} from './tasks';

export const senilai: ModuleDef<EquivParams, SenilaiTask, SenilaiAnswer> = {
  slug: 'senilai',
  peraga: { parseParams: parseEquivParams, formatParams: formatEquivParams, View: Peraga },
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
