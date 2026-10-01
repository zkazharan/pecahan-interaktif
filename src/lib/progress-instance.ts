import { createProgressStore, safeLocalStorage } from './progress';

export const progress = createProgressStore(safeLocalStorage());
