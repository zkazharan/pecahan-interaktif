import type { Feedback } from './types';

export const TASKS_PER_LATIHAN = 5;

export type TaskOutcome = 'first-try' | 'retry' | 'shown';
export type LatihanStatus = 'answering' | 'wrong' | 'correct' | 'shown' | 'done';
export type LatihanState = {
  index: number;
  attempts: number;
  outcomes: TaskOutcome[];
  status: LatihanStatus;
};

export function startLatihan(): LatihanState {
  return { index: 0, attempts: 0, outcomes: [], status: 'answering' };
}

export function submitAnswer(state: LatihanState, correct: boolean): LatihanState {
  if (state.status !== 'answering' && state.status !== 'wrong') return state;
  if (correct) {
    return { ...state, status: 'correct', outcomes: [...state.outcomes, state.attempts === 0 ? 'first-try' : 'retry'] };
  }
  return { ...state, status: 'wrong', attempts: state.attempts + 1 };
}

export function canShowSolution(state: LatihanState): boolean {
  return state.status === 'wrong' && state.attempts >= 2;
}

export function showSolution(state: LatihanState): LatihanState {
  if (!canShowSolution(state)) return state;
  return { ...state, status: 'shown', outcomes: [...state.outcomes, 'shown'] };
}

export function nextTask(state: LatihanState, total: number = TASKS_PER_LATIHAN): LatihanState {
  if (state.status !== 'correct' && state.status !== 'shown') return state;
  if (state.index + 1 >= total) return { ...state, status: 'done' };
  return { index: state.index + 1, attempts: 0, outcomes: state.outcomes, status: 'answering' };
}

export function firstTryCount(outcomes: readonly TaskOutcome[]): number {
  return outcomes.filter((outcome) => outcome === 'first-try').length;
}

export function stampText(firstTry: number): string {
  if (firstTry >= 5) return 'Hebat!';
  if (firstTry >= 3) return 'Bagus!';
  return 'Terus berlatih!';
}

export function feedbackFor(status: LatihanStatus): Feedback {
  if (status === 'wrong' || status === 'correct' || status === 'shown') return status;
  return 'none';
}
