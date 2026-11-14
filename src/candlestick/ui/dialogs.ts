import type { Chart } from '../core/chart';
import type { SymbolInfo } from '../core/types';
import type { Drawing, DrawingOptions, FibLevel, LineDash } from '../drawings/base';
import { type Indicator, type ParamDef, VISIBILITY_UNITS, createIndicator } from '../indicators/indicators';
import { colorPicker } from './color-picker';
import { closePopover, h, modal, showPopover } from './dom';
import { icon } from './icons';

export function symbolSearch(symbols: SymbolInfo[], onPick: (s: SymbolInfo) => void): void {
  const input = h('input', { class: 'tc-search-input', placeholder: 'Pesquisar símbolo', autofocus: true }) as HTMLInputElement;
  const list = h('div', { class: 'tc-list' });
  const types = ['Todos', ...new Set(symbols.map((s) => s.type).filter((t): t is string => !!t))];
  let type = 'Todos';
  const tabs = h('div', { class: 'tc-tabs' });
  const render = (): void => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    for (const s of symbols) {
      if (type !== 'Todos' && s.type !== type) continue;
      if (q && !s.symbol.toLowerCase().includes(q) && !(s.name ?? '').toLowerCase().includes(q)) continue;
      list.append(
        h(
          'button',
          { class: 'tc-list__row', onclick: () => { onPick(s); dlg.close(); } },
          h('span', { class: 'tc-sym-badge', 'data-type': s.type ?? '' }, s.symbol.slice(0, 1)),
          h('span', { class: 'tc-list__main' }, s.symbol),
          h('span', { class: 'tc-list__desc' }, s.name ?? ''),
          h('span', { class: 'tc-list__meta' }, [s.type, s.exchange].filter(Boolean).join(' · ')),
        ),
      );
    }
    tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b.textContent === labelOf(type)));
  };
  const labelOf = (t: string): string => ({ Todos: 'Todos', crypto: 'Cripto', forex: 'Forex', commodity: 'Commodities', index: 'Índices', stock: 'Ações' })[t] ?? t;
  for (const t of types) tabs.append(h('button', { class: 'tc-tab', onclick: () => { type = t; render(); } }, labelOf(t)));
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') (list.querySelector('.tc-list__row') as HTMLElement | null)?.click();
  });
  const body = h('div', { class: 'tc-symbol-search' }, h('div', { class: 'tc-search-box' }, h('span', { html: icon('search') }), input), tabs, list);
  const dlg = modal('Pesquisa de símbolo', body, { width: 680 });
  render();
  setTimeout(() => input.focus(), 0);
}

/** An entry of the indicators dialog. */
export interface IndicatorChoice {
  id: string;
  name: string;
  description: string;
}

/** The simulation's section of the indicators dialog: one checkbox per indicator to show or hide it. */
export interface SimulationChoices {
  title: string;
  items: () => (IndicatorChoice & { on: boolean })[];
  onToggle: (id: string, on: boolean) => void;
}

export function indicatorsDialog(choices: IndicatorChoice[], onPick: (c: IndicatorChoice) => void, sim?: SimulationChoices): void {
  const input = h('input', { class: 'tc-search-input', placeholder: 'Pesquisar' }) as HTMLInputElement;
  const list = h('div', { class: 'tc-list' });
  const render = (): void => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    const match = (c: IndicatorChoice): boolean => !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const simItems = sim ? sim.items().filter(match) : [];
    if (simItems.length) list.append(h('div', { class: 'tc-list-title' }, sim!.title));
    for (const c of simItems) {
      const box = h('input', { type: 'checkbox', class: 'tc-checkbox' }) as HTMLInputElement;
      box.checked = c.on;
      box.addEventListener('change', () => sim!.onToggle(c.id, box.checked));
      list.append(
        h(
          'label',
          { class: 'tc-list__row tc-list__row--check' },
          box,
          h('span', { class: 'tc-list__main' }, c.name),
          h('span', { class: 'tc-list__desc' }, c.description),
        ),
      );
    }
    const items = choices.filter(match);
    if (items.length) list.append(h('div', { class: 'tc-list-title' }, 'Indicadores técnicos'));
    for (const c of items) {
      list.append(
        h(
          'button',
          { class: 'tc-list__row', onclick: () => onPick(c) },
          h('span', { class: 'tc-list__icon', html: icon('indicators') }),
          h('span', { class: 'tc-list__main' }, c.name),
          h('span', { class: 'tc-list__desc' }, c.description),
        ),
      );
    }
    if (!list.childElementCount) list.append(h('div', { class: 'tc-list-title' }, 'Sem resultados'));
  };
  input.addEventListener('input', render);
  const body = h('div', { class: 'tc-symbol-search' }, h('div', { class: 'tc-search-box' }, h('span', { html: icon('search') }), input), list);
  modal('Indicadores, métricas e estratégias', body, { width: 620 });
  render();
  setTimeout(() => input.focus(), 0);
}

