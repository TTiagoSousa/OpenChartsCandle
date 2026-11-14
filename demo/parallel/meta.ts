import { createParallelChart } from 'openchartscandle/parallel';
import type { ExampleMeta, Family } from '../site/registry';
import { STOCK_AXES, stocks } from './data';

/** The parallel family on the site: examples (demo/parallel/examples), gallery (demo/parallel/gallery) and docs. */
const EXAMPLES: ExampleMeta[] = [
  {
    id: 'basic',
    title: 'Filtrar empresas',
    description:
      '400 empresas em sete eixos, coloridas por uma dimensão. Arrasta nos eixos para selecionar (vários eixos = E), muda o layout e a dimensão das cores, e vê quantas ficam selecionadas.',
    height: 600,
    api: ['createParallelChart', "layout: 'vertical'", 'visualMap', 'setBrush', "on('brush')", 'clearBrush'],
  },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um gráfico sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'smooth'] },
];

export const PARALLEL_FAMILY: Family = {
  id: 'parallel',
  title: 'Parallel',
  tag: 'coordenadas paralelas',
  description:
    'Coordenadas paralelas: um eixo por dimensão (valores, escala log ou categorias) e uma linha por linha de dados, coloridas por série ou pelo valor de uma dimensão. Arrasta nos eixos para filtrar, reordena os eixos e desenha milhares de linhas.',
  importPath: 'openchartscandle/parallel',
  mainExports: 'createParallelChart',
  examples: EXAMPLES,
  gallery: [
    {
      title: 'Parallel',
      items: [
        { id: 'basic-parallel', title: 'Basic Parallel', description: 'Seis meses de três fundos: uma linha por mês, um eixo por medida.' },
        { id: 'parallel-aqi', title: 'Parallel Aqi', description: 'Qualidade do ar diária em três cidades, com um eixo de categorias e cores por intervalos de AQI.' },
        { id: 'parallel-nutrients', title: 'Parallel Nutrients', description: 'Perto de 300 alimentos em oito dimensões, um grupo por cor, filtrados arrastando nos eixos.' },
        { id: 'scatter-matrix', title: 'Scatter Matrix', description: 'Uma matriz de dispersão ligada às paralelas: a seleção nos eixos apaga os outros pontos.' },
      ],
    },
  ],
  groups: [
    { title: 'Básico', items: ['basic'] },
    { title: 'Personalizar', items: ['themes'] },
  ],
  docs: [{ id: 'api', title: 'Referência da API' }],
  headline: '<span class="grad">Coordenadas</span><br />paralelas',
  features: [
    ['📏', 'Eixos paralelos', 'Valores com escala arredondada, log ou categorias; min, max, inverse e formatter por eixo.'],
    ['↕️', 'Dois layouts', 'Eixos lado a lado (horizontal) ou empilhados (vertical), com nomes e etiquetas sempre legíveis.'],
    ['🖌️', 'Brush', 'Arrasta ao longo de um eixo para selecionar; vários eixos juntam as condições; evento brush com as linhas.'],
    ['🎨', 'visualMap', 'Cores pelo valor de uma dimensão: gradiente contínuo ou intervalos que se escondem com um clique.'],
    ['🔀', 'Reordenar eixos', 'Arrasta o nome de um eixo para o mudar de lugar.'],
    ['⚡', 'Milhares de linhas', 'Desenhadas em lotes por cor e guardadas em cache; o rato encontra a linha mais próxima.'],
    ['💬', 'Tooltip e legenda', 'Todos os valores da linha no tooltip, séries que se escondem na legenda, linhas retas ou curvas.'],
    ['🪶', 'Leve e separado', 'Sem dependências e sem carregar as outras famílias.'],
  ],
  preview: (el) => {
    const list = stocks(260, 13);
    const chart = createParallelChart(el, {
      axes: STOCK_AXES,
      series: [{ name: 'Empresas', data: list.map((s) => ({ name: `${s.name} · ${s.sector}`, value: s.value })) }],
      visualMap: { dimension: 4, show: false },
      opacity: 0.5,
      lineWidth: 1,
    });
    chart.setBrush([{ axis: 2, from: 0.9, to: 1.6 }]);
    return () => chart.destroy();
  },
};
