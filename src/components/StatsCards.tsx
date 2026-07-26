import { Dumbbell, Gauge, TrendingUp, TrendingDown, Repeat, Calendar, Minus, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { WorkoutSession } from '@/lib/supabase';
import {
  computeMonthSummary,
  computeMonthlyStatsByExercise,
  formatMonth,
  getAvailableMonths,
  getGoalRecommendation,
  type MonthKey,
  type TrainingGoal,
} from '@/lib/stats';

type Props = {
  sessions: WorkoutSession[];
  month: MonthKey;
  onMonthChange: (month: MonthKey) => void;
};

const fmt = (n?: number) => {
  if (n === undefined || n === null || Number.isNaN(n)) return '0';
  return n.toLocaleString('es-ES', { maximumFractionDigits: 1 });
};

const fmtProgress = (p?: number) => {
  if (p === undefined || p === null || p === 0 || Number.isNaN(p)) return '—';
  const isPositive = p > 0;
  return `${isPositive ? '+' : ''}${p.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`;
};

export default function StatsCards({ sessions = [], month, onMonthChange }: Props) {
  const availableMonths = useMemo(() => getAvailableMonths(sessions || []), [sessions]);
  const byExercise = useMemo(
    () => computeMonthlyStatsByExercise(sessions || [], month),
    [sessions, month]
  );
  const summary = useMemo(() => computeMonthSummary(sessions || [], month), [sessions, month]);

  const [selectedGoals, setSelectedGoals] = useState<Record<string, TrainingGoal>>({});

  const handleGoalChange = (exercise: string, goal: TrainingGoal) => {
    setSelectedGoals((prev) => ({ ...prev, [exercise]: goal }));
  };

  const summaryCards = [
    {
      label: 'Sesiones del mes',
      value: summary?.sessions ?? 0,
      icon: Dumbbell,
      accent: 'text-amber-400',
    },
    {
      label: 'Mejor 1RM estimado (kg)',
      value: summary?.best1RM && summary.best1RM > 0 ? fmt(summary.best1RM) : '—',
      icon: Gauge,
      accent: 'text-rose-400',
    },
    {
      label: 'Volumen total del mes (kg·rep)',
      value: summary?.totalVolume && summary.totalVolume > 0 ? fmt(summary.totalVolume) : '—',
      icon: TrendingUp,
      accent: 'text-emerald-400',
    },
    {
      label: 'Repeticiones del mes',
      value: summary?.totalReps ?? 0,
      icon: Repeat,
      accent: 'text-sky-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de mes */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Calendar className="h-4 w-4 text-amber-400" />
          <span>Resumen correspondiente a:</span>
        </div>
        <select
          value={month}
          onChange={(e) => onMonthChange(e.target.value as MonthKey)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 sm:w-64"
        >
          {availableMonths.length === 0 ? (
            <option value={month}>{formatMonth(month)}</option>
          ) : (
            availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Resumen global del mes */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-lg shadow-black/30 backdrop-blur transition hover:border-zinc-700"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
                <Icon className={`h-5 w-5 ${card.accent}`} />
              </div>
              <p className="text-2xl font-bold text-zinc-100">{card.value}</p>
              <p className="mt-1 text-xs text-zinc-400">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Métricas por ejercicio */}
      <div>
        <h3 className="mb-3 px-1 text-sm font-medium text-zinc-300">
          Métricas por ejercicio · {formatMonth(month)}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {byExercise.map((stat) => {
            const hasData = stat.sessionsInMonth > 0;
            const loadDiff = stat.loadProgressPercentage ?? 0;
            const volDiff = stat.volumeProgressPercentage ?? 0;

            const activeGoal = selectedGoals[stat.exercise] || 'hipertrofia';
            
            // Usamos la función importada desde lib/stats
            const prescription = stat.best1RM > 0 ? getGoalRecommendation(stat.best1RM, activeGoal) : null;

            return (
              <div
                key={stat.exercise}
                className={`rounded-2xl border bg-zinc-950/60 p-5 shadow-lg shadow-black/30 backdrop-blur transition ${
                  hasData ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-900 opacity-60'
                }`}
              >
                {/* Header Ejercicio */}
                <div className="mb-4 flex items-center justify-between border-b border-zinc-800/60 pb-3">
                  <h4 className="font-semibold text-zinc-100">{stat.exercise}</h4>
                  <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs text-zinc-400">
                    {stat.sessionsInMonth} {stat.sessionsInMonth === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>

                {/* Métricas históricas y del mes */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-zinc-500">Carga media</p>
                    <p className="font-semibold text-sky-400">
                      {stat.avgLoadPerSet > 0 ? `${fmt(stat.avgLoadPerSet)} kg` : '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Mejora Carga (vs mes ant.)</p>
                    <p
                      className={`font-semibold flex items-center gap-1 ${
                        loadDiff > 0
                          ? 'text-emerald-400'
                          : loadDiff < 0
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {loadDiff > 0 && <TrendingUp className="h-3.5 w-3.5" />}
                      {loadDiff < 0 && <TrendingDown className="h-3.5 w-3.5" />}
                      {loadDiff === 0 && <Minus className="h-3.5 w-3.5" />}
                      {fmtProgress(loadDiff)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Volumen del mes</p>
                    <p className="font-semibold text-emerald-400">
                      {stat.totalVolumeMonth > 0 ? `${fmt(stat.totalVolumeMonth)}` : '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Mejora Vol. (vs mes ant.)</p>
                    <p
                      className={`font-semibold flex items-center gap-1 ${
                        volDiff > 0
                          ? 'text-emerald-400'
                          : volDiff < 0
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {volDiff > 0 && <TrendingUp className="h-3.5 w-3.5" />}
                      {volDiff < 0 && <TrendingDown className="h-3.5 w-3.5" />}
                      {volDiff === 0 && <Minus className="h-3.5 w-3.5" />}
                      {fmtProgress(volDiff)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Peso máx. histórico</p>
                    <p className="font-semibold text-amber-400">
                      {stat.maxWeightHistorical > 0 ? `${fmt(stat.maxWeightHistorical)} kg` : '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Mejor 1RM (Epley)</p>
                    <p className="font-semibold text-rose-400">
                      {stat.best1RM > 0 ? `${fmt(stat.best1RM)} kg` : '—'}
                    </p>
                  </div>
                </div>

                {/* SECCIÓN INTERACTIVA: RECOMENDACIÓN DE CARGA / OBJETIVO */}
                {prescription && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/80">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                      <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                        <Target className="h-3 w-3 text-amber-400" /> Carga Sugerida
                      </span>

                      {/* Selector de Objetivos */}
                      <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 overflow-x-auto">
                        {(['hipertrofia', 'fuerza', 'potencia', 'resistencia'] as TrainingGoal[]).map((g) => (
                          <button
                            type="button"
                            key={g}
                            onClick={() => handleGoalChange(stat.exercise, g)}
                            className={`px-2 py-0.5 text-[10px] font-medium capitalize rounded-md transition whitespace-nowrap ${
                              activeGoal === g
                                ? 'bg-amber-500 text-zinc-950 font-bold'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {g === 'hipertrofia'
                              ? 'Hipertrofia'
                              : g === 'fuerza'
                              ? 'Fuerza'
                              : g === 'potencia'
                              ? 'Potencia'
                              : 'Resistencia'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prescripción Calculada de lib/stats */}
                    <div className="bg-zinc-900/70 rounded-xl p-2.5 border border-zinc-800/50 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-zinc-500">{prescription.intensityRange}</p>
                        <p className="font-bold text-amber-400">
                          {prescription.weightMin} - {prescription.weightMax} kg
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500">Esquema</p>
                        <p className="font-semibold text-zinc-200">
                          {prescription.sets} × {prescription.reps}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500">Descanso</p>
                        <p className="font-semibold text-sky-400">{prescription.rest}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
