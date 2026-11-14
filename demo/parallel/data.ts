/** Data and helpers for the parallel examples (all generated, see each comment). */
import type { ParallelAxis, ParallelItem } from 'openchartscandle/parallel';
import { seeded } from '../scatter/data';

export { cells, seeded, select, withToolbar } from '../scatter/data';
export { choice, h } from '../line/data';
export { treemapGrid } from '../treemap/data';

// ---------------------------------------------------------------- air quality

export const AQI_GRADES = ['Excelente', 'Bom', 'Moderado', 'Fraco', 'Mau', 'Perigoso'];

export const AQI_AXES: ParallelAxis[] = [
  { name: 'Dia', min: 1, max: 31, nice: false },
  { name: 'AQI' },
  { name: 'PM2.5' },
  { name: 'PM10' },
  { name: 'CO' },
  { name: 'NO2' },
  { name: 'SO2' },
  { name: 'Qualidade', type: 'category', data: AQI_GRADES },
];

const grade = (aqi: number): string => AQI_GRADES[aqi <= 50 ? 0 : aqi <= 100 ? 1 : aqi <= 150 ? 2 : aqi <= 200 ? 3 : aqi <= 300 ? 4 : 5];

/**
 * One month of daily air quality in a city (generated): [dia, AQI, PM2.5, PM10, CO, NO2, SO2, qualidade].
 * `level` makes the city cleaner or more polluted.
 */
export function aqiMonth(level: number, seed: number): (number | string)[][] {
  const rnd = seeded(seed);
  let k = level;
  return Array.from({ length: 31 }, (_, d) => {
    // polluted days come in streaks
    k = Math.max(0.15, k * 0.6 + level * (0.2 + rnd() * 0.9) * 0.4 + (rnd() < 0.08 ? level * 1.5 : 0));
    const pm25 = Math.round(55 * k + rnd() * 18);
    const aqi = Math.round(pm25 * 1.3 + rnd() * 14);
    return [d + 1, aqi, pm25, Math.round(pm25 * 1.35 + rnd() * 22), +(0.4 + k * 1.1 + rnd() * 0.5).toFixed(2), Math.round(22 + k * 46 + rnd() * 18), Math.round(4 + k * 16 + rnd() * 8), grade(aqi)];
  });
}

// ---------------------------------------------------------------- nutrients

export const FOOD_GROUPS = ['Laticínios', 'Carne', 'Peixe', 'Cereais', 'Legumes', 'Fruta', 'Frutos secos', 'Doces', 'Bebidas'];

export const NUTRIENT_AXES: ParallelAxis[] = [
  { name: 'Proteína (g)' },
  { name: 'Gordura (g)' },
  { name: 'Hidratos (g)' },
  { name: 'Açúcar (g)' },
  { name: 'Fibra (g)' },
  { name: 'Sódio (mg)' },
  { name: 'Calorias (kcal)' },
  { name: 'Grupo', type: 'category', data: FOOD_GROUPS },
];

// [protein, fat, carbs, sugar, fiber, sodium] per 100 g: a typical value of each group
const FOOD_PROFILE: Record<string, number[]> = {
  Laticínios: [10, 9, 6, 5, 0, 300],
  Carne: [24, 14, 1, 0.5, 0, 420],
  Peixe: [21, 6, 0.5, 0.2, 0, 280],
  Cereais: [10, 3, 66, 6, 7, 320],
  Legumes: [2.5, 0.4, 6, 3, 2.8, 40],
  Fruta: [0.9, 0.4, 13, 10, 2.2, 3],
  'Frutos secos': [19, 50, 18, 5, 8, 120],
  Doces: [5, 22, 60, 42, 2, 180],
  Bebidas: [0.6, 0.6, 9, 8, 0.2, 15],
};

const FOOD_NAMES: Record<string, string[]> = {
  Laticínios: ['Queijo flamengo', 'Iogurte natural', 'Leite meio-gordo', 'Queijo fresco', 'Requeijão', 'Manteiga', 'Natas', 'Queijo da serra'],
  Carne: ['Frango', 'Peru', 'Vaca', 'Porco', 'Chouriço', 'Fiambre', 'Borrego', 'Presunto'],
  Peixe: ['Bacalhau', 'Salmão', 'Sardinha', 'Atum', 'Pescada', 'Dourada', 'Polvo', 'Camarão'],
  Cereais: ['Pão de trigo', 'Arroz', 'Massa', 'Aveia', 'Broa', 'Cereais de pequeno-almoço', 'Bolachas de água e sal', 'Quinoa'],
  Legumes: ['Brócolos', 'Cenoura', 'Espinafres', 'Tomate', 'Abóbora', 'Couve', 'Pimento', 'Feijão-verde'],
  Fruta: ['Maçã', 'Pera', 'Laranja', 'Banana', 'Uvas', 'Morango', 'Ananás', 'Kiwi'],
  'Frutos secos': ['Amêndoa', 'Noz', 'Avelã', 'Caju', 'Amendoim', 'Pinhão', 'Pistácio', 'Sementes de girassol'],
  Doces: ['Chocolate de leite', 'Pastel de nata', 'Bolo de laranja', 'Gelado', 'Marmelada', 'Bolacha Maria', 'Croissant', 'Compota'],
  Bebidas: ['Sumo de laranja', 'Refrigerante', 'Néctar de pêssego', 'Bebida de soja', 'Chá gelado', 'Batido', 'Água tónica', 'Café com leite'],
};

