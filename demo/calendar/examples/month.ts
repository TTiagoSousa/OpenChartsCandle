import { createCalendarChart, type CalendarOptions } from 'openchartscandle/calendar';
import { choice, holidays, key, monthDays, seeded, withToolbar } from '../data';

// Um mês como calendário de parede (orient: 'vertical'): o dia no canto, os feriados com cor e nome, e uma
// barra com o valor do dia desenhada em renderCell. Os botões mudam de mês com setOptions().
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const YEAR = 2026;

export function mount(el: HTMLElement): () => void {
  const hol = holidays(YEAR);
  const rnd = seeded(3);
  const options = (m: number): CalendarOptions => ({
    range: `${YEAR}-${String(m + 1).padStart(2, '0')}`,
    orient: 'vertical',
    monthLabel: false,
    yearLabel: false,
    type: 'none',
    data: monthDays(YEAR, m).map((d) => ({
      date: key(d),
      value: Math.round(20 + rnd() * 80),
      label: hol.get(key(d)),
      color: hol.has(key(d)) ? 'rgba(242,54,69,0.22)' : undefined,
    })),
    label: { position: 'top-left', format: (c) => [String(c.date.getDate()), c.datum?.label ?? ''] },
    renderCell: (ctx, c, api) => {
      if (c.value === null) return;
      // a bar at the bottom of the day: its length is the value (0–100)
      const w = (c.w - 12) * (c.value / 100) * api.progress;
      ctx.fillStyle = '#2962ff';
      ctx.fillRect(c.x + 6, c.y + c.h - 9, w, 4);
    },
    valueFormatter: (v) => `${v}% de ocupação`,
  });
  const host = withToolbar(el, choice('Mês', MONTHS.map((m, i): [string, number] => [m, i]), 9, (m) => chart.setOptions(options(m), true)));
  const chart = createCalendarChart(host, options(9));
  return () => chart.destroy();
}
