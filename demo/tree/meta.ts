import type { ExampleMeta, Family } from '../site/registry';

/** The tree family on the site: examples (demo/tree/examples), gallery (demo/tree/gallery) and docs. */
const EXAMPLES: ExampleMeta[] = [
  {
    id: 'basic',
    title: 'Árvore de mercados',
    description: 'Uma hierarquia de mercados que abre e fecha com um click, nas quatro orientações e em radial, com o caminho até à raiz no tooltip.',
    height: 600,
    api: ['createTreeChart', 'orient', "layout: 'radial'", 'initialDepth', 'expandAll', "on('click')"],
  },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e uma árvore sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'edgeShape', 'symbol'] },
];

export const TREE_FAMILY: Family = {
  id: 'tree',
  title: 'Tree',
  tag: 'árvores · hierarquias',
  description:
    'Hierarquias em árvore arrumada (Reingold–Tilford): da esquerda para a direita, da direita para a esquerda, de cima para baixo, de baixo para cima ou radial, com ligações curvas ou em cotovelo, nós que abrem e fecham com animação, várias árvores no mesmo gráfico, zoom e pan.',
  importPath: 'openchartscandle/tree',
  mainExports: 'createTreeChart',
  examples: EXAMPLES,
  gallery: [
    {
      title: 'Tree',
      items: [
        { id: 'tree-lr', title: 'From Left to Right Tree', description: 'Mercados → classes → setores → ativos, com os dois primeiros níveis abertos.' },
        { id: 'tree-multiple', title: 'Multiple Trees', description: 'Duas árvores lado a lado, cada uma com o seu espaço e símbolo, e legenda.' },
        { id: 'tree-bt', title: 'From Bottom to Top Tree', description: 'As pastas desta biblioteca, com a raiz em baixo.' },
        { id: 'tree-rl', title: 'From Right to Left Tree', description: 'A mesma ideia ao contrário: raiz à direita, folhas à esquerda.' },
        { id: 'tree-polyline', title: 'Tree with Polyline Edge', description: 'Um organigrama com ligações em cotovelo e nomes em caixas.' },
        { id: 'tree-radial', title: 'Radial Tree', description: 'Toda a árvore de mercados num círculo, com zoom e pan.' },
        { id: 'tree-tb', title: 'From Top to Bottom Tree', description: 'A árvore de mercados de cima para baixo, com os nomes na vertical.' },
      ],
    },
  ],
  groups: [
    { title: 'Básico', items: ['basic'] },
    { title: 'Personalizar', items: ['themes'] },
  ],
  docs: [{ id: 'api', title: 'Referência da API' }],
  headline: '<span class="grad">Árvores</span><br />e hierarquias',
  features: [
    ['🌳', 'Árvore arrumada', 'Pais ao centro dos filhos e subárvores o mais juntas possível, sem se cruzarem.'],
    ['🧭', 'Quatro sentidos e radial', 'LR, RL, TB, BT ou em círculo, com as etiquetas sempre do lado certo.'],
    ['➰', 'Ligações', 'Curvas (com a curvatura que quiseres) ou em cotovelo, como num organigrama.'],
    ['📂', 'Abrir e fechar', 'Click num nó para o abrir ou fechar, com animação; initialDepth, expandAll e collapseAll.'],
    ['🏷️', 'Etiquetas', 'Rodam nas árvores verticais, seguem o raio na radial e escondem-se quando se tapam.'],
    ['🌲', 'Várias árvores', 'Cada uma no seu espaço do gráfico, com legenda para as esconder.'],
    ['🔎', 'Zoom e pan', 'Roda do rato e arrastar (roam), destaque do caminho até à raiz e tooltip.'],
    ['🪶', 'Leve e separado', 'Sem dependências e sem carregar as outras famílias.'],
  ],
};
