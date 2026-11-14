import { createBarChart, type BarOptions, type BarSeries } from 'openchartscandle/bar';
import { MONTHS, h } from '../data';

// Playground: cada controlo muda uma opção e o código correspondente aparece em baixo.
interface Cfg {
  inCard: boolean;
  transparent: boolean;
  seriesCount: number;
  months: number;
  orientation: 'vertical' | 'horizontal';
  stacked: 'no' | 'yes' | 'percent';
  categoryGap: number;
  barGap: number;
  radius: number;
  negatives: boolean;
  sort: 'none' | 'asc' | 'desc';
  labels: 'off' | 'outside' | 'inside' | 'center';
  overlay: 'none' | 'sma' | 'ema' | 'linear' | 'exponential' | 'average' | 'cumulative';
  period: number;
  grid: boolean;
  valueAxis: boolean;
  legend: 'top' | 'bottom' | 'right' | 'left' | 'off';
  legendMarker: 'square' | 'circle';
  tooltip: 'shared' | 'single' | 'off';
  theme: 'dark' | 'light';
  animation: boolean;
}

const DEFAULT: Cfg = {
  inCard: false,
  transparent: false,
  seriesCount: 3,
  months: 6,
  orientation: 'vertical',
  stacked: 'no',
  categoryGap: 0.25,
  barGap: 3,
  radius: 3,
  negatives: false,
  sort: 'none',
  labels: 'off',
  overlay: 'none',
  period: 3,
  grid: true,
  valueAxis: true,
  legend: 'top',
  legendMarker: 'square',
  tooltip: 'shared',
  theme: 'dark',
  animation: true,
};

const NAMES = ['Série A', 'Série B', 'Série C', 'Série D', 'Série E'];
const DATA = NAMES.map((_, s) => MONTHS.map((_, m) => Math.round(30 + 25 * Math.sin(m / 2 + s) + s * 6 + ((m * 13 + s * 7) % 11))));

function seriesFor(c: Cfg): BarSeries[] {
  return NAMES.slice(0, c.seriesCount).map((name, i) => ({
    name,
    data: DATA[i].slice(0, c.months).map((v, m) => (c.negatives && (m + i) % 3 === 1 ? -Math.round(v / 2) : v)),
  }));
}

function toOptions(c: Cfg): BarOptions {
  const o: BarOptions = {};
  if (c.transparent) o.background = 'transparent';
  if (c.orientation !== 'vertical') o.orientation = c.orientation;
  if (c.stacked === 'yes') o.stacked = true;
  if (c.stacked === 'percent') o.stacked = 'percent';
  if (c.categoryGap !== 0.25) o.categoryGap = c.categoryGap;
  if (c.barGap !== 3) o.barGap = c.barGap;
  if (c.radius !== 3) o.radius = c.radius;
  if (c.sort !== 'none') o.sort = c.sort;
  if (c.labels !== 'off') o.labels = { show: true, position: c.labels };
  if (c.overlay !== 'none') {
    const withPeriod = c.overlay === 'sma' || c.overlay === 'ema';
    o.overlays = [{ type: c.overlay, ...(c.seriesCount > 1 ? { source: 'total' } : {}), ...(withPeriod && c.period !== 3 ? { period: c.period } : {}), ...(c.overlay === 'cumulative' ? { percent: true } : {}) }];
  }
  if (!c.grid || !c.valueAxis) o.valueAxis = { ...(c.grid ? {} : { grid: false }), ...(c.valueAxis ? {} : { show: false }) };
  if (c.legend === 'off') o.legend = { show: false };
  else if (c.legend !== 'top' || c.legendMarker !== 'square') o.legend = { ...(c.legend !== 'top' ? { position: c.legend } : {}), ...(c.legendMarker !== 'square' ? { marker: c.legendMarker } : {}) };
  if (c.tooltip === 'off') o.tooltip = { show: false };
  else if (c.tooltip === 'single') o.tooltip = { mode: 'single' };
  if (c.theme !== 'dark') o.theme = c.theme;
  if (!c.animation) o.animation = false;
  return o;
}

