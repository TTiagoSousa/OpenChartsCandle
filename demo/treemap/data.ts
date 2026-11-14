import { fromPaths, type TreeNode } from 'openchartscandle/treemap';

/** Helpers for the treemap examples (DOM helpers shared with the line examples). */
export { choice, h } from '../line/data';

// sources of this project, loaded only when an example asks for them
const FILES = {
  ...import.meta.glob<string>('../../src/**/*.{ts,scss}', { query: '?raw', import: 'default' }),
  ...import.meta.glob<string>('../**/*.{ts,css,html}', { query: '?raw', import: 'default' }),
  ...import.meta.glob<string>('../../docs/**/*.md', { query: '?raw', import: 'default' }),
  ...import.meta.glob<string>('../../tests/**/*.ts', { query: '?raw', import: 'default' }),
};

/** Files of this project as a tree (size = bytes): `src` only, or everything. */
export async function projectTree(scope: 'src' | 'all' = 'all'): Promise<TreeNode[]> {
  const enc = new TextEncoder();
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, load]) => {
      // '../../src/bar/bar.ts' → 'src/bar/bar.ts', '../bar/x.ts' → 'demo/bar/x.ts'
      const path = key.startsWith('../../') ? key.slice(6) : `demo/${key.slice(3)}`;
      return { path, value: enc.encode(await load()).length };
    }),
  );
  const list = entries.filter((e) => scope === 'all' || e.path.startsWith('src/'));
  const tree = fromPaths(list);
  return scope === 'src' ? (tree.find((n) => n.name === 'src')?.children ?? []) : tree;
}

export const kb = (v: number): string => (v >= 1024 * 1024 ? `${(v / 1024 / 1024).toFixed(1)} MB` : `${(v / 1024).toFixed(1)} KB`);

/** Small deterministic random generator. */
export function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * US federal budget (approximate, billions of dollars): `value: [2012, 2011, growth %]`.
 * Inspired by the "How $3.7 Trillion is Spent" chart (2012 budget proposal).
 */
export const BUDGET: TreeNode[] = (() => {
  const rnd = seeded(37);
  const dept = (name: string, total2012: number, growth: number, parts: [string, number][]): TreeNode => ({
    name,
    children: parts.map(([n, share]) => {
      const v12 = +(total2012 * share).toFixed(1);
      const g = +(growth + (rnd() - 0.5) * 30).toFixed(1);
      return { name: n, value: [v12, +(v12 / (1 + g / 100)).toFixed(1), g] };
    }),
  });
  return [
    dept('Segurança Social', 761, 4.6, [['Pensões de velhice', 0.68], ['Invalidez', 0.17], ['Sobrevivência', 0.15]]),
    dept('Defesa', 737, -4.2, [['Operações e manutenção', 0.4], ['Pessoal militar', 0.22], ['Aquisições', 0.17], ['Investigação', 0.11], ['Guerras no estrangeiro', 0.1]]),
    dept('Medicare', 485, 0.9, [['Hospitais', 0.42], ['Médicos', 0.3], ['Medicamentos', 0.17], ['Planos privados', 0.11]]),
    dept('Saúde e Serviços Humanos', 372, 6.8, [['Medicaid', 0.72], ['Programas para crianças', 0.12], ['Investigação médica', 0.09], ['Prevenção', 0.07]]),
    dept('Juros da dívida', 242, 17.3, [['Juros líquidos', 1]]),
    dept('Agricultura', 154, -1.8, [['Senhas de alimentação', 0.53], ['Nutrição infantil', 0.13], ['Apoios agrícolas', 0.21], ['Florestas', 0.13]]),
    dept('Trabalho', 113, -16.4, [['Subsídio de desemprego', 0.79], ['Formação', 0.21]]),
    dept('Veteranos', 129, 3.9, [['Pensões', 0.51], ['Saúde', 0.43], ['Habitação', 0.06]]),
    dept('Transportes', 129, 37.1, [['Estradas', 0.48], ['Comboios', 0.17], ['Aviação', 0.2], ['Transportes públicos', 0.15]]),
    dept('Educação', 77, 16.1, [['Ensino básico', 0.47], ['Bolsas', 0.4], ['Educação especial', 0.13]]),
    dept('Habitação e Urbanismo', 48, -23.6, [['Apoio à renda', 0.71], ['Desenvolvimento local', 0.29]]),
    dept('Segurança Interna', 47, 1.5, [['Fronteiras', 0.42], ['Guarda Costeira', 0.22], ['Emergências', 0.36]]),
    dept('Justiça', 33, 6.4, [['FBI', 0.27], ['Prisões', 0.22], ['Tribunais', 0.51]]),
    dept('Energia', 29, 12.7, [['Armamento nuclear', 0.42], ['Ciência', 0.18], ['Energias limpas', 0.4]]),
    dept('NASA', 18.7, 0.8, [['Exploração', 0.21], ['Ciência espacial', 0.27], ['Operações', 0.52]]),
    dept('Estado e Ajuda Externa', 59, -0.6, [['Diplomacia', 0.42], ['Ajuda ao desenvolvimento', 0.58]]),
  ];
})();

