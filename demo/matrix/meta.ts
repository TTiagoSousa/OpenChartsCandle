import { heatmapCorrelation } from 'openchartscandle/heatmap';
import { createMatrixChart } from 'openchartscandle/matrix';
import type { ExampleMeta, Family } from '../site/registry';
import { ASSETS, assetReturns } from './data';

/** The matrix family on the site: examples (demo/matrix/examples), gallery (demo/matrix/gallery) and docs. */
const EXAMPLES: ExampleMeta[] = [
  {
    id: 'basic',
    title: 'Retornos mensais',
    description:
      'Dez anos × doze meses agrupados por trimestre: números, cores por visualMap ou sparklines em cada célula, realce em cruz, seleção de linhas e colunas pelos cabeçalhos e o mês num click.',
    height: 600,
    api: ['createMatrixChart', 'x.data (níveis)', 'visualMap', 'renderCell', 'emphasis', 'select', "on('click')"],
  },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e uma matriz sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'gap', 'itemStyle.radius'] },
];

export const MATRIX_FAMILY: Family = {
  id: 'matrix',
  title: 'Matrix',
  tag: 'matrizes · grelhas',
  description:
    'Matrizes e grelhas: cabeçalhos com vários níveis nos dois lados, células unidas, valores com cores por visualMap, desenho próprio em canvas, gráficos de outras famílias dentro das células, realce em cruz, seleção e regras por largura para fazer dashboards que se reorganizam.',
  importPath: 'openchartscandle/matrix',
  mainExports: 'createMatrixChart',
  examples: EXAMPLES,
  gallery: [
    {
      title: 'Matrix',
      items: [
        { id: 'simple-matrix', title: 'Simple Matrix', description: 'Ano › semestre nas colunas, regiões nas linhas e uma célula unida.' },
        { id: 'correlation-heatmap', title: 'Correlation Matrix (Heatmap)', description: 'Correlação de oito ativos, de -1 a 1, com o valor em cada célula.' },
        { id: 'correlation-scatter', title: 'Correlation Matrix (Scatter)', description: 'Dispersão de cada par de ativos, histogramas na diagonal e a correlação em cima.' },
        { id: 'covariance-matrix', title: 'Covariance Matrix', description: 'Números no triângulo de baixo, círculos com a área do valor no de cima.' },
        { id: 'graph-in-matrix', title: 'Graph Chart in Matrix', description: 'Tarefas nas células da fase e da equipa, com as dependências desenhadas por cima.' },
        { id: 'pie-in-matrix', title: 'Pie Charts in Matrix', description: 'Um gráfico circular da família pie em cada célula: perfis × anos.' },
        { id: 'confusion-matrix', title: 'Confusion Matrix', description: 'Um classificador de sinais comprar / manter / vender, com totais, recall e precisão.' },
        { id: 'responsive-grid', title: 'Responsive grid layout based on matrix', description: 'Um dashboard de gráficos que passa de 3 colunas para 2 e para 1 com a largura.' },
        { id: 'stock-application', title: 'Matrix Stock Application', description: 'Uma watchlist: preço, variação, sparkline, volume, velas e intervalo de 52 semanas.' },
        { id: 'sparkline-matrix', title: 'Mini Line Charts (Sparkline) in Matrix', description: 'Países por continente × trimestres por ano, uma sparkline por célula.' },
        {
          id: 'mini-bars-matrix',
          title: 'Mini Bars and Geo in Matrix',
          description: 'Barras por trimestre e, sem mapas na biblioteca, um cartograma de Portugal em quadrados desenhado à mão.',
        },
        { id: 'periodic-table', title: 'Periodic Table', description: '118 elementos, buracos escondidos, cores por categoria e legenda que filtra.' },
        { id: 'mbti-compatibility', title: 'MBTI Partner Compatibility', description: '16 × 16 tipos agrupados nos cabeçalhos, com níveis de compatibilidade por cor.' },
      ],
    },
  ],
  groups: [
    { title: 'Básico', items: ['basic'] },
    { title: 'Personalizar', items: ['themes'] },
  ],
  docs: [{ id: 'api', title: 'Referência da API' }],
  headline: '<span class="grad">Matrizes</span><br />e grelhas',
  features: [
    ['🧱', 'Cabeçalhos com níveis', 'Ano › trimestre › mês nos dois lados; os pais ocupam os filhos.'],
    ['🔗', 'Células unidas', 'Por intervalo, pelo nome de um cabeçalho pai ou com colSpan / rowSpan; buracos escondidos.'],
    ['🎨', 'visualMap', 'Cores contínuas com barra ou por peças / categorias com legenda que filtra.'],
    ['✏️', 'Desenho próprio', 'renderCell desenha cada célula em canvas: sparklines, barras, velas, milhares de células.'],
    ['🧩', 'Gráficos nas células', 'mount põe qualquer família numa célula (pie, line, bar…) e destrói-a no fim.'],
    ['📱', 'Responsivo', 'Regras media por largura: um dashboard que passa de 3 colunas para 2 e para 1.'],
    ['🎯', 'Interação', 'Realce em cruz, tooltip, eventos e seleção de células, linhas e colunas.'],
    ['🪶', 'Leve e separado', 'Sem dependências e sem carregar as outras famílias.'],
  ],
  preview: (el) => {
    const names = ASSETS.slice(0, 6);
    const c = createMatrixChart(el, {
      x: { data: names, label: { fontSize: 10 } },
      y: { data: names, label: { fontSize: 10 } },
      data: heatmapCorrelation(assetReturns().slice(0, 6)).map((r) => r.map((v) => +v.toFixed(2))),
      visualMap: { min: -1, max: 1, colors: ['#1848cc', '#5b8def', '#2a2e39', '#ef5350', '#b71c1c'], show: false },
      gap: 2,
      cellAspect: 1.3,
      label: { fontSize: 11 },
      valueFormatter: (v) => v.toFixed(2),
    });
    return () => c.destroy();
  },
};
