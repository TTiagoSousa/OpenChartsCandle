/**
 * openchartscandle/gauge — velocímetros e medidores: ponteiro com mola e/ou arco de progresso,
 * zonas de cor ou gradiente, marcas e números, marcadores, valor com unidade e título,
 * tooltip e atualização em tempo real.
 */
export { GaugeChart, createGauge, gaugeDarkTheme, gaugeLightTheme, trafficZones } from './gauge';
export { angleToValue, gaugeArc, gaugeTicks, valueToAngle, zoneAt } from './geometry';
export type { GaugeEvent, GaugeMarker, GaugeOptions, GaugePointer, GaugeRing, GaugeTheme, GaugeZone } from './types';
