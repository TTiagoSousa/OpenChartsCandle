/** Data and helpers for the scatter examples (approximate or generated, see each comment). */
export { choice, h } from '../line/data';

/** Toolbar on top of a gallery box; returns the element that holds the chart. */
export function withToolbar(el: HTMLElement, ...controls: HTMLElement[]): HTMLElement {
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const bar = document.createElement('div');
  bar.className = 'ex-toolbar';
  bar.append(...controls);
  const host = document.createElement('div');
  host.style.cssText = 'flex:1;min-height:0;position:relative';
  el.append(bar, host);
  return host;
}

/** A labelled <select>. */
export function select<T extends string | number>(label: string, items: [string, T][], initial: T, onPick: (v: T) => void): HTMLElement {
  const wrap = document.createElement('label');
  wrap.className = 'ex-choice';
  wrap.innerHTML = `<span class="ex-label">${label}</span>`;
  const sel = document.createElement('select');
  sel.className = 'ex-btn';
  items.forEach(([text, v], i) => sel.add(new Option(text, String(i), false, v === initial)));
  sel.addEventListener('change', () => onPick(items[Number(sel.value)][1]));
  wrap.append(sel);
  return wrap;
}

/** Small deterministic random generator. */
export function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Normal distribution (Box–Muller). */
export function gauss(rnd: () => number): number {
  return Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
}

/** Grid of cells inside a gallery box (several small charts). */
export function cells(el: HTMLElement, n: number, columns = n, gap = 8): HTMLElement[] {
  const grid = document.createElement('div');
  grid.style.cssText = `display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:${gap}px;height:100%;padding:${gap / 2}px;box-sizing:border-box`;
  el.append(grid);
  return Array.from({ length: n }, () => {
    const c = document.createElement('div');
    c.style.cssText = 'min-width:0;min-height:0;position:relative';
    grid.append(c);
    return c;
  });
}

// ---------------------------------------------------------------- Anscombe's quartet (1973)

const AX = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
export const ANSCOMBE: { name: string; data: [number, number][] }[] = [
  { name: 'I', data: AX.map((x, i) => [x, [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68][i]]) },
  { name: 'II', data: AX.map((x, i) => [x, [9.14, 8.14, 8.74, 8.77, 9.26, 8.1, 6.13, 3.1, 9.13, 7.26, 4.74][i]]) },
  { name: 'III', data: AX.map((x, i) => [x, [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73][i]]) },
  { name: 'IV', data: [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8].map((x, i) => [x, [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.5, 5.56, 7.91, 6.89][i]]) },
];

// ---------------------------------------------------------------- height and weight (generated)

/** [height cm, weight kg] of 260 women and 260 men (generated, realistic spread). */
export function heightWeight(): { women: [number, number][]; men: [number, number][] } {
  const rnd = seeded(11);
  const make = (h0: number, hs: number, bmi: number): [number, number][] =>
    Array.from({ length: 260 }, () => {
      const h = h0 + gauss(rnd) * hs;
      const w = bmi * (h / 100) ** 2 * (1 + gauss(rnd) * 0.12);
      return [+h.toFixed(1), +w.toFixed(1)];
    });
  return { women: make(163, 6.5, 23.5), men: make(176.5, 7, 25.5) };
}

// ---------------------------------------------------------------- countries (approximate)

export interface CountryYear {
  name: string;
  region: string;
  year: number;
  /** GDP per person, USD (PPP, approximate) */
  gdp: number;
  /** life expectancy, years */
  life: number;
  /** population, millions */
  pop: number;
}

