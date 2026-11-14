import { createCalendarChart } from 'openchartscandle/calendar';
import { drawWeather, weatherMonth, type Weather } from '../data';

// O tempo de um mês com ícones próprios: sol, nuvens, chuva e trovoada desenhados em `renderCell`, e a máxima
// do dia por baixo. Dados gerados.
const NAMES: Record<Weather, string> = { sol: 'Sol', nuvens: 'Nuvens', chuva: 'Chuva', trovoada: 'Trovoada' };

export function mount(el: HTMLElement): () => void {
  const chart = createCalendarChart(el, {
    range: '2026-03',
    orient: 'vertical',
    monthLabel: false,
    title: 'Lisboa, março de 2026',
    data: weatherMonth(2026, 2, 11).map((d) => ({ date: d.date, value: d.max, weather: d.weather })),
    type: 'none',
    label: { position: 'top-left', fontSize: 11 },
    renderCell: (ctx, c, api) => {
      const w = c.datum?.weather as Weather | undefined;
      if (!w) return;
      drawWeather(ctx, w, c.x + c.w / 2, c.y + c.h * 0.47, Math.min(c.w, c.h) * 0.5);
      ctx.fillStyle = api.theme.muted;
      ctx.font = `600 ${Math.max(9, Math.min(12, c.h * 0.16))}px ${api.theme.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${c.value}°`, c.x + c.w / 2, c.y + c.h - 3);
    },
    tooltip: {
      formatter: (c) => `<b>${c.date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</b><br>${NAMES[c.datum?.weather as Weather]}, máxima ${c.value}°`,
    },
  });
  return () => chart.destroy();
}