function colorButton(color: string, onChange: (c: string) => void): HTMLElement {
  const btn = h('button', { class: 'tc-color-btn' }, h('span', { class: 'tc-color-btn__swatch', style: `background:${color}` }));
  btn.addEventListener('click', () => {
    showPopover(
      colorPicker(color, (c) => {
        color = c;
        (btn.firstChild as HTMLElement).style.background = c;
        onChange(c);
      }),
      btn,
    );
  });
  return btn;
}

function row(label: string, control: HTMLElement): HTMLElement {
  return h('div', { class: 'tc-form-row' }, h('label', { class: 'tc-form-row__label' }, label), h('div', { class: 'tc-form-row__control' }, control));
}

function checkbox(checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const input = h('input', { type: 'checkbox', class: 'tc-checkbox' }) as HTMLInputElement;
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return input;
}

function numberInput(value: number, onChange: (v: number) => void, min?: number, max?: number, step?: number): HTMLElement {
  const input = h('input', { type: 'number', class: 'tc-input tc-input--num', value, min, max, step: step ?? 1 }) as HTMLInputElement;
  input.addEventListener('change', () => {
    let v = Number(input.value);
    if (!isFinite(v)) return;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    input.value = String(v);
    onChange(v);
  });
  return input;
}

function select(value: string, options: { value: string; label: string }[], onChange: (v: string) => void): HTMLElement {
  const s = h('select', { class: 'tc-input tc-select' }) as HTMLSelectElement;
  for (const o of options) s.append(h('option', { value: o.value, selected: o.value === value }, o.label));
  s.addEventListener('change', () => onChange(s.value));
  return s;
}

/** A text field: the value is used when `check` finds nothing wrong (else the field turns red, with the reason). */
function textInput(value: string, onChange: (v: string) => void, check?: (v: string) => string | null): HTMLElement {
  const input = h('input', { type: 'text', class: 'tc-input tc-input--text', value }) as HTMLInputElement;
  input.addEventListener('change', () => {
    const bad = check?.(input.value) ?? null;
    input.classList.toggle('is-invalid', !!bad);
    input.title = bad ?? '';
    if (!bad) onChange(input.value.trim());
  });
  return input;
}

/** 'HHMM-HHMM' as two time fields (09:30 – 16:00); several ranges ('0900-1130,1230-1530') as text. */
function sessionInput(value: string, onChange: (v: string) => void, check?: (v: string) => string | null): HTMLElement {
  const m = /^(\d{2}):?(\d{2})-(\d{2}):?(\d{2})$/.exec(value.trim());
  if (!m) return textInput(value, onChange, check);
  const time = (hh: string, mm: string): HTMLInputElement => h('input', { type: 'time', class: 'tc-input tc-input--time', value: `${hh === '24' ? '00' : hh}:${mm}` }) as HTMLInputElement;
  const a = time(m[1], m[2]);
  const b = time(m[3], m[4]);
  const emit = (): void => {
    if (!a.value || !b.value) return;
    onChange(`${a.value.replace(':', '')}-${b.value.replace(':', '')}`);
  };
  a.addEventListener('change', emit);
  b.addEventListener('change', emit);
  return h('div', { class: 'tc-form-row__pair' }, a, h('span', { class: 'tc-form-row__dash' }, '–'), b);
}

