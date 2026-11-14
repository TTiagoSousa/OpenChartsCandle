import type { ExampleMeta, Family } from '../site/registry';

/** The graph family on the site: examples (demo/graph/examples), gallery (demo/graph/gallery) and docs. */
const EXAMPLES: ExampleMeta[] = [
  {
    id: 'basic',
    title: 'Rede com forças',
    description: 'Uma rede com comunidades num layout de forças: legenda que esconde categorias, tooltip, destaque dos vizinhos, arrastar nós e o evento click.',
    height: 560,
    api: ['createGraphChart', "layout: 'force'", 'categories', "on('click')", 'setData'],
  },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um grafo sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'edge', 'nodeStyle'] },
];

export const GRAPH_FAMILY: Family = {
  id: 'graph',
  title: 'Graph',
  tag: 'grafos · redes',
  description:
    'Nós e ligações: layout de forças (Barnes–Hut, milhares de nós), circular ou em posições dadas, categorias com legenda, arestas curvas com setas e etiquetas, destaque dos vizinhos, arrastar nós, zoom e pan, eixos numéricos, mapas por baixo e animações.',
  importPath: 'openchartscandle/graph',
  mainExports: 'createGraphChart',
  examples: EXAMPLES,
  gallery: [
    {
      title: 'Graph',
      items: [
        { id: 'force-layout', title: 'Force Layout', description: 'Uma rede de 160 nós em oito comunidades a organizar-se sozinha.' },
        { id: 'graph-cartesian', title: 'Graph on Cartesian', description: 'Nós em coordenadas de dados, com eixos, ligados pela ordem.' },
        { id: 'simple-graph', title: 'Simple Graph', description: 'Quatro nós em posições fixas, setas, curvas e texto nas ligações.' },
        { id: 'force-layout-2', title: 'Force Layout', description: 'Nós grandes que se arrastam e não se sobrepõem.' },
        { id: 'hide-overlap', title: 'Hide Overlapped Label', description: 'Todos os nós com nome; os nomes que se tapam escondem-se.' },
        { id: 'les-miserables', title: 'Les Miserables', description: 'As personagens de Os Miseráveis num círculo, com os nomes ao longo do raio.' },
        { id: 'les-miserables-force', title: 'Les Miserables', description: 'As mesmas personagens num layout de forças.' },
        { id: 'graph-dynamic', title: 'Graph Dynamic', description: 'Um nó novo a cada segundo, ligado à rede que já existe.' },
        { id: 'life-expectancy', title: 'Graph Life Expectancy', description: 'Rendimento e esperança de vida de seis países, ano a ano.' },
        { id: 'webkit-dep', title: 'Graph Webkit Dep', description: 'As dependências de 400 módulos, por categoria.' },
        { id: 'npm-dependencies', title: 'NPM Dependencies', description: '1500 pacotes e as suas dependências, com zoom e pan fluidos.' },
        { id: 'geo-graph', title: 'Geo Graph', description: 'As cidades de Portugal e as autoestradas que as ligam, sobre o mapa.' },
        { id: 'calendar-graph', title: 'Calendar Graph', description: 'Reuniões num calendário de quatro meses, ligadas por curvas.' },
      ],
    },
  ],
  groups: [
    { title: 'Básico', items: ['basic'] },
    { title: 'Personalizar', items: ['themes'] },
  ],
  docs: [{ id: 'api', title: 'Referência da API' }],
  headline: '<span class="grad">Grafos</span><br />e redes',
  features: [
    ['🕸️', 'Layout de forças', 'Repulsão Barnes–Hut, molas, gravidade e arrefecimento animado; milhares de nós.'],
    ['⭕', 'Circular e fixo', 'Nós num círculo por categoria, com nomes rodados, ou nas posições que dás.'],
    ['🏷️', 'Etiquetas', 'Nomes à volta ou dentro dos nós, escondidos quando se tapam; texto nas ligações.'],
    ['➰', 'Arestas', 'Retas ou curvas, com setas, espessura e cor própria ou do nó de origem.'],
    ['🔦', 'Destaque', 'Ao passar o rato num nó acendem-se os vizinhos e o resto fica esbatido.'],
    ['🖐️', 'Arrastar, zoom e pan', 'Arrasta nós (o layout reage), roda do rato para zoom e arrasta o fundo.'],
    ['🗺️', 'Eixos e mapas', 'Nós em coordenadas de dados com eixos, ou sobre um mapa ou calendário desenhado por baixo.'],
    ['🪶', 'Leve e separado', 'Sem dependências e sem carregar as outras famílias.'],
  ],
};
