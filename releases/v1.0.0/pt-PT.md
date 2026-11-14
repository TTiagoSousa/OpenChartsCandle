# v1.0.0 · Primeira versão pública

O OpenChartsCandle é uma biblioteca de gráficos para a web em TypeScript e Canvas 2D, sem dependências em runtime.

### Funcionalidades

- **candlestick:** um terminal ao estilo TradingView (`createTerminal`) e só o gráfico (`createChart`): velas, barras OHLC, velas ocas, Heikin Ashi, linha, linha em degraus, área e baseline, com scroll com inércia, zoom e escalas de preço automática / log / percentagem / invertida.
- **candlestick:** `Datafeed` com histórico aos blocos, velas em tempo real e ressincronização; fusos horários; tema escuro e claro; modos só gráfico e compacto.
- **desenhos:** 26 ferramentas de desenho (linhas, Fibonacci, posições compradas / vendidas, intervalos, perfil de volume de intervalo fixo, VWAP ancorado, formas, texto) com íman, desfazer / refazer, copiar / colar e guardar.
- **indicadores:** Média Móvel, Média Móvel Exponencial, RSI (com média SMA ou EMA) e Session Volume Profile HD, com os valores do TradingView e cálculo incremental.
- **indicadores:** janela de definições com os separadores Valores, Estilo e Visibilidade, "Padrões" e visibilidade por tempo gráfico.
- **trades:** entradas e saídas com P&L ao vivo, lista de trades ligada ao gráfico, marcadores e zonas no tempo.
- **famílias:** pizza, linhas, barras, velocímetros, treemap, dispersão, calendário, radar, boxplot, mapas de calor, grafos, árvores, coordenadas paralelas, sankey, funis, matrizes e séries próprias.
- **demo:** um site de demonstração com 279 gráficos na galeria e exemplos ao vivo, no GitHub Pages.

### Instalar

```bash
npm install github:TTiagoSousa/OpenChartsCandle#v1.0.0
```