// name, region, GDP 1950, GDP 2015, life 1950, life 2015, population 1950, population 2015 (approximate)
const COUNTRY_ROWS: [string, string, number, number, number, number, number, number][] = [
  ['China', 'Ásia', 600, 13500, 41, 76, 544, 1371],
  ['Índia', 'Ásia', 900, 5900, 35, 68, 376, 1311],
  ['Japão', 'Ásia', 3000, 36000, 60, 84, 83, 127],
  ['Indonésia', 'Ásia', 900, 10500, 38, 69, 70, 258],
  ['Coreia do Sul', 'Ásia', 900, 34000, 47, 82, 19, 51],
  ['Turquia', 'Ásia', 2300, 19000, 43, 76, 21, 78],
  ['Bangladesh', 'Ásia', 900, 3100, 37, 72, 38, 161],
  ['Paquistão', 'Ásia', 900, 4700, 38, 66, 38, 189],
  ['Vietname', 'Ásia', 700, 5700, 41, 76, 25, 93],
  ['Arábia Saudita', 'Ásia', 4000, 50000, 41, 74, 3.1, 31],
  ['Alemanha', 'Europa', 6000, 44000, 67, 81, 70, 82],
  ['Portugal', 'Europa', 3000, 26000, 59, 81, 8.4, 10.4],
  ['Espanha', 'Europa', 3500, 32000, 63, 83, 28, 46],
  ['França', 'Europa', 7000, 38000, 66, 82, 42, 66],
  ['Reino Unido', 'Europa', 9500, 38000, 69, 81, 50, 65],
  ['Itália', 'Europa', 5000, 34000, 65, 83, 47, 60],
  ['Rússia', 'Europa', 6000, 23000, 57, 71, 102, 144],
  ['Noruega', 'Europa', 9000, 64000, 72, 82, 3.3, 5.2],
  ['Nigéria', 'África', 1200, 5600, 36, 53, 38, 181],
  ['Egito', 'África', 1500, 10000, 41, 71, 21, 92],
  ['África do Sul', 'África', 4000, 12400, 45, 62, 14, 55],
  ['Etiópia', 'África', 400, 1500, 34, 64, 18, 99],
  ['Angola', 'África', 2000, 6200, 32, 61, 4.5, 28],
  ['Moçambique', 'África', 600, 1100, 31, 57, 6.3, 28],
  ['Gana', 'África', 1200, 3900, 42, 62, 5, 27],
  ['Quénia', 'África', 900, 2900, 42, 63, 6, 47],
  ['Estados Unidos', 'Américas', 15000, 53000, 68, 79, 158, 321],
  ['Brasil', 'Américas', 2300, 14700, 50, 75, 54, 206],
  ['México', 'Américas', 3500, 16500, 50, 77, 28, 127],
  ['Argentina', 'Américas', 7000, 19000, 62, 76, 17, 43],
  ['Canadá', 'Américas', 11000, 43000, 69, 82, 14, 36],
  ['Chile', 'Américas', 4500, 22000, 54, 80, 6.1, 17.8],
  ['Cuba', 'Américas', 4000, 21000, 59, 79, 5.9, 11.4],
  ['Haiti', 'Américas', 1500, 1700, 37, 63, 3.2, 10.7],
  ['Austrália', 'Oceânia', 11000, 44000, 69, 82, 8, 24],
  ['Nova Zelândia', 'Oceânia', 13000, 34000, 69, 81, 1.9, 4.6],
];

export const REGIONS = ['Ásia', 'Europa', 'África', 'Américas', 'Oceânia'];
export const REGION_COLORS = ['#f23645', '#2962ff', '#ff9800', '#089981', '#9c27b0'];
export const YEARS = Array.from({ length: 14 }, (_, i) => 1950 + i * 5);

/** Every country in a year between 1950 and 2015 (interpolated from approximate values). */
export function countries(year: number): CountryYear[] {
  const t = (year - 1950) / 65;
  return COUNTRY_ROWS.map(([name, region, g0, g1, l0, l1, p0, p1], k) => {
    const rnd = seeded(1000 + k * 97 + year);
    const wob = 1 + (t > 0 && t < 1 ? (rnd() - 0.5) * 0.08 : 0);
    let life = l0 + (l1 - l0) * (1 - (1 - t) ** 1.6);
    if (name === 'China' && year === 1960) life -= 12; // the great famine
    if (name === 'Etiópia' && year === 1985) life -= 5;
    return {
      name,
      region,
      year,
      gdp: Math.round(g0 * (g1 / g0) ** t * wob),
      life: +life.toFixed(1),
      pop: +(p0 * (p1 / p0) ** t).toFixed(1),
    };
  });
}

// ---------------------------------------------------------------- nutrients per 100 g (approximate)

export const NUTRIENT_DIMS = ['Energia (kcal)', 'Proteína (g)', 'Gordura (g)', 'Hidratos (g)', 'Fibra (g)', 'Açúcares (g)', 'Sódio (mg)'];
export const FOOD_GROUPS = ['Fruta', 'Legumes', 'Cereais', 'Laticínios e ovos', 'Carne e peixe', 'Frutos secos', 'Doces e snacks'];

