/**
 * Dados dos exemplos de sankey. Todos os valores são inventados ou aproximados, só para ilustrar (ver cada
 * comentário).
 */
import type { SankeyLevel, SankeyLink, SankeyNode } from 'openchartscandle/sankey';

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const flows = (rows: [string, string, number][]): SankeyLink[] => rows.map(([source, target, value]) => ({ source, target, value }));
/** Os nós pela ordem em que aparecem nas ligações. */
const nodesOf = (links: SankeyLink[]): SankeyNode[] => [...new Set(links.flatMap((l) => [String(l.source), String(l.target)]))].map((name) => ({ name }));

/** Orçamento mensal de uma família (€, inventado). */
export function budgetFlow(): SankeyData {
  const links = flows([
    ['Salário', 'Orçamento', 2400],
    ['Freelance', 'Orçamento', 600],
    ['Orçamento', 'Casa', 900],
    ['Orçamento', 'Alimentação', 450],
    ['Orçamento', 'Transportes', 200],
    ['Orçamento', 'Lazer', 250],
    ['Orçamento', 'Poupança', 1200],
    ['Poupança', 'ETF', 800],
    ['Poupança', 'Emergência', 400],
  ]);
  return { nodes: nodesOf(links), links };
}

/**
 * Demonstração de resultados de uma tecnológica imaginária (mil milhões de $, valores inventados): segmentos →
 * receita → lucro bruto / custo das vendas → lucro operacional / despesas → lucro líquido / impostos.
 */
export function incomeStatement(): SankeyData {
  const links = flows([
    ['Publicidade', 'Receita', 175],
    ['Cloud', 'Receita', 92],
    ['Hardware', 'Receita', 28],
    ['Subscrições', 'Receita', 12],
    ['Receita', 'Lucro bruto', 175],
    ['Receita', 'Custo das vendas', 132],
    ['Lucro bruto', 'Lucro operacional', 84],
    ['Lucro bruto', 'Despesas operacionais', 91],
    ['Despesas operacionais', 'I&D', 45],
    ['Despesas operacionais', 'Vendas e marketing', 28],
    ['Despesas operacionais', 'Administrativas', 18],
    ['Lucro operacional', 'Lucro líquido', 72],
    ['Lucro operacional', 'Impostos', 12],
  ]);
  const red = new Set(['Custo das vendas', 'Despesas operacionais', 'I&D', 'Vendas e marketing', 'Administrativas', 'Impostos']);
  const green = new Set(['Lucro bruto', 'Lucro operacional', 'Lucro líquido']);
  const nodes = nodesOf(links).map((n) => ({
    ...n,
    itemStyle: red.has(n.name) ? { color: '#f23645' } : green.has(n.name) ? { color: '#089981' } : undefined,
  }));
  // os custos e os lucros levam a cor do destino; o resto, a da origem
  for (const l of links) if (red.has(String(l.target)) || green.has(String(l.target))) l.lineStyle = { color: 'target' };
  return { nodes, links };
}

/** Níveis da demonstração de resultados: cor por coluna e ligações mais fortes nas primeiras colunas. */
export const incomeLevels: SankeyLevel[] = [
  { depth: 0, lineStyle: { color: 'source', opacity: 0.45 } },
  { depth: 1, itemStyle: { color: '#2962ff' }, lineStyle: { opacity: 0.4 } },
  { depth: 2, lineStyle: { opacity: 0.35 } },
  { depth: 3, lineStyle: { opacity: 0.3 } },
  { depth: 4, label: { fontWeight: 600 } },
];

/**
 * Fluxos de energia de um país imaginário (PJ por ano, valores inventados e arredondados, inspirados nos
 * balanços energéticos publicados): fontes primárias → conversão → combustíveis e redes → setores → usos finais
 * e perdas. 40 nós, 82 ligações.
 */