const VARIANTS = ['', ' light', ' biológico', ' caseiro', ' de marca branca', ' gourmet', ' sem sal', ' integral'];

/** About 300 foods per 100 g (generated around a typical profile of each group): one item list per group. */
export function nutrients(seed = 7): Record<string, ParallelItem[]> {
  const rnd = seeded(seed);
  const out: Record<string, ParallelItem[]> = {};
  for (const g of FOOD_GROUPS) {
    const p = FOOD_PROFILE[g];
    const n = 26 + Math.floor(rnd() * 16);
    out[g] = Array.from({ length: n }, (_, i) => {
      const f = (base: number, spread = 0.45): number => Math.max(0, base * (1 + (rnd() * 2 - 1) * spread));
      const prot = f(p[0]);
      const fat = f(p[1], 0.6);
      const carbs = f(p[2]);
      const sugar = Math.min(carbs, f(p[3], 0.6));
      const kcal = prot * 4 + fat * 9 + carbs * 4;
      const names = FOOD_NAMES[g];
      return {
        name: names[i % names.length] + VARIANTS[Math.floor(i / names.length) % VARIANTS.length],
        value: [+prot.toFixed(1), +fat.toFixed(1), +carbs.toFixed(1), +sugar.toFixed(1), +f(p[4], 0.7).toFixed(1), Math.round(f(p[5], 0.7)), Math.round(kcal), g],
      };
    });
  }
  return out;
}

// ---------------------------------------------------------------- stocks

export const SECTORS = ['Tecnologia', 'Financeiro', 'Saúde', 'Energia', 'Consumo', 'Indústria'];

export const STOCK_AXES: ParallelAxis[] = [
  { name: 'P/E', min: 0 },
  { name: 'Dividendo %', min: 0 },
  { name: 'Beta' },
  { name: 'Volatilidade %', min: 0 },
  { name: 'Retorno 1a %' },
  { name: 'Cap. (mil M$)', type: 'log' },
  { name: 'Setor', type: 'category', data: SECTORS },
];

// [P/E, dividend %, beta, volatility %, 1y return %, market cap] typical of each sector
const SECTOR_PROFILE: Record<string, number[]> = {
  Tecnologia: [32, 0.6, 1.25, 34, 22, 180],
  Financeiro: [12, 3.2, 1.05, 24, 9, 90],
  Saúde: [24, 1.8, 0.8, 26, 6, 110],
  Energia: [10, 4.5, 1.1, 30, 4, 70],
  Consumo: [22, 2.2, 0.9, 22, 8, 80],
  Indústria: [19, 2.0, 1.0, 25, 11, 60],
};

export interface Stock {
  name: string;
  sector: string;
  /** [P/E, dividend %, beta, volatility %, 1y return %, market cap, sector] */
  value: (number | string)[];
}

/** `n` listed companies (generated: made-up tickers, numbers around a typical profile of each sector). */
export function stocks(n = 300, seed = 3): Stock[] {
  const rnd = seeded(seed);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const used = new Set<string>();
  const ticker = (): string => {
    let t = '';
    do t = Array.from({ length: 3 + Math.floor(rnd() * 2) }, () => letters[Math.floor(rnd() * 26)]).join('');
    while (used.has(t));
    used.add(t);
    return t;
  };
  return Array.from({ length: n }, () => {
    const sector = SECTORS[Math.floor(rnd() * SECTORS.length)];
    const p = SECTOR_PROFILE[sector];
    const g = (): number => (rnd() + rnd() + rnd() - 1.5) * 1.4;
    const beta = Math.max(0.2, p[2] + g() * 0.3);
    const vol = Math.max(8, p[3] * (0.75 + beta * 0.25) + g() * 6);
    const ret = p[4] + g() * vol * 0.8;
    return {
      name: ticker(),
      sector,
      value: [+Math.max(3, p[0] * (1 + g() * 0.4)).toFixed(1), +Math.max(0, p[1] * (1 + g() * 0.6)).toFixed(2), +beta.toFixed(2), +vol.toFixed(1), +ret.toFixed(1), +(p[5] * Math.exp(g() * 1.6)).toFixed(1), sector],
    };
  });
}
