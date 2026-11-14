import { createPieChart, type PieOptions } from 'openchartscandle/pie';
import { h, portfolio } from '../data';

// Playground: cada controlo muda uma opção com setOptions() e o código correspondente
// aparece em baixo, pronto a copiar. Os sliders atualizam sem animação enquanto arrastas
// (setOptions(patch, false)), para ficarem fluidos; os botões animam a transição.
// "Dentro de um card" mostra o gráfico com fundo transparente sobre um card da cor que escolheres.
interface Cfg {
  // container
  inCard: boolean;
  cardColor: string;
  background: 'transparent' | 'theme' | 'custom';
  bgColor: string;
  padding: number;
  scale: number;
  // shape
  shape: 'full' | 'half';
  rose: boolean;
  rotation: number;
  clockwise: boolean;
  innerRadius: number;
  padAngle: number;
  cornerRadius: number;
  borderWidth: number;
  minSliceAngle: number;
  // look
  theme: 'dark' | 'light';
  gradient: boolean;
  shadow: boolean;
  hoverOffset: number;
  hoverDim: number;
  animation: boolean;
  // data
  sort: 'none' | 'desc' | 'asc';
  groupBelow: number;
  // labels
  labels: 'auto' | 'inside' | 'outside' | 'off';
  labelContent: 'percent' | 'value' | 'label' | 'label-percent';
  labelMin: number;
  labelSize: number;
  labelWeight: number;
  labelLine: number;
  // legend
  legend: 'right' | 'bottom' | 'left' | 'top' | 'off';
  legendMarker: 'square' | 'circle' | 'line';
  legendAlign: 'start' | 'center' | 'end';
  legendValues: boolean;
  legendSize: number;
  // center
  center: boolean;
  centerScale: number;
  // tooltip
  tooltip: boolean;
  tooltipFollow: boolean;
  tooltipValue: boolean;
  tooltipPercent: boolean;
}

const DEFAULT: Cfg = {
  inCard: true,
  cardColor: '#1b2030',
  background: 'transparent',
  bgColor: '#131722',
  padding: 8,
  scale: 1,
  shape: 'full',
  rose: false,
  rotation: 0,
  clockwise: true,
  innerRadius: 0.58,
  padAngle: 1.5,
  cornerRadius: 5,
  borderWidth: 1,
  minSliceAngle: 0,
  theme: 'dark',
  gradient: false,
  shadow: false,
  hoverOffset: 8,
  hoverDim: 0.55,
  animation: true,
  sort: 'desc',
  groupBelow: 0,
  labels: 'auto',
  labelContent: 'percent',
  labelMin: 3,
  labelSize: 12,
  labelWeight: 600,
  labelLine: 18,
  legend: 'right',
  legendMarker: 'square',
  legendAlign: 'center',
  legendValues: true,
  legendSize: 13,
  center: true,
  centerScale: 1,
  tooltip: true,
  tooltipFollow: true,
  tooltipValue: true,
  tooltipPercent: true,
};

