/** Data for the tree examples (structure made up for the demo; values are rough sizes, not real figures). */
import type { TreeChartNode } from 'openchartscandle/tree';

const leaves = (names: string[]): TreeChartNode[] => names.map((name) => ({ name }));
const sized = (rows: [string, number][]): TreeChartNode[] => rows.map(([name, value]) => ({ name, value }));

/** Markets → classes → sectors → instruments (≈ 120 nodes). Values: rough size in thousands of millions. */
export function marketsTree(): TreeChartNode {
  return {
    name: 'Mercados',
    children: [
      {
        name: 'Ações',
        children: [
          { name: 'Tecnologia', children: sized([['Apple', 3400], ['Microsoft', 3100], ['Nvidia', 3300], ['Alphabet', 2100], ['Meta', 1400], ['ASML', 280]]) },
          { name: 'Saúde', children: sized([['Eli Lilly', 760], ['Novo Nordisk', 420], ['J&J', 380], ['Roche', 250]]) },
          { name: 'Energia', children: sized([['Exxon', 470], ['Shell', 210], ['Galp', 13], ['EDP', 15]]) },
          { name: 'Finanças', children: sized([['JPMorgan', 680], ['Visa', 610], ['BCP', 9], ['Santander', 90]]) },
          { name: 'Consumo', children: sized([['Amazon', 2200], ['LVMH', 330], ['Jerónimo Martins', 13], ['Nestlé', 230]]) },
        ],
      },
      {
        name: 'Obrigações',
        children: [
          { name: 'Dívida pública', children: leaves(['Portugal 10A', 'Alemanha 10A', 'EUA 10A', 'Itália 10A', 'Japão 10A']) },
          { name: 'Empresas', children: leaves(['Investment grade', 'High yield', 'Convertíveis']) },
          { name: 'Indexadas à inflação', children: leaves(['TIPS', 'OATi']) },
        ],
      },
      {
        name: 'Matérias-primas',
        children: [
          { name: 'Energia', children: leaves(['Brent', 'WTI', 'Gás natural']) },
          { name: 'Metais preciosos', children: leaves(['Ouro', 'Prata', 'Platina']) },
          { name: 'Metais industriais', children: leaves(['Cobre', 'Alumínio', 'Níquel']) },
          { name: 'Agrícolas', children: leaves(['Trigo', 'Milho', 'Café', 'Cacau']) },
        ],
      },
      {
        name: 'Cripto',
        children: [
          { name: 'Camada 1', children: sized([['Bitcoin', 1900], ['Ethereum', 420], ['Solana', 90], ['Cardano', 25]]) },
          { name: 'Stablecoins', children: sized([['USDT', 160], ['USDC', 70]]) },
          { name: 'DeFi', children: sized([['Uniswap', 8], ['Aave', 4], ['Maker', 2]]) },
        ],
      },
      {
        name: 'Forex',
        children: [
          { name: 'Principais', children: leaves(['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF']) },
          { name: 'Cruzados', children: leaves(['EUR/GBP', 'EUR/JPY', 'GBP/JPY']) },
          { name: 'Emergentes', children: leaves(['USD/BRL', 'USD/TRY', 'USD/ZAR']) },
        ],
      },
    ],
  };
}

/** The folders and modules of this library (simplified). */
export function libraryTree(): TreeChartNode {
  const fam = (name: string, files: string[]): TreeChartNode => ({ name, children: leaves(files) });
  return {
    name: 'openchartscandle',
    children: [
      fam('candlestick', ['core', 'indicators', 'drawings', 'ui', 'styles']),
      fam('line', ['line.ts', 'types.ts', 'styles']),
      fam('bar', ['bar.ts', 'types.ts', 'styles']),
      fam('pie', ['pie.ts', 'types.ts', 'styles']),
      fam('gauge', ['gauge.ts', 'zones.ts', 'styles']),
      fam('treemap', ['treemap.ts', 'sunburst.ts', 'squarify.ts']),
      fam('scatter', ['scatter.ts', 'regression.ts', 'styles']),
      fam('calendar', ['calendar.ts', 'layout.ts', 'styles']),
      fam('radar', ['radar.ts', 'geometry.ts', 'styles']),
      fam('graph', ['graph.ts', 'layout.ts', 'styles']),
      fam('tree', ['tree.ts', 'layout.ts', 'styles']),
      fam('shared', ['color.ts', 'curve.ts', 'format.ts']),
    ],
  };
}

/** A small company org chart. */
export function orgTree(): TreeChartNode {
  return {
    name: 'Administração',
    children: [
      { name: 'Investimentos', children: [{ name: 'Ações', children: leaves(['Europa', 'EUA', 'Ásia']) }, { name: 'Rendimento fixo', children: leaves(['Soberana', 'Crédito']) }, { name: 'Quant' }] },
      { name: 'Risco', children: leaves(['Mercado', 'Crédito', 'Operacional']) },
      { name: 'Tecnologia', children: [{ name: 'Plataforma', children: leaves(['Dados', 'Execução']) }, { name: 'Produto' }, { name: 'Segurança' }] },
      { name: 'Operações', children: leaves(['Liquidação', 'Contabilidade']) },
      { name: 'Comercial', children: leaves(['Particulares', 'Institucionais']) },
    ],
  };
}