/**
 * How often each ECharts option was looked up in the docs (made-up counts),
 * for ECharts 2 and ECharts 3, in the spirit of the "ECharts Option Query" chart.
 */
export function optionQuery(version: 2 | 3): TreeNode[] {
  const rnd = seeded(version === 2 ? 11 : 29);
  const opts: Record<string, Record<string, string[]>> = {
    series: {
      line: ['data', 'smooth', 'areaStyle', 'itemStyle', 'markLine', 'symbol', 'stack', 'label'],
      bar: ['data', 'barWidth', 'stack', 'itemStyle', 'label', 'barGap', 'markPoint'],
      pie: ['radius', 'center', 'label', 'labelLine', 'roseType', 'itemStyle'],
      map: ['mapType', 'roam', 'label', 'itemStyle', 'geoCoord'],
      scatter: ['symbolSize', 'data', 'large', 'itemStyle'],
      gauge: ['detail', 'pointer', 'axisLine', 'splitLine', 'title'],
      treemap: ['levels', 'leafDepth', 'breadcrumb', 'visualDimension'],
      radar: ['indicator', 'shape', 'areaStyle'],
      graph: ['force', 'layout', 'links', 'categories'],
      funnel: ['sort', 'gap', 'label'],
    },
    xAxis: { axisLabel: ['interval', 'rotate', 'formatter'], type: ['category', 'value', 'time'], splitLine: ['show', 'lineStyle'], data: [], boundaryGap: [] },
    yAxis: { axisLabel: ['formatter', 'margin'], type: ['value', 'log'], min: [], max: [], splitArea: [] },
    tooltip: { trigger: ['axis', 'item'], formatter: [], axisPointer: ['type', 'crossStyle'], backgroundColor: [] },
    legend: { data: [], orient: [], selected: [], textStyle: ['color', 'fontSize'], x: [], y: [] },
    grid: { x: [], y: [], x2: [], y2: [], containLabel: [] },
    toolbox: { feature: ['saveAsImage', 'dataView', 'magicType', 'restore'], show: [] },
    dataZoom: { start: [], end: [], type: ['inside', 'slider'], realtime: [] },
    visualMap: version === 3 ? { inRange: ['color', 'symbolSize'], min: [], max: [], calculable: [], pieces: [] } : {},
    title: { text: [], subtext: [], x: [], textStyle: ['fontSize', 'color'] },
    color: {},
    animation: { animationDuration: [], animationEasing: [] },
  };
  const weight: Record<string, number> = { series: 4, xAxis: 4, yAxis: 3, tooltip: 4, legend: 3, grid: 2, toolbox: 1.5, dataZoom: 1.6, visualMap: 1.8, title: 1.3, color: 0.8, animation: 0.5 };
  const n = (w: number): number => Math.round(w * (200 + rnd() * 1800) * (version === 3 ? 1.6 : 1));
  return Object.entries(opts)
    .filter(([k, v]) => Object.keys(v).length || k === 'color')
    .map(([k, sub]) => {
      const kids = Object.entries(sub).map(([s, leaves]) =>
        leaves.length
          ? { name: s, children: leaves.map((l) => ({ name: l, value: n(weight[k] / 3) })) }
          : { name: s, value: n(weight[k] / 2) },
      );
      return kids.length ? { name: k, children: kids } : { name: k, value: n(weight[k]) };
    });
}

