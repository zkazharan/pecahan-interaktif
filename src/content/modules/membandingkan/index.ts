import type { Placement } from '../../../manipulatives/cardSlots';
import type { ModuleDef } from '../../types';
import Peraga from './Peraga.svelte';
import TaskView from './TaskView.svelte';
import { formatCompareParams, parseCompareParams, type CompareParams } from './params';
import {
  CONCLUSION,
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  solution,
  type MembandingkanTask,
} from './tasks';

export const membandingkan: ModuleDef<CompareParams, MembandingkanTask, Placement> = {
  slug: 'membandingkan',
  peraga: { parseParams: parseCompareParams, formatParams: formatCompareParams, View: Peraga },
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
