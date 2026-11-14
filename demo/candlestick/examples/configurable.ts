import {
  INDICATORS,
  TIMEFRAMES,
  TOOL_GROUPS,
  createTerminal,
  darkTheme,
  lightTheme,
  type ChartType,
  type Terminal,
  type TerminalOptions,
  type Theme,
} from 'openchartscandle/candlestick';
import { datafeed } from '../data';

// Playground: cada opção do createTerminal pode ser ligada/desligada; o terminal é recriado
// a cada alteração e o código correspondente aparece em baixo.

const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: 'candles', label: 'Velas' },
  { id: 'hollow', label: 'Velas ocas' },
  { id: 'bars', label: 'Barras' },
  { id: 'heikin', label: 'Heikin Ashi' },
  { id: 'line', label: 'Linha' },
  { id: 'step', label: 'Degraus' },
  { id: 'area', label: 'Área' },
  { id: 'baseline', label: 'Baseline' },
];

interface Config {
  topbar: boolean;
  symbolSearch: boolean;
  timeframeSelector: boolean;
  timeframes: string[];
  chartTypesMenu: boolean;
  chartTypes: ChartType[];
  indicatorPicker: boolean;
  builtinIndicators: string[];
  undoRedo: boolean;
  screenshot: boolean;
  fullscreen: boolean;
  leftToolbar: boolean;
  toolGroups: string[];
  legend: boolean;
  bottomBar: boolean;
  rangeButtons: boolean;
  watchlist: boolean;
  initialIndicators: string[];
  // appearance
  preset: 'dark' | 'light';
  bg: string;
  up: string;
  down: string;
  wickUp: string;
  wickDown: string;
  candleBorder: boolean;
  borderUp: string;
  borderDown: string;
  grid: boolean;
  priceAxis: boolean;
  timeAxis: boolean;
  crosshair: boolean;
  compact: boolean;
  minimal: boolean;
  rounded: boolean;
}

const DEFAULT: Config = {
  topbar: true,
  symbolSearch: true,
  timeframeSelector: true,
  timeframes: TIMEFRAMES.map((t) => t.id),
  chartTypesMenu: true,
  chartTypes: CHART_TYPES.map((c) => c.id),
  indicatorPicker: true,
  builtinIndicators: INDICATORS.map((i) => i.type),
  undoRedo: true,
  screenshot: true,
  fullscreen: true,
  leftToolbar: true,
  toolGroups: TOOL_GROUPS.map((g) => g.id),
  legend: true,
  bottomBar: true,
  rangeButtons: true,
  watchlist: false,
  initialIndicators: ['sma', 'rsi'],
  preset: 'dark',
  bg: darkTheme.bg,
  up: darkTheme.up,
  down: darkTheme.down,
  wickUp: darkTheme.wickUp,
  wickDown: darkTheme.wickDown,
  candleBorder: false,
  borderUp: darkTheme.up,
  borderDown: darkTheme.down,
  grid: true,
  priceAxis: true,
  timeAxis: true,
  crosshair: true,
  compact: false,
  minimal: false,
  rounded: false,
};

const KEY = 'tc-demo-custom';
const load = (): Config => {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(`${KEY}.config`) ?? '{}') };
  } catch {
    return { ...DEFAULT };
  }
};
let cfg = load();
let host: HTMLElement;
let panel: HTMLElement;
let codeEl: HTMLElement;
let terminal: Terminal | null = null;

/** Turn the checkbox config into TerminalOptions (only non-default values, so the code stays short). */
function toOptions(c: Config): Omit<TerminalOptions, 'datafeed'> {
  const o: Omit<TerminalOptions, 'datafeed'> = { symbol: 'SIMBTC', timeframe: c.timeframes.includes('5') ? '5' : c.timeframes[0] };
  if (!c.topbar) o.topbar = false;
  if (!c.symbolSearch) o.symbolSearch = false;
  if (!c.timeframeSelector) o.timeframeSelector = false;
  else if (c.timeframes.length < TIMEFRAMES.length) o.timeframeSelector = c.timeframes;
  if (!c.chartTypesMenu) o.chartTypes = false;
  else if (c.chartTypes.length < CHART_TYPES.length) o.chartTypes = c.chartTypes;
  if (!c.indicatorPicker) o.indicatorPicker = false;
  else if (c.builtinIndicators.length < INDICATORS.length) o.indicatorPicker = c.builtinIndicators;
  if (!c.undoRedo) o.undoRedo = false;
  if (!c.screenshot) o.screenshot = false;
  if (!c.fullscreen) o.fullscreen = false;
  if (!c.leftToolbar) o.leftToolbar = false;
  else if (c.toolGroups.length < TOOL_GROUPS.length)
    o.drawingTools = TOOL_GROUPS.filter((g) => c.toolGroups.includes(g.id)).flatMap((g) => g.tools.map((t) => t.id));
  if (!c.legend) o.legend = false;
  if (!c.bottomBar) o.bottomBar = false;
  if (!c.rangeButtons) o.rangeButtons = false;
  o.watchlist = c.watchlist;
  o.indicators = c.initialIndicators.map((type) => ({ type }));
  // appearance: only keys that differ from the default dark theme go into `theme`
  const base = c.preset === 'light' ? lightTheme : darkTheme;
  const wanted: Partial<Theme> = {
    ...base,
    bg: c.bg,
    up: c.up,
    down: c.down,
    wickUp: c.wickUp,
    wickDown: c.wickDown,
    candleBorder: c.candleBorder,
    borderUp: c.borderUp,
    borderDown: c.borderDown,
    grid: c.grid ? base.grid : 'transparent',
  };
  const theme: Partial<Theme> = {};
  for (const [k, v] of Object.entries(wanted) as [keyof Theme, Theme[keyof Theme]][]) {
    if (v !== darkTheme[k]) (theme as Record<string, unknown>)[k] = v;
  }
  if (Object.keys(theme).length) o.theme = theme;
  if (!c.priceAxis) o.priceAxis = false;
  if (!c.timeAxis) o.timeAxis = false;
  if (!c.crosshair) o.crosshair = false;
  if (c.compact) o.compact = true;
  if (c.minimal) o.minimal = true;
  if (c.rounded) {
    o.radius = 10;
    o.border = `1px solid ${c.preset === 'light' ? '#d1d4dc' : '#2a2e39'}`;
  }
  return o;
}