export const FOODS: [string, number, ...number[]][] = [
  ['Maçã', 0, 52, 0.3, 0.2, 14, 2.4, 10, 1], ['Banana', 0, 89, 1.1, 0.3, 23, 2.6, 12, 1], ['Laranja', 0, 47, 0.9, 0.1, 12, 2.4, 9, 0],
  ['Morango', 0, 32, 0.7, 0.3, 7.7, 2, 4.9, 1], ['Uva', 0, 69, 0.7, 0.2, 18, 0.9, 15, 2], ['Abacate', 0, 160, 2, 15, 8.5, 6.7, 0.7, 7],
  ['Manga', 0, 60, 0.8, 0.4, 15, 1.6, 14, 1], ['Kiwi', 0, 61, 1.1, 0.5, 15, 3, 9, 3], ['Pera', 0, 57, 0.4, 0.1, 15, 3.1, 10, 1],
  ['Ananás', 0, 50, 0.5, 0.1, 13, 1.4, 10, 1],
  ['Brócolos', 1, 34, 2.8, 0.4, 7, 2.6, 1.7, 33], ['Cenoura', 1, 41, 0.9, 0.2, 10, 2.8, 4.7, 69], ['Espinafres', 1, 23, 2.9, 0.4, 3.6, 2.2, 0.4, 79],
  ['Batata', 1, 77, 2, 0.1, 17, 2.2, 0.8, 6], ['Tomate', 1, 18, 0.9, 0.2, 3.9, 1.2, 2.6, 5], ['Feijão', 1, 127, 8.7, 0.5, 23, 6.4, 0.3, 1],
  ['Grão-de-bico', 1, 164, 8.9, 2.6, 27, 7.6, 4.8, 7], ['Ervilhas', 1, 81, 5.4, 0.4, 14, 5.1, 5.7, 5], ['Couve', 1, 49, 4.3, 0.9, 9, 3.6, 2.3, 38],
  ['Lentilhas', 1, 116, 9, 0.4, 20, 7.9, 1.8, 2],
  ['Arroz', 2, 130, 2.7, 0.3, 28, 0.4, 0.1, 1], ['Massa', 2, 158, 5.8, 0.9, 31, 1.8, 0.6, 1], ['Pão', 2, 265, 9, 3.2, 49, 2.7, 5, 491],
  ['Pão integral', 2, 247, 13, 3.4, 41, 7, 6, 450], ['Aveia', 2, 389, 17, 6.9, 66, 10.6, 1, 2], ['Cornflakes', 2, 357, 7.5, 0.4, 84, 3.3, 10, 729],
  ['Quinoa', 2, 120, 4.4, 1.9, 21, 2.8, 0.9, 7], ['Bolachas Maria', 2, 436, 7, 13, 73, 2.4, 22, 330],
  ['Leite', 3, 61, 3.2, 3.3, 4.8, 0, 5, 43], ['Iogurte natural', 3, 61, 3.5, 3.3, 4.7, 0, 4.7, 46], ['Queijo flamengo', 3, 356, 25, 27, 1.4, 0, 1.4, 800],
  ['Queijo fresco', 3, 98, 11, 4.3, 3.4, 0, 2.7, 364], ['Manteiga', 3, 717, 0.9, 81, 0.1, 0, 0.1, 11], ['Natas', 3, 340, 2.8, 36, 2.8, 0, 2.9, 38],
  ['Ovo', 3, 155, 13, 11, 1.1, 0, 1.1, 124],
  ['Frango', 4, 165, 31, 3.6, 0, 0, 0, 74], ['Vaca', 4, 250, 26, 15, 0, 0, 0, 72], ['Porco', 4, 242, 27, 14, 0, 0, 0, 62],
  ['Salmão', 4, 208, 20, 13, 0, 0, 0, 59], ['Atum em lata', 4, 116, 26, 0.8, 0, 0, 0, 247], ['Bacalhau', 4, 82, 18, 0.7, 0, 0, 0, 54],
  ['Sardinha', 4, 208, 25, 11, 0, 0, 0, 307], ['Fiambre', 4, 145, 21, 6, 1.5, 0, 1.5, 1203], ['Chouriço', 4, 455, 24, 38, 1.9, 0, 1, 1235],
  ['Camarão', 4, 99, 24, 0.3, 0.2, 0, 0, 111],
  ['Amêndoa', 5, 579, 21, 50, 22, 12.5, 4.4, 1], ['Noz', 5, 654, 15, 65, 14, 6.7, 2.6, 2], ['Amendoim', 5, 567, 26, 49, 16, 8.5, 4, 18],
  ['Caju', 5, 553, 18, 44, 30, 3.3, 6, 12], ['Avelã', 5, 628, 15, 61, 17, 9.7, 4.3, 0], ['Pistácio', 5, 560, 20, 45, 28, 10, 7.7, 1],
  ['Chocolate negro', 6, 546, 4.9, 31, 61, 7, 48, 24], ['Chocolate de leite', 6, 535, 7.7, 30, 59, 3.4, 52, 79], ['Açúcar', 6, 387, 0, 0, 100, 0, 100, 1],
  ['Mel', 6, 304, 0.3, 0, 82, 0.2, 82, 4], ['Gelado', 6, 207, 3.5, 11, 24, 0.7, 21, 80], ['Bolo de chocolate', 6, 371, 5, 16, 53, 2, 36, 300],
  ['Batatas fritas de pacote', 6, 536, 7, 35, 53, 4.4, 0.5, 525], ['Refrigerante', 6, 42, 0, 0, 10.6, 0, 10.6, 4],
];

