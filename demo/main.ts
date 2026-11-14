import { createTerminal, type Terminal } from 'openchartscandle/candlestick';
import { createBarChart } from 'openchartscandle/bar';
import { createGauge, trafficZones } from 'openchartscandle/gauge';
import { createLineChart } from 'openchartscandle/line';
import { createPieChart } from 'openchartscandle/pie';
import { createScatterChart } from 'openchartscandle/scatter';
import { createCalendarChart } from 'openchartscandle/calendar';
import { createRadarChart } from 'openchartscandle/radar';
import { createTreeChart } from 'openchartscandle/tree';
import { marketsTree } from './tree/data';
import { dailyValues } from './calendar/data';
import { countries } from './scatter/data';
import { walk } from './line/data';
import { portfolio } from './pie/data';
import 'openchartscandle/style.css';
import pkg from '../package.json';
import readme from '../README.pt-PT.md?raw';
import { datafeed } from './candlestick/data';
import { highlight } from './site/highlight';
import { renderMarkdown } from './site/markdown';
import { FAMILIES, GENERAL_DOCS, docSource, exampleSource, family, gallerySource, loadExample, loadGallery, type Family } from './site/registry';
import './site/site.css';

// ---------------------------------------------------------------- helpers

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector(sel) as T;

function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ''), '');
}

function codeBlock(code: string, lang = 'ts', file?: string): string {
  return html`<div class="codebox">
    <div class="codebox__bar"><span>${file ?? lang}</span><button class="codebox__copy" type="button">Copiar</button></div>
    <pre class="code"><code>${highlight(code.trim(), lang)}</code></pre>
  </div>`;
}

function wireCopyButtons(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('.codebox__copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.closest('.codebox')!.querySelector('code')!.textContent ?? '';
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = 'Copiado!';
      } catch {
        btn.textContent = 'Seleciona e copia';
      }
      setTimeout(() => (btn.textContent = 'Copiar'), 1400);
    });
  });
}

/** Small live candlestick chart (hero of the intro and of the family page). */
function heroChart(el: HTMLElement): () => void {
  const t: Terminal = createTerminal(el, {
    datafeed,
    symbol: 'SIMBTC',
    timeframe: '5',
    minimal: true,
    legend: true,
    compact: true,
    mouseWheel: false,
    storageKey: null,
    indicators: [
      { type: 'sma', params: { length: 9, color: '#ff9800' } },
      { type: 'sma', params: { length: 21, color: '#2962ff' } },
    ],
  });
  void t.ready.then(() => t.chart.showLastBars(110));
  return () => t.destroy();
}

