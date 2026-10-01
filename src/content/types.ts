import type { Component } from 'svelte';
import type { Rng } from '../lib/random';

export type CheckResult = { correct: boolean; hint: string };

export type Feedback = 'none' | 'wrong' | 'correct' | 'shown';

export type TaskViewProps<T, A> = {
  task: T;
  answer: A;
  onanswer: (answer: A) => void;
  feedback: Feedback;
  diff?: boolean;
};

export type LatihanDef<T, A> = {
  generate: (rng: Rng) => T[];
  emptyAnswer: (task: T) => A;
  isComplete: (task: T, answer: A) => boolean;
  solution: (task: T) => A;
  check: (task: T, answer: A) => CheckResult;
  graded?: (answer: A) => unknown;
  conclusion: string;
  TaskView: Component<TaskViewProps<T, A>>;
};

export type PeragaProps<P> = { params: P; onparams: (params: P) => void };

export type PeragaDef<P> = {
  parseParams: (raw: Record<string, string>) => P;
  formatParams: (params: P) => Record<string, string>;
  View: Component<PeragaProps<P>>;
};

export type ModuleDef<P = any, T = any, A = any> = {
  slug: string;
  peraga: PeragaDef<P>;
  latihan: LatihanDef<T, A>;
};
