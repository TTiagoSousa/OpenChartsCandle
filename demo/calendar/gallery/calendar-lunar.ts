import { createCalendarChart, type CalendarOptions } from 'openchartscandle/calendar';
import { drawMoon, holidays, key, monthDays, moonAge, moonPhase, select, withToolbar } from '../data';

// Calendário de parede de um mês: o dia, a lua de cada noite, as fases principais e os feriados nacionais
// (a vermelho). As fases e os feriados são calculados (a Páscoa e o Corpo de Deus mudam todos os anos).
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const YEAR = 2026;

export function mount(el: HTMLElement): () => void {
  const hol = holidays(YEAR);
  const options = (month: number): CalendarOptions => ({
    range: `${YEAR}-${String(month + 1).padStart(2, '0')}`,
    orient: 'vertical',
    monthLabel: false,
    title: `${MONTHS[month]} de ${YEAR}`,
    data: monthDays(YEAR, month).map((d) => ({
      date: key(d),
      label: hol.get(key(d)) ?? moonPhase(d),
      color: hol.has(key(d)) ? 'rgba(242,54,69,0.25)' : undefined,
    })),
    label: { position: 'top-left', format: (c) => [String(c.date.getDate()), c.datum?.label ?? ''] },
    renderCell: (ctx, c) => {
      const r = Math.min(c.w, c.h) * 0.12;
      drawMoon(ctx, c.x + c.w - r - 6, c.y + r + 6, r, moonAge(c.date));
    },
    tooltip: {
      formatter: (c) => `<b>${c.date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</b>${c.datum?.label ? `<br>${c.datum.label}` : ''}`,
    },
  });
  const host = withToolbar(el, select('Mês', MONTHS.map((m, i): [string, number] => [m, i]), 3, (m) => chart.setOptions(options(m), true)));
  const chart = createCalendarChart(host, options(3));
  return () => chart.destroy();
}
