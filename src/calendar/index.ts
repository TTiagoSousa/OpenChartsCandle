/**
 * openchartscandle/calendar — calendários de dias: anos, meses ou intervalos numa grelha (uma coluna por semana
 * como o GitHub, ou uma linha por semana como um calendário de parede), com um valor por dia em mapa de calor
 * ou círculos, legenda de cores, contorno dos meses, etiquetas, desenho próprio em cada dia e tooltip.
 */
export { CALENDAR_COLORS, CalendarChart, calendarDarkTheme, calendarLightTheme, createCalendarChart } from './calendar';
export { dayKey, parseDay, rangeDays } from './layout';
export type {
  CalendarCell,
  CalendarDate,
  CalendarDatum,
  CalendarEvent,
  CalendarGraphicApi,
  CalendarLabelOptions,
  CalendarOptions,
  CalendarRange,
  CalendarTheme,
  CalendarVisualMap,
} from './types';
