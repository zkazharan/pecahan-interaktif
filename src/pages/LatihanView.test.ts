import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LatihanDef } from '../content/types';
import { createProgressStore } from '../lib/progress';
import FakeTask from './fixtures/FakeTask.svelte';
import LatihanView from './LatihanView.svelte';

const fake: LatihanDef<{ target: number }, number | null> = {
  generate: () => [0, 1, 2, 3, 4].map((target) => ({ target })),
  emptyAnswer: () => null,
  isComplete: (_task, answer) => answer !== null,
  solution: (task) => task.target,
  check: (task, answer) => (answer === task.target ? { correct: true, hint: '' } : { correct: false, hint: 'Coba lagi ya.' }),
  conclusion: 'Kesimpulan contoh.',
  TaskView: FakeTask,
};

function setup(next?: { number: number; slug: string; title: string }) {
  const store = createProgressStore(null);
  render(LatihanView, { props: { latihan: fake as LatihanDef<unknown, unknown>, slug: 'contoh', number: 3, next, seed: 1, store } });
  return { store, user: userEvent.setup() };
}

async function answerRight(user: ReturnType<typeof userEvent.setup>, last: boolean) {
  await user.click(screen.getByRole('button', { name: 'Jawab benar' }));
  await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
  await user.click(screen.getByRole('button', { name: last ? 'Lihat hasil' : 'Soal berikutnya →' }));
}

