import type { ModuleDef } from '../../types';
import Peraga from './Peraga.svelte';
import TaskView from './TaskView.svelte';
import { formatMixedParams, parseMixedParams, type MixedParams } from './params';
import {
  CONCLUSION,
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  solution,
  type CampuranAnswer,
  type CampuranTask,
} from './tasks';

export const pecahanCampuran: ModuleDef<MixedParams, CampuranTask, CampuranAnswer> = {
  slug: 'pecahan-campuran',
  peraga: { parseParams: parseMixedParams, formatParams: formatMixedParams, View: Peraga },
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