function codeFor(c: Cfg, o: BarOptions): string {
  const body = JSON.stringify(o, null, 2).replace(/"([a-zA-Z]+)":/g, '$1:').replace(/"/g, "'").split('\n').slice(1, -1);
  return [
    "import { createBarChart } from 'openchartscandle/bar';",
    "import 'openchartscandle/style.css';",
    '',
    "const chart = createBarChart(document.getElementById('barras')!, {",
    `  categories: [${MONTHS.slice(0, c.months).map((m) => `'${m}'`).join(', ')}],`,
    '  series: [',
    ...seriesFor(c).map((s) => `    { name: '${s.name}', data: [${s.data.join(', ')}] },`),
    '  ],',
    ...body.map((l, i) => (i === body.length - 1 || /[,{[]$/.test(l) ? l : `${l},`)),
    '});',
  ].join('\n');
}

export function mount(el: HTMLElement): () => void {
  let cfg: Cfg = { ...DEFAULT };
  const panel = h('aside', { class: 'cfg' });
  const chartBox = h('div', { class: 'pg-chart' });
  const stage = h('div', { class: 'pg-stage' }, h('div', { class: 'pg-card' }, h('div', { class: 'pg-card__title', text: 'Vendas' }), chartBox));
  const code = h('pre', { class: 'cfg-code__pre' });
  el.append(h('div', { class: 'cfg-layout' }, panel, h('div', { class: 'cfg-main' }, stage, h('div', { class: 'cfg-code' }, h('div', { class: 'cfg-code__head', text: 'Código desta configuração' }), code))));

  const chart = createBarChart(chartBox, { categories: MONTHS.slice(0, cfg.months), series: seriesFor(cfg), ...toOptions(cfg) });
  const RESET: BarOptions = {
    background: undefined, orientation: 'vertical', stacked: false, categoryGap: 0.25, barGap: 3, radius: 3, sort: 'none',
    labels: { show: false }, overlays: [], valueAxis: {}, legend: {}, tooltip: {}, theme: 'dark', animation: true,
  };

  const apply = (animate: boolean): void => {
    const o = toOptions(cfg);
    chart.setOptions({ ...RESET, ...o, categories: MONTHS.slice(0, cfg.months), series: seriesFor(cfg) }, animate);
    stage.classList.toggle('is-card', cfg.inCard);
    stage.style.setProperty('--card', cfg.theme === 'light' ? '#ffffff' : '#1b2030');
    stage.style.setProperty('--card-text', cfg.theme === 'light' ? '#131722' : '#d1d4dc');
    code.textContent = codeFor(cfg, o);
  };
  let frame = 0;
  const applySoon = (): void => {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), apply(false)));
  };

  type NumKey = 'seriesCount' | 'months' | 'categoryGap' | 'barGap' | 'radius' | 'period';
  const slider = (label: string, key: NumKey, min: number, max: number, step: number): HTMLElement => {
    const range = h('input', { class: 'cfg-range' });
    Object.assign(range, { type: 'range', min: String(min), max: String(max), step: String(step) });
    const num = h('input');
    Object.assign(num, { type: 'number', min: String(min), max: String(max), step: String(step) });
    const paint = (): void => {
      range.value = num.value = String(cfg[key]);
      range.style.setProperty('--p', `${((cfg[key] - min) / (max - min)) * 100}%`);
    };
    const set = (v: number): void => {
      if (!Number.isFinite(v)) return;
      cfg[key] = Math.min(max, Math.max(min, v));
      paint();
      applySoon();
    };
    range.addEventListener('input', () => set(Number(range.value)));
    num.addEventListener('input', () => set(Number(num.value)));
    paint();
    return h('div', { class: 'cfg-slider' }, h('div', { class: 'cfg-slider__head' }, h('span', { class: 'cfg-slider__label', text: label }), h('label', { class: 'cfg-slider__num' }, num)), range);
  };
  const chips = <K extends keyof Cfg>(key: K, items: [string, Cfg[K]][]): HTMLElement => {
    const box = h('div', { class: 'cfg-chips' });
    const buttons = items.map(([text, value]) => {
      const b = h('button', { class: `cfg-chip${cfg[key] === value ? ' is-on' : ''}`, text });
      b.addEventListener('click', () => {
        cfg[key] = value;
        buttons.forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        apply(true);
      });
      return b;
    });
    box.append(...buttons);
    return box;
  };
  type BoolKey = { [K in keyof Cfg]: Cfg[K] extends boolean ? K : never }[keyof Cfg];
  const toggle = (label: string, key: BoolKey): HTMLElement => {
    const input = h('input');
    input.type = 'checkbox';
    input.checked = cfg[key];
    input.addEventListener('change', () => {
      cfg[key] = input.checked;
      apply(true);
    });
    return h('label', { class: 'cfg-row' }, input, h('span', { text: label }));
  };
  const open = new Set(['Dados', 'Barras']);
  const section = (title: string, ...children: HTMLElement[]): HTMLElement => {
    const d = h('details', { class: 'cfg-section cfg-details' }, h('summary', { text: title }), ...children);
    d.open = open.has(title);
    d.addEventListener('toggle', () => (d.open ? open.add(title) : open.delete(title)));
    return d;
  };

  const render = (): void => {
    panel.replaceChildren(
      h('div', { class: 'cfg-head' }, h('h2', { text: 'Configuração' }), h('button', { class: 'cfg-reset', text: 'Repor', onclick: () => ((cfg = { ...DEFAULT }), render(), apply(true)) })),
      section('Dados', slider('Número de séries', 'seriesCount', 1, 5, 1), slider('Meses', 'months', 2, 12, 1), toggle('Valores negativos', 'negatives'), chips('sort', [['Sem ordenar', 'none'], ['Crescente', 'asc'], ['Decrescente', 'desc']])),
      section(
        'Barras',
        chips('orientation', [['Colunas', 'vertical'], ['Horizontais', 'horizontal']]),
        chips('stacked', [['Agrupadas', 'no'], ['Empilhadas', 'yes'], ['100%', 'percent']]),
        slider('Espaço entre categorias', 'categoryGap', 0, 0.8, 0.05),
        slider('Espaço entre barras (px)', 'barGap', 0, 12, 1),
        slider('Cantos arredondados (px)', 'radius', 0, 14, 1),
      ),
      section('Valores', chips('labels', [['Sem', 'off'], ['Fora', 'outside'], ['Dentro', 'inside'], ['Centro', 'center']])),
      section(
        'Médias e tendências',
        chips('overlay', [['Sem', 'none'], ['Média móvel', 'sma'], ['Exponencial', 'ema'], ['Tend. linear', 'linear'], ['Tend. exponencial', 'exponential'], ['Média', 'average'], ['Acumulado %', 'cumulative']]),
        slider('Período da média', 'period', 2, 6, 1),
      ),
      section('Eixos', toggle('Grelha', 'grid'), toggle('Eixo de valores', 'valueAxis')),
      section(
        'Legenda e tooltip',
        chips('legend', [['Cima', 'top'], ['Baixo', 'bottom'], ['Direita', 'right'], ['Esquerda', 'left'], ['Sem', 'off']]),
        chips('legendMarker', [['■ Quadrado', 'square'], ['● Círculo', 'circle']]),
        chips('tooltip', [['Partilhado', 'shared'], ['Barra única', 'single'], ['Sem', 'off']]),
      ),
      section('Aparência', chips('theme', [['Escuro', 'dark'], ['Claro', 'light']]), toggle('Mostrar dentro de um card', 'inCard'), toggle('Fundo transparente', 'transparent'), toggle('Animação', 'animation')),
    );
  };
  render();
  apply(false);
  return () => {
    cancelAnimationFrame(frame);
    chart.destroy();
  };
}
