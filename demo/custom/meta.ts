import { createCustomChart } from 'openchartscandle/custom';
import type { ExampleMeta, Family } from '../site/registry';
import { candles } from './data';

/** The custom family on the site: examples (demo/custom/examples), gallery (demo/custom/gallery) and docs. */
const EXAMPLES: ExampleMeta[] = [
  {
    id: 'basic',
    title: 'Velas com renderItem',
    description: 'Cada vela é desenhada pelo renderItem; troca entre velas, OHLC e intervalo (as formas transformam-se), dados novos animados, zoom com a roda e click num dia.',
    height: 560,
    api: ['createCustomChart', 'renderItem', 'api.coord', 'api.size', 'id', 'setData', 'zoom', "on('click')"],
  },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um gráfico sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'api.style', 'api.theme'] },
];

export const CUSTOM_FAMILY: Family = {
  id: 'custom',
  title: 'Custom',
  tag: 'séries próprias',
  description:
    'Séries próprias: uma função renderItem desenha cada item com retângulos, círculos, setores, polígonos, caminhos SVG, texto e grupos, num sistema cartesiano, polar ou em píxeis. O gráfico trata dos eixos, do tooltip, do hover, do click, do arrastar, do zoom e das transições: formas com o mesmo id transformam-se umas nas outras.',
  importPath: 'openchartscandle/custom',
  mainExports: 'createCustomChart',
  examples: EXAMPLES,
  gallery: [
    {
      title: 'Custom',
      items: [
        { id: 'histogram', title: 'Histogram with Custom Series', description: 'Retornos diários em classes com customHistogram(), cada classe um retângulo.' },
        { id: 'profit', title: 'Profit', description: 'Resultado mensal em barras com ponta de seta, para cima ou para baixo.' },
        { id: 'error-scatter', title: 'Error Scatter on Catesian', description: 'Estimativas dos analistas com barras de erro nos dois eixos.' },
        { id: 'custom-bar-trend', title: 'Custom Bar Trend', description: 'Barras com gradiente e a linha que liga o topo de cada uma.' },
        { id: 'cartesian-polygon', title: 'Custom Cartesian Polygon', description: 'Um polígono em coordenadas cartesianas que muda de forma com animação.' },
        { id: 'error-bar', title: 'Error Bar on Catesian', description: 'Duas séries de barras lado a lado (barLayout) com o intervalo por cima.' },
        { id: 'profile', title: 'Profile', description: 'Perfil de carregamento por thread, com zoom e pan no tempo.' },
        { id: 'cycle-plot', title: 'Cycle Plot', description: 'Retornos por dia da semana ao longo de 8 semanas, com a média.' },
        { id: 'gantt-flights', title: 'Gantt Chart of Airport Flights', description: 'Voos por porta de embarque; arrasta um voo para outra porta ou hora.' },
        { id: 'polar-heatmap', title: 'Polar Heatmap', description: 'Ordens por hora (à volta) e dia da semana (do centro para fora).' },
        { id: 'flame-graph', title: 'Flame graph', description: 'Perfil de CPU de um backtest; clica numa função para fazer zoom.' },
        { id: 'wind-barb', title: 'Wind Barb', description: 'Barbelas de vento ao longo de 48 horas, sobre a velocidade.' },
        { id: 'hexbin', title: 'Hexagonal Binning', description: '1400 operações contadas em hexágonos, com a cor da contagem.' },
        { id: 'custom-calendar-icon', title: 'Custom Calendar Icon', description: 'Um mês em píxeis com ícones do tempo e fases da lua desenhados à mão.' },
        { id: 'wind-vectors', title: 'Use custom series to draw wind vectors', description: 'Setas de vento numa grelha de longitude × latitude, sobre Portugal.' },
        { id: 'custom-gauge', title: 'Custom Gauge', description: 'Um velocímetro feito com setores, marcas e agulha, animado com live.' },
        { id: 'geo-custom-effect', title: 'GEO SVG with Customized Effect', description: 'Substituto sem mapas: o contorno de Portugal como caminho SVG, com ondas e uma rota animadas.' },
        { id: 'parliament-pie', title: 'Transition of Parliament and Pie Chart', description: 'Os lugares passam de um hemiciclo para uma pizza e voltam (morphing).' },
        { id: 'circle-packing', title: 'Circle Packing with d3', description: 'Setores e empresas em círculos encaixados (sem d3); clica para entrar.' },
        { id: 'spiral-race', title: 'Custom Spiral Race', description: 'Cinco ativos a correr em pistas de uma espiral, mês a mês.' },
      ],
    },
  ],
  groups: [
    { title: 'Básico', items: ['basic'] },
    { title: 'Personalizar', items: ['themes'] },
  ],
  docs: [{ id: 'api', title: 'Referência da API' }],
  headline: '<span class="grad">Séries próprias</span><br />desenhadas por ti',
  features: [
    ['✏️', 'renderItem', 'Uma função por item devolve as formas: retângulos, círculos, setores, polígonos, linhas, texto, imagens e grupos.'],
    ['🧭', 'Coordenadas', 'Cartesianas (valor, categoria, tempo, log), polares ou em píxeis, com api.coord e api.size.'],
    ['🧬', 'Morphing', 'Formas com o mesmo id transformam-se umas nas outras, até um círculo num setor.'],
    ['🖱️', 'Interação', 'Tooltip, hover com destaque, click e arrastar em cada forma desenhada.'],
    ['🔍', 'Zoom', 'Roda do rato e pan num eixo, ou zoomTo() animado.'],
    ['🛤️', 'Caminhos SVG', 'Qualquer atributo d de SVG, encaixado numa caixa, com arcos e curvas.'],
    ['🧰', 'Ajudantes', 'customHistogram, customHexbin e customPack (empacotamento de círculos).'],
    ['🪶', 'Leve e separado', 'Sem dependências e sem carregar as outras famílias.'],
  ],
  preview: (el) => {
    const c = createCustomChart(el, {
      xAxis: { type: 'category', show: false },
      yAxis: { beginAtZero: false, show: false },
      grid: { left: 10, right: 10, top: 10, bottom: 10 },
      series: [
        {
          data: candles(40, 4),
          encode: { y: [3, 4] },
          renderItem: (p, api) => {
            const [o, cl, lo, hi] = [1, 2, 3, 4].map((d) => api.value(d) as number);
            const [x, yo] = api.coord([p.dataIndex, o]);
            const yc = api.coord([p.dataIndex, cl])[1];
            const w = api.size([1, 0])[0] * 0.6;
            const color = cl >= o ? '#089981' : '#f23645';
            return {
              type: 'group',
              children: [
                { type: 'line', shape: { x1: x, y1: api.coord([0, hi])[1], x2: x, y2: api.coord([0, lo])[1] }, style: { stroke: color } },
                { type: 'rect', shape: { x: x - w / 2, y: Math.min(yo, yc), width: w, height: Math.max(1, Math.abs(yc - yo)) }, style: { fill: color } },
              ],
            };
          },
        },
      ],
      animation: { delay: (i) => i * 20 },
    });
    return () => c.destroy();
  },
};
