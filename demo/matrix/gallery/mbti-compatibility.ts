import { createMatrixChart } from 'openchartscandle/matrix';
import { MBTI, MBTI_LEVELS, mbtiScore } from '../data';

// 16 × 16 tipos de personalidade MBTI, agrupados em NF, NT, SP e SJ nos dois cabeçalhos, com a cor da
// compatibilidade (ilustrativa: uma regra popular, não é ciência). A legenda por baixo é um visualMap por
// peças: um click esconde um nível; o rato acende a linha e a coluna.
const GROUPS = ['NF', 'NT', 'SP', 'SJ'];

export function mount(el: HTMLElement): () => void {
  const header = GROUPS.map((g, i) => ({ value: g, children: MBTI.slice(i * 4, i * 4 + 4) }));
  const visualMap = { pieces: MBTI_LEVELS.map((l) => ({ value: l.value, color: l.color, label: l.label })), position: 'bottom' as const };
  const chart = createMatrixChart(el, {
    x: { data: header, label: { fontSize: 10 } },
    y: { data: header, label: { fontSize: 10 } },
    data: MBTI.map((a) => MBTI.map((b) => mbtiScore(a, b))),
    gap: 1,
    label: { show: false },
    visualMap,
    media: [{ query: { maxWidth: 420 }, option: { visualMap: { ...visualMap, show: false } } }],
    tooltip: { formatter: (c) => `<b>${c.yName} + ${c.xName}</b><br/>${MBTI_LEVELS.find((l) => l.value === c.value)!.label}` },
  });
  return () => chart.destroy();
}
