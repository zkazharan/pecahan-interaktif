import type { ModuleDef } from '../../types';
import Peraga from './Peraga.svelte';
import TaskView from './TaskView.svelte';
import { formatReadParams, parseReadParams, type ReadParams } from './params';
import {
  CONCLUSION,
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  solution,
  type MembacaAnswer,
  type MembacaTask,
} from './tasks';

export const membacaPecahan: ModuleDef<ReadParams, MembacaTask, MembacaAnswer> = {
  slug: 'membaca-pecahan',
  peraga: { parseParams: parseReadParams, formatParams: formatReadParams, View: Peraga },
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
