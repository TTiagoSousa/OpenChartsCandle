import changelog from '../../CHANGELOG.md?raw';
import { BOXPLOT_FAMILY } from '../boxplot/meta';
import { GRAPH_FAMILY } from '../graph/meta';
import { TREE_FAMILY } from '../tree/meta';
import { SANKEY_FAMILY } from '../sankey/meta';
import { FUNNEL_FAMILY } from '../funnel/meta';
import { MATRIX_FAMILY } from '../matrix/meta';
import { CUSTOM_FAMILY } from '../custom/meta';
import { PARALLEL_FAMILY } from '../parallel/meta';
import { HEATMAP_FAMILY } from '../heatmap/meta';

/**
 * Everything the site lists: general pages/docs and, per chart FAMILY,
 * its examples (live + source) and docs. New families (heatmap…) are added to FAMILIES.
 */

export interface ExampleMeta {
  id: string;
  title: string;
  description: string;
  /** Height of the live demo box: 'full' fills the screen */
  height: 'full' | number;
  /** API used, shown as tags */
  api: string[];
}

/** One chart of the gallery: a short, self-contained file in demo/<family>/gallery/<id>.ts */
export interface GalleryItem {
  id: string;
  title: string;
  description: string;
}

export interface GallerySection {
  title: string;
  items: GalleryItem[];
}

export interface Family {
  id: string;
  title: string;
  /** short tag shown next to the title */
  tag: string;
  description: string;
  /** import path of the family */
  importPath: string;
  /** main functions, shown in the import snippet */
  mainExports?: string;
  /** not available yet: shown greyed out in the menu */
  soon?: boolean;
  examples: ExampleMeta[];
  /** sidebar sub-groups of example ids */
  groups: { title: string; items: string[] }[];
  docs: { id: string; title: string }[];
  /** Overview page: big title (HTML), feature cards and a live preview */
  headline?: string;
  features?: [icon: string, title: string, text: string][];
  preview?: (el: HTMLElement) => () => void;
  /** Gallery of small ready-to-copy charts (#/galeria/<family>) */
  gallery?: GallerySection[];
}

