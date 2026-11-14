import type { ExampleMeta, Family } from '../site/registry';

/** The boxplot family on the site: examples (demo/boxplot/examples), gallery (demo/boxplot/gallery) and docs. */
const EXAMPLES: ExampleMeta[] = [
  {
    id: 'basic',
    title: 'Boxplot',
    description: 'Três serviços por dia da semana com caixas calculadas a partir dos valores, média, outliers, legenda clicável, tooltip, o evento click e setSeries() animado.',
    height: 520,
    api: ['createBoxplotChart', 'samples', 'mean', 'setSeries', "on('click')"],
  },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um boxplot sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'fill'] },
];

export const BOXPLOT_FAMILY: Family = {
  id: 'boxplot',
  title: 'Boxplot',
  tag: 'caixas de bigodes',
  description:
    'Caixas de bigodes: dadas prontas ou calculadas a partir dos valores (quartis, bigodes a 1,5 × IQR, outliers), várias séries lado a lado, na vertical ou na horizontal, média, pontos dispersos, legenda, tooltip e animações.',
  importPath: 'openchartscandle/boxplot',
  mainExports: 'createBoxplotChart, boxplotStats',
  examples: EXAMPLES,
  gallery: [
    {
      title: 'Boxplot',
      items: [
        { id: 'data-transform-aggregate', title: 'Data Transform Simple Aggregate', description: 'Linhas em bruto agrupadas por país com boxplotAggregate(): uma caixa por país, ordenadas pela mediana.' },
        { id: 'light-velocity', title: 'Boxplot Light Velocity', description: 'As medições da velocidade da luz de Michelson–Morley (1879): cinco caixas com outliers.' },
        { id: 'light-velocity2', title: 'Boxplot Light Velocity2', description: 'As mesmas medições na horizontal, com cada medição como um ponto disperso ao lado da caixa.' },
        { id: 'multiple-categories', title: 'Multiple Categories', description: 'Três cidades lado a lado em cada mês, com a legenda para esconder uma.' },
      ],
    },
  ],
  groups: [
    { title: 'Básico', items: ['basic'] },
    { title: 'Personalizar', items: ['themes'] },
  ],
  docs: [{ id: 'api', title: 'Referência da API' }],
  headline: '<span class="grad">Caixas</span><br />de bigodes',
  features: [
    ['📦', 'Caixas a sério', 'Mínimo, quartis, mediana e máximo, dados prontos ou calculados a partir dos valores.'],
    ['📐', 'Estatística incluída', 'Quartis por interpolação linear, bigodes a 1,5 × IQR (ou outro k) e outliers; boxplotStats para usares à parte.'],
    ['🧮', 'Agregar linhas', 'boxplotAggregate agrupa linhas em bruto por categoria e série.'],
    ['📊', 'Várias séries', 'Caixas agrupadas lado a lado em cada categoria, com a legenda para esconder.'],
    ['↔️', 'Vertical ou horizontal', 'Categorias em baixo ou à esquerda, eixo de valores com marcas redondas.'],
    ['✨', 'Pontos e média', 'Outliers, a média num símbolo e cada valor como ponto disperso por cima ou ao lado.'],
    ['💬', 'Tooltip e eventos', 'Os cinco números, a média e os outliers; eventos click, hover e toggle.'],
    ['🪶', 'Leve e separado', 'Sem carregar as outras famílias.'],
  ],
};