const TABS = [
  { id: 'values', label: 'Valores' },
  { id: 'style', label: 'Estilo' },
  { id: 'visibility', label: 'Visibilidade' },
] as const;
type Tab = (typeof TABS)[number]['id'];

/** The tab of a field: its `tab`, else 'style' for the "Estilo" section, else 'values'. */
function tabOf(p: ParamDef): Tab {
  return p.tab ?? (p.section === 'Estilo' ? 'style' : 'values');
}

/**
 * The settings of an indicator, in TradingView's tabs: Valores (inputs), Estilo (colours and lines) and
 * Visibilidade (on which timeframes it shows). "Padrões" puts the defaults back; "Cancelar" undoes all.
 */
export function indicatorSettings(chart: Chart, ind: Indicator, onChange: () => void): void {
  const before = JSON.stringify(ind.params);
  const visBefore = ind.visibility ? JSON.stringify(ind.visibility) : null;
  const tabs = h('div', { class: 'tc-dlg-tabs' });
  const body = h('div', { class: 'tc-form' });
  const used = TABS.filter((t) => t.id === 'visibility' || ind.schema.some((p) => tabOf(p) === t.id));
  let tab: Tab = used[0].id;
  const changed = (): void => {
    chart.updateIndicator(ind);
    onChange();
  };
  // rebuilt after a change so fields that depend on others (`enabled`) follow
  const fill = (): void => {
    tabs.replaceChildren(...used.map((t) => h('button', { class: `tc-dlg-tab${t.id === tab ? ' is-active' : ''}`, onclick: () => { tab = t.id; fill(); } }, t.label)));
    body.replaceChildren();
    if (tab === 'visibility') {
      fillVisibility();
      return;
    }
    let section: string | undefined;
    for (const p of ind.schema) {
      if (tabOf(p) !== tab) continue;
      const val = ind.params[p.key];
      const set = (v: number | string | boolean): void => {
        ind.params[p.key] = v;
        changed();
        if ((p.type === 'select' || p.type === 'bool') && ind.schema.some((f) => f.enabled)) fill();
      };
      const setKey = (key: string, v: number | string | boolean): void => {
        ind.params[key] = v;
        changed();
      };
      let control: HTMLElement | null;
      if (p.type === 'color' && p.numberKey) {
        // colour and level in one row (a band of the RSI)
        const key = p.numberKey;
        control = h('div', { class: 'tc-form-row__pair' }, colorButton(String(val), set), numberInput(Number(ind.params[key]), (n) => setKey(key, n), p.min, p.max, p.step));
      }
      else if (p.type === 'color' && p.dashKey) {
        // colour and line style in one row (the POC of the volume profile)
        const key = p.dashKey;
        control = h('div', { class: 'tc-form-row__pair' }, colorButton(String(val), set), select(String(ind.params[key]), DASHES, (d) => setKey(key, d)));
      }
      else if (p.type === 'color') control = colorButton(String(val), set);
      else if (p.type === 'bool') control = null; // the checkbox goes before the label
      else if (p.type === 'text') control = textInput(String(val), set, p.check);
      else if (p.type === 'session') control = sessionInput(String(val), set, p.check);
      else if (p.type === 'select') {
        // a value outside the list (e.g. timeframe '45') is still shown
        const opts = p.options ?? [];
        const all = opts.includes(String(val)) ? opts : [...opts, String(val)];
        control = select(String(val), all.map((o) => ({ value: o, label: p.optionLabels?.[o] ?? o })), set);
      }
      else control = numberInput(Number(val), set, p.min, p.max, p.step);
      // the "Estilo" heading is the tab itself
      const heading = p.section === 'Estilo' ? undefined : p.section;
      if (heading && heading !== section) body.append(h('div', { class: 'tc-form-section' }, heading));
      section = heading;
      let r: HTMLElement;
      if (!control) {
        r = h('div', { class: 'tc-form-row' }, h('label', { class: 'tc-form-row__label tc-form-row__label--check' }, checkbox(Boolean(val), set), p.label));
      } else if (p.toggle) {
        // show / hide this line: a checkbox before the label, as in TradingView's style tab
        const key = p.toggle;
        const box = checkbox(Boolean(ind.params[key]), (on) => setKey(key, on));
        r = h('div', { class: 'tc-form-row' }, h('label', { class: 'tc-form-row__label tc-form-row__label--check' }, box, p.label), h('div', { class: 'tc-form-row__control' }, control));
      } else r = row(p.label, control);
      if (p.indent) r.classList.add('tc-form-row--indent');
      if (p.enabled && !p.enabled(ind.params)) {
        r.classList.add('tc-form-row--disabled');
        r.querySelectorAll('input, select, button').forEach((el) => ((el as HTMLInputElement).disabled = true));
      }
      body.append(r);
    }
  };
  // one row per unit: on / off and the range of counts (1–59 minutes…)
  const fillVisibility = (): void => {
    for (const u of VISIBILITY_UNITS) {
      const cur = ind.visibility?.[u.key] ?? { on: true, min: 1, max: u.max };
      const put = (patch: Partial<typeof cur>): void => {
        const next = { ...cur, ...patch };
        Object.assign(cur, next);
        const vis = { ...(ind.visibility ?? {}), [u.key]: next };
        // all back to "every timeframe": nothing to keep
        const all = VISIBILITY_UNITS.every((x) => { const r = vis[x.key]; return !r || (r.on && r.min <= 1 && r.max >= x.max); });
        ind.visibility = all ? null : vis;
        changed();
      };
      const min = numberInput(cur.min, (n) => put({ min: n }), 1, u.max);
      const max = numberInput(cur.max, (n) => put({ max: n }), 1, u.max);
      const r = h(
        'div',
        { class: 'tc-form-row' },
        h('label', { class: 'tc-form-row__label tc-form-row__label--check' }, checkbox(cur.on, (on) => put({ on })), u.label),
        h('div', { class: 'tc-form-row__pair' }, min, h('span', { class: 'tc-form-row__dash' }, '–'), max),
      );
      body.append(r);
    }
    body.append(h('div', { class: 'tc-form-note' }, 'O indicador só aparece nos tempos gráficos marcados (ex.: Minutos 1–15 = de 1 a 15 minutos).'));
  };
  const defaults = (anchor: HTMLElement): void => {
    showPopover(
      h(
        'div',
        { class: 'tc-menu' },
        h('button', {
          class: 'tc-menu__item',
          onclick: () => {
            closePopover();
            const fresh = createIndicator(ind.type);
            if (!fresh) return;
            ind.params = { ...fresh.params };
            ind.visibility = null;
            changed();
            fill();
          },
        }, h('span', { class: 'tc-menu__label' }, 'Repor padrões')),
      ),
      anchor,
      { side: 'top' },
    );
  };
  const defaultsBtn = h('button', { class: 'tc-btn tc-btn--menu' }, 'Padrões ▾');
  defaultsBtn.addEventListener('click', () => defaults(defaultsBtn));
  fill();
  const dlg = modal(ind.name, h('div', { class: 'tc-dlg' }, tabs, body), {
    width: 420,
    footer: h(
      'div',
      { class: 'tc-modal__actions tc-modal__actions--split' },
      defaultsBtn,
      h('span', { class: 'tc-modal__spacer' }),
      h('button', {
        class: 'tc-btn',
        onclick: () => {
          ind.params = JSON.parse(before);
          ind.visibility = visBefore ? JSON.parse(visBefore) : null;
          changed();
          dlg.close();
        },
      }, 'Cancelar'),
      h('button', { class: 'tc-btn tc-btn--primary', onclick: () => dlg.close() }, 'Ok'),
    ),
  });
}