/** Grid of labelled cells, each with a fixed-height host for one chart. */
export function treemapGrid(el: HTMLElement, titles: string[], height = 300, className = 'pc-demo-card--dark'): HTMLElement[] {
  const grid = document.createElement('div');
  grid.className = 'pc-demo-grid';
  const scroll = document.createElement('div');
  scroll.className = 'ex-scroll pc-demo-bg';
  scroll.append(grid);
  el.append(scroll);
  return titles.map((t) => {
    const card = document.createElement('section');
    card.className = `pc-demo-card ${className}`;
    const h3 = document.createElement('h3');
    h3.textContent = t;
    const body = document.createElement('div');
    body.style.height = `${height}px`;
    card.append(h3, body);
    grid.append(card);
    return body;
  });
}

/** Market map: sectors → stocks, `[ticker, market cap in B$]`. */
export const SECTORS: Record<string, [string, number][]> = {
  Tecnologia: [['AAPL', 3400], ['MSFT', 3100], ['NVDA', 2900], ['AVGO', 780], ['ORCL', 420], ['ADBE', 240], ['CRM', 260], ['AMD', 250], ['INTC', 130], ['CSCO', 230]],
  Comunicações: [['GOOGL', 2100], ['META', 1400], ['NFLX', 300], ['DIS', 200], ['TMUS', 260], ['VZ', 170]],
  Consumo: [['AMZN', 1900], ['TSLA', 900], ['HD', 380], ['MCD', 210], ['NKE', 120], ['SBUX', 100]],
  Financeiro: [['BRK.B', 950], ['JPM', 640], ['V', 560], ['MA', 470], ['BAC', 330], ['WFC', 230], ['GS', 170]],
  Saúde: [['LLY', 820], ['UNH', 520], ['JNJ', 380], ['ABBV', 320], ['MRK', 280], ['PFE', 160]],
  Energia: [['XOM', 480], ['CVX', 290], ['COP', 130], ['SLB', 60]],
  Indústria: [['GE', 190], ['CAT', 170], ['UNP', 140], ['BA', 130], ['HON', 135]],
  'Bens essenciais': [['WMT', 700], ['PG', 400], ['COST', 390], ['KO', 270], ['PEP', 220]],
};

/** Market map data, `value: [market cap, change %]`, with random daily changes (same `rnd` → same map). */
export function marketData(rnd: () => number = Math.random): TreeNode[] {
  return withAverages(
    Object.entries(SECTORS).map(([name, stocks]) => {
      const bias = (rnd() - 0.5) * 2.4;
      return { name, children: stocks.map(([t, cap]) => ({ name: t, value: [cap, +(bias + (rnd() - 0.5) * 5).toFixed(2)] })) };
    }),
  );
}

/** Give each sector the change of its stocks weighted by market cap (`value: [0, change]`; the size comes from the children). */
export function withAverages(data: TreeNode[]): TreeNode[] {
  return data.map((s) => {
    const kids = (s.children ?? []).map((c) => c.value as number[]);
    const cap = kids.reduce((a, v) => a + v[0], 0);
    const chg = kids.reduce((a, v) => a + v[0] * v[1], 0) / (cap || 1);
    return { ...s, value: [0, +chg.toFixed(2)] };
  });
}

/** A small family tree, in the spirit of the ECharts sunburst examples. */
export const FAMILY: TreeNode[] = [
  {
    name: 'Avô Rui',
    children: [
      {
        name: 'Tio Luís',
        children: [
          { name: 'Primo João', value: 2 },
          { name: 'Prima Maria', children: [{ name: 'Joana', value: 2 }, { name: 'Tomás', value: 3 }] },
          { name: 'Primo Bruno', value: 4 },
        ],
      },
      { name: 'Pai', children: [{ name: 'Eu', value: 5 }, { name: 'Irmão Pedro', value: 1 }] },
    ],
  },
  { name: 'Avó Ana', children: [{ name: 'Tio Nuno', children: [{ name: 'Prima Beatriz', value: 1 }, { name: 'Prima Inês', value: 2 }] }, { name: 'Tia Rosa', value: 3 }] },
];