// ---------------------------------------------------------------- iris-like flowers (generated)

export const IRIS_DIMS = ['Comprimento da sépala', 'Largura da sépala', 'Comprimento da pétala', 'Largura da pétala', 'Espécie'];

/** 150 flowers like the classic Iris data set (generated from the means and spreads of each species). */
export function irisLike(): (number | string)[][] {
  const rnd = seeded(5);
  const species: [string, number[], number[]][] = [
    ['setosa', [5.01, 3.43, 1.46, 0.25], [0.35, 0.38, 0.17, 0.11]],
    ['versicolor', [5.94, 2.77, 4.26, 1.33], [0.52, 0.31, 0.47, 0.2]],
    ['virginica', [6.59, 2.97, 5.55, 2.03], [0.64, 0.32, 0.55, 0.27]],
  ];
  return species.flatMap(([name, mean, sd]) =>
    Array.from({ length: 50 }, () => {
      const z = gauss(rnd);
      return [...mean.map((m, i) => Math.max(0.1, +(m + sd[i] * (0.7 * z + 0.71 * gauss(rnd))).toFixed(1))), name];
    }),
  );
}

// ---------------------------------------------------------------- GitHub punch card (generated)

export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const HOURS = Array.from({ length: 24 }, (_, i) => `${i}h`);

/** [hour, day, commits] — busy on weekday afternoons, quiet at night and on weekends. */
export function punchCard(): [number, number, number][] {
  const rnd = seeded(23);
  const out: [number, number, number][] = [];
  for (let d = 0; d < 7; d++)
    for (let hr = 0; hr < 24; hr++) {
      const work = d < 5 ? Math.exp(-(((hr - 15) / 4.2) ** 2)) * 10 + Math.exp(-(((hr - 10.5) / 2) ** 2)) * 5 : Math.exp(-(((hr - 16) / 5) ** 2)) * 4;
      const night = hr >= 21 || hr < 2 ? 2.5 : 0;
      out.push([hr, d, Math.max(0, Math.round((work + night) * (0.6 + rnd() * 0.8)))]);
    }
  return out;
}

// ---------------------------------------------------------------- air quality (generated)

export const AQI_DIMS = ['Dia', 'AQI', 'PM2.5', 'PM10', 'CO', 'NO2', 'SO2'];