const DASHES: { value: LineDash; label: string }[] = [
  { value: 'solid', label: '——— Sólida' },
  { value: 'dashed', label: '- - - Tracejada' },
  { value: 'dotted', label: '······ Pontilhada' },
];

export function drawingSettings(chart: Chart, d: Drawing): void {
  const dm = chart.drawings;
  const body = h('div', { class: 'tc-form' });
  const set = (patch: Partial<DrawingOptions>): void => {
    dm.updateOptions(d, patch);
  };
  for (const f of d.settings()) {
    const val = d.opts[f.key];
    let control: HTMLElement;
    switch (f.type) {
      case 'color':
      case 'fill':
        control = colorButton(String(val), (c) => set({ [f.key]: c }));
        break;
      case 'width':
        control = select(String(val), [1, 2, 3, 4].map((w) => ({ value: String(w), label: `${w}px` })), (v) => set({ [f.key]: Number(v) }));
        break;
      case 'dash':
        control = select(String(val), DASHES, (v) => set({ [f.key]: v as LineDash }));
        break;
      case 'bool':
        control = checkbox(Boolean(val), (v) => set({ [f.key]: v }));
        break;
      case 'text': {
        const ta = h('textarea', { class: 'tc-input tc-textarea', rows: 3 }) as HTMLTextAreaElement;
        ta.value = String(val ?? '');
        ta.addEventListener('input', () => {
          d.opts.text = ta.value;
          chart.requestRender();
        });
        ta.addEventListener('change', () => set({ text: ta.value }));
        control = ta;
        break;
      }
      case 'number':
        control = numberInput(Number(val), (v) => set({ [f.key]: v }), f.min, f.max, f.step);
        break;
      case 'levels':
        control = levelsEditor(d.opts.levels, (levels) => set({ levels }));
        break;
      default:
        continue;
    }
    body.append(f.type === 'levels' ? h('div', { class: 'tc-form-block' }, h('div', { class: 'tc-form-row__label' }, f.label), control) : row(f.label, control));
  }
  const dlg = modal(d.title, body, {
    width: f_width(d),
    footer: h('div', { class: 'tc-modal__actions' }, h('button', { class: 'tc-btn tc-btn--primary', onclick: () => dlg.close() }, 'Ok')),
  });
}

