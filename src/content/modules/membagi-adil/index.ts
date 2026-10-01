import type { ModuleDef } from '../../types';
import Peraga from './Peraga.svelte';
import TaskView from './TaskView.svelte';
import { formatFairParams, parseFairParams, type FairParams } from './params';
import {
  CONCLUSION,
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  solution,
  type MembagiAdilAnswer,
  type MembagiAdilTask,
} from './tasks';

export const membagiAdil: ModuleDef<FairParams, MembagiAdilTask, MembagiAdilAnswer> = {
  slug: 'membagi-adil',
  peraga: { parseParams: parseFairParams, formatParams: formatFairParams, View: Peraga },
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