/** 31 days of [day, AQI, PM2.5, PM10, CO, NO2, SO2] for three cities. */
export function airQuality(): { city: string; data: number[][] }[] {
  return [
    ['Lisboa', 55, 1],
    ['Porto', 75, 2],
    ['Madrid', 105, 3],
  ].map(([city, base, seed]) => {
    const rnd = seeded((seed as number) * 31);
    let level = base as number;
    return {
      city: city as string,
      data: Array.from({ length: 31 }, (_, d) => {
        level = Math.max(18, level + (rnd() - 0.5) * 50 + ((base as number) - level) * 0.25);
        const pm25 = level * (0.55 + rnd() * 0.25);
        return [d + 1, Math.round(level), Math.round(pm25), Math.round(pm25 * (1.3 + rnd() * 0.5)), +(0.4 + rnd() * 1.6).toFixed(2), Math.round(10 + level * 0.35 * rnd()), Math.round(2 + rnd() * 25)];
      }),
    };
  });
}

// ---------------------------------------------------------------- painters (approximate palettes)

/** Painter, year of a famous work and its dominant colors (picked by eye, approximate). */
export const PAINTERS: [string, number, string[]][] = [
  ['Jan van Eyck', 1434, ['#2b3a67', '#8b1e1e', '#c49a45', '#3d5a3c', '#d8c8a8']],
  ['Leonardo da Vinci', 1503, ['#6b5a3a', '#3e4a3d', '#a88b5d', '#2f2a24', '#c9b28a']],
  ['Ticiano', 1538, ['#9b2d20', '#c58b4a', '#2e3b55', '#e2c9a1', '#5a3a28']],
  ['Caravaggio', 1600, ['#1d1611', '#8e3b1f', '#d6b48a', '#5b4a3a', '#b0442b']],
  ['Rembrandt', 1642, ['#2a1e14', '#7a5226', '#c99a4b', '#4b3b2a', '#e2c28b']],
  ['Vermeer', 1665, ['#2f4f8f', '#e6c34a', '#d9cfb4', '#4d5c4b', '#8a6a43']],
  ['Goya', 1814, ['#3b3f45', '#a8622e', '#e3d3b4', '#5e2a23', '#1f1f22']],
  ['Hokusai', 1831, ['#1f3f6b', '#e3d9bf', '#6b8fa8', '#2a2a2a', '#c9b98a']],
  ['Turner', 1844, ['#e8b85a', '#f2dfb0', '#c9693a', '#7a8b9c', '#d9a441']],
  ['Van Gogh', 1889, ['#1f3f8f', '#f2c230', '#3b6e9e', '#e8a33c', '#5a8a4a']],
  ['Monet', 1899, ['#7fa8c9', '#b9c97f', '#e3b5c8', '#5d7f59', '#f0d6a0']],
  ['Klimt', 1908, ['#d4a72c', '#a8761d', '#3b5a46', '#e8d6a0', '#7a2e2e']],
  ['Matisse', 1910, ['#c8392b', '#2f6b3f', '#2a4a8f', '#e6a23c', '#e8c9b0']],
  ['Kandinsky', 1923, ['#e33b2e', '#f2c230', '#2a5aa8', '#1f1f1f', '#7fbf8f']],
  ['Mondrian', 1930, ['#d62d20', '#1e4fa0', '#f7d417', '#f2f2f2', '#111111']],
  ['Picasso', 1937, ['#3b3b3b', '#9a9a9a', '#e8e8e8', '#6b6b6b', '#1a1a1a']],
  ['Frida Kahlo', 1940, ['#2f6b3f', '#c8392b', '#e6b33c', '#7a4a2e', '#3a5a8f']],
  ['Hopper', 1942, ['#2e5a46', '#c9a46a', '#8a2f2a', '#e8d9a8', '#3a4a6b']],
  ['Rothko', 1958, ['#b3261e', '#e2582a', '#5a1e1e', '#e8a33c', '#2f1a1a']],
  ['Warhol', 1962, ['#ff4fa3', '#f2e230', '#30c8e8', '#ff7a1a', '#7a3aff']],
];

/** Hue (0–360), saturation and lightness (0–100) of a hex color. */
export function hsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hh * 60, s * 100, l * 100];
}

// ---------------------------------------------------------------- regressions (generated)

/** Points around a curve with some noise. */
export function noisy(n: number, x0: number, x1: number, f: (x: number) => number, noise: number, seed: number): [number, number][] {
  const rnd = seeded(seed);
  return Array.from({ length: n }, () => {
    const x = x0 + rnd() * (x1 - x0);
    return [+x.toFixed(2), +(f(x) + gauss(rnd) * noise).toFixed(2)];
  });
}