function rebuild(): void {
  localStorage.setItem(`${KEY}.config`, JSON.stringify(cfg));
  localStorage.removeItem(`${KEY}.state`); // the checkboxes win over the saved UI state (drawings are kept)
  terminal?.destroy();
  const options = toOptions(cfg);
  terminal = createTerminal(host, { datafeed, storageKey: KEY, ...options });
  (window as unknown as { terminal: Terminal }).terminal = terminal;
  renderCode(options);
}

function renderCode(options: object): void {
  // string arrays on one line: ['1', '5', '60']
  const json = JSON.stringify(options, (_k, v) => (Array.isArray(v) && v.every((x) => typeof x === 'string') ? `@[${v.map((x) => `'${x}'`).join(', ')}]@` : v), 2)
    .replace(/"@(.*?)@"/g, '$1')
    .replace(/"([a-zA-Z]+)":/g, '$1:')
    .replace(/"/g, "'");
  const lines = json.split('\n').slice(1, -1); // drop the outer braces, keep the 2-space indent
  const code = [
    "import { createTerminal } from 'openchartscandle/candlestick';",
    "import 'openchartscandle/style.css';",
    '',
    "const terminal = createTerminal(document.getElementById('grafico')!, {",
    '  datafeed: meuDatafeed,',
    ...lines,
    '});',
  ].join('\n');
  codeEl.textContent = code;
}

// ---------------- config panel ----------------


function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function toggle(label: string, key: keyof Config, hint = ''): HTMLElement {
  const row = el('label', 'cfg-row');
  const input = el('input');
  input.type = 'checkbox';
  input.checked = Boolean(cfg[key]);
  input.addEventListener('change', () => {
    (cfg as unknown as Record<string, unknown>)[key] = input.checked;
    rebuild();
    renderPanel();
  });
  row.append(input, el('span', '', label));
  if (hint) row.append(el('small', 'cfg-hint', hint));
  return row;
}

function multi<T extends string>(key: keyof Config, items: { id: T; label: string }[], disabled = false): HTMLElement {
  const box = el('div', `cfg-chips${disabled ? ' is-disabled' : ''}`);
  const selected = cfg[key] as unknown as T[];
  for (const it of items) {
    const chip = el('button', `cfg-chip${selected.includes(it.id) ? ' is-on' : ''}`, it.label);
    chip.type = 'button';
    chip.addEventListener('click', () => {
      const cur = new Set(cfg[key] as unknown as T[]);
      if (cur.has(it.id)) {
        if (cur.size === 1 && key !== 'initialIndicators') return; // keep at least one
        cur.delete(it.id);
      } else cur.add(it.id);
      (cfg as unknown as Record<string, unknown>)[key] = items.map((x) => x.id).filter((id) => cur.has(id));
      rebuild();
      renderPanel();
    });
    box.append(chip);
  }
  return box;
}

function color(label: string, key: 'bg' | 'up' | 'down' | 'wickUp' | 'wickDown' | 'borderUp' | 'borderDown'): HTMLElement {
  const row = el('label', 'cfg-row cfg-color');
  const input = el('input');
  input.type = 'color';
  input.value = cfg[key];
  input.addEventListener('input', () => {
    cfg[key] = input.value;
    // candle parts follow the body color until changed separately
    if (key === 'up' && cfg.wickUp === DEFAULT.wickUp) cfg.wickUp = input.value;
    if (key === 'down' && cfg.wickDown === DEFAULT.wickDown) cfg.wickDown = input.value;
    terminal?.applyTheme({ [key]: input.value }); // live preview without rebuilding
  });
  input.addEventListener('change', () => {
    rebuild();
    renderPanel();
  });
  row.append(input, el('span', '', label));
  return row;
}

function presetRow(): HTMLElement {
  const box = el('div', 'cfg-chips');
  for (const p of ['dark', 'light'] as const) {
    const chip = el('button', `cfg-chip${cfg.preset === p ? ' is-on' : ''}`, p === 'dark' ? 'Tema escuro' : 'Tema claro');
    chip.type = 'button';
    chip.addEventListener('click', () => {
      const t = p === 'light' ? lightTheme : darkTheme;
      cfg = { ...cfg, preset: p, bg: t.bg };
      rebuild();
      renderPanel();
    });
    box.append(chip);
  }
  return box;
}

function section(title: string, ...children: HTMLElement[]): HTMLElement {
  const s = el('section', 'cfg-section');
  s.append(el('h3', '', title), ...children);
  return s;
}

function renderPanel(): void {
  panel.innerHTML = '';
  const head = el('div', 'cfg-head');
  const reset = el('button', 'cfg-reset', 'Repor');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    cfg = { ...DEFAULT };
    rebuild();
    renderPanel();
  });
  head.append(el('h2', '', 'Configuração'), reset);
  panel.append(
    head,
    section(
      'Painéis',
      toggle('Barra de topo', 'topbar'),
      toggle('Ferramentas de desenho (esquerda)', 'leftToolbar'),
      toggle('Legenda (OHLC e valores)', 'legend'),
      toggle('Barra de baixo', 'bottomBar'),
      toggle('Botões 1D · 5D · 1M…', 'rangeButtons'),
      toggle('Watchlist + informação do símbolo', 'watchlist'),
    ),
    section(
      'Barra de topo',
      toggle('Pesquisa de símbolo', 'symbolSearch'),
      toggle('Desfazer / refazer', 'undoRedo'),
      toggle('Captura de ecrã', 'screenshot'),
      toggle('Ecrã inteiro', 'fullscreen'),
    ),
    section(
      'Timeframes',
      toggle('Mostrar seletor', 'timeframeSelector'),
      multi('timeframes', TIMEFRAMES.map((t) => ({ id: t.id, label: t.short })), !cfg.timeframeSelector),
    ),
    section(
      'Tipos de gráfico',
      toggle('Mostrar menu', 'chartTypesMenu'),
      multi('chartTypes', CHART_TYPES, !cfg.chartTypesMenu),
    ),
    section(
      'Indicadores',
      toggle('Botão "Indicadores"', 'indicatorPicker'),
      multi('builtinIndicators', INDICATORS.map((i) => ({ id: i.type, label: i.name })), !cfg.indicatorPicker),
      el('div', 'cfg-sub', 'Ativos ao abrir'),
      multi('initialIndicators', INDICATORS.map((i) => ({ id: i.type, label: i.name }))),
    ),
    section('Ferramentas de desenho', multi('toolGroups', TOOL_GROUPS.map((g) => ({ id: g.id, label: g.title })), !cfg.leftToolbar)),
    section(
      'Aparência',
      presetRow(),
      color('Fundo', 'bg'),
      color('Vela de alta', 'up'),
      color('Vela de baixa', 'down'),
      color('Pavio de alta', 'wickUp'),
      color('Pavio de baixa', 'wickDown'),
      toggle('Contorno nas velas', 'candleBorder'),
      ...(cfg.candleBorder ? [color('Contorno de alta', 'borderUp'), color('Contorno de baixa', 'borderDown')] : []),
      toggle('Grelha', 'grid'),
      toggle('Eixo de preço', 'priceAxis'),
      toggle('Eixo de tempo', 'timeAxis'),
      toggle('Crosshair', 'crosshair'),
      toggle('Compacto (para cards)', 'compact'),
      toggle('Só o gráfico (minimal)', 'minimal', 'desliga barras, watchlist e legenda'),
      toggle('Borda e cantos arredondados', 'rounded'),
    ),
  );
}

export function mount(root: HTMLElement): () => void {
  panel = el('aside', 'cfg');
  host = el('div', 'cfg-terminal');
  codeEl = el('pre', 'cfg-code__pre');
  const copy = el('button', 'cfg-copy', 'Copiar código');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codeEl.textContent ?? '');
      copy.textContent = 'Copiado!';
    } catch {
      copy.textContent = 'Seleciona e copia';
    }
    setTimeout(() => (copy.textContent = 'Copiar código'), 1500);
  });
  const code = el('div', 'cfg-code');
  code.append(el('div', 'cfg-code__head'), codeEl);
  code.firstElementChild!.append(el('span', '', 'Código desta configuração'), copy);
  const main = el('div', 'cfg-main');
  main.append(host, code);
  const layout = el('div', 'cfg-layout');
  layout.append(panel, main);
  root.append(layout);

  cfg = load();
  renderPanel();
  rebuild();
  return () => {
    terminal?.destroy();
    terminal = null;
  };
}
