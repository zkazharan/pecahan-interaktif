import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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

describe('LatihanView', () => {
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
