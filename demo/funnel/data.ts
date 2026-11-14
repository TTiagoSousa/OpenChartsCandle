/** Data for the funnel examples (made up for the demo). */
import type { FunnelItem } from 'openchartscandle/funnel';

/** A broker's sign-up funnel: visits → … → first trade. */
export function signupFunnel(): FunnelItem[] {
  return [
    { name: 'Visitas', value: 48000 },
    { name: 'Registos', value: 12600 },
    { name: 'Conta verificada', value: 7400 },
    { name: 'Primeiro depósito', value: 3900 },
    { name: 'Primeira ordem', value: 2600 },
  ];
}

/** The same funnel in %, the target and this month. */
export const TARGET: FunnelItem[] = [
  { name: 'Visitas', value: 100 },
  { name: 'Registos', value: 80 },
  { name: 'Conta verificada', value: 60 },
  { name: 'Primeiro depósito', value: 40 },
  { name: 'Primeira ordem', value: 20 },
];

export const ACTUAL: FunnelItem[] = [
  { name: 'Visitas', value: 100 },
  { name: 'Registos', value: 68 },
  { name: 'Conta verificada', value: 52 },
  { name: 'Primeiro depósito', value: 27 },
  { name: 'Primeira ordem', value: 15 },
];
