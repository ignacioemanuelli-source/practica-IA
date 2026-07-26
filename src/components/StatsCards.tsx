import { Dumbbell, Gauge, TrendingUp, Repeat, Calendar } from 'lucide-react';
import { useMemo } from 'react';
import type { WorkoutSession } from '@/lib/supabase';
import {
  computeMonthSummary,
  computeMonthlyStatsByExercise,
  formatMonth,
  getAvailableMonths,
  type MonthKey,
} from '@/lib/stats';

type Props = {
  sessions: WorkoutSession[];
  month: MonthKey;
  onMonthChange: (month: MonthKey) => void;
};

const fmt = (n: number) =>
  n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

export default function StatsCards({ sessions, month, onMonthChange }: Props) {
  const availableMonths = useMemo(() => getAvailableMonths(sessions), [sessions]);
  const byExercise = useMemo(
    () => computeMonthlyStatsByExercise(sessions, month),
    [sessions, month]
  );
  const summary = useMemo(() => computeMonthSummary(sessions, month), [sessions, month]);

  const summaryCards = [
    {
      label: 'Sesiones del mes',
      value: summary.sessions,
      icon: Dumbbell,
      accent: 'text-amber-400',
    },
    {
      label: 'Mejor 1RM estimado (kg)',
      value: summary.best1RM > 0 ? fmt(summary.best1RM) : '—',
      icon: Gauge,
      accent: 'text-rose-400',
    },
    {
      label: 'Volumen total del mes (kg·rep)',
      value: summary.totalVolume > 0 ? fmt(summary.totalVolume) : '—',
      icon: TrendingUp,
      accent: 'text-emerald-400',
    },
    {
      label: 'Repeticiones del mes',
      value: summary.totalReps,
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
          onChange={(e) => onMonthChange(e.target.value)}
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

      {/* KPIs por ejercicio (mes seleccionado) */}
      <div>
        <h3 className="mb-3 px-1 text-sm font-medium text-zinc-300">
          KPIs por ejercicio · {formatMonth(month)}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {byExercise.map((stat) => {
            const hasData = stat.sessionsInMonth > 0;
            return (
              <div
                key={stat.exercise}
                className={`rounded-2xl border bg-zinc-950/60 p-5 shadow-lg shadow-black/30 backdrop-blur transition ${
                  hasData ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-900 opacity-60'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold text-zinc-100">{stat.exercise}</h4>
                  <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs text-zinc-400">
                    {stat.sessionsInMonth} {stat.sessionsInMonth === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
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
                  <div>
                    <p className="text-xs text-zinc-500">Volumen del mes</p>
                    <p className="font-semibold text-emerald-400">
                      {stat.totalVolumeMonth > 0 ? `${fmt(stat.totalVolumeMonth)}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Carga media (kg/serie)</p>
                    <p className="font-semibold text-sky-400">
                      {stat.avgLoadPerSet > 0 ? `${fmt(stat.avgLoadPerSet)} kg` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