/** Monthly household budget (€). */
export const HOUSEHOLD: TreeNode[] = [
  { name: 'Casa', children: [{ name: 'Renda', value: 850 }, { name: 'Eletricidade', value: 75 }, { name: 'Água', value: 30 }, { name: 'Internet', value: 40 }, { name: 'Condomínio', value: 45 }] },
  { name: 'Alimentação', children: [{ name: 'Supermercado', value: 420 }, { name: 'Restaurantes', value: 160 }, { name: 'Cafés', value: 45 }] },
  { name: 'Transportes', children: [{ name: 'Combustível', value: 140 }, { name: 'Passe', value: 40 }, { name: 'Manutenção', value: 55 }, { name: 'Portagens', value: 25 }] },
  { name: 'Lazer', children: [{ name: 'Ginásio', value: 35 }, { name: 'Streaming', value: 25 }, { name: 'Viagens', value: 150 }, { name: 'Livros', value: 20 }] },
  { name: 'Saúde', children: [{ name: 'Seguro', value: 60 }, { name: 'Farmácia', value: 30 }] },
  { name: 'Poupança', children: [{ name: 'Fundo de emergência', value: 150 }, { name: 'PPR', value: 100 }] },
];

const leaves = (list: [string, number][]): TreeNode[] => list.map(([name, value]) => ({ name, value }));

/** Population of Portugal by NUTS II and NUTS III region (thousands, 2021 census, approximate). */
export const PT_POPULATION: TreeNode[] = [
  {
    name: 'Norte',
    children: leaves([['Área Metropolitana do Porto', 1737], ['Tâmega e Sousa', 420], ['Ave', 418], ['Cávado', 416], ['Alto Minho', 231], ['Douro', 185], ['Terras de Trás-os-Montes', 107], ['Alto Tâmega', 85]]),
  },
  { name: 'Lisboa', children: leaves([['Grande Lisboa', 2070], ['Península de Setúbal', 801]]) },
  {
    name: 'Centro',
    children: leaves([['Região de Coimbra', 437], ['Região de Aveiro', 367], ['Oeste', 362], ['Região de Leiria', 287], ['Viseu Dão Lafões', 253], ['Médio Tejo', 230], ['Beiras e Serra da Estrela', 212], ['Beira Baixa', 79]]),
  },
  { name: 'Alentejo', children: leaves([['Lezíria do Tejo', 237], ['Alentejo Central', 152], ['Baixo Alentejo', 115], ['Alto Alentejo', 104], ['Alentejo Litoral', 96]]) },
  { name: 'Algarve', value: 467 },
  { name: 'Madeira', value: 251 },
  { name: 'Açores', value: 236 },
];

/** CO2 emissions by continent and country: `value: [Mt CO2, t per person]` (2022, approximate). */
export const CO2: TreeNode[] = (() => {
  const c = (name: string, perCapita: number, list: [string, number, number][]): TreeNode => ({
    name,
    value: [0, perCapita],
    children: list.map(([n, mt, pc]) => ({ name: n, value: [mt, pc] })),
  });
  return [
    c('Ásia', 4.9, [['China', 11400, 8.0], ['Índia', 2830, 2.0], ['Japão', 1050, 8.5], ['Indonésia', 730, 2.6], ['Irão', 690, 7.8], ['Arábia Saudita', 670, 18.2], ['Coreia do Sul', 600, 11.6], ['Turquia', 440, 5.1]]),
    c('América', 7.4, [['Estados Unidos', 5000, 14.9], ['Canadá', 550, 14.2], ['Brasil', 480, 2.2], ['México', 450, 3.5], ['Argentina', 190, 4.2], ['Chile', 85, 4.3]]),
    c('Europa', 6.9, [['Rússia', 1650, 11.4], ['Alemanha', 670, 8.0], ['Reino Unido', 330, 4.7], ['Itália', 320, 5.4], ['Polónia', 300, 7.9], ['França', 300, 4.6], ['Espanha', 250, 5.2], ['Países Baixos', 140, 7.9], ['Portugal', 40, 3.9]]),
    c('África', 1.0, [['África do Sul', 400, 6.7], ['Egito', 250, 2.3], ['Argélia', 180, 4.0], ['Nigéria', 130, 0.6], ['Marrocos', 70, 1.9]]),
    c('Oceânia', 10.9, [['Austrália', 390, 15.0], ['Nova Zelândia', 33, 6.4]]),
  ];
})();