/** Live preview shown on each family overview page. */
const PREVIEWS: Record<string, (el: HTMLElement) => () => void> = {
  candlestick: heroChart,
  calendar: (el) => {
    const c = createCalendarChart(el, {
      range: 2026,
      data: dailyValues(2026, 7, 1000),
      visualMap: { min: 0, max: 1000, colors: ['#0e2a47', '#2962ff', '#7fb2ff'] },
      cell: { gap: 2, radius: 2, borderWidth: 0 },
    });
    return () => c.destroy();
  },
  radar: (el) => {
    const c = createRadarChart(el, {
      indicators: ['Retorno', 'Estabilidade', 'Liquidez', 'Diversificação', 'Custos baixos', 'ESG'].map((name) => ({ name, max: 10 })),
      series: [
        { name: 'Fundo Ações', data: [8.6, 4.2, 9.1, 7.4, 6.8, 5.5], area: true },
        { name: 'Fundo Obrigações', data: [5.1, 8.8, 7.2, 6.1, 8.4, 7.0], area: true },
      ],
      splitArea: true,
    });
    return () => c.destroy();
  },
  tree: (el) => {
    const c = createTreeChart(el, { data: marketsTree(), initialDepth: 2, label: { fontSize: 11 } });
    return () => c.destroy();
  },
  bar: (el) => {
    const c = createBarChart(el, {
      categories: ['T1', 'T2', 'T3', 'T4'],
      series: [
        { name: '2024', data: [118, 131, 139, 162], color: '#5d606b' },
        { name: '2025', data: [131, 149, 158, 181] },
      ],
      radius: 4,
      legend: { position: 'top', align: 'end' },
      valueFormatter: (v) => `${v} M€`,
    });
    return () => c.destroy();
  },
  gauge: (el) => {
    const g = createGauge(el, { value: 0, max: 240, unit: 'km/h', zones: trafficZones(0, 240, [0.55, 0.8]), ticks: { major: 13, minor: 3 } });
    const t = window.setInterval(() => g.setValue(60 + Math.random() * 150), 1800);
    g.setValue(140);
    return () => {
      clearInterval(t);
      g.destroy();
    };
  },
  line: (el) => {
    const c = createLineChart(el, {
      series: [
        { name: 'Estratégia', data: walk(81, 120, 100, 0.02, 0.0025), area: { opacity: 0.22 } },
        { name: 'Benchmark', data: walk(82, 120, 100, 0.014, 0.001), dash: [5, 4], width: 1.5 },
      ],
      curve: 'smooth',
      legend: { position: 'top', align: 'end' },
      valueFormatter: (v) => v.toFixed(2),
    });
    return () => c.destroy();
  },
  scatter: (el) => {
    const c = createScatterChart(el, {
      series: [{ name: 'Países', data: countries(2015).map((p) => ({ x: p.gdp, y: p.life, values: [p.pop], name: p.name })), gradient: true }],
      dimensions: ['PIB por pessoa ($)', 'Esperança de vida', 'População (milhões)'],
      xAxis: { type: 'log' },
      yAxis: { min: 50 },
      visualMap: [
        { dimension: 2, sizes: [8, 44], show: false },
        { dimension: 1, colors: ['#f23645', '#ff9800', '#089981'], show: false },
      ],
    });
    return () => c.destroy();
  },
  pie: (el) => {
    const c = createPieChart(el, {
      data: portfolio,
      innerRadius: 0.6,
      padAngle: 1.2,
      cornerRadius: 4,
      sort: 'desc',
      legend: { position: 'right', values: false },
      valueFormatter: (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
      center: { title: 'Carteira' },
    });
    return () => c.destroy();
  },
};

// ---------------------------------------------------------------- layout

document.getElementById('app')!.innerHTML = html`
  <aside class="side" id="side">
    <a class="side__brand" href="#/">
      <svg viewBox="0 0 36 28" width="30" height="24"><path d="M3 21l8-9 6 5 9-11" stroke="#2962ff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="29" cy="6" r="3.2" fill="#2962ff"/></svg>
      <span>OpenChartsCandle</span><small>v${pkg.version}</small>
    </a>
    <input class="side__search" id="search" placeholder="Procurar exemplos e docs…" />
    <nav class="side__nav" id="nav"></nav>
    <div class="side__foot">TypeScript · Canvas · sem dependências</div>
  </aside>
  <div class="page">
    <header class="topnav">
      <button class="topnav__menu" id="menu" type="button" aria-label="Menu">☰</button>
      <div class="topnav__crumbs" id="crumbs"></div>
      <a class="topnav__link" href="https://github.com/TTiagoSousa/OpenChartsCandle" target="_blank" rel="noopener">Repositório ↗</a>
    </header>
    <main class="content" id="content"></main>
  </div>
`;

interface NavLink {
  href: string;
  title: string;
}

function link(l: NavLink): string {
  return `<a class="side__link" href="${l.href}" data-href="${l.href}">${l.title}</a>`;
}

// ---- sidebar accordion state (families + sub-groups), remembered between visits
const NAV_KEY = 'tc-site.nav';
const navState: { family: string | null; groups: string[] } = (() => {
  try {
    return { family: null, groups: [], ...JSON.parse(localStorage.getItem(NAV_KEY) ?? '{}') };
  } catch {
    return { family: null, groups: [] };
  }
})();
const openGroups = new Set<string>(navState.groups);
let openFamily: string | null = navState.family;
let navFilter = '';

function saveNav(): void {
  try {
    localStorage.setItem(NAV_KEY, JSON.stringify({ family: openFamily, groups: [...openGroups] }));
  } catch {
    /* private mode */
  }
}

/** Open the family and the group of the current page (does not close what the user opened). */
function revealCurrent(): void {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const f = parts[0] ? family(parts[0]) : undefined;
  if (!f || f.soon) return;
  openFamily = f.id;
  if (parts[1] === 'docs') openGroups.add(`${f.id}:docs`);
  else if (parts[1]) {
    const g = f.groups.find((x) => x.items.includes(parts[1]));
    if (g) openGroups.add(`${f.id}:${g.title}`);
  }
  saveNav();
}

const CHEVRON = '<svg class="side__chev" viewBox="0 0 16 16" width="14" height="14"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function renderNav(): void {
  const q = navFilter.trim().toLowerCase();
  const searching = q.length > 0;
  const match = (...texts: string[]): boolean => !q || texts.some((t) => t.toLowerCase().includes(q));
  const parts: string[] = [];

  const general: NavLink[] = [
    { href: '#/', title: 'Introdução' },
    { href: '#/instalacao', title: 'Instalação e uso' },
    { href: '#/galeria', title: 'Galeria de exemplos' },
    ...GENERAL_DOCS.map((d) => ({ href: `#/docs/${d.id}`, title: d.title })),
  ].filter((l) => match(l.title, 'geral'));
  if (general.length) parts.push(`<div class="side__group"><div class="side__title">Geral</div>${general.map(link).join('')}</div>`);

  for (const f of FAMILIES) {
    const count = f.examples.length;
    const tag = `<span class="side__family-tag">${f.soon ? f.tag : `${count} exemplos`}</span>`;
    if (f.soon) {
      if (match(f.title, f.tag)) parts.push(html`<div class="side__fam is-soon"><a class="side__family is-soon" href="#/${f.id}" data-href="#/${f.id}"><span class="side__family-name">${f.title}</span>${tag}</a></div>`);
      continue;
    }
    // sub-groups: examples by group + docs
    const groups: { key: string; title: string; links: string[] }[] = f.groups.map((g) => ({
      key: `${f.id}:${g.title}`,
      title: g.title,
      links: g.items
        .map((id) => f.examples.find((e) => e.id === id)!)
        .filter((e) => match(e.title, g.title, f.title))
        .map((e) => link({ href: `#/${f.id}/${e.id}`, title: e.title })),
    }));
    groups.push({
      key: `${f.id}:docs`,
      title: 'Documentação',
      links: f.docs.filter((d) => match(d.title, 'documentação', f.title)).map((d) => link({ href: `#/${f.id}/docs/${d.id}`, title: d.title })),
    });
    const visibleGroups = groups.filter((g) => g.links.length);
    const overview =
      (match('Visão geral', f.title) ? link({ href: `#/${f.id}`, title: 'Visão geral' }) : '') +
      (f.gallery && match('Galeria', f.title) ? link({ href: `#/galeria/${f.id}`, title: 'Galeria' }) : '');
    if (!visibleGroups.length && !overview && !match(f.title, f.tag)) continue;

    const famOpen = searching || openFamily === f.id;
    const body = visibleGroups
      .map((g) => {
        const gOpen = searching || openGroups.has(g.key);
        return html`<div class="side__sub${gOpen ? ' is-open' : ''}">
          <button class="side__sub-head" type="button" data-group="${g.key}" aria-expanded="${gOpen}">${CHEVRON}<span>${g.title}</span><small>${g.links.length}</small></button>
          <div class="side__sub-body">${g.links.join('')}</div>
        </div>`;
      })
      .join('');
    parts.push(html`<div class="side__fam${famOpen ? ' is-open' : ''}">
      <button class="side__family" type="button" data-family="${f.id}" aria-expanded="${famOpen}">
        ${CHEVRON}<span class="side__family-name">${f.title}</span>${tag}
      </button>
      <div class="side__fam-body">${overview}${body}</div>
    </div>`);
  }
  const nav = $('#nav');
  const scroll = nav.scrollTop;
  nav.innerHTML = parts.join('');
  nav.scrollTop = scroll;
  markActive();
}

