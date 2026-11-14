import { createSankeyChart } from 'openchartscandle/sankey';
import type { ExampleMeta, Family } from '../site/registry';
import { incomeLevels, incomeStatement } from './data';

/** The sankey family on the site: examples (demo/sankey/examples), gallery (demo/sankey/gallery) and docs. */
const EXAMPLES: ExampleMeta[] = [
  {
    id: 'basic',
    title: 'Fluxos de uma carteira',
    description:
      'Do salário às posições da carteira, ou da receita ao lucro líquido de uma empresa: troca os dados, o alinhamento, a orientação e a cor das ligações; arrasta os nós; clica para ver os totais.',
    height: 600,
    api: ['createSankeyChart', 'nodeAlign', 'orient', 'lineStyle.color', 'levels', 'setOptions', "on('click')"],
  },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um sankey sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'colors', "lineStyle: { color: 'gradient' }"] },
];

export const SANKEY_FAMILY: Family = {
  id: 'sankey',
  title: 'Sankey',
  tag: 'fluxos',
  description:
    'Diagramas de fluxo: nós em colunas com a altura proporcional ao valor e ligações com a largura do fluxo, coloridas pela origem, pelo destino ou em gradiente. Alinhamento justify / left / right, horizontal ou vertical, níveis, destaque das adjacências, nós que se arrastam e atualizações animadas.',
  importPath: 'openchartscandle/sankey',
  mainExports: 'createSankeyChart',
  examples: EXAMPLES,
  gallery: [
    {
      title: 'Sankey',
      items: [
        { id: 'basic-sankey', title: 'Basic Sankey', description: 'O orçamento de uma família: rendimentos → despesas e poupança → investimentos.' },
        { id: 'sankey-vertical', title: 'Sankey Orient Vertical', description: 'O mesmo orçamento de cima para baixo, com ligações em gradiente.' },
        { id: 'sankey-itemstyle', title: 'Specify ItemStyle for Each Node in Sankey', description: 'Um rebalanceamento de janeiro para dezembro, com a cor, a borda e os cantos de cada nó.' },
        { id: 'sankey-levels', title: 'Sankey with Levels Setting', description: 'A demonstração de resultados de uma empresa, com cor e opacidade por coluna.' },
        { id: 'sankey-gradient', title: 'Gradient Edge', description: 'Os fluxos de energia de um país: 40 nós e 82 ligações em gradiente, com destaque do percurso.' },
        { id: 'sankey-left', title: 'Node Align Left in Sankey', description: 'Os mesmos fluxos com cada nó na coluna da sua profundidade.' },
        { id: 'sankey-right', title: 'Node Align Right in Sankey', description: 'E com cada nó encostado ao fim, pela distância ao último destino.' },
      ],
    },
  ],
  groups: [
    { title: 'Básico', items: ['basic'] },
    { title: 'Personalizar', items: ['themes'] },
  ],
  docs: [{ id: 'api', title: 'Referência da API' }],
  headline: '<span class="grad">Sankey</span><br />e fluxos',
  features: [
    ['🌊', 'Fluxos proporcionais', 'A altura de cada nó e a largura de cada ligação seguem o valor que passa por lá.'],
    ['🧮', 'Layout que desembaraça', 'Colunas pelo caminho mais longo e várias passagens de relaxação para cruzar o menos possível.'],
    ['↔️', 'Alinhar e orientar', "nodeAlign justify, left ou right; horizontal ou vertical; depth de cada nó à mão."],
    ['🎨', 'Cores', 'Paleta, itemStyle por nó, níveis por coluna e ligações pela origem, pelo destino ou em gradiente.'],
    ['🔦', 'Destaque', 'Adjacências ou o percurso todo de um nó, com tooltip de entradas, saídas e A → B.'],
    ['✋', 'Arrastar nós', 'Arrasta um nó ao longo da coluna e as ligações seguem-no.'],
    ['🎬', 'Animação', 'O fluxo entra da esquerda para a direita e os nós deslizam quando os dados mudam.'],
    ['🪶', 'Leve e separado', 'Sem dependências e sem carregar as outras famílias.'],
  ],
  preview: (el) => {
    const chart = createSankeyChart(el, {
      ...incomeStatement(),
      nodeAlign: 'left',
      levels: incomeLevels,
      nodeGap: 12,
      label: { formatter: (n) => `${n.name}\n$${n.value} mM` },
      valueFormat: (v) => `$${v} mM`,
    });
    return () => chart.destroy();
  },
};