const CANDLESTICK_EXAMPLES: ExampleMeta[] = [
  {
    id: 'terminal',
    title: 'Gráfico TradingView',
    description:
      'O terminal completo: pesquisa de símbolos, timeframes, tipos de gráfico, indicadores, 25 ferramentas de desenho, watchlist com detalhes do símbolo e atalhos de teclado. É uma linha de código.',
    height: 'full',
    api: ['createTerminal'],
  },
  {
    id: 'no-watchlist',
    title: 'Sem watchlist',
    description: 'O mesmo terminal sem a lista de símbolos e o painel de informação à direita: mais espaço para o gráfico.',
    height: 'full',
    api: ['createTerminal', 'watchlist: false'],
  },
  {
    id: 'chart-only',
    title: 'Só o gráfico',
    description: 'Sem barras, sem watchlist: só o canvas com a legenda OHLC. Ideal para embutir numa página.',
    height: 560,
    api: ['minimal: true', 'legend: true'],
  },
  {
    id: 'configurable',
    title: 'Playground de opções',
    description: 'Liga e desliga cada peça da interface e da aparência e vê o código gerado para usares no teu projeto.',
    height: 'full',
    api: ['createTerminal', 'TerminalOptions', 'theme'],
  },
  {
    id: 'light-theme',
    title: 'Tema claro',
    description: 'O tema claro pronto a usar, com as cores das velas alteradas por cima. O tema pinta o gráfico e a interface.',
    height: 560,
    api: ['lightTheme', 'theme'],
  },
  {
    id: 'candle-colors',
    title: 'Cores das velas',
    description: 'Corpo, pavio e contorno com cores próprias para alta e baixa, fundo e grelha — e trocar de paleta ao vivo com applyTheme().',
    height: 560,
    api: ['theme', 'candleBorder', 'applyTheme'],
  },
  {
    id: 'compact',
    title: 'Compacto num card',
    description: 'O terminal em tamanho pequeno dentro de um card: barras compactas, borda, cantos arredondados e só as ferramentas escolhidas.',
    height: 460,
    api: ['compact', 'border', 'radius', 'drawingTools'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard com cards',
    description: 'Vários gráficos pequenos numa grelha de cards, cada um com uma aparência diferente, incluindo uma estratégia com estatísticas.',
    height: 'full',
    api: ['minimal', 'compact', 'mouseWheel: false'],
  },
  {
    id: 'sparklines',
    title: 'Sparklines',
    description: 'Mini gráficos de área numa tabela, estilo watchlist: sem eixos, sem crosshair e sem zoom.',
    height: 560,
    api: ["chartType: 'area'", 'priceAxis: false', 'timeAxis: false'],
  },
  {
    id: 'strategy',
    title: 'Estratégia simulada',
    description: 'Cruzamento de médias 9/21 a abrir e fechar posições ao vivo. As entradas e saídas são desenhadas com setTrades() e as estatísticas vêm de tradeStats().',
    height: 'full',
    api: ['setTrades', 'tradeStats'],
  },
  {
    id: 'trade-list',
    title: 'Lista de trades',
    description: 'Trades vindos de fora, cada um com id: mostrar só entradas, só saídas ou ambas sem a linha, procurar pelo id e clicar para ir à entrada ou à saída.',
    height: 'full',
    api: ['tradeList', 'setTradeDisplay', 'goToTrade', 'tradeClick', 'createTradeList'],
  },
  {
    id: 'backtest-zones',
    title: 'Backtest com zonas e fuso',
    description: 'MA 9, MA 21 e RSI 14 internos, o aquecimento, o início da simulação e os períodos excluídos marcados no tempo, e o eixo no fuso horário que escolheres (botões ou o relógio em baixo).',
    height: 'full',
    api: ["createIndicator('sma' | 'rsi')", 'setTimeRanges', 'timezone', 'setTimezone', 'timezoneChanged'],
  },
  {
    id: 'paged-history',
    title: 'Histórico aos blocos',
    description: 'Um datafeed com 5 anos de velas de 1m servidas em blocos de 1000: arrastar carrega o bloco anterior, trocar de intervalo mantém o instante central, ir a um trade de há 3 anos, perder a ligação e voltar (resync).',
    height: 'full',
    api: ['getBars({ to, countBack, signal })', 'noMore', 'onResync', 'goToTime', 'timeframeChanged', 'loadingChanged', 'error'],
  },
  {
    id: 'paper-trading',
    title: 'Paper trading',
    description: 'Compra e vende com botões ao preço atual. Cada operação aparece no gráfico com P&L ao vivo; ao fechar, o resultado fica registado.',
    height: 'full',
    api: ['addTrade', 'updateTrade', 'tradePnl'],
  },
  {
    id: 'markers',
    title: 'Marcadores de sinais',
    description: 'Setas de compra e venda calculadas a partir do RSI e desenhadas com setMarkers().',
    height: 600,
    api: ['setMarkers'],
  },
  {
    id: 'own-data',
    title: 'Dados próprios (createChart)',
    description: 'Só o motor do gráfico, alimentado com um array de velas. Os botões chamam a API diretamente: tipo de gráfico, zoom, escala log, indicador e PNG.',
    height: 600,
    api: ['createChart', 'setData', 'setChartType', 'zoomStep', 'screenshot'],
  },
  {
    id: 'realtime',
    title: 'Tempo real',
    description: 'Um "WebSocket" falso envia um preço a cada 150 ms e o gráfico atualiza com chart.update(). Velas de 5 segundos.',
    height: 560,
    api: ['createChart', 'update'],
  },
  {
    id: 'drawings-api',
    title: 'Desenhos por código',
    description: 'Criar Fibonacci, linhas, perfis de volume e posições com drawings.add(), exportar e importar JSON para guardar no teu backend.',
    height: 'full',
    api: ['drawings.add', 'toJSON', 'fromJSON', 'changed'],
  },
  {
    id: 'events',
    title: 'Eventos',
    description: 'A vela debaixo do cursor num painel externo (crosshairMoved) e um registo de eventos: desenhos, seleção, zoom e indicadores.',
    height: 'full',
    api: ['crosshairMoved', 'drawings.changed', 'viewChanged'],
  },
  {
    id: 'multi-timeframe',
    title: 'Vários timeframes',
    description: 'O mesmo símbolo em 1m, 15m, 1h e 1D lado a lado; os botões mudam o símbolo em todos ao mesmo tempo.',
    height: 'full',
    api: ['createTerminal × 4', 'setSymbol'],
  },
];

const PIE_EXAMPLES: ExampleMeta[] = [
  { id: 'basic', title: 'Pizza', description: 'O gráfico de pizza com tooltip, legenda clicável, etiquetas e animação de entrada. Passa o rato pelas fatias e clica para as selecionar.', height: 520, api: ['createPieChart', 'data', 'valueFormatter'] },
  { id: 'donut', title: 'Donut', description: 'Pizza com buraco: o centro mostra o total e, ao passar o rato, a fatia. Espaço entre fatias e cantos arredondados.', height: 520, api: ['innerRadius', 'center', 'padAngle', 'cornerRadius'] },
  { id: 'half-donut', title: 'Meio donut (gauge)', description: 'Arco de 180°: alocação de carteira e um medidor estilo "medo & ganância".', height: 420, api: ['startAngle', 'endAngle'] },
  { id: 'rose', title: 'Rosa (Nightingale)', description: 'Fatias com o mesmo ângulo e o raio proporcional ao valor — ideal para meses ou dias da semana.', height: 560, api: ['rose: true'] },
  { id: 'styles', title: 'Estilo das fatias', description: 'Tamanho do buraco, espaço entre fatias, cantos arredondados e paletas, a mudar ao vivo.', height: 540, api: ['setOptions', 'colors', 'padAngle', 'cornerRadius'] },
  { id: 'labels', title: 'Etiquetas', description: 'Dentro, fora com linhas-guia (sem se sobreporem) ou automático, e o conteúdo: %, valor, nome ou uma função tua.', height: 560, api: ['labels.position', 'labels.content'] },
  { id: 'legend', title: 'Legenda', description: 'Em qualquer lado, com ou sem valores. Clicar esconde/mostra a fatia e passar o rato destaca-a.', height: 520, api: ['legend', 'toggle'] },
  { id: 'tooltip', title: 'Tooltip personalizado', description: 'O formatter devolve HTML: aqui o tooltip mostra quanto comprar ou vender para chegar à meta da carteira.', height: 520, api: ['tooltip.formatter'] },
  { id: 'group-others', title: 'Agrupar em "Outros"', description: 'Fatias abaixo de X% juntam-se numa só; o tooltip dessa fatia lista o que está lá dentro.', height: 520, api: ['groupBelow', 'othersLabel'] },
  { id: 'live-data', title: 'Dados ao vivo', description: 'setData() anima as fatias para os novos valores; com sort a ordem também muda. Acrescenta e remove ativos.', height: 540, api: ['setData', 'sort', 'animation'] },
  { id: 'events', title: 'Eventos e API', description: 'hover, click, select e toggle, e os métodos select(), toggle(), highlight() e screenshot().', height: 'full', api: ['on', 'select', 'toggle', 'highlight', 'screenshot'] },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro e um tema próprio com fundo, texto, linhas e tooltip personalizados.', height: 460, api: ["theme: 'light'", 'theme: {…}'] },
  { id: 'cards', title: 'Pizza em cards', description: "Com background: 'transparent' o gráfico usa a cor, o gradiente ou o vidro do card — incluindo nos espaços entre fatias. Seis estilos de card diferentes.", height: 'full', api: ["background: 'transparent'", 'gradient', 'shadow', 'legend.marker'] },
  { id: 'dashboard', title: 'Dashboard com velas', description: 'Pizzas da carteira ao lado de um gráfico de velas: clicar numa fatia muda o ativo do gráfico. Duas famílias juntas.', height: 'full', api: ['openchartscandle/pie', 'openchartscandle/candlestick'] },
  { id: 'playground', title: 'Playground de opções', description: 'Todas as opções num painel e o código gerado, pronto a copiar.', height: 'full', api: ['PieOptions'] },
];

const LINE_EXAMPLES: ExampleMeta[] = [
  { id: 'basic', title: 'Várias linhas', description: 'Três séries ao longo do tempo: eixo de datas automático, tooltip partilhado com todas as séries no dia sob o cursor e legenda clicável.', height: 520, api: ['createLineChart', 'series'] },
  { id: 'area', title: 'Área', description: 'Uma série com preenchimento em gradiente e curva suave monotónica (não inventa máximos nem mínimos entre pontos).', height: 480, api: ['area', "curve: 'smooth'"] },
  { id: 'stacked', title: 'Áreas empilhadas', description: 'Cada série por cima da anterior, ou em 100% para ver a proporção. O tooltip mostra os valores reais.', height: 520, api: ['stacked', "stacked: 'percent'"] },
  { id: 'curves', title: 'Curvas e pontos', description: 'Reta, suave ou degraus; pontos em círculo, quadrado, losango ou triângulo; linhas tracejadas e pontos ocos.', height: 520, api: ['curve', 'points', 'dash'] },
  { id: 'categories', title: 'Categorias', description: 'Eixo de meses com o valor escrito por cima de cada ponto e o eixo Y a começar no zero.', height: 480, api: ['categories', 'labels', 'beginAtZero'] },
  { id: 'dual-axis', title: 'Dois eixos Y', description: 'Preço à esquerda e funding rate à direita, cada um com a sua escala e formato.', height: 520, api: ["axis: 'right'", 'y2Axis'] },
  { id: 'gaps', title: 'Falhas nos dados', description: 'Valores null partem a linha (sensor desligado); com spanGaps a linha liga por cima da falha.', height: 480, api: ['null', 'spanGaps'] },
  { id: 'annotations', title: 'Anotações', description: 'Linhas de alvo e stop, uma faixa de zona de compra e marcadores verticais de eventos.', height: 520, api: ['annotations.y', 'annotations.bands', 'annotations.x'] },
  { id: 'compare', title: 'Comparar desempenho', description: 'Cinco ativos em % desde o início, tooltip ordenado do melhor para o pior e crosshair horizontal.', height: 540, api: ['tooltip.sort', 'crosshair.horizontal'] },
  { id: 'tooltip', title: 'Tooltip', description: 'Partilhado ou ponto único, e um formatter com HTML próprio (aqui a diferença entre real e previsto).', height: 500, api: ['tooltip.mode', 'tooltip.formatter'] },
  { id: 'zoom', title: 'Zoom e pan', description: '5 anos de dados diários: roda do rato faz zoom, arrastar move, duplo clique repõe; botões 1M/6M/1A com setZoom().', height: 540, api: ['zoom', 'setZoom', 'resetZoom'] },
  { id: 'realtime', title: 'Tempo real', description: 'Bid, ask e média a cada 250 ms com appendPoint() e uma janela deslizante (maxPoints).', height: 500, api: ['appendPoint', 'maxPoints'] },
  { id: 'events', title: 'Eventos e API', description: 'hover, click, toggle e zoom; e addSeries, removeSeries, updateSeries, highlight, toggle e screenshot.', height: 'full', api: ['on', 'addSeries', 'updateSeries', 'highlight'] },
  { id: 'cards', title: 'Linhas em cards', description: "KPIs com mini gráficos sem eixos e cards grandes (claro e gradiente), tudo com background: 'transparent'.", height: 'full', api: ["background: 'transparent'", 'xAxis.show', 'yAxis.show'] },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro e um tema próprio com fundo, grelha, eixos e tooltip personalizados.', height: 460, api: ["theme: 'light'", 'theme: {…}'] },
  { id: 'playground', title: 'Playground de opções', description: 'Séries, curvas, áreas, empilhamento, pontos, eixos, legenda, tooltip e aparência num painel, com o código gerado.', height: 'full', api: ['LineOptions'] },
];

const BAR_EXAMPLES: ExampleMeta[] = [
  { id: 'basic', title: 'Colunas', description: 'Uma série por mês com o valor por cima de cada coluna e uma linha de média.', height: 480, api: ['createBarChart', 'labels', 'annotations'] },
  { id: 'grouped', title: 'Agrupadas', description: 'Três anos lado a lado em cada trimestre; o tooltip mostra todas as séries e a legenda esconde uma série.', height: 480, api: ['series', 'barGap', 'categoryGap'] },
  { id: 'stacked', title: 'Empilhadas', description: 'Cada série por cima da anterior, ou em 100% para ver a proporção. O tooltip mostra o total.', height: 520, api: ['stacked', "stacked: 'percent'"] },
  { id: 'horizontal', title: 'Horizontais (ranking)', description: 'Barras deitadas, ordenadas do maior para o menor, com o valor à frente de cada barra.', height: 500, api: ["orientation: 'horizontal'", "sort: 'desc'", 'maxBarWidth'] },
  { id: 'negative', title: 'Valores negativos', description: 'P&L mensal: as barras descem abaixo do zero e colorBy pinta de verde ou vermelho.', height: 480, api: ['colorBy', 'negativeColor'] },
  { id: 'stack-groups', title: 'Grupos de pilhas', description: 'Duas pilhas lado a lado em cada categoria (2024 e 2025), com a propriedade stack de cada série.', height: 520, api: ['stack', 'tooltip.total'] },
  { id: 'overlays', title: 'Médias e tendências', description: 'Linhas sobre as barras: média móvel simples, exponencial e ponderada, tendência linear e exponencial, média e uma meta vinda do backend.', height: 540, api: ['overlays', "type: 'sma' | 'ema'", "type: 'exponential'", 'setOverlays'] },
  { id: 'pareto', title: 'Pareto (acumulado)', description: 'Barras ordenadas e o acumulado em % num segundo eixo à direita, com a linha dos 80%.', height: 520, api: ["type: 'cumulative'", "axis: 'right'", 'rightAxis'] },
  { id: 'tooltip', title: 'Tooltip', description: 'Partilhado, barra única ou um formatter com HTML próprio (aqui o crescimento de um ano para o outro).', height: 500, api: ['tooltip.mode', 'tooltip.formatter'] },
  { id: 'realtime', title: 'Tempo real', description: 'Profundidade do livro de ordens: setData() a cada 600 ms com transição suave entre valores.', height: 520, api: ['setData', 'animation'] },
  { id: 'events', title: 'Eventos e API', description: 'hover, click e toggle; e setValue, updateSeries, toggle, highlight, setOptions e screenshot.', height: 'full', api: ['on', 'setValue', 'updateSeries', 'highlight'] },
  { id: 'cards', title: 'Barras em cards', description: "Mini gráficos sem eixos em KPIs e cards grandes (claro e gradiente), com background: 'transparent'.", height: 'full', api: ["background: 'transparent'", 'valueAxis.show'] },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro e um tema próprio com fundo, grelha, eixos e tooltip personalizados.', height: 460, api: ["theme: 'light'", 'theme: {…}'] },
  { id: 'playground', title: 'Playground de opções', description: 'Orientação, empilhamento, espaços, cantos, valores, eixos, legenda, tooltip e aparência, com o código gerado.', height: 'full', api: ['BarOptions'] },
];

const GAUGE_EXAMPLES: ExampleMeta[] = [
  { id: 'basic', title: 'Velocímetro', description: 'Ponteiro com efeito de mola, zonas verde/amarelo/vermelho, marcas grandes e pequenas e o valor na cor da zona.', height: 520, api: ['createGauge', 'setValue', 'trafficZones'] },
  { id: 'shapes', title: 'Formatos', description: 'Velocímetro (240°), meio círculo, anel completo e ângulos próprios.', height: 'full', api: ['shape', 'startAngle', 'endAngle'] },
  { id: 'progress', title: 'Arco de progresso', description: 'Sem ponteiro, para KPIs, metas e percentagens: espessura, pontas e cores.', height: 'full', api: ['needle: false', 'progress', 'thickness'] },
  { id: 'zones', title: 'Zonas e marcadores', description: 'Fear & Greed Index com cinco zonas com nome (no tooltip) e marcadores de ontem e da semana passada.', height: 520, api: ['zones', 'markers', 'zoneGap'] },
  { id: 'needles', title: 'Ponteiros e animação', description: 'Clássico, linha e seta; cor, espessura e comprimento; animação com mola, suave ou linear.', height: 'full', api: ['needle', 'animation.easing'] },
  { id: 'realtime', title: 'Tempo real', description: "Carga do CPU a cada 500 ms com setValue(); o evento 'zone' avisa quando muda de zona.", height: 500, api: ['setValue', "on('zone')"] },
  { id: 'dashboard', title: 'Painel de carro', description: 'Conta-rotações, velocímetro e combustível a mexer juntos. Mantém premido o botão para acelerar.', height: 460, api: ['gradient', 'progress'] },
  { id: 'cards', title: 'Velocímetros em cards', description: "Fear & Greed, RSI, metas, latência e alavancagem em cards escuros, claros, de vidro e gradiente.", height: 'full', api: ["background: 'transparent'"] },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro e um tema próprio com fundo, trilho, ponteiro e tooltip personalizados.', height: 400, api: ["theme: 'light'", 'theme: {…}'] },
  { id: 'playground', title: 'Playground de opções', description: 'Valor, formato, espessura, zonas/gradiente/progresso, ponteiro, marcas e aparência, com o código gerado.', height: 'full', api: ['GaugeOptions'] },
];

const TREEMAP_EXAMPLES: ExampleMeta[] = [
  { id: 'basic', title: 'Treemap', description: 'O código desta biblioteca por pasta e ficheiro: áreas proporcionais, cabeçalhos com o nome das pastas e clique para entrar.', height: 'full', api: ['createTreemap', 'upperLabel', 'setType'] },
  { id: 'market', title: 'Mapa do mercado', description: 'Setores e ações do S&P 500: área pela capitalização, cor pela variação do dia e atualização a cada 2 s.', height: 'full', api: ['visualDimension', 'CHANGE_COLORS', 'setData'] },
  { id: 'drilldown', title: 'Drill-down', description: 'Um nível de cada vez (leafDepth), caminho em cima, zoomTo / zoomOut e os eventos click e zoom.', height: 'full', api: ['leafDepth', 'breadcrumb', 'zoomTo', "on('zoom')"] },
  { id: 'sunburst', title: 'Sunburst', description: 'Os mesmos dados em anéis: clica num setor para o pôr ao centro, etiquetas radiais ou tangenciais, buraco ao centro.', height: 'full', api: ["type: 'sunburst'", 'sunburst.labelRotate'] },
  { id: 'colors', title: 'Cores por nível', description: 'Paleta, luminosidade e saturação entre irmãos, gradiente pelo valor, lista por nível e cor fixa num nó.', height: 'full', api: ['levels', 'colorLightness', 'colorMappingBy'] },
  { id: 'themes', title: 'Temas', description: "Escuro, claro, um tema próprio e um treemap sem fundo dentro de um card.", height: 'full', api: ["theme: 'light'", "background: 'transparent'"] },
];

const SCATTER_EXAMPLES: ExampleMeta[] = [
  { id: 'basic', title: 'Dispersão', description: 'Duas séries com legenda clicável, tooltip com os valores e animação de entrada da esquerda para a direita.', height: 520, api: ['createScatterChart', 'series', 'animation.delay'] },
  { id: 'bubbles', title: 'Bolhas e visualMap', description: 'Cor e tamanho pelo valor de outras dimensões, com controlos que filtram: arrasta as pontas das barras.', height: 560, api: ['visualMap', 'sizes', 'colors', 'setVisualRange'] },
  { id: 'regression', title: 'Regressões', description: 'Linear, exponencial, logarítmica e polinomial sobre os mesmos pontos, com a fórmula e o R². E a função regression() para usar à parte.', height: 520, api: ['regression', "regression('linear', pts)"] },
  { id: 'zoom-brush', title: 'Zoom e seleção', description: '20 000 pontos: roda do rato para zoom, arrastar para mover, ou modo seleção com o evento brush e a lista do que ficou dentro.', height: 'full', api: ['zoom', 'brush', "on('brush')", 'setZoom'] },
  { id: 'matrix', title: 'Matriz de dispersão', description: 'Todas as combinações de colunas numa grelha, cor por grupo e seleção ligada entre células.', height: 'full', api: ['createScatterMatrix', 'groupBy', "on('brush')"] },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um gráfico sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'"] },
];

const CALENDAR_EXAMPLES: ExampleMeta[] = [
  { id: 'basic', title: 'Mapa de calor de um ano', description: 'Um valor por dia com a legenda de cores, os meses contornados, tooltip e o evento click.', height: 420, api: ['createCalendarChart', 'range', 'data', 'visualMap', "on('click')"] },
  { id: 'month', title: 'Calendário de um mês', description: "Um mês como calendário de parede: o dia no canto, feriados com cor e nome, uma barra desenhada em renderCell e botões que mudam de mês.", height: 560, api: ["orient: 'vertical'", "range: '2026-10'", 'label', 'renderCell', 'setOptions'] },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um calendário sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", 'cell'] },
];

const RADAR_EXAMPLES: ExampleMeta[] = [
  { id: 'basic', title: 'Radar', description: 'Dois fundos em seis indicadores com faixas e valores dos anéis, legenda clicável, tooltip, o evento click e setSeries() animado.', height: 520, api: ['createRadarChart', 'indicators', 'series', 'setSeries', "on('click')"] },
  { id: 'themes', title: 'Temas', description: 'Escuro, claro, um tema próprio e um radar sem fundo dentro de um card.', height: 'full', api: ["theme: 'light'", "background: 'transparent'", "shape: 'circle'"] },
];

export const GENERAL_DOCS: { id: string; title: string }[] = [
  { id: 'estrutura', title: 'Estrutura e famílias' },
  { id: 'versoes', title: 'Versões e publicação' },
  { id: 'changelog', title: 'Changelog' },
];

export const FAMILIES: Family[] = [
  {
    id: 'candlestick',
    title: 'Candlestick',
    tag: 'estilo TradingView',
    description:
      'Gráfico de velas ao estilo TradingView: terminal completo com barras, 25 ferramentas de desenho, SMA, EMA, RSI, perfil de volume por sessão, entradas e saídas com os indicadores da simulação, temas e modo compacto.',
    importPath: 'openchartscandle/candlestick',
    mainExports: 'createTerminal, createChart',
    examples: CANDLESTICK_EXAMPLES,
    gallery: [
      {
        title: 'Tipos de gráfico',
        items: [
          { id: 'candles', title: 'Velas japonesas', description: 'O mais simples: createChart e setData com velas de 1 hora.' },
          { id: 'ohlc-bars', title: 'Barras OHLC', description: 'Traço do mínimo ao máximo, abertura à esquerda e fecho à direita.' },
          { id: 'hollow', title: 'Velas ocas', description: 'As velas que sobem ficam só com o contorno.' },
          { id: 'heikin-ashi', title: 'Heikin Ashi', description: 'Velas suavizadas, boas para ver a tendência.' },
          { id: 'area', title: 'Área', description: 'Só os fechos, com gradiente por baixo. Velas diárias.' },
          { id: 'baseline', title: 'Linha de base', description: 'Verde acima do preço de referência, vermelho abaixo.' },
        ],
      },
      {
        title: 'Aparência',
        items: [
          { id: 'light-theme', title: 'Tema claro', description: 'A opção theme com lightTheme.' },
          { id: 'candle-colors', title: 'Cores das velas', description: 'Corpo, pavio e contorno com cores próprias para as que sobem e as que descem.' },
          { id: 'sparkline', title: 'Sem eixos', description: 'Um gráfico pequeno para cards: sem eixos, sem cruz, sem grelha.' },
          { id: 'timezone', title: 'Fuso horário', description: 'O eixo em UTC, Nova Iorque, Tóquio ou na hora do browser.' },
        ],
      },
      {
        title: 'Indicadores',
        items: [
          { id: 'moving-averages', title: 'Médias móveis', description: 'Médias móveis simples de 20, 50 e 100 velas com createIndicator.' },
          { id: 'rsi-volume', title: 'RSI', description: "createIndicator('rsi') num painel por baixo, com níveis 70/30." },
          { id: 'indicator-timeframe', title: 'Tempo gráfico próprio', description: 'A média e o RSI de 4h num gráfico de 1h, 15m ou 1m, sem olhar para o futuro.' },
        ],
      },
      {
        title: 'Trades',
        items: [
          { id: 'trades', title: 'Entradas e saídas', description: 'Trades vindos de fora, cada um com id, P&L e o último aberto.' },
          { id: 'trades-entries', title: 'Só entradas', description: "setTradeDisplay({ exits: false }): só as setas de entrada." },
          { id: 'trades-exits', title: 'Só saídas', description: 'Só as saídas, com o P&L ao lado de cada seta.' },
          { id: 'trades-no-line', title: 'Ambas sem linha', description: 'Entradas e saídas sem a linha tracejada entre elas.' },
          { id: 'trade-display', title: 'Ligar e desligar', description: 'Os teus botões: Ambas, Entradas, Saídas e a linha.' },
          { id: 'trade-list', title: 'Lista de trades', description: 'Tabela ligada ao gráfico: procurar pelo id e clicar para ir à entrada ou à saída.' },
          { id: 'go-to-trade', title: 'Ir para um trade', description: 'goToTrade(id): o gráfico desliza até à entrada, à saída ou ao trade inteiro.' },
          { id: 'trade-click', title: 'Clicar num trade', description: 'O evento tradeClick: clicar na entrada leva à saída e vice-versa.' },
          { id: 'open-trade', title: 'Trade aberto ao vivo', description: 'P&L a mudar a cada tique; fecha no alvo ou no stop e abre outro.' },
          { id: 'markers', title: 'Marcadores', description: 'Sinais de compra e venda e notas soltas no gráfico.' },
          { id: 'time-ranges', title: 'Zonas e linhas no tempo', description: 'setTimeRanges: aquecimento, início da simulação e períodos excluídos.' },
        ],
      },
      {
        title: 'Desenhos e tempo real',
        items: [
          { id: 'drawings', title: 'Desenhos por código', description: 'Fibonacci, tendência, máximo e uma posição long com alvo e stop.' },
          { id: 'realtime', title: 'Tempo real', description: 'chart.update a cada tique: a última vela muda e nascem velas novas.' },
          { id: 'terminal-trades', title: 'Terminal com lista de trades', description: 'O terminal completo com a opção tradeList por baixo do gráfico.' },
          { id: 'terminal-compact', title: 'Terminal compacto', description: 'Barras, ferramentas e legenda em tamanho pequeno, com dados ao vivo.' },
        ],
      },
    ],
    groups: [
      { title: 'Gráfico TradingView', items: ['terminal', 'no-watchlist', 'chart-only', 'configurable'] },
      { title: 'Aparência', items: ['light-theme', 'candle-colors', 'compact', 'dashboard', 'sparklines'] },
      { title: 'Trading', items: ['strategy', 'backtest-zones', 'trade-list', 'paper-trading', 'markers'] },
      { title: 'Dados e API', items: ['paged-history', 'own-data', 'realtime', 'drawings-api', 'events', 'multi-timeframe'] },
    ],
    headline: 'Gráficos de velas<br />ao estilo <span class="grad">TradingView</span>',
    features: [
    ['📈', 'Gráfico ao estilo TradingView', 'Velas, barras, Heikin Ashi, linha e área, com zoom suave, scroll com inércia e velas nítidas ao pixel.'],
    ['✏️', '25 ferramentas de desenho', 'Linhas, canais, Fibonacci, posições long/short, medições, perfil de volume, formas e texto, com íman e desfazer.'],
    ['🧩', 'Peças à tua escolha', 'Liga e desliga barras, timeframes, tipos de gráfico, indicadores e ferramentas. Ou usa só o gráfico.'],
    ['🎨', 'Aparência total', 'Fundo, grelha, bordas, cores das velas (corpo, pavio e contorno), tema claro e escuro, modo compacto.'],
    ['🔌', 'Qualquer fonte de dados', 'Uma interface Datafeed simples: Binance, a tua base de dados ou um simulador.'],
    ['🧠', 'Indicadores', 'Média móvel simples e RSI, com os mesmos valores do TradingView e cálculo incremental em tempo real.'],
    ['💹', 'Entradas e saídas', 'Trades desenhados como num testador de estratégias, com P&L ao vivo e estatísticas.'],
    ['🪶', 'Leve', 'Cerca de 50 KB gzip, com tipos TypeScript incluídos.'],
  ],
    docs: [
      { id: 'api', title: 'Referência da API' },
      { id: 'datafeed', title: 'Ligar dados (Datafeed)' },
      { id: 'aparencia', title: 'Aparência e tamanhos' },
      { id: 'desenhos', title: 'Ferramentas de desenho' },
      { id: 'entradas-saidas', title: 'Entradas e saídas' },
    ],
  },
  {
    id: 'pie',
    title: 'Pie',
    tag: 'pizza · donut · rosa',
    description:
      'Gráficos circulares: pizza, donut, meio donut (gauge) e rosa, com tooltip, legenda interativa, etiquetas dentro/fora, texto central, seleção, agrupamento em "Outros" e animações.',
    importPath: 'openchartscandle/pie',
    mainExports: 'createPieChart',
    gallery: [
      {
        title: 'Básicos',
        items: [
          { id: 'referer', title: 'Referer of a Website', description: 'Pizza com título, legenda à esquerda e etiquetas por fora.' },
          { id: 'doughnut', title: 'Doughnut Chart', description: 'Donut com o centro vazio que mostra a fatia debaixo do rato.' },
          { id: 'doughnut-rounded', title: 'Doughnut Chart with Rounded Corner', description: 'Donut com cantos arredondados e bordas largas.' },
          { id: 'half-doughnut', title: 'Half Doughnut Chart', description: 'Só a metade de cima, com o total ao centro.' },
          { id: 'pad-angle', title: 'Pie with padAngle', description: 'Fatias separadas por um ângulo, com cantos redondos.' },
        ],
      },
      {
        title: 'Estilo',
        items: [
          { id: 'customized-pie', title: 'Customized Pie', description: 'Rosa por raio, cor pela grandeza, linhas curvas e animação elástica.' },
          { id: 'texture', title: 'Texture on Pie Chart', description: 'Riscas, pontos e xadrez sobre as cores (patterns).' },
          { id: 'nightingale', title: 'Nightingale Chart', description: 'Rosa com ângulos iguais e o raio pelo valor, com buraco e cantos redondos.' },
          { id: 'nightingale-modes', title: 'Nightingale Chart (modos)', description: "Os modos 'radius' e 'area' da rosa lado a lado." },
        ],
      },
      {
        title: 'Etiquetas e legenda',
        items: [
          { id: 'label-align', title: 'Pie Label Align', description: "Etiquetas de fora alinhadas de três maneiras: 'none', 'line' e 'edge'." },
          { id: 'label-line-adjust', title: 'Label Line Adjust', description: 'Etiquetas de duas linhas encostadas às margens, sem se sobreporem.' },
          { id: 'special-label', title: 'Pie Special Label', description: 'Texto rico: ícone, nome, valor e a percentagem numa caixa colorida.' },
          { id: 'scrollable-legend', title: 'Pie with Scrollable Legend', description: '50 fatias com a legenda à direita a fazer scroll.' },
        ],
      },
      {
        title: 'Várias pizzas',
        items: [
          { id: 'nested-pies', title: 'Nested Pies', description: 'Uma pizza no centro e um anel à volta com o detalhe (rings).' },
          { id: 'partition-data', title: 'Partition Data to Pies', description: 'O mesmo conjunto de dados partido por ano, uma pizza por ano.' },
          { id: 'default-arrangement', title: 'Default arrangement', description: 'Várias pizzas arrumadas sozinhas numa grelha que se adapta à largura.' },
          { id: 'geo-map', title: 'Pie Charts on GEO Map', description: 'A origem da eletricidade em cidades de Portugal, com pizzas sobre o mapa.' },
          { id: 'calendar-pie', title: 'Calendar Pie', description: 'Um mês em calendário com uma pizza por dia.' },
          { id: 'share-dataset', title: 'Share Dataset', description: 'Linhas e pizza com os mesmos dados; a pizza segue o ano debaixo do rato.' },
        ],
      },
    ],
    examples: PIE_EXAMPLES,
    groups: [
      { title: 'Tipos', items: ['basic', 'donut', 'half-donut', 'rose'] },
      { title: 'Personalizar', items: ['styles', 'labels', 'legend', 'tooltip', 'themes'] },
      { title: 'Dados e interação', items: ['group-others', 'live-data', 'events'] },
      { title: 'Juntar tudo', items: ['cards', 'dashboard', 'playground'] },
    ],
    docs: [{ id: 'api', title: 'Referência da API' }],
    headline: 'Gráficos de <span class="grad">pizza</span><br />e donut',
    features: [
      ['🥧', 'Pizza, donut, gauge e rosa', 'Um só componente: buraco, ângulo de início/fim e modo rosa (Nightingale).'],
      ['💬', 'Tooltip', 'Segue o rato, mostra valor e %, lista o que está em "Outros" — ou o teu próprio HTML.'],
      ['🏷️', 'Etiquetas inteligentes', 'Dentro quando cabem, fora com linhas-guia que nunca se sobrepõem.'],
      ['📋', 'Legenda interativa', 'Clicar esconde/mostra fatias com animação; passar o rato destaca-as.'],
      ['🎯', 'Seleção e destaque', 'Hover afasta a fatia, clique seleciona-a; eventos para ligar ao resto da app.'],
      ['🎨', 'Aparência', 'Paletas, espaço entre fatias, cantos arredondados, contorno, temas claro/escuro/próprio.'],
      ['✨', 'Animações', 'Entrada em varrimento e transições suaves quando os dados mudam.'],
      ['🪶', 'Leve e separado', 'Cerca de 7 KB gzip, sem carregar o código das velas.'],
    ],
  },
  {
    id: 'line',
    title: 'Line',
    tag: 'linhas · áreas',
    description:
      'Gráficos de linhas e áreas com várias séries: eixo de tempo, números ou categorias, dois eixos Y, áreas empilhadas, tooltip partilhado, anotações, zoom e tempo real.',
    importPath: 'openchartscandle/line',
    mainExports: 'createLineChart',
    examples: LINE_EXAMPLES,
    gallery: [
      {
        title: 'Linhas',
        items: [
          { id: 'basic-line', title: 'Basic Line Chart', description: 'Uma linha com pontos sobre categorias.' },
          { id: 'smoothed-line', title: 'Smoothed Line Chart', description: "A mesma linha com curve: 'smooth'." },
          { id: 'stacked-line', title: 'Stacked Line Chart', description: 'Cinco linhas empilhadas, sem área (area: false).' },
          { id: 'line-gradient', title: 'Line Gradient', description: 'A cor da linha muda pelo valor (em cima) ou ao longo do eixo X (em baixo).' },
          { id: 'bump-chart', title: 'Bump Chart (Ranking)', description: 'Posições ano a ano com o 1.º lugar em cima (yAxis.inverse) e o nome no fim de cada linha.' },
          { id: 'data-filter', title: 'Data Transform Filter', description: 'Uma tabela filtrada no cliente: uma linha por país, a partir de 1950, com o nome no fim.' },
          { id: 'line-race', title: 'Line Race', description: 'Um ano novo a cada 120 ms com appendPoint(); cada linha leva o nome e o valor atual no fim.' },
          { id: 'multiple-x-axes', title: 'Multiple X Axes', description: 'Dois anos no mesmo gráfico: um eixo X em baixo e outro em cima (x2Axis), com a cor de cada série.' },
          { id: 'function-plot', title: 'Function Plot', description: 'Funções matemáticas num eixo X numérico, com os eixos x = 0 e y = 0 marcados.' },
          { id: 'line-style', title: 'Line Style and Item Style', description: 'Linha tracejada, grossa e com sombra; pontos em triângulo com preenchimento e borda próprios.' },
          { id: 'line-types', title: 'Linha, pontilhada e área', description: "Linha normal, linha pontilhada (dash: [2, 4]) e linha com área (area: { gradient: true }) no mesmo gráfico." },
          { id: 'cartesian', title: 'Line Chart in Cartesian Coordinate System', description: 'x e y como valores; a linha segue a ordem dos dados (sortByX: false) e pode voltar para trás.' },
          { id: 'log-axis', title: 'Log Axis', description: 'Eixo logarítmico de base 3: crescimentos exponenciais em linha reta.' },
          { id: 'step-line', title: 'Step Line', description: "Degraus no início, ao meio e no fim ('step-start', 'step-middle', 'step-end')." },
          { id: 'y-category', title: 'Line Y Category', description: 'Os dias no eixo Y (de cima para baixo) e os valores no eixo X.' },
          { id: 'easing', title: 'Line Easing Visualizing', description: 'Uma mini linha por curva de animação (easing), em grelha, com o preset sparkline.' },
          { id: 'sparkline-matrix', title: 'Mini Line Charts (Sparkline) in Matrix', description: 'Uma tabela de ativos e métricas com uma sparkline em cada célula.' },
        ],
      },
      {
        title: 'Áreas',
        items: [
          { id: 'basic-area', title: 'Basic Area Chart', description: 'Área com cor sólida a partir do zero.' },
          { id: 'stacked-area', title: 'Stacked Area Chart', description: 'Cinco áreas empilhadas com tooltip ordenado.' },
          { id: 'gradient-stacked-area', title: 'Gradient Stacked Area Chart', description: 'Áreas suaves com gradientes de duas cores e sem linha.' },
          { id: 'area-pieces', title: 'Area Pieces', description: 'Área preenchida só em alguns intervalos (area.ranges), com os limites marcados.' },
          { id: 'confidence-band', title: 'Confidence Band', description: 'Previsão com intervalo de confiança (band) que alarga com o tempo; o tooltip mostra o intervalo.' },
        ],
      },
      {
        title: 'Tempo, zoom e muitos dados',
        items: [
          { id: 'large-area', title: 'Large scale area chart', description: '20 000 pontos numa área, com a barra de zoom em baixo (zoom.slider).' },
          { id: 'area-time-axis', title: 'Area Chart with Time Axis', description: '5 000 dias com datas formatadas sozinhas conforme o zoom.' },
          { id: 'dynamic-time', title: 'Dynamic Data + Time Axis', description: 'Pontos novos a cada segundo com appendPoint(); os antigos saem pela esquerda (maxPoints).' },
          { id: 'beijing-aqi', title: 'Beijing AQI', description: 'Qualidade do ar diária com a cor da linha por nível (valuePieces) e limites marcados.' },
          { id: 'rainfall', title: 'Rainfall', description: 'Caudal à esquerda e chuva à direita num eixo invertido, a cair do topo.' },
          { id: 'rainfall-evaporation', title: 'Rainfall vs Evaporation', description: 'Dois gráficos ligados: hover e zoom passam de um para o outro (showHover, setZoom).' },
          { id: 'intraday-breaks', title: 'Intraday Chart with Breaks', description: 'Um dia de bolsa com a pausa de almoço escondida no eixo (xAxis.breaks).' },
          { id: 'intraday-breaks-2', title: 'Intraday Chart with Breaks (II)', description: 'Cinco dias seguidos sem noites nem almoços, com um botão para ver o tempo real.' },
        ],
      },
      {
        title: 'Interação e modos especiais',
        items: [
          { id: 'fisheye', title: 'Fisheye Lens on Line Chart', description: 'Uma lupa que alarga o eixo X à volta do rato para ver de perto sem fazer zoom.' },
          { id: 'click-add', title: 'Click to Add Points', description: "Clica no gráfico para acrescentar pontos (evento 'plotclick')." },
          { id: 'draggable', title: 'Draggable Points', description: "Agarra e arrasta os pontos; o evento 'change' dá o novo valor." },
          { id: 'mobile', title: 'Tooltip and DataZoom on Mobile', description: 'Num telemóvel: um dedo mostra os valores, dois dedos fazem zoom, barra de intervalo em baixo.' },
          { id: 'custom-graphic', title: 'Custom Graphic Component', description: 'Marca de água, caixa de texto e uma seta desenhadas por cima com `graphic`.' },
          { id: 'polar', title: 'Two Value-Axes in Polar', description: 'Coordenadas polares: ângulo de 0° a 360° e raio, com uma cardioide e uma rosa.' },
          { id: 'share-dataset', title: 'Share Dataset', description: 'Os mesmos dados numa linha e numa pizza; a pizza mostra o ano debaixo do rato.' },
        ],
      },
      {
        title: 'Marcas e zonas',
        items: [
          { id: 'temperature-week', title: 'Temperature Change in the Coming Week', description: 'Máximas e mínimas com o maior e o menor valor marcados e a média de cada série.' },
          { id: 'electricity', title: 'Distribution of Electricity', description: 'Consumo ao longo do dia com a linha a vermelho nas horas de pico e faixas a marcar os picos.' },
          { id: 'marklines', title: 'Line with Marklines', description: 'Máximo, mínimo e média automáticos, uma meta e uma seta do mínimo ao máximo (segments).' },
        ],
      },
    ],
    groups: [
      { title: 'Básico', items: ['basic', 'area', 'stacked', 'curves', 'categories'] },
      { title: 'Eixos e dados', items: ['dual-axis', 'gaps', 'annotations', 'compare'] },
      { title: 'Interação', items: ['tooltip', 'zoom', 'realtime', 'events'] },
      { title: 'Juntar tudo', items: ['cards', 'themes', 'playground'] },
    ],
    docs: [{ id: 'api', title: 'Referência da API' }],
    headline: 'Gráficos de <span class="grad">linhas</span><br />e áreas',
    features: [
      ['📈', 'Várias séries', 'Quantas linhas quiseres, cada uma com cor, espessura, tracejado, curva, área e pontos próprios.'],
      ['🗓️', 'Eixo de tempo inteligente', 'Datas, horas, meses e anos formatados automaticamente; também números ou categorias.'],
      ['↕️', 'Dois eixos Y', 'Séries com escalas diferentes lado a lado (preço e volume, % e valor).'],
      ['🧱', 'Áreas empilhadas', 'Normal ou 100%, com o tooltip a mostrar os valores reais.'],
      ['💬', 'Tooltip e crosshair', 'Todas as séries no ponto sob o cursor, ou o ponto mais próximo; formatter com HTML.'],
      ['📌', 'Anotações', 'Linhas de referência, faixas e marcadores verticais com etiquetas.'],
      ['🔍', 'Zoom e tempo real', 'Roda do rato, arrastar e setZoom; appendPoint com janela deslizante.'],
      ['🪶', 'Leve e separado', 'Cerca de 11 KB gzip, sem carregar as outras famílias.'],
    ],
  },
  {
    id: 'bar',
    title: 'Bar',
    tag: 'barras · colunas',
    description:
      'Gráficos de barras e colunas: séries agrupadas, empilhadas ou em 100%, valores negativos, vertical ou horizontal, valores nas barras, ranking, tooltip e tempo real.',
    importPath: 'openchartscandle/bar',
    mainExports: 'createBarChart',
    examples: BAR_EXAMPLES,
    gallery: [
      {
        title: 'Básicos e estilo',
        items: [
          { id: 'basic-bar', title: 'Basic Bar', description: 'Colunas simples: uma série com um valor por dia.' },
          { id: 'axis-align-tick', title: 'Axis Align with Tick', description: 'Marcas do eixo alinhadas com o centro de cada coluna (categoryAxis.ticks).' },
          { id: 'bar-background', title: 'Bar with Background', description: 'Cada coluna com um trilho de fundo com a altura total do eixo.' },
          { id: 'single-bar-style', title: 'Set Style of Single Bar', description: 'Uma só barra com cor própria, dada como { value, color }.' },
          { id: 'clickable-gradient', title: 'Clickable Column Chart with Gradient', description: 'Colunas com gradiente; um clique faz zoom à volta da coluna e um duplo clique repõe.' },
          { id: 'label-rotation', title: 'Bar Label Rotation', description: 'Valores rodados dentro das colunas, com seletor de posição e de ângulo.' },
          { id: 'world-population', title: 'World Population', description: 'População por país em barras horizontais agrupadas por ano.' },
          { id: 'weather-statistics', title: 'Weather Statistics', description: 'Dias de sol, nuvens e aguaceiros por cidade, com ícones nos nomes das categorias.' },
          { id: 'watermark', title: 'Watermark - ECharts Download', description: 'Downloads por biblioteca em barras com marca de água (graphic) e a mesma divisão numa pizza.' },
        ],
      },
      {
        title: 'Negativos e cascata',
        items: [
          { id: 'negative-value', title: 'Bar Chart with Negative Value', description: 'Barras horizontais com valores negativos: verde acima de zero, vermelho abaixo.' },
          { id: 'negative-value-2', title: 'Bar Chart with Negative Value (2)', description: 'Lucro, receita e despesas empilhados por dia, com as despesas para a esquerda.' },
          { id: 'waterfall', title: 'Waterfall Chart', description: 'Gastos a flutuar sobre o que sobra, com base invisível e o helper waterfall().' },
          { id: 'waterfall-2', title: 'Waterfall Chart (2)', description: 'Cascata de entradas (verde) e saídas (vermelho) ao longo de 11 dias.' },
        ],
      },
      {
        title: 'Empilhadas',
        items: [
          { id: 'stacked-column', title: 'Stacked Column Chart', description: 'Grupos de pilhas: séries com o mesmo stack empilham juntas e os grupos ficam lado a lado.' },
          { id: 'stacked-radius', title: 'Stacked Bar with borderRadius', description: 'Pilhas com cantos redondos só no segmento de cima.' },
          { id: 'stacked-normalization', title: 'Stacked Bar Normalization', description: 'Empilhadas a 100%: cada coluna mostra a proporção de cada série.' },
          { id: 'normalization-variation', title: 'Stacked Bar Normalization and Variation', description: '100% com largura proporcional ao total de cada categoria (Mekko).' },
          { id: 'stacked-horizontal', title: 'Stacked Horizontal Bar', description: 'Barras horizontais empilhadas com o valor ao centro de cada segmento.' },
        ],
      },
      {
        title: 'Eixos e misturas',
        items: [
          { id: 'rainfall-evaporation', title: 'Rainfall and Evaporation', description: 'Barras agrupadas com máximo, mínimo e média de cada série.' },
          { id: 'mixed-line-bar', title: 'Mixed Line and Bar', description: 'Chuva e evaporação em barras e a temperatura numa linha no eixo da direita.' },
          { id: 'multiple-y-axes', title: 'Multiple Y Axes', description: 'Três eixos de valores: esquerda, direita e um terceiro para a temperatura.' },
          { id: 'axis-breaks', title: 'Bar Chart with Axis Breaks', description: 'Uma quebra no eixo de valores para as barras enormes não esmagarem as outras.' },
          { id: 'axis-breaks-brush', title: 'Bar Chart with Axis Breaks (Brush-enabled)', description: 'Quebra no eixo e seleção por área, com um botão para ver a escala completa.' },
          { id: 'mix-zoom-value', title: 'Mix Zoom On Value', description: 'Barra de zoom nas categorias e um controlo para o máximo do eixo de valores.' },
        ],
      },
      {
        title: 'Polares',
        items: [
          { id: 'polar-bar', title: 'Bar Chart on Polar', description: 'Uma série em coordenadas polares, uma categoria por anel.' },
          { id: 'polar-stacked', title: 'Stacked Bar Chart on Polar', description: 'Três séries empilhadas em anéis polares.' },
          { id: 'polar-stacked-radial', title: 'Stacked Bar Chart on Polar (Radial)', description: 'Três séries empilhadas em fatias que crescem para fora.' },
          { id: 'polar-rounded', title: 'Rounded Bar on Polar', description: 'Barras polares empilhadas com pontas redondas e buraco ao centro.' },
          { id: 'polar-end-angle', title: 'Polar endAngle', description: 'Barras polares num arco de três quartos (0° a 270°).' },
          { id: 'polar-radial-label', title: 'Radial Polar Bar Label Position', description: 'Barras polares radiais com o valor escrito por fora.' },
          { id: 'polar-tangential-label', title: 'Tangential Polar Bar Label Position', description: 'Barras polares em anéis com o valor escrito por dentro.' },
        ],
      },
      {
        title: 'Interação e animação',
        items: [
          { id: 'brush-select', title: 'Brush Select on Column Chart', description: 'Arrasta um retângulo para selecionar barras e ver quantas são e a soma.' },
          { id: 'drilldown', title: 'Bar Chart Drilldown Animation', description: 'Clica numa barra para ver o que a compõe; Voltar regressa ao topo.' },
          { id: 'drilldown-multi', title: 'Bar Chart Multi-level Drilldown Animation', description: 'Continentes → Países → Cidades, com um caminho clicável para voltar a qualquer nível.' },
          { id: 'sort-data', title: 'Sort Data in Bar Chart', description: 'Barras ordenadas que deslizam para o novo lugar quando os valores mudam.' },
          { id: 'animation-delay', title: 'Animation Delay', description: '100 colunas que aparecem uma a uma (animation.stagger), com botão Repetir.' },
          { id: 'bar-race', title: 'Bar Race', description: 'Top 10 de 30 ativos: os valores sobem e as barras trocam de lugar.' },
          { id: 'bar-race-2', title: 'Bar Race (2)', description: 'Corrida de rendimentos por país de 1950 a 2020, com o ano grande ao fundo.' },
          { id: 'dynamic-data', title: 'Dynamic Data', description: 'A cada 2 s sai a primeira categoria e entra uma nova, com barras e linha de preço.' },
          { id: 'large-scale', title: 'Large Scale Bar Chart', description: '20 000 barras com barra de zoom; só a janela visível é desenhada.' },
          { id: 'finance-indices', title: 'Finance Indices 2002', description: 'Barras empilhadas por região e setor ao longo dos anos, com linha do tempo e pizza do ano.' },
        ],
      },
      {
        title: 'Datasets',
        items: [
          { id: 'dataset-simple', title: 'Simple Example of Dataset', description: 'Uma tabela com cabeçalho transformada em barras agrupadas com fromDataset.' },
          { id: 'dataset-objects', title: 'Dataset in Object Array', description: 'Uma lista de objetos (como vem de uma API) transformada em barras agrupadas.' },
          { id: 'simple-encode', title: 'Simple Encode', description: 'Da tabela, o produto vai para as categorias, a quantidade para as barras e a pontuação para a cor.' },
          { id: 'series-layout', title: 'Series Layout By Column or Row', description: 'A mesma tabela lida por colunas e por linhas, lado a lado.' },
          { id: 'mini-bars-matrix', title: 'Mini Bars and Geo in Matrix', description: 'Tabela de regiões e métricas com mini barras em cada célula; sem o mapa geográfico.' },
        ],
      },
    ],
    groups: [
      { title: 'Básico', items: ['basic', 'grouped', 'stacked', 'horizontal'] },
      { title: 'Dados', items: ['negative', 'stack-groups'] },
      { title: 'Médias e tendências', items: ['overlays', 'pareto'] },
      { title: 'Interação', items: ['tooltip', 'realtime', 'events'] },
      { title: 'Juntar tudo', items: ['cards', 'themes', 'playground'] },
    ],
    docs: [{ id: 'api', title: 'Referência da API' }],
    headline: 'Gráficos de <span class="grad">barras</span><br />e colunas',
    features: [
      ['📊', 'Agrupadas ou empilhadas', 'Séries lado a lado, empilhadas, em 100% ou em vários grupos de pilhas.'],
      ['↔️', 'Vertical ou horizontal', 'Colunas ou barras deitadas, com ordenação para rankings.'],
      ['➖', 'Valores negativos', 'Abaixo do zero com cor própria, ou colorBy para pintar pelo valor.'],
      ['🏷️', 'Valores nas barras', 'Fora, dentro ou ao centro, com formato próprio.'],
      ['💬', 'Tooltip e legenda', 'Todas as séries da categoria ou só a barra, com total; legenda para esconder e destacar.'],
      ['📈', 'Médias e tendências', 'Médias móveis (simples, exponencial, ponderada), tendência linear ou exponencial, acumulado e Pareto sobre as barras.'],
      ['📌', 'Linhas de referência', 'Média, meta ou limite com etiqueta.'],
      ['⚡', 'Animado e em tempo real', 'Barras a crescer, transição suave ao mudar os dados, setValue e setData.'],
      ['🪶', 'Leve e separado', 'Cerca de 8 KB gzip, sem carregar as outras famílias.'],
    ],
  },
  {
    id: 'gauge',
    title: 'Gauge',
    tag: 'velocímetros · medidores',
    description:
      'Velocímetros e medidores: ponteiro com mola, arco de progresso, zonas de cor ou gradiente, marcas, marcadores, valor com unidade, tooltip e tempo real.',
    importPath: 'openchartscandle/gauge',
    mainExports: 'createGauge',
    examples: GAUGE_EXAMPLES,
    gallery: [
      {
        title: 'Básicos',
        items: [
          { id: 'gauge-basic', title: 'Gauge Basic chart', description: 'Ponteiro, marcas e arco de progresso com o valor e um título.' },
          { id: 'simple-gauge', title: 'Simple Gauge', description: 'O mais simples: trilho, marcas, ponteiro e o valor com unidade.' },
          { id: 'speed-gauge', title: 'Speed Gauge', description: 'Velocímetro 0–240 km/h com progresso grosso e ponteiro em seta.' },
          { id: 'progress-gauge', title: 'Progress Gauge', description: 'Só o arco de progresso, sem ponteiro, com os números por fora.' },
        ],
      },
      {
        title: 'Zonas e escalas',
        items: [
          { id: 'stage-speed', title: 'Stage Speed Gauge', description: "Três zonas, marcas por cima do arco e o ponteiro com a cor da zona (needle.color: 'zone')." },
          { id: 'grade-gauge', title: 'Grade Gauge', description: 'Meio círculo com notas A a D escritas no mostrador (zoneLabels).' },
          { id: 'temperature', title: 'Temperature Gauge chart', description: 'Arco de 220° com gradiente laranja, progresso e o valor em °C.' },
          { id: 'barometer', title: 'Gauge Barometer chart', description: 'Barómetro com hPa por fora, mmHg por dentro (secondaryScale) e o estado do tempo.' },
        ],
      },
      {
        title: 'Vários valores',
        items: [
          { id: 'multi-title', title: 'Multi Title Gauge', description: 'Três ponteiros no mesmo mostrador, cada um com nome, cor e valor (pointers).' },
          { id: 'ring-gauge', title: 'Ring Gauge', description: 'Três valores em anéis concêntricos, com os nomes e valores ao centro (rings).' },
          { id: 'clock', title: 'Clock', description: 'Um relógio a funcionar: ponteiros das horas, minutos e segundos.' },
        ],
      },
    ],
    groups: [
      { title: 'Básico', items: ['basic', 'shapes', 'progress'] },
      { title: 'Personalizar', items: ['zones', 'needles'] },
      { title: 'Tempo real', items: ['realtime', 'dashboard'] },
      { title: 'Juntar tudo', items: ['cards', 'themes', 'playground'] },
    ],
    docs: [{ id: 'api', title: 'Referência da API' }],
    headline: '<span class="grad">Velocímetros</span><br />e medidores',
    features: [
      ['⏱️', 'Velocímetro a sério', 'Ponteiro com efeito de mola, marcas grandes e pequenas e números.'],
      ['🌀', 'Vários formatos', 'Velocímetro 240°, meio círculo, anel completo ou ângulos próprios.'],
      ['🚦', 'Zonas e gradiente', 'Verde/amarelo/vermelho com nomes, ou um gradiente ao longo do arco.'],
      ['🎯', 'Progresso e metas', 'Arco de progresso sem ponteiro e marcadores como "Meta" ou "Ontem".'],
      ['🔢', 'Valor e unidade', 'Valor na cor da zona, unidade, título e mínimo/máximo.'],
      ['⚡', 'Tempo real', "setValue() a qualquer ritmo e o evento 'zone' quando muda de zona."],
      ['🎨', 'Para cards', "background: 'transparent', tema claro, escuro ou próprio."],
      ['🪶', 'Leve e separado', 'Cerca de 6 KB gzip, sem carregar as outras famílias.'],
    ],
  },
  {
    id: 'treemap',
    title: 'Treemap',
    tag: 'treemap · sunburst',
    description:
      'Hierarquias em retângulos ou anéis: área proporcional ao valor, cores por nível ou por valor, cabeçalhos dos pais, clique para entrar com caminho de volta e transição animada entre treemap e sunburst.',
    importPath: 'openchartscandle/treemap',
    mainExports: 'createTreemap',
    examples: TREEMAP_EXAMPLES,
    gallery: [
      {
        title: 'Básicos',
        items: [
          { id: 'basic-treemap', title: 'Basic Treemap', description: 'Dois grupos com filhos; a área de cada retângulo é o seu valor.' },
          { id: 'show-parent-labels', title: 'Show Parent Labels', description: 'Cada pasta com o nome numa faixa por cima dos ficheiros (upperLabel).' },
          { id: 'gradient-mapping', title: 'Gradient Mapping', description: 'Tamanho pelas vendas e cor pela variação, num gradiente vermelho → verde.' },
        ],
      },
      {
        title: 'Hierarquias e drill-down',
        items: [
          { id: 'disk-usage', title: 'Disk Usage', description: 'O uso do disco deste projeto, pasta a pasta, com caminho de volta e molduras por nível.' },
          { id: 'option-query', title: 'ECharts Option Query', description: 'As opções mais consultadas, um nível de cada vez, a trocar entre o ECharts 2 e o 3.' },
          { id: 'budget', title: 'How $3.7 Trillion is Spent', description: 'Orçamento federal dos EUA: 2012, 2011 ou cor pelo crescimento de cada rubrica.' },
        ],
      },
      {
        title: 'Sunburst',
        items: [
          { id: 'treemap-sunburst', title: 'Transition between Treemap and Sunburst', description: 'Os mesmos dados mudam de forma a cada 3 s; cada retângulo transforma-se no seu setor.' },
          { id: 'basic-sunburst', title: 'Basic Sunburst', description: 'Uma árvore de família em anéis; clica num setor para o pôr ao centro.' },
          { id: 'sunburst-rounded', title: 'Sunburst with Rounded Corner', description: 'Setores com cantos arredondados e espaço entre irmãos (borderRadius, padAngle).' },
          { id: 'sunburst-label-rotate', title: 'Sunburst Label Rotate', description: 'Etiquetas radiais, tangenciais ou num ângulo fixo, por nível ou por nó.' },
          { id: 'sunburst-monochrome', title: 'Monochrome Sunburst', description: 'Um só tom, por profundidade e valor; o rato acende o setor e os antepassados.' },
          { id: 'sunburst-visualmap', title: 'Sunburst VisualMap', description: 'Ângulo pelo CO₂ total, cor pelas toneladas por pessoa, com barra de cores.' },
          { id: 'drink-flavors', title: 'Drink Flavors', description: 'A roda de sabores do café: cores por nó e um anel fino com etiquetas por fora.' },
          { id: 'book-records', title: 'Book Records', description: 'Registo de leituras com raios e etiquetas diferentes em cada nível.' },
        ],
      },
    ],
    groups: [
      { title: 'Básico', items: ['basic', 'market'] },
      { title: 'Navegar', items: ['drilldown', 'sunburst'] },
      { title: 'Personalizar', items: ['colors', 'themes'] },
    ],
    docs: [{ id: 'api', title: 'Referência da API' }],
    headline: '<span class="grad">Treemaps</span><br />e sunbursts',
    features: [
      ['🧱', 'Treemap a sério', 'Retângulos quase quadrados (squarified), proporcionais ao valor, a qualquer profundidade.'],
      ['🌞', 'Sunburst', 'Os mesmos dados em anéis, raios e etiquetas por nível, cantos arredondados e transição animada entre as duas formas.'],
      ['🔎', 'Entrar e voltar', 'Clique para entrar num ramo, caminho de volta, leafDepth para mostrar um nível de cada vez.'],
      ['🎨', 'Cores por nível', 'Paleta, saturação e luminosidade entre irmãos, gradiente pelo valor de outra dimensão ou visualMap com barra de cores.'],
      ['🏷️', 'Etiquetas e cabeçalhos', 'Nome e valor nos retângulos, faixa com o nome dos pais, formato próprio.'],
      ['📈', 'Mapa do mercado', 'Capitalização e variação com CHANGE_COLORS, e setData() animado em tempo real.'],
      ['💬', 'Tooltip e eventos', 'Caminho, valores e percentagens; eventos click, hover e zoom.'],
      ['🪶', 'Leve e separado', 'Cerca de 10 KB gzip, sem carregar as outras famílias.'],
    ],
  },
  {
    id: 'scatter',
    title: 'Scatter',
    tag: 'dispersão · bolhas',
    description:
      'Pontos e bolhas em eixos de valor, log, categorias ou polares: cor e tamanho por valor com filtros, regressões, clusters, marcas, ondas, símbolos que mudam de forma, centenas de milhares de pontos, zoom, seleção e matriz de dispersão.',
    importPath: 'openchartscandle/scatter',
    mainExports: 'createScatterChart',
    examples: SCATTER_EXAMPLES,
    gallery: [
      {
        title: 'Básicos',
        items: [
          { id: 'basic-scatter', title: 'Basic Scatter Chart', description: 'O mais simples: cada par [x, y] é um ponto.' },
          { id: 'anscombe', title: "Anscomb's quartet", description: 'Quatro conjuntos com a mesma reta de regressão e formas completamente diferentes.' },
          { id: 'effect-scatter', title: 'Effect Scatter Chart', description: 'Os cinco maiores valores pulsam com ondas à volta (effect).' },
          { id: 'bubble', title: 'Bubble Chart', description: 'Riqueza, esperança de vida e população em 1990 e 2015, com brilho e sombra.' },
          { id: 'height-weight', title: 'Distribution of Height and Weight', description: 'Caixa com o intervalo de cada grupo, pinos no máximo e no mínimo e a média.' },
          { id: 'jitter', title: 'Scatter with Jittering', description: 'Pontos de uma categoria espalhados para o lado, sem se sobreporem ou ao acaso.' },
          { id: 'single-axis', title: 'Scatter on Single Axis', description: 'Uma linha por dia com as horas; o tamanho é o número de commits.' },
        ],
      },
      {
        title: 'Regressões e clusters',
        items: [
          { id: 'linear-regression', title: 'Linear Regression', description: 'A reta de mínimos quadrados com a fórmula e o R².' },
          { id: 'exponential-regression', title: 'Exponential Regression', description: 'y = a·e^(bx): crescimento que acelera.' },
          { id: 'polynomial-regression', title: 'Polynomial Regression', description: 'Uma curva de grau 3 com subidas e descidas.' },
          { id: 'logarithmic-regression', title: 'Logarithmic Regression', description: 'y = a + b·ln(x): cresce depressa e depois abranda.' },
          { id: 'clustering', title: 'Clustering Process', description: 'O k-means passo a passo: os centros movem-se e os pontos mudam de cor até estabilizar.' },
          { id: 'clustering-hull', title: 'Clustering Process', description: 'O resultado com k à escolha, um contorno à volta de cada grupo e o centro marcado.' },
        ],
      },
      {
        title: 'Etiquetas, símbolos e transições',
        items: [
          { id: 'label-align-top', title: 'Align Label on the Top', description: 'Os nomes numa linha em cima, afastados uns dos outros, com uma linha até cada bolha.' },
          { id: 'label-align-right', title: 'Align Label on the Top', description: 'A mesma ideia com os nomes numa coluna à direita, à altura de cada ponto.' },
          { id: 'symbol-morph', title: 'Symbol Shape Morph', description: 'Círculos, quadrados, triângulos, pinos e estrelas a transformarem-se uns nos outros.' },
          { id: 'aggregate-bar', title: 'Aggregate Scatter to Bar', description: 'Cada ponto voa para uma fatia da barra com o peso médio do seu grupo, e volta.' },
        ],
      },
      {
        title: 'Cor e tamanho por valor',
        items: [
          { id: 'aqi-color', title: 'Scatter Aqi Color', description: 'Tamanho pelas PM2.5 e cor pelo NO2, com dois controlos que filtram.' },
          { id: 'nutrients', title: 'Scatter Nutrients', description: 'Nutrientes de 60 alimentos: escolhe os eixos e os pontos deslizam.' },
          { id: 'painters', title: 'Master Painter Color Choices Throughout History', description: 'As cores de 20 pintores ao longo dos séculos, cada ponto com a própria cor.' },
          { id: 'life-expectancy', title: 'Life Expectancy and GDP', description: 'De 1950 a 2015 ao estilo Gapminder: as bolhas andam de ano para ano.' },
          { id: 'stream-visual', title: 'Visual interaction with stream', description: '60 000 pontos a chegar aos poucos, com uma barra de cores que filtra.' },
        ],
      },
      {
        title: 'Muitos pontos',
        items: [
          { id: 'large-scatter', title: 'Large Scatter', description: '100 000 pontos desenhados num instante, com zoom e pan.' },
          { id: 'nebula', title: 'Scatter Nebula', description: '60 000 pontos que somam a luz onde se juntam (blend lighter).' },
        ],
      },
      {
        title: 'Grelhas, polar e mapas',
        items: [
          { id: 'punch-card', title: 'Punch Card of Github', description: 'Dia da semana × hora com o número de commits em círculos.' },
          { id: 'punch-card-polar', title: 'Punch Card of Github', description: 'O mesmo em coordenadas polares: as horas à volta, um anel por dia.' },
          { id: 'scatter-matrix', title: 'Scatter Matrix', description: 'Cada par de medidas de 150 flores, com seleção ligada entre células.' },
          { id: 'nutrients-matrix', title: 'Scatter Nutrients Matrix', description: 'Cinco nutrientes cruzados dois a dois, cor pelo grupo do alimento.' },
          { id: 'geo-choropleth', title: 'Geo Choropleth and Scatter', description: 'Regiões de Portugal pintadas pelo PIB e as maiores cidades como bolhas.' },
          { id: 'calendar', title: 'Calendar Charts', description: 'Um ano de passos num calendário, com os 12 melhores dias a pulsar.' },
        ],
      },
    ],
    groups: [
      { title: 'Básico', items: ['basic', 'bubbles'] },
      { title: 'Análise', items: ['regression', 'zoom-brush', 'matrix'] },
      { title: 'Personalizar', items: ['themes'] },
    ],
    docs: [{ id: 'api', title: 'Referência da API' }],
    headline: '<span class="grad">Dispersão</span><br />e bolhas',
    features: [
      ['🫧', 'Pontos e bolhas', 'Eixos de valor, log, categorias ou polares, com nove símbolos e tamanho por valor.'],
      ['🎨', 'Cor e tamanho por valor', 'visualMap contínuo ou por peças, com controlos que filtram os pontos.'],
      ['📐', 'Regressões e clusters', 'Linear, exponencial, logarítmica e polinomial com fórmula e R²; k-means e contornos.'],
      ['✨', 'Transições', 'Os pontos voam para o novo lugar e os símbolos mudam de forma, até de ponto para barra.'],
      ['⚡', 'Muitos pontos', 'Centenas de milhares de pontos, appendData para streams e blend para brilho.'],
      ['🔍', 'Zoom e seleção', 'Roda do rato, arrastar, brush com evento e a matriz de dispersão ligada.'],
      ['🏷️', 'Etiquetas e marcas', 'Nomes sem sobreposição, alinhados em cima ou à direita; máximos, médias e intervalos.'],
      ['🪶', 'Leve e separado', 'Cerca de 20 KB gzip, sem carregar as outras famílias.'],
    ],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    tag: 'calendários',
    description:
      'Dias numa grelha: anos com uma coluna por semana (como o GitHub) ou meses como um calendário de parede, com um valor por dia em cores ou círculos, legenda, contorno dos meses, etiquetas e desenho próprio em cada dia.',
    importPath: 'openchartscandle/calendar',
    mainExports: 'createCalendarChart',
    examples: CALENDAR_EXAMPLES,
    gallery: [
      {
        title: 'Calendário',
        items: [
          { id: 'simple-calendar', title: 'Simple Calendar', description: 'Um ano sem dados: uma coluna por semana e os meses contornados.' },
          { id: 'calendar-heatmap', title: 'Calendar Heatmap', description: 'A cor de cada dia é o seu valor, com a legenda de cores em baixo.' },
          { id: 'calendar-heatmap-vertical', title: 'Calendar Heatmap Vertical', description: 'Três anos lado a lado, uma linha por semana.' },
          { id: 'calendar-heatmap-horizontal', title: 'Calendar Heatmap Horizontal', description: 'Três anos um por baixo do outro, com cores por intervalos que se escondem com um clique.' },
          { id: 'calendar-graph', title: 'Calendar Graph', description: 'Um grafo por cima dos dias: nós em alguns dias e curvas a ligá-los.' },
          { id: 'calendar-lunar', title: 'Calendar Lunar', description: 'Um mês com a lua de cada noite, as fases principais e os feriados de Portugal.' },
          { id: 'calendar-pie', title: 'Calendar Pie', description: 'Uma pizza em cada dia com as horas de trabalho, lazer e sono.' },
          { id: 'calendar-charts', title: 'Calendar Charts', description: 'Um ano de passos em círculos, com os 12 melhores dias a pulsar.' },
          { id: 'custom-calendar-icon', title: 'Custom Calendar Icon', description: 'O tempo de um mês com ícones próprios de sol, nuvens e chuva e a máxima do dia.' },
        ],
      },
    ],
    groups: [
      { title: 'Básico', items: ['basic', 'month'] },
      { title: 'Personalizar', items: ['themes'] },
    ],
    docs: [{ id: 'api', title: 'Referência da API' }],
    headline: '<span class="grad">Calendários</span><br />de dias',
    features: [
      ['📅', 'Anos e meses', 'Uma coluna por semana como o GitHub, ou uma linha por semana como um calendário de parede.'],
      ['🔥', 'Mapa de calor', 'A cor de cada dia pelo valor, em gradiente ou por intervalos com legenda que filtra.'],
      ['⚪', 'Círculos e ondas', 'Círculos do tamanho do valor e os maiores dias a pulsar.'],
      ['🗓️', 'Vários anos', 'Um calendário por ano, um por baixo do outro ou lado a lado.'],
      ['🏷️', 'Etiquetas', 'O dia, feriados ou o que quiseres em várias linhas, com o contorno de cada mês.'],
      ['🎨', 'Desenho próprio', 'renderCell e graphic com a caixa de cada dia: pizzas, ícones, grafos.'],
      ['💬', 'Tooltip e eventos', 'Data e valor ao passar o rato; eventos click e hover.'],
      ['🪶', 'Leve e separado', 'Sem carregar as outras famílias.'],
    ],
  },
  {
    id: 'radar',
    title: 'Radar',
    tag: 'teia de indicadores',
    description:
      'Vários indicadores em eixos à volta de um centro: um ou muitos polígonos por série, anéis em polígono ou círculo, faixas, vários radares no mesmo gráfico, cores por ano, legenda, tooltip e animações.',
    importPath: 'openchartscandle/radar',
    mainExports: 'createRadarChart',
    examples: RADAR_EXAMPLES,
    gallery: [
      {
        title: 'Radar',
        items: [
          { id: 'basic-radar', title: 'Basic Radar Chart', description: 'Orçamento e gasto real de seis departamentos, cada eixo com o seu máximo.' },
          { id: 'aqi-radar', title: 'AQI - Radar Chart', description: 'Qualidade do ar de um mês em três cidades: um polígono fino por dia num radar circular.' },
          { id: 'customized-radar', title: 'Customized Radar Chart', description: 'Dois radares personalizados: valores nos vértices, nomes em caixas, círculo e área em gradiente.' },
          { id: 'browsers', title: 'Proportion of Browsers', description: 'A quota dos browsers de 2010 a 2024, um polígono por ano com a cor do ano.' },
          { id: 'multiple-radar', title: 'Multiple Radar', description: 'Três radares no mesmo gráfico, cada série no seu.' },
        ],
      },
    ],
    groups: [
      { title: 'Básico', items: ['basic'] },
      { title: 'Personalizar', items: ['themes'] },
    ],
    docs: [{ id: 'api', title: 'Referência da API' }],
    headline: '<span class="grad">Radar</span><br />de indicadores',
    features: [
      ['🕸️', 'Radar a sério', 'Um eixo por indicador, cada um com o seu mínimo e máximo, em polígono ou círculo.'],
      ['🔷', 'Séries e polígonos', 'Um polígono por série, ou muitos (um por dia, por ano) que se escondem juntos.'],
      ['🎨', 'Áreas e linhas', 'Área sólida ou em gradiente, linhas tracejadas, quatro símbolos e valores nos vértices.'],
      ['🧭', 'Vários radares', 'Radares lado a lado no mesmo gráfico, cada um com os seus eixos e título.'],
      ['🌈', 'Cor por ano', 'visualMap pinta os polígonos do primeiro ao último, com a barra de cores.'],
      ['✨', 'Animações', 'Os polígonos crescem do centro e mudam de forma com setSeries().'],
      ['💬', 'Tooltip e eventos', 'Os valores de cada indicador; eventos click, hover e toggle.'],
      ['🪶', 'Leve e separado', 'Sem carregar as outras famílias.'],
    ],
  },
  BOXPLOT_FAMILY,
  HEATMAP_FAMILY,
  GRAPH_FAMILY,
  TREE_FAMILY,
  PARALLEL_FAMILY,
  SANKEY_FAMILY,
  FUNNEL_FAMILY,
  MATRIX_FAMILY,
  CUSTOM_FAMILY,
];

export function family(id: string): Family | undefined {
  return FAMILIES.find((f) => f.id === id);
}

type Mount = (el: HTMLElement) => () => void;

const loaders = import.meta.glob<{ mount: Mount }>('../*/examples/*.ts');
const galleryLoaders = import.meta.glob<{ mount: Mount }>('../*/gallery/*.ts');
const gallerySources = import.meta.glob<string>('../*/gallery/*.ts', { query: '?raw', import: 'default', eager: true });
const sources = import.meta.glob<string>('../*/examples/*.ts', { query: '?raw', import: 'default', eager: true });
const familyDocs = import.meta.glob<string>('../../docs/*/*.md', { query: '?raw', import: 'default', eager: true });
const generalDocs = import.meta.glob<string>('../../docs/*.md', { query: '?raw', import: 'default', eager: true });

export async function loadExample(fam: string, id: string): Promise<Mount> {
  const loader = loaders[`../${fam}/examples/${id}.ts`];
  if (!loader) throw new Error(`exemplo desconhecido: ${fam}/${id}`);
  return (await loader()).mount;
}

export async function loadGallery(fam: string, id: string): Promise<Mount> {
  const loader = galleryLoaders[`../${fam}/gallery/${id}.ts`];
  if (!loader) throw new Error(`galeria desconhecida: ${fam}/${id}`);
  return (await loader()).mount;
}

export function gallerySource(fam: string, id: string): string {
  return gallerySources[`../${fam}/gallery/${id}.ts`] ?? '';
}

export function exampleSource(fam: string, id: string): string {
  return sources[`../${fam}/examples/${id}.ts`] ?? '';
}

/** Markdown of a doc: `fam` = family id, or null for general docs. */
export function docSource(fam: string | null, id: string): string {
  if (!fam && id === 'changelog') return changelog;
  return (fam ? familyDocs[`../../docs/${fam}/${id}.md`] : generalDocs[`../../docs/${id}.md`]) ?? '';
}
