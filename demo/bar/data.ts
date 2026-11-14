/** Sample data for the bar examples (DOM helpers shared with the line examples). */
export { MONTHS, choice, h, rng } from '../line/data';

export const QUARTERS = ['T1', 'T2', 'T3', 'T4'];

export const sales2024 = [32, 38, 41, 36, 45, 52, 49, 55, 58, 54, 63, 71];
export const sales2025 = [38, 44, 47, 46, 53, 60, 58, 66, 69, 65, 74, 84];

/** Monthly P&L in thousands (positive and negative) */
export const pnl = [12.4, -4.2, 8.9, 15.1, -9.8, 3.2, 21.5, -2.1, 6.6, -12.3, 18.2, 9.4];

export const exchanges = ['Binance', 'Coinbase', 'OKX', 'Bybit', 'Kraken', 'Bitget', 'KuCoin', 'Gate.io', 'HTX', 'Bitfinex'];
export const volume24h = [14.2, 3.1, 4.8, 5.6, 1.2, 2.9, 1.1, 1.6, 1.4, 0.6];

export const eur = (v: number): string => `${v.toLocaleString('pt-PT', { maximumFractionDigits: 1 })} k€`;
