import { createFunnelChart } from 'openchartscandle/funnel';
import type { ExampleMeta, Family } from '../site/registry';
import { signupFunnel } from './data';

/** The funnel family on the site: examples (demo/funnel/examples), gallery (demo/funnel/gallery) and docs. */
const EXAMPLES: ExampleMeta[] = [
  {
    id: 'basic',
    title: 'Funil de abertura de conta',
    description: 'Visitas até à primeira ordem: funil, pirâmide ou horizontal, etiquetas por fora ou por dentro, dados novos animados e a conversão no tooltip.',
    height: 560,
    api: ['createFunnelChart', 'sort', 'orient', 'label.position', 'setData', "on('click')"],
  },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um funil sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'colors', 'minSize'] },
];

export const FUNNEL_FAMILY: Family = {
  id: 'funnel',
  title: 'Funnel',
  tag: 'funis · pirâmides',
  description:
    'Funis e pirâmides: etapas da maior para a menor, espaço entre etapas, etiquetas por fora com linhas ou por dentro, alinhamento à esquerda, à direita ou ao centro, vários funis para comparar, conversão no tooltip e animações.',
  importPath: 'openchartscandle/funnel',
  mainExports: 'createFunnelChart',
  examples: EXAMPLES,
  gallery: [
    {
      title: 'Funnel',
      items: [
        { id: 'funnel-chart', title: 'Funnel Chart', description: 'Cinco etapas de abertura de conta, com os nomes por fora.' },
        { id: 'funnel-compare', title: 'Funnel Compare', description: 'A meta e o mês real lado a lado, encostados ao centro.' },
        { id: 'customized-funnel', title: 'Customized Funnel', description: 'O real por dentro do contorno tracejado da meta.' },
        { id: 'multiple-funnels', title: 'Multiple Funnels', description: 'Quatro funis: à esquerda, à direita, ao centro e uma pirâmide.' },
      ],
    },
  ],
  groups: [
    { title: 'Básico', items: ['basic'] },
    { title: 'Personalizar', items: ['themes'] },
  ],
  docs: [{ id: 'api', title: 'Referência da API' }],
  headline: '<span class="grad">Funis</span><br />e pirâmides',
  features: [
    ['🔻', 'Funil e pirâmide', 'Da maior para a menor, ao contrário, ou pela ordem dada; vertical ou horizontal.'],
    ['📐', 'Tamanhos', 'minSize e maxSize, min e max e espaço entre etapas.'],
    ['🏷️', 'Etiquetas', 'Por fora com linhas (com espaço reservado) ou por dentro, com a cor do texto que se lê.'],
    ['↔️', 'Alinhamento', 'Encostado à esquerda, à direita ou ao centro, para comparar funis lado a lado.'],
    ['🧩', 'Vários funis', 'Cada um no seu espaço ou um por cima do outro (meta e real).'],
    ['📊', 'Conversão', 'O tooltip mostra a percentagem da primeira etapa e da anterior.'],
    ['✨', 'Animações', 'O funil cresce de cima e muda de forma com setData() e com a legenda.'],
    ['🪶', 'Leve e separado', 'Sem dependências e sem carregar as outras famílias.'],
  ],
  preview: (el) => {
    const c = createFunnelChart(el, { data: signupFunnel(), gap: 3, minSize: '12%', legend: false });
    return () => c.destroy();
  },
};
