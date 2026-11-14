# v1.0.0 · First public release

OpenChartsCandle is a charting library for the web in TypeScript and Canvas 2D, with zero runtime dependencies.

### Features

- **candlestick:** a TradingView-style terminal (`createTerminal`) and a bare chart (`createChart`): candles, OHLC bars, hollow candles, Heikin Ashi, line, step line, area and baseline, with kinetic scroll, zoom and auto / log / percentage / inverted price scales.
- **candlestick:** `Datafeed` with history in chunks, real-time bars and resync; time zones; dark and light themes; chart-only and compact modes.
- **drawings:** 26 drawing tools (lines, Fibonacci, long / short positions, ranges, fixed range volume profile, anchored VWAP, shapes, text) with magnet, undo / redo, copy / paste and saving.
- **indicators:** Moving Average, Moving Average Exponential, RSI (with SMA or EMA smoothing) and Session Volume Profile HD, with TradingView's values, computed incrementally.
- **indicators:** settings dialog with Inputs, Style and Visibility tabs, "Defaults" and per-timeframe visibility.
- **trades:** entries and exits with live P&L, a linked trade list, markers and time ranges.
- **families:** pie, line, bar, gauge, treemap, scatter, calendar, radar, boxplot, heatmap, graph, tree, parallel, sankey, funnel, matrix and custom charts.
- **demo:** a demo site with 279 gallery charts and live examples, on GitHub Pages.

### Install

```bash
npm install github:TTiagoSousa/OpenChartsCandle#v1.0.0
```