function f_width(d: Drawing): number {
  return d.settings().some((f) => f.type === 'levels') ? 520 : 400;
}

function levelsEditor(levels: FibLevel[], onChange: (l: FibLevel[]) => void): HTMLElement {
  const grid = h('div', { class: 'tc-levels' });
  const cur = levels.map((l) => ({ ...l }));
  cur.forEach((l, i) => {
    const emit = (): void => onChange(cur.map((x) => ({ ...x })));
    grid.append(
      h(
        'div',
        { class: 'tc-levels__item' },
        checkbox(l.enabled, (v) => { cur[i].enabled = v; emit(); }),
        numberInput(l.value, (v) => { cur[i].value = v; emit(); }, -10, 100, 0.001),
        colorButton(l.color, (c) => { cur[i].color = c; emit(); }),
      ),
    );
  });
  return grid;
}

/** Inline text editor overlay for text drawings. */
export function editText(chart: Chart, d: Drawing): void {
  closePopover();
  const v = chart.mainView();
  const p = v.toXY(d.points[0]);
  const rect = chart.canvas.getBoundingClientRect();
  const ta = h('textarea', { class: 'tc-inline-editor', rows: 2 }) as HTMLTextAreaElement;
  ta.value = d.opts.text;
  ta.style.left = `${rect.left + p.x}px`;
  ta.style.top = `${rect.top + chart.mainPane.rect.y + p.y - 8}px`;
  ta.style.fontSize = `${d.opts.fontSize}px`;
  ta.style.color = d.opts.textColor;
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const before = d.opts.text;
  const done = (): void => {
    ta.remove();
    if (ta.value !== before) {
      d.opts.text = before;
      chart.drawings.updateOptions(d, { text: ta.value || 'Texto' }, false);
    }
  };
  ta.addEventListener('input', () => {
    d.opts.text = ta.value;
    chart.requestRender();
  });
  ta.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ta.blur();
    }
    if (e.key === 'Escape') ta.blur();
  });
  ta.addEventListener('blur', done, { once: true });
}

export { colorButton };