/** Only the options that differ from the library defaults (keeps the generated code short). */
function toOptions(c: Cfg): PieOptions {
  const o: PieOptions = {};
  if (c.background === 'transparent') o.background = 'transparent';
  else if (c.background === 'custom') o.background = c.bgColor;
  if (c.padding) o.padding = c.padding;
  if (c.scale !== 1) o.scale = c.scale;
  if (c.innerRadius) o.innerRadius = c.innerRadius;
  const start = (c.shape === 'half' ? -180 : -90) + c.rotation;
  if (start !== -90) o.startAngle = start;
  if (c.shape === 'half') o.endAngle = start + 180;
  if (!c.clockwise) o.clockwise = false;
  if (c.rose) o.rose = true;
  if (c.padAngle) o.padAngle = c.padAngle;
  if (c.cornerRadius) o.cornerRadius = c.cornerRadius;
  if (c.borderWidth !== 1) o.borderWidth = c.borderWidth;
  if (c.minSliceAngle) o.minSliceAngle = c.minSliceAngle;
  if (c.theme !== 'dark') o.theme = c.theme;
  if (c.gradient) o.gradient = true;
  if (c.shadow) o.shadow = { blur: 14, offsetY: 4 };
  if (c.hoverOffset !== 8) o.hoverOffset = c.hoverOffset;
  if (c.hoverDim !== 0.55) o.hoverDim = c.hoverDim;
  if (!c.animation) o.animation = false;
  if (c.sort !== 'none') o.sort = c.sort;
  if (c.groupBelow) o.groupBelow = c.groupBelow;

  if (c.labels === 'off') o.labels = { show: false };
  else {
    const l: NonNullable<PieOptions['labels']> = {};
    if (c.labels !== 'auto') l.position = c.labels;
    if (c.labelContent !== 'percent') l.content = c.labelContent;
    if (c.labelMin !== 3) l.minPercent = c.labelMin;
    if (c.labelSize !== 12) l.fontSize = c.labelSize;
    if (c.labelWeight !== 600) l.fontWeight = c.labelWeight;
    if (c.labelLine !== 18) l.lineLength = c.labelLine;
    if (Object.keys(l).length) o.labels = l;
  }

  if (c.legend === 'off') o.legend = { show: false };
  else {
    const l: NonNullable<PieOptions['legend']> = {};
    if (c.legend !== 'right') l.position = c.legend;
    if (c.legendMarker !== 'square') l.marker = c.legendMarker;
    if (c.legendAlign !== 'center') l.align = c.legendAlign;
    if (!c.legendValues) l.values = false;
    if (c.legendSize !== 13) l.fontSize = c.legendSize;
    if (Object.keys(l).length) o.legend = l;
  }

  if (!c.center) o.center = { show: false };
  else if (c.centerScale !== 1) o.center = { fontScale: c.centerScale };

  if (!c.tooltip) o.tooltip = { show: false };
  else {
    const t: NonNullable<PieOptions['tooltip']> = {};
    if (!c.tooltipFollow) t.followCursor = false;
    if (!c.tooltipValue) t.showValue = false;
    if (!c.tooltipPercent) t.showPercent = false;
    if (Object.keys(t).length) o.tooltip = t;
  }
  return o;
}

/** Every option back to the library default, so removing a setting really removes it. */
const RESET: PieOptions = {
  background: undefined, padding: 0, scale: 1, innerRadius: 0, startAngle: -90, endAngle: 270, clockwise: true, rose: false,
  padAngle: 0, cornerRadius: 0, borderWidth: 1, minSliceAngle: 0, theme: 'dark', gradient: false, shadow: false, hoverOffset: 8,
  hoverDim: 0.55, animation: true, sort: 'none', groupBelow: 0, labels: {}, legend: {}, center: {}, tooltip: {},
};