/**
 * Coffee flavour wheel (SCA, in Portuguese): category → group → flavour, every node with its own color.
 * Inspired by the "Drink Flavors" ECharts example.
 */
export const COFFEE_FLAVORS: TreeNode[] = (() => {
  type Spec = [name: string, color: string, kids?: Spec[]];
  const node = ([name, color, kids]: Spec): TreeNode => (kids ? { name, color, children: kids.map(node) } : { name, color, value: 1 });
  const wheel: Spec[] = [
    ['Floral', '#da0d68', [['Chá preto', '#975e6d'], ['Floral', '#e0719c', [['Camomila', '#f99e1c'], ['Rosa', '#ef5a78'], ['Jasmim', '#f7f1bd']]]]],
    [
      'Frutado',
      '#da1d23',
      [
        ['Bagas', '#dd4c51', [['Amora', '#3e0317'], ['Framboesa', '#e62969'], ['Mirtilo', '#6569b0'], ['Morango', '#ef2d36']]],
        ['Fruta seca', '#c94a44', [['Passa', '#b53b54'], ['Ameixa seca', '#a5446f']]],
        ['Outra fruta', '#dd4c51', [['Coco', '#f2684b'], ['Cereja', '#e73451'], ['Romã', '#e65656'], ['Ananás', '#f89a1c'], ['Uva', '#aeb92c'], ['Maçã', '#4eb849'], ['Pêssego', '#f68a5c'], ['Pera', '#baa635']]],
        ['Citrinos', '#f7a128', [['Toranja', '#f26355'], ['Laranja', '#e2631e'], ['Limão', '#fde404'], ['Lima', '#7eb138']]],
      ],
    ],
    [
      'Ácido / Fermentado',
      '#ebb40f',
      [
        ['Ácido', '#e1c315', [['Acético', '#9ea718'], ['Butírico', '#94a76f'], ['Isovalérico', '#d0b24f'], ['Cítrico', '#8eb646'], ['Málico', '#faef07']]],
        ['Álcool / Fermentado', '#c1ba07', [['Vinoso', '#b09733'], ['Whisky', '#8f1c53'], ['Fermentado', '#b34039'], ['Muito maduro', '#ba9232']]],
      ],
    ],
    [
      'Verde / Vegetal',
      '#187a2f',
      [
        ['Azeite', '#a2b029'],
        ['Cru', '#718933'],
        ['Verde / Vegetal', '#3aa255', [['Imaturo', '#a2bb2b'], ['Vagem', '#62aa3c'], ['Fresco', '#03a653'], ['Verde escuro', '#038549'], ['Vegetal', '#28b44b'], ['Feno', '#a3a830'], ['Herbáceo', '#7ac141']]],
        ['Leguminoso', '#5e9a80'],
      ],
    ],
    [
      'Outro',
      '#0aa3b5',
      [
        ['Papel / Mofo', '#9db2b7', [['Bafio', '#8b8c90'], ['Cartão', '#beb276'], ['Papel', '#fefef4'], ['Madeira', '#744e03'], ['Mofo', '#a3a36f'], ['Poeira', '#c9b583'], ['Terroso', '#978847'], ['Animal', '#9d977f'], ['Carne', '#cc7b6a'], ['Fenólico', '#db646a']]],
        ['Químico', '#76c0cb', [['Amargo', '#80a89d'], ['Salgado', '#def2fd'], ['Medicinal', '#7a9bae'], ['Petróleo', '#039fb8'], ['Borracha', '#5e777b']]],
      ],
    ],
    [
      'Torrado',
      '#c94930',
      [
        ['Tabaco de cachimbo', '#caa465'],
        ['Tabaco', '#dfbd7e'],
        ['Queimado', '#be8663', [['Acre', '#b9a449'], ['Cinza', '#899893'], ['Fumado', '#a1743b'], ['Castanho torrado', '#894810']]],
        ['Cereal', '#ddaf61', [['Grão', '#b7906f'], ['Malte', '#eb9d5f']]],
      ],
    ],
    ['Especiarias', '#ad213e', [['Pimenta', '#794752'], ['Especiarias', '#cc3d41', [['Anis', '#b14d57'], ['Noz-moscada', '#c78936'], ['Canela', '#8c292c'], ['Cravinho', '#e5762e']]]]],
    [
      'Frutos secos / Cacau',
      '#a87b64',
      [
        ['Frutos secos', '#c78869', [['Amendoim', '#d4ad12'], ['Avelã', '#9d5433'], ['Amêndoa', '#c89f83']]],
        ['Cacau', '#bb764c', [['Chocolate', '#692a19'], ['Chocolate negro', '#470604']]],
      ],
    ],
    [
      'Doce',
      '#e65832',
      [
        ['Açúcar mascavado', '#d45a59', [['Melaço', '#310d0f'], ['Xarope de ácer', '#ae341f'], ['Caramelo', '#d78823'], ['Mel', '#da5c1f']]],
        ['Baunilha', '#f89a80'],
        ['Vanilina', '#f37674'],
        ['Doce', '#e75b68'],
        ['Aromático doce', '#d0545f'],
      ],
    ],
  ];
  return wheel.map(node);
})();

