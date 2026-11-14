/** Data and helpers for the radar examples (generated or approximate, see each comment). */
export { cells, seeded, select, withToolbar } from '../scatter/data';
export { choice } from '../line/data';
import { seeded } from '../scatter/data';

/** Air quality indicators and their scale (outer ring). */
export const AQI_INDICATORS = [
  { name: 'AQI', max: 300 },
  { name: 'PM2.5', max: 250 },
  { name: 'PM10', max: 300 },
  { name: 'CO', max: 5 },
  { name: 'NO2', max: 200 },
  { name: 'SO2', max: 100 },
];

/**
 * One month of daily air quality per city (generated): [AQI, PM2.5, PM10, CO, NO2, SO2]. `level` makes a city
 * cleaner or more polluted.
 */
export function airQuality(level: number, seed: number): number[][] {
  const rnd = seeded(seed);
  return Array.from({ length: 31 }, () => {
    const k = level * (0.4 + rnd() * 1.1);
    const pm25 = Math.round(60 * k + rnd() * 20);
    return [Math.round(pm25 * 1.25 + rnd() * 15), pm25, Math.round(pm25 * 1.3 + rnd() * 20), +(0.5 + k * 1.2 + rnd() * 0.4).toFixed(2), Math.round(30 + k * 50 + rnd() * 20), Math.round(5 + k * 18 + rnd() * 8)];
  });
}

/**
 * Desktop browser shares in % per year (approximate, rounded, from public statistics):
 * [Chrome, Safari, Edge / IE, Firefox, Outros].
 */
export const BROWSERS: [number, number[]][] = [
  [2010, [9, 4, 52, 31, 4]],
  [2011, [18, 5, 44, 29, 4]],
  [2012, [30, 6, 35, 24, 5]],
  [2013, [40, 7, 28, 20, 5]],
  [2014, [46, 8, 23, 18, 5]],
  [2015, [52, 9, 18, 16, 5]],
  [2016, [58, 10, 14, 14, 4]],
  [2017, [62, 11, 11, 12, 4]],
  [2018, [66, 11, 9, 10, 4]],
  [2019, [68, 9, 9, 9, 5]],
  [2020, [69, 9, 10, 8, 4]],
  [2021, [68, 9, 11, 8, 4]],
  [2022, [66, 10, 12, 7, 5]],
  [2023, [65, 10, 13, 7, 5]],
  [2024, [65, 9, 14, 7, 5]],
];