function codeFor(o: PieOptions): string {
  const body = JSON.stringify(o, null, 2)
    .replace(/"([a-zA-Z]+)":/g, '$1:')
    .replace(/"/g, "'")
    .split('\n')
    .slice(1, -1);
  return [
    "import { createPieChart } from 'openchartscandle/pie';",
    "import 'openchartscandle/style.css';",
    '',
    "const chart = createPieChart(document.getElementById('pizza')!, {",
    "  data: meusDados, // [{ label: 'Ações', value: 60 }, …]",
    ...body.map((l, i) => (i === body.length - 1 || /[,{[]$/.test(l) ? l : `${l},`)),
    '});',
  ].join('\n');
}

export function mount(el: HTMLElement): () => void {
  let cfg: Cfg = { ...DEFAULT };
  const panel = h('aside', { class: 'cfg' });
  const chartBox = h('div', { class: 'pg-chart' });
  const stage = h('div', { class: 'pg-stage' }, h('div', { class: 'pg-card' }, h('div', { class: 'pg-card__title', text: 'Carteira' }), chartBox));
  const code = h('pre', { class: 'cfg-code__pre' });
  const copy = h('button', { class: 'cfg-copy', text: 'Copiar código' });
  el.append(
    h('div', { class: 'cfg-layout' },
      panel,
      h('div', { class: 'cfg-main' }, stage, h('div', { class: 'cfg-code' }, h('div', { class: 'cfg-code__head' }, h('span', { text: 'Código desta configuração' }), copy), code)),
    ),
  );
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent ?? '');
      copy.textContent = 'Copiado!';
    } catch {
      copy.textContent = 'Seleciona e copia';
    }
    setTimeout(() => (copy.textContent = 'Copiar código'), 1400);
  });

  const chart = createPieChart(chartBox, { data: portfolio, ...toOptions(cfg) });

  const paintStage = (): void => {
    stage.classList.toggle('is-card', cfg.inCard);
    stage.style.setProperty('--card', cfg.cardColor);
    stage.style.setProperty('--card-text', cfg.theme === 'light' ? '#131722' : '#d1d4dc');
  };

  const apply = (animate: boolean): void => {
    const o = toOptions(cfg);
    chart.setOptions({ ...RESET, ...o }, animate);
    paintStage();
    code.textContent = codeFor(o);
  };

  // continuous controls: at most one update per frame, no animation
  let frame = 0;
  const applySoon = (): void => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      apply(false);
    });
  };

  type NumKey = { [K in keyof Cfg]: Cfg[K] extends number ? K : never }[keyof Cfg];
  const slider = (label: string, key: NumKey, min: number, max: number, step: number, unit = ''): HTMLElement => {
    const range = h('input', { class: 'cfg-range' });
    range.type = 'range';
    range.min = String(min);
    range.max = String(max);
    range.step = String(step);
    const num = h('input');
    num.type = 'number';
    num.min = String(min);
    num.max = String(max);
    num.step = String(step);
    const paint = (): void => {
      range.value = String(cfg[key]);
      num.value = String(cfg[key]);
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
    num.addEventListener('change', paint);
    paint();
    return h(
      'div',
      { class: 'cfg-slider' },
      h('div', { class: 'cfg-slider__head' }, h('span', { class: 'cfg-slider__label', text: label }), h('label', { class: 'cfg-slider__num' }, num, unit ? h('span', { text: unit }) : null)),
      range,
    );
  };

  const chips = <K extends keyof Cfg>(key: K, items: [string, Cfg[K]][], rerender = false): HTMLElement => {
    const box = h('div', { class: 'cfg-chips' });
    const buttons = items.map(([text, value]) => {
      const b = h('button', { class: `cfg-chip${cfg[key] === value ? ' is-on' : ''}`, text });
      b.addEventListener('click', () => {
        cfg[key] = value;
        buttons.forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        apply(true);
        if (rerender) render();
      });
      return b;
    });
    box.append(...buttons);
    return box;
  };

  const toggle = (label: string, key: { [K in keyof Cfg]: Cfg[K] extends boolean ? K : never }[keyof Cfg], rerender = false): HTMLElement => {
    const input = h('input');
    input.type = 'checkbox';
    input.checked = cfg[key];
    input.addEventListener('change', () => {
      cfg[key] = input.checked;
      apply(true);
      if (rerender) render();
    });
    return h('label', { class: 'cfg-row' }, input, h('span', { text: label }));
  };

  const color = (label: string, key: 'cardColor' | 'bgColor'): HTMLElement => {
    const input = h('input');
    input.type = 'color';
    input.value = cfg[key];
    input.addEventListener('input', () => {
      cfg[key] = input.value;
      applySoon();
    });
    return h('label', { class: 'cfg-row cfg-color' }, input, h('span', { text: label }));
  };

  // collapsible sections (remember which are open)
  const open = new Set(['Fundo e card', 'Forma', 'Fatias']);
  const section = (title: string, ...children: (HTMLElement | null)[]): HTMLElement => {
    const d = h('details', { class: 'cfg-section cfg-details' }, h('summary', { text: title }), ...children);
    d.open = open.has(title);
    d.addEventListener('toggle', () => (d.open ? open.add(title) : open.delete(title)));
    return d;
  };

  const render = (): void => {
    const scroll = panel.scrollTop;
    panel.replaceChildren(
      h('div', { class: 'cfg-head' },
        h('h2', { text: 'Configuração' }),
        h('button', { class: 'cfg-reset', text: 'Repor', onclick: () => ((cfg = { ...DEFAULT }), render(), apply(true)) }),
      ),
      section(
        'Fundo e card',
        toggle('Mostrar dentro de um card', 'inCard', true),
        cfg.inCard ? color('Cor do card', 'cardColor') : null,
        h('div', { class: 'cfg-sub', text: 'Fundo do gráfico' }),
        chips('background', [['Transparente', 'transparent'], ['Do tema', 'theme'], ['Cor', 'custom']], true),
        cfg.background === 'custom' ? color('Cor de fundo', 'bgColor') : null,
        slider('Margem interior', 'padding', 0, 60, 1, 'px'),
        slider('Tamanho', 'scale', 0.3, 1, 0.01),
      ),
      section(
        'Forma',
        chips('shape', [['Círculo', 'full'], ['Meio (gauge)', 'half']]),
        chips('rose', [['Normal', false], ['Rosa', true]]),
        chips('clockwise', [['Sentido horário', true], ['Anti-horário', false]]),
        slider('Rotação', 'rotation', 0, 360, 5, '°'),
      ),
      section(
        'Fatias',
        slider('Buraco (donut)', 'innerRadius', 0, 0.9, 0.01),
        slider('Espaço entre fatias', 'padAngle', 0, 8, 0.25, '°'),
        slider('Cantos arredondados', 'cornerRadius', 0, 20, 1, 'px'),
        slider('Contorno / corte', 'borderWidth', 0, 6, 0.5, 'px'),
        slider('Ângulo mínimo', 'minSliceAngle', 0, 15, 0.5, '°'),
      ),
      section(
        'Aparência',
        chips('theme', [['Escuro', 'dark'], ['Claro', 'light']]),
        toggle('Gradiente nas fatias', 'gradient'),
        toggle('Sombra', 'shadow'),
        toggle('Animação', 'animation'),
        slider('Afastar no hover', 'hoverOffset', 0, 24, 1, 'px'),
        slider('Opacidade das outras no hover', 'hoverDim', 0, 1, 0.05),
      ),
      section('Dados', chips('sort', [['Sem ordem', 'none'], ['Maior primeiro', 'desc'], ['Menor primeiro', 'asc']]), slider('Agrupar em "Outros" abaixo de', 'groupBelow', 0, 20, 1, '%')),
      section(
        'Etiquetas',
        chips('labels', [['Auto', 'auto'], ['Dentro', 'inside'], ['Fora', 'outside'], ['Sem', 'off']]),
        chips('labelContent', [['%', 'percent'], ['Valor', 'value'], ['Nome', 'label'], ['Nome + %', 'label-percent']]),
        slider('Esconder abaixo de', 'labelMin', 0, 15, 0.5, '%'),
        slider('Tamanho do texto', 'labelSize', 8, 20, 1, 'px'),
        chips('labelWeight', [['Normal', 400], ['Semi', 600], ['Negrito', 700]]),
        slider('Linha-guia', 'labelLine', 6, 60, 1, 'px'),
      ),
      section(
        'Legenda',
        chips('legend', [['Direita', 'right'], ['Baixo', 'bottom'], ['Esquerda', 'left'], ['Cima', 'top'], ['Sem', 'off']]),
        chips('legendMarker', [['■ Quadrado', 'square'], ['● Círculo', 'circle'], ['▬ Linha', 'line']]),
        chips('legendAlign', [['Início', 'start'], ['Centro', 'center'], ['Fim', 'end']]),
        toggle('Mostrar valores', 'legendValues'),
        slider('Tamanho do texto', 'legendSize', 10, 18, 1, 'px'),
      ),
      section('Centro (donut)', toggle('Texto no centro', 'center'), slider('Tamanho do texto', 'centerScale', 0.5, 1.6, 0.05, '×')),
      section(
        'Tooltip',
        toggle('Mostrar tooltip', 'tooltip'),
        toggle('Seguir o rato (senão fica junto à fatia)', 'tooltipFollow'),
        toggle('Mostrar valor', 'tooltipValue'),
        toggle('Mostrar %', 'tooltipPercent'),
      ),
    );
    panel.scrollTop = scroll;
  };

  render();
  apply(false);

  return () => {
    cancelAnimationFrame(frame);
    chart.destroy();
  };
}
