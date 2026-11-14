# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [semantic versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-11-14

First public release of OpenChartsCandle.

### Added
- **Candlestick family** (`openchartscandle/candlestick`), TradingView style:
  - `createTerminal` (full interface: symbol search, timeframes, chart types, indicators, drawing toolbar, legend, watchlist with symbol details, undo / redo, screenshot, full screen, keyboard shortcuts) and `createChart` (the canvas only).
  - Candles, OHLC bars, hollow candles, Heikin Ashi, line, step line, area and baseline; kinetic scroll and zoom; auto, log, percentage and inverted price scales.
  - `Datafeed` with history in chunks, real-time bars, resync, going to a date or a trade that is not loaded yet.
  - 26 drawing tools (lines, Fibonacci, long / short positions, ranges, fixed range volume profile, anchored VWAP, shapes, text) with magnet, undo / redo, copy / paste and saving.
  - Indicators with TradingView's values: Moving Average, Moving Average Exponential, RSI (with SMA or EMA smoothing) and Session Volume Profile HD (sessions of 10 exchanges or custom hours, HD rows, POC / VAH / VAL extended until touched, developing POC and value area).
  - Indicator settings dialog with Inputs, Style and Visibility tabs, "Defaults" and per-timeframe visibility.
  - Trades with live P&L and a trade list, markers, time ranges, time zones, dark and light themes, chart-only and compact modes.
- **17 more chart families**: pie, line, bar, gauge, treemap, scatter, calendar, radar, boxplot, heatmap, graph, tree, parallel, sankey, funnel, matrix and custom.
- Demo site with 279 gallery charts and live examples, published on GitHub Pages.

[Unreleased]: https://github.com/TTiagoSousa/OpenChartsCandle/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/TTiagoSousa/OpenChartsCandle/releases/tag/v1.0.0
