import { createGauge, trafficZones, type GaugeOptions } from 'openchartscandle/gauge';
import { h } from '../data';

// Playground: cada controlo muda uma opção e o código correspondente aparece em baixo.
interface Cfg {
  inCard: boolean;
  transparent: boolean;
  value: number;
  max: number;
  shape: 'speedometer' | 'semi' | 'full';
  thickness: number;
  rounded: boolean;
  fill: 'zones' | 'gradient' | 'progress' | 'none';
  needle: boolean;
  needleShape: 'classic' | 'line' | 'arrow';
  ticks: boolean;
  major: number;
  minor: number;
  ticksPos: 'inside' | 'outside';
  marker: boolean;
  unit: string;
  title: boolean;
  easing: 'spring' | 'smooth' | 'linear';
  theme: 'dark' | 'light';
}

const DEFAULT: Cfg = {
  inCard: false,
  transparent: false,
  value: 65,
  max: 100,
  shape: 'speedometer',
  thickness: 0.16,
  rounded: true,
  fill: 'zones',
  needle: true,
  needleShape: 'classic',
  ticks: true,
  major: 6,
  minor: 4,
  ticksPos: 'inside',
  marker: false,
  unit: '%',
  title: true,
  easing: 'spring',
  theme: 'dark',
};

function toOptions(c: Cfg): GaugeOptions {
  const o: GaugeOptions = { value: c.value };
  if (c.max !== 100) o.max = c.max;
  if (c.transparent) o.background = 'transparent';
  if (c.shape !== 'speedometer') o.shape = c.shape;
  if (c.thickness !== 0.16) o.thickness = c.thickness;
  if (!c.rounded) o.rounded = false;
  if (c.fill === 'zones') o.zones = trafficZones(0, c.max);
  if (c.fill === 'gradient') o.gradient = ['#089981', '#ffb300', '#f23645'];
  if (c.fill === 'progress') o.progress = true;
  if (c.fill === 'gradient' && !c.needle) o.progress = true;
  if (!c.needle) o.needle = false;
  else if (c.needleShape !== 'classic') o.needle = { shape: c.needleShape };
  if (!c.ticks) o.ticks = { show: false };
  else if (c.major !== 6 || c.minor !== 4 || c.ticksPos !== 'inside') o.ticks = { ...(c.major !== 6 ? { major: c.major } : {}), ...(c.minor !== 4 ? { minor: c.minor } : {}), ...(c.ticksPos !== 'inside' ? { position: c.ticksPos } : {}) };
  if (c.marker) o.markers = [{ value: c.max * 0.8, label: 'Meta', color: '#2962ff' }];
  if (c.unit) o.unit = c.unit;
  if (c.title) o.title = 'Utilização';
  if (c.easing !== 'spring') o.animation = { easing: c.easing };
  if (c.theme !== 'dark') o.theme = c.theme;
  return o;
}