export function energyFlows(): SankeyData {
  const links = flows([
    // fontes primárias
    ['Petróleo', 'Refinarias', 1200],
    ['Petróleo', 'Usos não energéticos', 60],
    ['Gás natural', 'Ciclo combinado', 380],
    ['Gás natural', 'Cogeração', 90],
    ['Gás natural', 'Rede de gás', 420],
    ['Gás natural', 'Hidrogénio', 30],
    ['Carvão', 'Centrais térmicas', 260],
    ['Carvão', 'Indústria', 70],
    ['Carvão', 'Cogeração', 20],
    ['Nuclear', 'Centrais térmicas', 300],
    ['Hídrica', 'Rede elétrica', 140],
    ['Eólica', 'Rede elétrica', 160],
    ['Solar', 'Rede elétrica', 70],
    ['Solar', 'Residencial', 20],
    ['Biomassa', 'Biocombustíveis', 90],
    ['Biomassa', 'Cogeração', 60],
    ['Biomassa', 'Residencial', 50],
    ['Biomassa', 'Aquecimento urbano', 20],
    ['Geotermia', 'Aquecimento urbano', 15],
    ['Geotermia', 'Rede elétrica', 10],
    ['Resíduos', 'Cogeração', 30],
    ['Resíduos', 'Aquecimento urbano', 25],
    // conversão
    ['Refinarias', 'Gasolina', 380],
    ['Refinarias', 'Gasóleo', 460],
    ['Refinarias', 'Jet fuel', 150],
    ['Refinarias', 'GPL', 60],
    ['Refinarias', 'Fuelóleo', 90],
    ['Refinarias', 'Usos não energéticos', 30],
    ['Refinarias', 'Perdas de conversão', 30],
    ['Biocombustíveis', 'Gasolina', 25],
    ['Biocombustíveis', 'Gasóleo', 45],
    ['Biocombustíveis', 'Perdas de conversão', 20],
    ['Centrais térmicas', 'Rede elétrica', 250],
    ['Centrais térmicas', 'Perdas de conversão', 310],
    ['Ciclo combinado', 'Rede elétrica', 210],
    ['Ciclo combinado', 'Perdas de conversão', 170],
    ['Cogeração', 'Rede elétrica', 70],
    ['Cogeração', 'Aquecimento urbano', 80],
    ['Cogeração', 'Indústria', 20],
    ['Cogeração', 'Perdas de conversão', 30],
    ['Hidrogénio', 'Indústria', 18],
    ['Hidrogénio', 'Transporte rodoviário', 4],
    ['Hidrogénio', 'Perdas de conversão', 8],
    // redes
    ['Rede de gás', 'Residencial', 170],
    ['Rede de gás', 'Serviços', 80],
    ['Rede de gás', 'Indústria', 150],
    ['Rede de gás', 'Transporte rodoviário', 10],
    ['Rede de gás', 'Perdas na rede', 10],
    ['Rede elétrica', 'Indústria', 290],
    ['Rede elétrica', 'Residencial', 260],
    ['Rede elétrica', 'Serviços', 220],
    ['Rede elétrica', 'Ferrovia', 25],
    ['Rede elétrica', 'Transporte rodoviário', 15],
    ['Rede elétrica', 'Agricultura', 15],
    ['Rede elétrica', 'Perdas na rede', 55],
    ['Rede elétrica', 'Exportações', 30],
    ['Aquecimento urbano', 'Residencial', 80],
    ['Aquecimento urbano', 'Serviços', 45],
    ['Aquecimento urbano', 'Perdas na rede', 15],
    // combustíveis
    ['Gasolina', 'Transporte rodoviário', 395],
    ['Gasolina', 'Navegação', 10],
    ['Gasóleo', 'Transporte rodoviário', 360],
    ['Gasóleo', 'Agricultura', 45],
    ['Gasóleo', 'Navegação', 40],
    ['Gasóleo', 'Ferrovia', 15],
    ['Gasóleo', 'Indústria', 45],
    ['Jet fuel', 'Aviação', 150],
    ['GPL', 'Residencial', 30],
    ['GPL', 'Serviços', 10],
    ['GPL', 'Indústria', 10],
    ['GPL', 'Transporte rodoviário', 10],
    ['Fuelóleo', 'Navegação', 60],
    ['Fuelóleo', 'Indústria', 30],
    // usos finais
    ['Residencial', 'Aquecimento', 350],
    ['Residencial', 'Iluminação e aparelhos', 210],
    ['Residencial', 'Arrefecimento', 50],
    ['Serviços', 'Aquecimento', 150],
    ['Serviços', 'Iluminação e aparelhos', 140],
    ['Serviços', 'Arrefecimento', 65],
    ['Indústria', 'Processos industriais', 520],
    ['Indústria', 'Aquecimento', 70],
    ['Indústria', 'Iluminação e aparelhos', 43],
  ]);
  return { nodes: nodesOf(links), links };
}

/**
 * Para onde vai o investimento mensal de uma carteira (€, inventado): rendimentos → investimento → classes de
 * ativos → posições. A liquidez fica a meio (acaba mais cedo), o que mostra a diferença entre os alinhamentos.
 */
export function portfolioFlows(): SankeyData {
  const links = flows([
    ['Salário', 'Investimento', 1000],
    ['Dividendos', 'Investimento', 180],
    ['Juros', 'Investimento', 70],
    ['Investimento', 'Ações', 700],
    ['Investimento', 'Obrigações', 300],
    ['Investimento', 'Cripto', 100],
    ['Investimento', 'Liquidez', 150],
    ['Ações', 'VWCE', 400],
    ['Ações', 'S&P 500', 200],
    ['Ações', 'Mercados emergentes', 100],
    ['Obrigações', 'Obrigações do Tesouro', 180],
    ['Obrigações', 'Obrigações corporate', 120],
    ['Cripto', 'Bitcoin', 75],
    ['Cripto', 'Ethereum', 25],
  ]);
  return { nodes: nodesOf(links), links };
}

/**
 * Rebalanceamento de uma carteira de 100 000 € (inventado): de onde estava o dinheiro em janeiro para onde está
 * em dezembro. Cada classe tem a sua cor nas duas colunas.
 */
export function rebalance(): SankeyData {
  const classes: [string, string][] = [
    ['Ações EUA', '#2962ff'],
    ['Ações Europa', '#00bcd4'],
    ['Obrigações', '#9c27b0'],
    ['Ouro', '#ffc107'],
    ['Liquidez', '#8bc34a'],
  ];
  const color = new Map(classes);
  const links = flows([
    ['Ações EUA · jan', 'Ações EUA · dez', 30000],
    ['Ações EUA · jan', 'Ações Europa · dez', 5000],
    ['Ações EUA · jan', 'Ouro · dez', 5000],
    ['Ações Europa · jan', 'Ações Europa · dez', 15000],
    ['Ações Europa · jan', 'Obrigações · dez', 5000],
    ['Obrigações · jan', 'Obrigações · dez', 20000],
    ['Obrigações · jan', 'Liquidez · dez', 5000],
    ['Ouro · jan', 'Ouro · dez', 5000],
    ['Liquidez · jan', 'Ações EUA · dez', 6000],
    ['Liquidez · jan', 'Liquidez · dez', 4000],
  ]);
  const nodes = nodesOf(links).map((n) => {
    const c = color.get(n.name.split(' · ')[0])!;
    return { ...n, itemStyle: { color: c, borderColor: '#ffffff', borderWidth: 1, borderRadius: 3 } };
  });
  return { nodes, links };
}

/** € sem casas decimais. */
export const eur = (v: number): string => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
