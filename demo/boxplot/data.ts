/** Data and helpers for the boxplot examples (generated or public, see each comment). */
export { cells, gauss, seeded, select, withToolbar } from '../scatter/data';
export { choice } from '../line/data';
import { gauss, seeded } from '../scatter/data';

/**
 * Michelson–Morley speed of light measurements (1879): 5 experiments × 20 runs, in km/s minus 299 000
 * (public dataset, the `morley` data of R; the accepted value today is 792.458).
 */
export const MICHELSON: number[][] = [
  [850, 740, 900, 1070, 930, 850, 950, 980, 980, 880, 1000, 980, 930, 650, 760, 810, 1000, 1000, 960, 960],
  [960, 940, 960, 940, 880, 800, 850, 880, 900, 840, 830, 790, 810, 880, 880, 830, 800, 790, 760, 800],
  [880, 880, 880, 860, 720, 720, 620, 860, 970, 950, 880, 910, 850, 870, 840, 840, 850, 840, 840, 840],
  [890, 810, 810, 820, 800, 770, 760, 740, 750, 760, 910, 920, 890, 860, 880, 720, 840, 850, 850, 780],
  [890, 840, 780, 810, 760, 810, 790, 810, 820, 850, 870, 870, 810, 740, 810, 940, 950, 800, 810, 870],
];

export interface IncomeRow {
  country: string;
  year: number;
  income: number;
}

/**
 * Income per person (US$) of a few countries, one row per country and year from 1950 to 2015 (generated: a
 * growth trend per country with noise and a few crises).
 */
export function incomeRows(): IncomeRow[] {
  const rnd = seeded(11);
  const countries: [string, number, number][] = [
    ['Portugal', 4000, 0.032],
    ['Espanha', 4500, 0.034],
    ['França', 7000, 0.026],
    ['Alemanha', 6500, 0.028],
    ['Itália', 5000, 0.03],
    ['Reino Unido', 9000, 0.022],
    ['Noruega', 8000, 0.035],
    ['Polónia', 3000, 0.033],
    ['Grécia', 3500, 0.031],
    ['Irlanda', 5500, 0.04],
  ];
  const rows: IncomeRow[] = [];
  for (const [country, start, growth] of countries)
    for (let year = 1950; year <= 2015; year++) {
      const crisis = year === 1975 || year === 2009 ? 0.94 : 1;
      rows.push({ country, year, income: Math.round(start * Math.exp(growth * (year - 1950)) * crisis * (1 + gauss(rnd) * 0.04)) });
    }
  return rows;
}

/** Raw values of a normal distribution (generated). */
export function normalSamples(n: number, mean: number, sd: number, seed: number): number[] {
  const rnd = seeded(seed);
  return Array.from({ length: n }, () => Math.round((mean + gauss(rnd) * sd) * 10) / 10);
}