function codeFor(o: GaugeOptions): string {
  const json = JSON.stringify(o, null, 2).replace(/"([a-zA-Z]+)":/g, '$1:').replace(/"/g, "'");
  const zones = o.zones ? json.replace(/zones: \[[\s\S]*?\n {2}\]/, `zones: trafficZones(0, ${o.max ?? 100})`) : json;
  return [
    `import { createGauge${o.zones ? ', trafficZones' : ''} } from 'openchartscandle/gauge';`,
    "import 'openchartscandle/style.css';",
    '',
    `const gauge = createGauge(document.getElementById('velocimetro')!, ${zones});`,
    '',
    '// tempo real',
    `gauge.setValue(${Math.round((o.max ?? 100) * 0.4)});`,
  ].join('\n');
}

export function mount(el: HTMLElement): () => void {
  let cfg: Cfg = { ...DEFAULT };
  const panel = h('aside', { class: 'cfg' });
  const chartBox = h('div', { class: 'pg-chart' });
  const stage = h('div', { class: 'pg-stage' }, h('div', { class: 'pg-card' }, h('div', { class: 'pg-card__title', text: 'Servidor' }), chartBox));
  const code = h('pre', { class: 'cfg-code__pre' });
  el.append(h('div', { class: 'cfg-layout' }, panel, h('div', { class: 'cfg-main' }, stage, h('div', { class: 'cfg-code' }, h('div', { class: 'cfg-code__head', text: 'Código desta configuração' }), code))));

  const gauge = createGauge(chartBox, toOptions(cfg));
  const RESET: GaugeOptions = {
    max: 100, background: undefined, shape: 'speedometer', thickness: 0.16, rounded: true, zones: undefined, gradient: undefined, progress: undefined,
    needle: undefined, ticks: {}, markers: undefined, unit: undefined, title: undefined, animation: true, theme: 'dark',
  };

  const apply = (animate: boolean): void => {
    const o = toOptions(cfg);
    gauge.setOptions({ ...RESET, ...o }, animate);
    stage.classList.toggle('is-card', cfg.inCard);
    stage.style.setProperty('--card', cfg.theme === 'light' ? '#ffffff' : '#1b2030');
    stage.style.setProperty('--card-text', cfg.theme === 'light' ? '#131722' : '#d1d4dc');
    code.textContent = codeFor(o);
  };
  let frame = 0;
  const applySoon = (key: string): void => {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), apply(key === 'value')));
  };

  type NumKey = 'value' | 'max' | 'thickness' | 'major' | 'minor';
  const slider = (label: string, key: NumKey, min: number, max: () => number, step: number): HTMLElement => {
    const range = h('input', { class: 'cfg-range' });
    const num = h('input');
    const paint = (): void => {
      const mx = max();
      Object.assign(range, { type: 'range', min: String(min), max: String(mx), step: String(step) });
      Object.assign(num, { type: 'number', min: String(min), max: String(mx), step: String(step) });
      range.value = num.value = String(cfg[key]);
      range.style.setProperty('--p', `${((cfg[key] - min) / (mx - min)) * 100}%`);
    };
    const set = (v: number): void => {
      if (!Number.isFinite(v)) return;
      cfg[key] = Math.min(max(), Math.max(min, v));
      if (key === 'max') cfg.value = Math.min(cfg.value, cfg.max);
      paint();
      applySoon(key);
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
  const open = new Set(['Valor', 'Formato']);
  const section = (title: string, ...children: HTMLElement[]): HTMLElement => {
    const d = h('details', { class: 'cfg-section cfg-details' }, h('summary', { text: title }), ...children);
    d.open = open.has(title);
    d.addEventListener('toggle', () => (d.open ? open.add(title) : open.delete(title)));
    return d;
  };

  const render = (): void => {
    panel.replaceChildren(
      h('div', { class: 'cfg-head' }, h('h2', { text: 'Configuração' }), h('button', { class: 'cfg-reset', text: 'Repor', onclick: () => ((cfg = { ...DEFAULT }), render(), apply(true)) })),
      section('Valor', slider('Valor', 'value', 0, () => cfg.max, 1), slider('Máximo', 'max', 10, () => 1000, 10), chips('unit', [['%', '%'], ['km/h', 'km/h'], ['ms', 'ms'], ['Sem', '']]), toggle('Título', 'title')),
      section(
        'Formato',
        chips('shape', [['Velocímetro', 'speedometer'], ['Meio círculo', 'semi'], ['Anel', 'full']]),
        slider('Espessura do arco', 'thickness', 0.04, () => 0.5, 0.01),
        toggle('Pontas redondas', 'rounded'),
        chips('fill', [['Zonas', 'zones'], ['Gradiente', 'gradient'], ['Progresso', 'progress'], ['Só trilho', 'none']]),
      ),
      section('Ponteiro', toggle('Mostrar ponteiro', 'needle'), chips('needleShape', [['Clássico', 'classic'], ['Linha', 'line'], ['Seta', 'arrow']]), chips('easing', [['Mola', 'spring'], ['Suave', 'smooth'], ['Linear', 'linear']])),
      section('Marcas', toggle('Mostrar marcas', 'ticks'), chips('ticksPos', [['Dentro', 'inside'], ['Fora', 'outside']]), slider('Marcas grandes', 'major', 2, () => 15, 1), slider('Pequenas entre grandes', 'minor', 0, () => 9, 1), toggle('Marcador "Meta"', 'marker')),
      section('Aparência', chips('theme', [['Escuro', 'dark'], ['Claro', 'light']]), toggle('Mostrar dentro de um card', 'inCard'), toggle('Fundo transparente', 'transparent')),
    );
  };
  render();
  apply(false);
  return () => {
    cancelAnimationFrame(frame);
    gauge.destroy();
  };
}