function rectAt(top: number, height: number): DOMRect {
  return { top, bottom: top + height, height, left: 0, right: 100, width: 100, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
}

describe('LatihanView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps Cek jawaban disabled until the task is answered', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Cek jawaban' })).toBeDisabled();
  });

  it('gives Hebat! and records 5 when every task is right the first time', async () => {
    const { store, user } = setup();
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Soal ${i + 1} dari 5`)).toBeInTheDocument();
      await answerRight(user, i === 4);
    }
    expect(screen.getByRole('img', { name: 'Stempel Hebat! Nilai 100. MODUL 3 SELESAI' })).toBeInTheDocument();
    expect(screen.getByText('5 dari 5 langsung benar.')).toBeInTheDocument();
    expect(screen.getByText('Kesimpulan contoh.')).toBeInTheDocument();
    expect(store.all().contoh.bestFirstTry).toBe(5);
  });

  it('shows the hint after a wrong answer and offers the solution after a second different one', async () => {
    const { store, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(screen.getByText('Coba lagi ya.')).toBeInTheDocument();
    expect(screen.getByText(/Umpan balik wrong/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tunjukkan caranya' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Jawab salah lain' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    await user.click(screen.getByRole('button', { name: 'Tunjukkan caranya' }));
    expect(screen.getByText(/Jawaban 0 · Umpan balik shown/)).toBeInTheDocument();
    expect(screen.getByLabelText('Soal 1: dibantu')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Soal berikutnya →' }));
    for (let i = 1; i < 5; i++) await answerRight(user, i === 4);
    expect(screen.getByRole('img', { name: 'Stempel Bagus! Nilai 80. MODUL 3 SELESAI' })).toBeInTheDocument();
    expect(store.all().contoh.bestFirstTry).toBe(4);
  });

  it('does not count an unchanged answer as another mistake', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(screen.getByRole('button', { name: 'Cek jawaban' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    expect(screen.getByRole('button', { name: 'Cek jawaban' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Tunjukkan caranya' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Jawab salah lain' }));
    expect(screen.getByRole('button', { name: 'Cek jawaban' })).toBeEnabled();
  });

  it('shows the difference only while the wrong answer is unchanged', async () => {
    const { user } = setup();
    expect(screen.getByText(/Beda tidak/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(screen.getByText(/Beda ya/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Jawab salah lain' }));
    expect(screen.getByText(/Beda tidak/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(screen.getByText(/Beda ya/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tunjukkan caranya' }));
    expect(screen.getByText(/Beda tidak/)).toBeInTheDocument();
  });

  it('compares only the graded part of the answer', async () => {
    const graded: LatihanDef<{ target: number }, number | null> = {
      ...fake,
      graded: (answer) => (answer === null ? null : ((answer % 100) + 100) % 100),
    };
    const store = createProgressStore(null);
    render(LatihanView, { props: { latihan: graded as LatihanDef<unknown, unknown>, slug: 'contoh', number: 3, seed: 1, store } });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    await user.click(screen.getByRole('button', { name: 'Ubah bantuan' }));
    expect(screen.getByRole('button', { name: 'Cek jawaban' })).toBeDisabled();
    expect(screen.getByText(/Beda ya/)).toBeInTheDocument();
  });

  it('treats an answer whose graded part is undefined as unchanged', async () => {
    const graded: LatihanDef<{ target: number }, number | null> = {
      ...fake,
      graded: () => undefined,
    };
    const store = createProgressStore(null);
    render(LatihanView, { props: { latihan: graded as LatihanDef<unknown, unknown>, slug: 'contoh', number: 3, seed: 1, store } });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    await user.click(screen.getByRole('button', { name: 'Jawab salah lain' }));
    expect(screen.getByRole('button', { name: 'Cek jawaban' })).toBeDisabled();
    expect(screen.getByText(/Beda ya/)).toBeInTheDocument();
  });

  it('shows the hint only while the checked answer is unchanged', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(screen.getByText('Coba lagi ya.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Jawab salah lain' }));
    expect(screen.queryByText('Coba lagi ya.')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(screen.getByText('Coba lagi ya.')).toBeInTheDocument();
  });

  it('keeps the hint when only a non-graded part of the answer changes', async () => {
    const graded: LatihanDef<{ target: number }, number | null> = {
      ...fake,
      graded: (answer) => (answer === null ? null : ((answer % 100) + 100) % 100),
    };
    const store = createProgressStore(null);
    render(LatihanView, { props: { latihan: graded as LatihanDef<unknown, unknown>, slug: 'contoh', number: 3, seed: 1, store } });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    await user.click(screen.getByRole('button', { name: 'Ubah bantuan' }));
    expect(screen.getByText('Coba lagi ya.')).toBeInTheDocument();
  });

  it('scrolls the feedback into view when the action bar covers it after a wrong check', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('actions')) return rectAt(700, 100);
      if (this.classList.contains('feedback')) return rectAt(690, 30);
      return rectAt(0, 10);
    });
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest', behavior: expect.any(String) });
  });

  it('does not scroll when the feedback is already above the action bar', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('actions')) return rectAt(700, 100);
      if (this.classList.contains('feedback')) return rectAt(500, 30);
      return rectAt(0, 10);
    });
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(scroll).not.toHaveBeenCalled();
  });

  it('scrolls instantly under reduced motion', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('actions')) return rectAt(700, 100);
      if (this.classList.contains('feedback')) return rectAt(690, 30);
      return rectAt(0, 10);
    });
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Jawab salah' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' });
    vi.unstubAllGlobals();
  });

  it('moves focus to the next button once the answer is correct', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Jawab benar' }));
    await user.click(screen.getByRole('button', { name: 'Cek jawaban' }));
    expect(screen.getByRole('button', { name: 'Soal berikutnya →' })).toHaveFocus();
  });

  it('starts over with Ulangi latihan', async () => {
    const { user } = setup();
    for (let i = 0; i < 5; i++) await answerRight(user, i === 4);
    await user.click(screen.getByRole('button', { name: 'Ulangi latihan' }));
    expect(screen.getByText('Soal 1 dari 5')).toBeInTheDocument();
  });

  it('links to the next ready module', async () => {
    const { user } = setup({ number: 4, slug: 'senilai', title: 'Pecahan senilai' });
    for (let i = 0; i < 5; i++) await answerRight(user, i === 4);
    expect(screen.getByRole('link', { name: 'Lanjut ke Modul 4 →' })).toHaveAttribute('href', '#/senilai/peraga');
  });

  it('links back to the list when there is no next module', async () => {
    const { user } = setup();
    for (let i = 0; i < 5; i++) await answerRight(user, i === 4);
    expect(screen.getByRole('link', { name: 'Kembali ke daftar modul' })).toHaveAttribute('href', '#/');
  });
});
