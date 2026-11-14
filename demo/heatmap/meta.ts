import { createHeatmapChart, heatmapCorrelation } from 'openchartscandle/heatmap';
import type { ExampleMeta, Family } from '../site/registry';
import { ASSETS, assetReturns } from './data';

/** The heatmap family on the site: examples (demo/heatmap/examples), gallery (demo/heatmap/gallery) and docs. */
const EXAMPLES: ExampleMeta[] = [
  { id: 'basic', title: 'Matriz de correlação', description: 'A correlação de oito ativos calculada com heatmapCorrelation(), valores com duas casas, cores divergentes, destaque da linha e da coluna e o evento click.', height: 560, api: ['createHeatmapChart', 'heatmapCorrelation', 'matrix', 'setMatrix', "on('click')"] },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um mapa de calor sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'cell'] },
];

export const HEATMAP_FAMILY: Family = {
  id: 'heatmap',
  title: 'Heatmap',
  tag: 'mapas de calor',
  description:
    'Mapas de calor cartesianos: categorias ou intervalos numéricos em x e y, um valor por célula com cores em gradiente ou por intervalos, legenda com pegas que filtram, etiquetas, destaque da linha e da coluna, zoom e dezenas de milhares de células.',
  importPath: 'openchartscandle/heatmap',
  mainExports: 'createHeatmapChart, heatmapCorrelation',
  examples: EXAMPLES,
  gallery: [
    {
      title: 'Heatmap',
      items: [
        { id: 'heatmap-cartesian', title: 'Heatmap on Cartesian', description: 'Atividade por hora e dia da semana, com o valor em cada célula.' },
        { id: 'heatmap-large', title: 'Heatmap - 20K data', description: '200 × 100 células com pegas na legenda que filtram, zoom e arrastar.' },
        { id: 'heatmap-discrete', title: 'Heatmap - Discrete Mapping of Color', description: 'A mesma grelha com cores por intervalos que se escondem com um clique.' },
        { id: 'calendar-heatmap', title: 'Calendar Heatmap', description: 'Um ano num calendário, a cor de cada dia é o seu valor (família calendar).' },
        { id: 'calendar-heatmap-vertical', title: 'Calendar Heatmap Vertical', description: 'Três anos lado a lado, uma linha por semana (família calendar).' },
      ],
    },
  ],
  groups: [
    { title: 'Básico', items: ['basic'] },
    { title: 'Personalizar', items: ['themes'] },
  ],
  docs: [{ id: 'api', title: 'Referência da API' }],
  headline: '<span class="grad">Mapas</span><br />de calor',
  features: [
    ['🟥', 'Grelha de categorias', 'Nomes ou intervalos numéricos em x e y, dados em [x, y, valor], objetos ou matriz.'],
    ['🎨', 'Cores por valor', 'visualMap em gradiente com pegas que filtram, ou por intervalos que se escondem com um clique.'],
    ['⚡', 'Milhares de células', '20 000 células ou mais, desenhadas por cor e com hit-test por índice.'],
    ['🔍', 'Zoom e arrastar', 'Roda do rato e arrastar em x, y ou ambos; duplo clique volta ao início.'],
    ['🏷️', 'Etiquetas', 'O valor em cada célula, a cor do texto escolhida para se ler, só onde cabe.'],
    ['📈', 'Correlação', 'heatmapCorrelation() faz a matriz de Pearson dos retornos dos teus ativos.'],
    ['💬', 'Tooltip e eventos', 'Linha, coluna e valor; destaque da linha e da coluna; eventos click, hover e zoom.'],
    ['🪶', 'Leve e separado', 'Sem carregar as outras famílias.'],
  ],
  preview: (el) => {
    const names = ASSETS.map(([n]) => n);
    const chart = createHeatmapChart(el, {
      xAxis: { data: names },
      yAxis: { data: names, inverse: true },
      matrix: heatmapCorrelation(assetReturns(120, 3)),
      square: true,
      cell: { gap: 2, radius: 3 },
      label: { format: (v) => v.toFixed(2) },
      emphasis: 'cross',
      visualMap: { min: -1, max: 1, colors: ['#f23645', '#f7f7f7', '#089981'], show: false },
    });
    return () => chart.destroy();
  },
};