// accordion clicks (event delegation, the nav is re-rendered often)
$('#nav').addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const fam = t.closest<HTMLElement>('[data-family]');
  if (fam) {
    const id = fam.dataset.family!;
    openFamily = openFamily === id ? null : id; // one family open at a time
    saveNav();
    renderNav();
    return;
  }
  const grp = t.closest<HTMLElement>('[data-group]');
  if (grp) {
    const key = grp.dataset.group!;
    if (openGroups.has(key)) openGroups.delete(key);
    else openGroups.add(key);
    saveNav();
    renderNav();
  }
});

function markActive(): void {
  const current = location.hash || '#/';
  document.querySelectorAll<HTMLAnchorElement>('.side__link').forEach((a) => a.classList.toggle('is-active', a.dataset.href === current));
  const seg = current.replace(/^#\/?/, '').split('/');
  const famId = seg[0] === 'galeria' ? seg[1] : seg[0];
  // a gallery chart page keeps its family gallery link highlighted
  if (seg[0] === 'galeria' && seg[2]) document.querySelector(`.side__link[data-href="#/galeria/${seg[1]}"]`)?.classList.add('is-active');
  document.querySelectorAll<HTMLElement>('[data-family]').forEach((b) => b.classList.toggle('is-current', b.dataset.family === famId));
  document.querySelector('.side__link.is-active')?.scrollIntoView({ block: 'nearest' });
}

$('#search').addEventListener('input', (e) => {
  navFilter = (e.target as HTMLInputElement).value;
  renderNav();
});
$('#menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));

// ---------------------------------------------------------------- pages

let cleanup: (() => void) | null = null;

function setCrumbs(...parts: string[]): void {
  $('#crumbs').innerHTML = parts.map((p, i) => (i === parts.length - 1 ? `<strong>${p}</strong>` : `<span>${p}</span>`)).join('<i>/</i>');
}

/** General intro: the library as a collection of chart families. */
function introPage(content: HTMLElement): void {
  setCrumbs('OpenChartsCandle', 'Introdução');
  content.innerHTML = html`
    <section class="hero">
      <div class="hero__text">
        <span class="pill">v${pkg.version} · TypeScript · Canvas · sem dependências</span>
        <h1>Uma coleção de<br /><span class="grad">gráficos financeiros</span></h1>
        <p>Cada tipo de gráfico é uma <strong>família</strong> com o seu motor, API, docs e exemplos. Usa só a que precisas: <code>openchartscandle/candlestick</code>, <code>openchartscandle/heatmap</code>, <code>openchartscandle/tree</code> e outras.</p>
        <div class="hero__cta">
          <a class="btn btn--primary" href="#/candlestick/terminal">Ver o gráfico TradingView</a>
          <a class="btn" href="#/galeria">Galeria de exemplos</a>
          <a class="btn" href="#/instalacao">Instalar</a>
        </div>
      </div>
      <div class="hero__chart"><div id="hero-chart"></div></div>
    </section>
    <section class="block">
      <h2>Famílias de gráficos</h2>
      <div class="families">${FAMILIES.map(
        (f) => html`<a class="family-card${f.soon ? ' is-soon' : ''}" href="#/${f.id}">
          <div class="family-card__head"><h3>${f.title}</h3><span class="family-card__tag">${f.tag}</span></div>
          <p>${f.description}</p>
          <div class="family-card__foot"><code>import … from '${f.importPath}'</code>${
            f.soon ? '' : `<span>${f.examples.length} exemplos · ${f.docs.length} docs →</span>`
          }</div>
        </a>`,
      ).join('')}</div>
    </section>
    <section class="block">
      <h2>Começar em 3 passos</h2>
      <div class="steps">
        <div class="step"><span>1</span><div><h3>Instalar</h3>${codeBlock('npm install github:TTiagoSousa/OpenChartsCandle#v' + pkg.version, 'bash', 'terminal')}</div></div>
        <div class="step"><span>2</span><div><h3>Ligar os teus dados</h3>${codeBlock(
          `const datafeed: Datafeed = {
  getSymbols: () => [{ symbol: 'BTCUSDT', precision: 2 }],
  getBars: (symbol, tf) => fetch(\`/api/candles?symbol=\${symbol}&tf=\${tf.id}\`).then((r) => r.json()),
  subscribeBars: (symbol, tf, onBar) => { /* WebSocket → onBar(vela) */ return () => {}; },
};`,
          'ts',
          'datafeed.ts',
        )}</div></div>
        <div class="step"><span>3</span><div><h3>Criar o gráfico</h3>${codeBlock(
          `import { createTerminal } from 'openchartscandle/candlestick';
import 'openchartscandle/style.css';

createTerminal(document.getElementById('grafico')!, { datafeed, symbol: 'BTCUSDT' });`,
          'ts',
          'main.ts',
        )}</div></div>
      </div>
    </section>
  `;
  wireCopyButtons(content);
  cleanup = heroChart(document.getElementById('hero-chart')!);
}


/** Overview page of a family. */
function familyPage(content: HTMLElement, f: Family): void {
  setCrumbs(`${f.title} · ${f.tag}`, 'Visão geral');
  if (f.soon) {
    content.innerHTML = html`<div class="soon">
      <span class="pill">${f.tag}</span>
      <h1>${f.title}</h1>
      <p>${f.description}</p>
      <p>Quando estiver pronta, esta família vai ter a sua própria entrada (<code>${f.importPath}</code>), docs e exemplos, aqui no menu.</p>
      <a class="btn" href="#/docs/estrutura">Como as famílias estão organizadas →</a>
    </div>`;
    return;
  }
  content.innerHTML = html`
    <section class="hero">
      <div class="hero__text">
        <span class="pill">${f.title} · ${f.tag}</span>
        <h1>${f.headline ?? f.title}</h1>
        <p>${f.description}</p>
        ${codeBlock(`import { ${f.mainExports ?? '…'} } from '${f.importPath}';
import 'openchartscandle/style.css';`, 'ts', 'import')}
        <div class="hero__cta">
          <a class="btn btn--primary" href="#/${f.id}/${f.examples[0].id}">${f.examples[0].title}</a>
          ${f.gallery ? `<a class="btn" href="#/galeria/${f.id}">Galeria de exemplos</a>` : ''}
          <a class="btn" href="#/${f.id}/docs/${f.docs[0].id}">${f.docs[0].title}</a>
        </div>
      </div>
      <div class="hero__chart"><div id="hero-chart"></div></div>
    </section>
    <section class="features">${(f.features ?? []).map(
      ([icon, title, text]) => `<div class="feature"><div class="feature__icon">${icon}</div><h3>${title}</h3><p>${text}</p></div>`,
    ).join('')}</section>
    ${f.groups
      .map(
        (g) => html`<section class="block">
          <h2>${g.title}</h2>
          <div class="ex-cards">${g.items
            .map((id) => f.examples.find((e) => e.id === id)!)
            .map(
              (e) => `<a class="ex-card-link" href="#/${f.id}/${e.id}"><h3>${e.title}</h3><p>${e.description}</p><div class="tags">${e.api
                .slice(0, 3)
                .map((a) => `<code>${a}</code>`)
                .join('')}</div></a>`,
            )
            .join('')}</div>
        </section>`,
      )
      .join('')}
    <section class="block">
      <h2>Documentação</h2>
      <div class="ex-cards">${f.docs.map((d) => `<a class="ex-card-link" href="#/${f.id}/docs/${d.id}"><h3>${d.title}</h3></a>`).join('')}</div>
    </section>
  `;
  wireCopyButtons(content);
  const preview = PREVIEWS[f.id] ?? f.preview;
  if (preview) cleanup = preview(document.getElementById('hero-chart')!);
}

function wireDocCode(content: HTMLElement): void {
  content.querySelectorAll('pre.code').forEach((pre) => {
    const box = document.createElement('div');
    box.className = 'codebox';
    box.innerHTML = '<div class="codebox__bar"><span></span><button class="codebox__copy" type="button">Copiar</button></div>';
    pre.replaceWith(box);
    box.append(pre);
  });
  wireCopyButtons(content);
}

function installPage(content: HTMLElement): void {
  setCrumbs('Geral', 'Instalação e uso');
  const { html: body } = renderMarkdown(readme);
  content.innerHTML = `<article class="doc">${body}</article>`;
  wireDocCode(content);
}

function docPage(content: HTMLElement, fam: Family | null, id: string): void {
  const title = fam ? fam.docs.find((d) => d.id === id)?.title : GENERAL_DOCS.find((d) => d.id === id)?.title;
  const md = docSource(fam?.id ?? null, id);
  if (!md) return notFound(content);
  setCrumbs(fam ? `${fam.title} · ${fam.tag}` : 'Geral', fam ? 'Documentação' : 'Docs', title ?? id);
  const { html: body, headings } = renderMarkdown(md, fam?.id ?? null);
  const toc = headings.filter((h) => h.level === 2 || h.level === 3);
  content.innerHTML = html`<div class="doc-layout">
    <article class="doc">${body}</article>
    ${toc.length > 2 ? `<nav class="toc"><div class="toc__title">Nesta página</div>${toc.map((h) => `<a class="toc__l${h.level}" data-id="${h.id}">${h.text}</a>`).join('')}</nav>` : ''}
  </div>`;
  content.querySelectorAll<HTMLAnchorElement>('.toc a').forEach((a) =>
    a.addEventListener('click', () => document.getElementById(a.dataset.id!)?.scrollIntoView({ behavior: 'smooth', block: 'start' })),
  );
  wireDocCode(content);
}

async function examplePage(content: HTMLElement, f: Family, id: string): Promise<void> {
  const meta = f.examples.find((e) => e.id === id);
  if (!meta) return notFound(content);
  const group = f.groups.find((g) => g.items.includes(id))?.title ?? 'Exemplos';
  setCrumbs(`${f.title} · ${f.tag}`, group, meta.title);
  const order = f.groups.flatMap((g) => g.items);
  const idx = order.indexOf(id);
  const prev = f.examples.find((e) => e.id === order[idx - 1]);
  const next = f.examples.find((e) => e.id === order[idx + 1]);
  const height = meta.height === 'full' ? 'calc(100vh - 210px)' : `${meta.height}px`;
  content.innerHTML = html`
    <div class="ex-head">
      <div>
        <h1>${meta.title}</h1>
        <p>${meta.description}</p>
        <div class="tags">${meta.api.map((a) => `<code>${a}</code>`).join('')}</div>
      </div>
      <div class="ex-head__actions">
        <button class="btn btn--small" id="view-code" type="button">Ver código ↓</button>
        <button class="btn btn--small" id="reload" type="button">Recarregar</button>
      </div>
    </div>
    <div class="ex-demo" id="demo" style="height:${height}; min-height: 420px"></div>
    <h2 class="ex-code-title" id="code">Código</h2>
    ${codeBlock(exampleSource(f.id, id), 'ts', `demo/${f.id}/examples/${id}.ts`)}
    <div class="pager">
      ${prev ? `<a class="pager__prev" href="#/${f.id}/${prev.id}"><small>Anterior</small>${prev.title}</a>` : '<span></span>'}
      ${next ? `<a class="pager__next" href="#/${f.id}/${next.id}"><small>Seguinte</small>${next.title}</a>` : '<span></span>'}
    </div>
  `;
  wireCopyButtons(content);
  $('#view-code').addEventListener('click', () => document.getElementById('code')!.scrollIntoView({ behavior: 'smooth' }));
  const demo = $('#demo');
  const start = async (): Promise<void> => {
    cleanup?.();
    demo.innerHTML = '';
    const mount = await loadExample(f.id, id);
    cleanup = mount(demo);
  };
  $('#reload').addEventListener('click', () => void start());
  await start();
}

// ---------------------------------------------------------------- gallery

/** Grid of live thumbnails; charts mount when the card scrolls into view. */
function galleryPage(content: HTMLElement, only: Family | null): void {
  const fams = FAMILIES.filter((f) => f.gallery?.length && (!only || f.id === only.id));
  if (only && !only.gallery?.length) return notFound(content);
  setCrumbs('Galeria de exemplos', ...(only ? [only.title] : ['Todas']));
  const all = FAMILIES.filter((f) => f.gallery?.length);
  const count = (f: Family): number => f.gallery!.reduce((a, s) => a + s.items.length, 0);
  content.innerHTML = html`
    <div class="gal-head">
      <div>
        <h1>Galeria de exemplos</h1>
        <p>Gráficos prontos a copiar. Clica num gráfico para o ver em grande com o código.</p>
      </div>
      <input class="gal-search" id="gal-search" type="search" placeholder="Procurar na galeria…" />
    </div>
    <nav class="gal-filters">
      <a class="gal-filter${only ? '' : ' is-on'}" href="#/galeria">Todas <small>${all.reduce((a, f) => a + count(f), 0)}</small></a>
      ${all.map((f) => `<a class="gal-filter${only?.id === f.id ? ' is-on' : ''}" href="#/galeria/${f.id}">${f.title} <small>${count(f)}</small></a>`).join('')}
    </nav>
    ${fams
      .map((f) =>
        (only ? '' : `<h2 class="gal-family" data-fam="${f.id}">${f.title} <a href="#/galeria/${f.id}">ver só esta família →</a></h2>`) +
        f.gallery!
          .map(
            (s) => html`<section class="gal-section" data-fam="${f.id}">
              <h3 class="gal-section__title">${s.title}</h3>
              <div class="gal-grid">${s.items
                .map(
                  (it) => html`<a class="gal-card" href="#/galeria/${f.id}/${it.id}" data-q="${`${it.title} ${it.description} ${f.title} ${s.title}`.toLowerCase()}">
                    <div class="gal-card__chart" data-fam="${f.id}" data-id="${it.id}"></div>
                    <div class="gal-card__text"><h3>${it.title}</h3><p>${it.description}</p></div>
                  </a>`,
                )
                .join('')}</div>
            </section>`,
          )
          .join(''),
      )
      .join('')}
    <p class="gal-empty" id="gal-empty" hidden>Nada encontrado.</p>
  `;
  const destroyers: (() => void)[] = [];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        void loadGallery(el.dataset.fam!, el.dataset.id!).then((mount) => {
          if (el.isConnected) destroyers.push(mount(el));
        });
      }
    },
    { rootMargin: '200px' },
  );
  content.querySelectorAll<HTMLElement>('.gal-card__chart').forEach((el) => io.observe(el));
  const search = $<HTMLInputElement>('#gal-search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    content.querySelectorAll<HTMLElement>('.gal-card').forEach((c) => {
      const ok = !q || c.dataset.q!.includes(q);
      c.hidden = !ok;
      if (ok) shown++;
    });
    content.querySelectorAll<HTMLElement>('.gal-section').forEach((s) => (s.hidden = !s.querySelector('.gal-card:not([hidden])')));
    content.querySelectorAll<HTMLElement>('.gal-family').forEach((h) => (h.hidden = !content.querySelector(`.gal-section[data-fam="${h.dataset.fam}"]:not([hidden])`)));
    $('#gal-empty').hidden = shown > 0;
  });
  cleanup = () => {
    io.disconnect();
    destroyers.forEach((d) => d());
  };
}

/** One gallery chart in big, next to its code. */
async function galleryItemPage(content: HTMLElement, f: Family, id: string): Promise<void> {
  const flat = (f.gallery ?? []).flatMap((s) => s.items.map((it) => ({ ...it, section: s.title })));
  const idx = flat.findIndex((it) => it.id === id);
  if (idx < 0) return notFound(content);
  const it = flat[idx];
  const prev = flat[idx - 1];
  const next = flat[idx + 1];
  setCrumbs('Galeria de exemplos', f.title, it.title);
  content.innerHTML = html`
    <div class="ex-head">
      <div>
        <a class="gal-back" href="#/galeria/${f.id}">← Galeria de ${f.title.toLowerCase()}</a>
        <h1>${it.title}</h1>
        <p>${it.description}</p>
      </div>
      <div class="ex-head__actions">
        <button class="btn btn--small" id="reload" type="button">Recarregar</button>
      </div>
    </div>
    <div class="gal-detail">
      <div class="gal-detail__code">${codeBlock(gallerySource(f.id, id), 'ts', `demo/${f.id}/gallery/${id}.ts`)}</div>
      <div class="gal-detail__chart"><div class="ex-demo" id="demo"></div></div>
    </div>
    <div class="pager">
      ${prev ? `<a class="pager__prev" href="#/galeria/${f.id}/${prev.id}"><small>Anterior</small>${prev.title}</a>` : '<span></span>'}
      ${next ? `<a class="pager__next" href="#/galeria/${f.id}/${next.id}"><small>Seguinte</small>${next.title}</a>` : '<span></span>'}
    </div>
  `;
  wireCopyButtons(content);
  const demo = $('#demo');
  const start = async (): Promise<void> => {
    cleanup?.();
    demo.innerHTML = '';
    cleanup = (await loadGallery(f.id, id))(demo);
  };
  $('#reload').addEventListener('click', () => void start());
  await start();
}

function notFound(content: HTMLElement): void {
  setCrumbs('404');
  content.innerHTML = '<div class="doc"><h1>Página não encontrada</h1><p><a href="#/">Voltar ao início</a></p></div>';
}

/**
 * Routes:
 *   #/                         intro            #/instalacao        README
 *   #/docs/<id>                general doc
 *   #/<familia>                family overview
 *   #/<familia>/<exemplo>      example
 *   #/<familia>/docs/<id>      family doc
 *   #/galeria[/<familia>[/<id>]]  gallery of small charts
 */
async function route(): Promise<void> {
  cleanup?.();
  cleanup = null;
  document.body.classList.remove('nav-open');
  const content = $('#content');
  content.innerHTML = '';
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  revealCurrent();
  renderNav();
  window.scrollTo(0, 0);
  const fam = parts[0] ? family(parts[0]) : undefined;
  if (!parts.length) introPage(content);
  else if (parts[0] === 'instalacao') installPage(content);
  else if (parts[0] === 'docs' && parts[1]) docPage(content, null, parts[1]);
  else if (parts[0] === 'galeria') {
    const gf = parts[1] ? family(parts[1]) : undefined;
    if (parts[1] && !gf) notFound(content);
    else if (gf && parts[2]) await galleryItemPage(content, gf, parts[2]);
    else galleryPage(content, gf ?? null);
  }
  else if (fam && parts.length === 1) familyPage(content, fam);
  else if (fam && parts[1] === 'docs' && parts[2]) docPage(content, fam, parts[2]);
  else if (fam && parts[1]) await examplePage(content, fam, parts[1]);
  else notFound(content);
  const title = $('#crumbs').querySelector('strong')?.textContent;
  document.title = title ? `${title} · OpenChartsCandle` : 'OpenChartsCandle';
}

// old URLs (#/exemplos/x, #/install) keep working
const legacy = location.hash.match(/^#\/(exemplos|install)(?:\/(.+))?$/);
if (legacy) location.replace(legacy[1] === 'install' ? '#/instalacao' : `#/candlestick/${legacy[2] ?? ''}`);

window.addEventListener('hashchange', () => void route());
void route();
