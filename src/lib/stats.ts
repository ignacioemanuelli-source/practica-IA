import type { WorkoutSession } from './supabase';

export const EXERCISES = [
  'Press banca',
  'Sentadilla',
  'Peso muerto',
  'Press de hombro',
  'Remo con barra',
] as const;

export type ExerciseName = (typeof EXERCISES)[number];

/** 1RM estimado usando la fórmula de Epley: 1RM = peso * (1 + reps / 30) */
export function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

/** Volumen total de una serie: peso * repeticiones * series */
export function sessionVolume(weight: number, reps: number, sets: number): number {
  return weight * reps * sets;
}

export type MonthKey = string; // 'YYYY-MM'

/** Lista de meses disponibles (descendente) a partir de las sesiones. */
export function getAvailableMonths(sessions: WorkoutSession[]): MonthKey[] {
  const set = new Set<string>();
  for (const s of sessions) {
    set.add(s.date.slice(0, 7));
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

/** Convierte una clave 'YYYY-MM' a texto legible, p. ej. "julio 2026". */
export function formatMonth(key: MonthKey): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export type ExerciseMonthlyStats = {
  exercise: string;
  sessionsInMonth: number;
  maxWeightHistorical: number;
  best1RM: number;
  totalVolumeMonth: number;
  avgLoadPerSet: number;
};

/**
 * KPIs por ejercicio para un mes concreto:
 * - peso máximo histórico (todo el histórico)
 * - mejor 1RM estimado (todo el histórico)
 * - volumen total del mes
 * - carga media (volumen del mes / series del mes)
 */
export function computeMonthlyStatsByExercise(
  allSessions: WorkoutSession[],
  month: MonthKey
): ExerciseMonthlyStats[] {
  return EXERCISES.map((exercise) => {
    const all = allSessions.filter((s) => s.exercise === exercise);
    const monthItems = all.filter((s) => s.date.slice(0, 7) === month);

    const maxWeightHistorical = all.reduce((max, s) => (s.weight > max ? s.weight : max), 0);
    const best1RM = all.reduce((max, s) => {
      const rm = epley1RM(s.weight, s.reps);
      return rm > max ? rm : max;
    }, 0);

    const totalVolumeMonth = monthItems.reduce(
      (sum, s) => sum + sessionVolume(s.weight, s.reps, s.sets),
      0
    );
    const totalSetsMonth = monthItems.reduce((sum, s) => sum + s.sets, 0);
    const avgLoadPerSet = totalSetsMonth > 0 ? totalVolumeMonth / totalSetsMonth : 0;

    return {
      exercise,
      sessionsInMonth: monthItems.length,
      maxWeightHistorical,
      best1RM,
      totalVolumeMonth,
      avgLoadPerSet,
    };
  });
}

export type MonthSummary = {
  sessions: number;
  best1RM: number;
  totalVolume: number;
  totalReps: number;
};

/** Resumen global para el mes seleccionado. */
export function computeMonthSummary(
  sessions: WorkoutSession[],
  month: MonthKey
): MonthSummary {
  const items = sessions.filter((s) => s.date.slice(0, 7) === month);
  const best1RM = items.reduce((max, s) => {
    const rm = epley1RM(s.weight, s.reps);
    return rm > max ? rm : max;
  }, 0);
  const totalVolume = items.reduce(
    (sum, s) => sum + sessionVolume(s.weight, s.reps, s.sets),
    0
  );
  const totalReps = items.reduce((sum, s) => sum + s.reps * s.sets, 0);
  return {
    sessions: items.length,
    best1RM,
    totalVolume,
    totalReps,
  };
}
