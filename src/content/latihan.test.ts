import { describe, expect, it } from 'vitest';
import {
  canShowSolution,
  feedbackFor,
  firstTryCount,
  nextTask,
  showSolution,
  stampText,
  startLatihan,
  submitAnswer,
} from './latihan';

describe('latihan flow', () => {
  it('starts at the first task', () => {
    expect(startLatihan()).toEqual({ index: 0, attempts: 0, outcomes: [], status: 'answering' });
  });

  it('records a first-try success', () => {
    const s = submitAnswer(startLatihan(), true);
    expect(s.status).toBe('correct');
    expect(s.outcomes).toEqual(['first-try']);
  });

  it('records a success after a mistake as retry', () => {
    const s = submitAnswer(submitAnswer(startLatihan(), false), true);
    expect(s.outcomes).toEqual(['retry']);
  });

  it('offers the solution only after two wrong answers', () => {
    const once = submitAnswer(startLatihan(), false);
    expect(once).toMatchObject({ status: 'wrong', attempts: 1 });
    expect(canShowSolution(once)).toBe(false);
    expect(showSolution(once)).toBe(once);
    const twice = submitAnswer(once, false);
    expect(canShowSolution(twice)).toBe(true);
    const shown = showSolution(twice);
    expect(shown.status).toBe('shown');
    expect(shown.outcomes).toEqual(['shown']);
  });

  it('ignores submissions after the task is settled', () => {
    const correct = submitAnswer(startLatihan(), true);
    expect(submitAnswer(correct, false)).toBe(correct);
  });

  it('moves to the next task and resets attempts', () => {
    const s = nextTask(submitAnswer(submitAnswer(startLatihan(), false), true));
    expect(s).toEqual({ index: 1, attempts: 0, outcomes: ['retry'], status: 'answering' });
  });

  it('does not advance an unsettled task', () => {
    const s = submitAnswer(startLatihan(), false);
    expect(nextTask(s)).toBe(s);
  });

  it('finishes after the last task', () => {
    let s = startLatihan();
    for (let i = 0; i < 5; i++) s = nextTask(submitAnswer(s, true));
    expect(s.status).toBe('done');
    expect(s.outcomes).toHaveLength(5);
  });

  it('counts first tries only', () => {
    expect(firstTryCount(['first-try', 'retry', 'shown', 'first-try'])).toBe(2);
  });

  it('picks the stamp word', () => {
    expect(stampText(5)).toBe('Hebat!');
    expect(stampText(4)).toBe('Bagus!');
    expect(stampText(3)).toBe('Bagus!');
    expect(stampText(2)).toBe('Terus berlatih!');
    expect(stampText(0)).toBe('Terus berlatih!');
  });

  it('maps status to task feedback', () => {
    expect(feedbackFor('answering')).toBe('none');
    expect(feedbackFor('wrong')).toBe('wrong');
    expect(feedbackFor('correct')).toBe('correct');
    expect(feedbackFor('shown')).toBe('shown');
    expect(feedbackFor('done')).toBe('none');
  });
});