/** A reading log: genre → subgenre → rating → book (value = pages). Made up, in the spirit of "Book Records". */
export const BOOK_RECORDS: TreeNode[] = (() => {
  type Shelf = Record<string, Record<string, [string, number][]>>;
  const shelf = (s: Shelf): TreeNode[] =>
    Object.entries(s).map(([sub, ratings]) => ({
      name: sub,
      children: Object.entries(ratings).map(([stars, books]) => ({ name: stars, children: leaves(books) })),
    }));
  return [
    {
      name: 'Ficção',
      children: shelf({
        Romance: { '5★': [['Ensaio sobre a Cegueira', 310], ['Memorial do Convento', 352], ['Os Maias', 714]], '4★': [['A Cidade e as Serras', 272], ['O Primo Basílio', 448]], '3★': [['A Jangada de Pedra', 330]] },
        Fantasia: { '5★': [['O Senhor dos Anéis', 1178], ['O Hobbit', 310]], '4★': [['A Guerra dos Tronos', 694], ['O Nome do Vento', 662]], '3★': [['Eragon', 503]] },
        Policial: { '5★': [['O Nome da Rosa', 512]], '4★': [['Um Estudo em Vermelho', 188], ['Crime no Expresso do Oriente', 256]], '3★': [['O Código Da Vinci', 454]] },
        'Ficção científica': { '5★': [['Duna', 688], ['Fundação', 255]], '4★': [['Neuromante', 271], ['Eu, Robô', 253]] },
      }),
    },
    {
      name: 'Não-ficção',
      children: shelf({
        História: { '5★': [['Sapiens', 498]], '4★': [['Armas, Germes e Aço', 480], ['Os Descobrimentos', 320]] },
        Ciência: { '5★': [['Cosmos', 396], ['Breve História do Tempo', 212]], '4★': [['O Gene Egoísta', 360]], '3★': [['O Universo Elegante', 448]] },
        Biografia: { '4★': [['Steve Jobs', 656], ['Longo Caminho para a Liberdade', 630]], '3★': [['Open', 386]] },
        Ensaio: { '5★': [['Pensar, Depressa e Devagar', 499]], '3★': [['O Poder do Hábito', 371]] },
      }),
    },
  ];
})();
