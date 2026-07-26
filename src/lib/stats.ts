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

/** Volumen total de un registro: peso * repeticiones * series */
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

/** Devuelve el mes anterior en formato 'YYYY-MM' */
export function getPreviousMonthKey(month: MonthKey): MonthKey {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 2, 1);
  const y = date.getFullYear();
  const prevM = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${prevM}`;
}

/** Calcula el porcentaje de variación entre dos valores */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous <= 0 || current <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

export type ExerciseMonthlyStats = {
  exercise: string;
  sessionsInMonth: number;
  maxWeightHistorical: number;
  best1RM: number;
  totalVolumeMonth: number;
  avgLoadPerSet: number;
  loadProgressPercentage: number;   
  volumeProgressPercentage: number;
};

/**
 * KPIs por ejercicio para un mes concreto:
 * - peso máximo histórico (todo el histórico)
 * - mejor 1RM estimado (todo el histórico)
 * - volumen total del mes y su % de variación respecto al mes previo
 * - carga media (peso promedio por serie) y su % de variación respecto al mes previo
 */
export function computeMonthlyStatsByExercise(
  allSessions: WorkoutSession[],
  month: MonthKey
): ExerciseMonthlyStats[] {
  const prevMonthKey = getPreviousMonthKey(month);

  return EXERCISES.map((exercise) => {
    const all = allSessions.filter((s) => s.exercise === exercise);

    // Sesiones del mes actual y del mes anterior
    const monthItems = all.filter((s) => s.date.slice(0, 7) === month);
    const prevMonthItems = all.filter((s) => s.date.slice(0, 7) === prevMonthKey);

    // Muestras históricas
    const maxWeightHistorical = all.reduce((max, s) => (s.weight > max ? s.weight : max), 0);
    const best1RM = all.reduce((max, s) => {
      const rm = epley1RM(s.weight, s.reps);
      return rm > max ? rm : max;
    }, 0);

    // --- Mes Actual ---
    const totalVolumeMonth = monthItems.reduce(
      (sum, s) => sum + sessionVolume(s.weight, s.reps, s.sets),
      0
    );
    const totalWeightedWeight = monthItems.reduce((sum, s) => sum + s.weight * s.sets, 0);
    const totalSetsMonth = monthItems.reduce((sum, s) => sum + s.sets, 0);
    const avgLoadPerSet = totalSetsMonth > 0 ? totalWeightedWeight / totalSetsMonth : 0;

    // --- Mes Anterior ---
    const prevTotalVolumeMonth = prevMonthItems.reduce(
      (sum, s) => sum + sessionVolume(s.weight, s.reps, s.sets),
      0
    );
    const prevTotalWeightedWeight = prevMonthItems.reduce((sum, s) => sum + s.weight * s.sets, 0);
    const prevTotalSets = prevMonthItems.reduce((sum, s) => sum + s.sets, 0);
    const prevAvgLoad = prevTotalSets > 0 ? prevTotalWeightedWeight / prevTotalSets : 0;

    // --- Porcentajes de variación ---
    const loadProgressPercentage = calculatePercentageChange(avgLoadPerSet, prevAvgLoad);
    const volumeProgressPercentage = calculatePercentageChange(totalVolumeMonth, prevTotalVolumeMonth);

    return {
      exercise,
      sessionsInMonth: monthItems.length,
      maxWeightHistorical,
      best1RM,
      totalVolumeMonth,
      avgLoadPerSet,
      loadProgressPercentage,
      volumeProgressPercentage,
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
export type TrainingGoal = 'fuerza' | 'hipertrofia' | 'potencia' | 'resistencia';

export interface GoalRecommendation {
  label: string;
  intensityRange: string;
  weightMin: number;
  weightMax: number;
  reps: string;
  sets: string;
  rest: string;
}

export function getGoalRecommendation(rm: number, goal: TrainingGoal): GoalRecommendation {
  switch (goal) {
    case 'fuerza':
      return {
        label: 'Fuerza Máxima',
        intensityRange: '85% - 95% 1RM',
        weightMin: Math.round(rm * 0.85),
        weightMax: Math.round(rm * 0.95),
        reps: '1 - 5 reps',
        sets: '3 - 5 series',
        rest: '3 - 5 min',
      };
    case 'potencia':
      return {
        label: 'Potencia / Velocidad',
        intensityRange: '50% - 70% 1RM',
        weightMin: Math.round(rm * 0.50),
        weightMax: Math.round(rm * 0.70),
        reps: '1 - 5 reps (máxima velocidad)',
        sets: '3 - 5 series',
        rest: '3 - 5 min',
      };
    case 'resistencia':
      return {
        label: 'Resistencia Muscular',
        intensityRange: '< 65% 1RM',
        weightMin: Math.round(rm * 0.40),
        weightMax: Math.round(rm * 0.60),
        reps: '15 - 25 reps',
        sets: '2 - 3 series',
        rest: '30 - 60 seg',
      };
    case 'hipertrofia':
    default:
      return {
        label: 'Hipertrofia',
        intensityRange: '65% - 80% 1RM',
        weightMin: Math.round(rm * 0.65),
        weightMax: Math.round(rm * 0.80),
        reps: '6 - 12 reps',
        sets: '3 - 4 series',
        rest: '1 - 3 min',
      };
  }
}
