export type CatalogEntry = { number: number; slug: string; title: string };

export const CATALOG: readonly CatalogEntry[] = [
  { number: 1, slug: 'membagi-adil', title: 'Membagi adil' },
  { number: 2, slug: 'membaca-pecahan', title: 'Pembilang, penyebut, garis bilangan' },
  { number: 3, slug: 'membandingkan', title: 'Membandingkan pecahan' },
  { number: 4, slug: 'senilai', title: 'Pecahan senilai' },
  { number: 5, slug: 'pecahan-campuran', title: 'Pecahan campuran' },
  { number: 6, slug: 'jumlah-penyebut-sama', title: 'Jumlah & kurang, penyebut sama' },
  { number: 7, slug: 'jumlah-penyebut-beda', title: 'Jumlah & kurang, penyebut beda' },
  { number: 8, slug: 'pecahan-dari-jumlah', title: 'Pecahan dari suatu jumlah' },
];
