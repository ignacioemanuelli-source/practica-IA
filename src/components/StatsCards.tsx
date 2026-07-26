import { Dumbbell, Gauge, TrendingUp, TrendingDown, Repeat, Calendar, Minus, Target } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import type { WorkoutSession } from '@/lib/supabase';
import {
  computeMonthSummary,
  computeExerciseStatsForMonths,
  getPreviousMonthKey,
  formatMonth,
  getAvailableMonths,
  getGoalRecommendation,
  EXERCISES,
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

/** TARJETA INDIVIDUAL DE EJERCICIO CON SELECTOR DE COMPARACIÓN */
function ExerciseStatCard({
  exercise,
  sessions,
  currentMonth,
  availableMonths,
}: {
  exercise: string;
  sessions: WorkoutSession[];
  currentMonth: MonthKey;
  availableMonths: MonthKey[];
}) {
  // Estado local para el mes de comparación (por defecto el mes anterior)
  const [compareMonth, setCompareMonth] = useState<MonthKey>(() => getPreviousMonthKey(currentMonth));

  // Si cambia el mes principal en la app, reajustamos el mes a comparar al anterior por defecto
  useEffect(() => {
    setCompareMonth(getPreviousMonthKey(currentMonth));
  }, [currentMonth]);

  // Cálculo memoizado de las métricas de este ejercicio en específico
  const stat = useMemo(
    () => computeExerciseStatsForMonths(sessions, exercise, currentMonth, compareMonth),
    [sessions, exercise, currentMonth, compareMonth]
  );

  const hasData = stat.sessionsInMonth > 0;
  const loadDiff = stat.loadProgressPercentage ?? 0;
  const volDiff = stat.volumeProgressPercentage ?? 0;

  return (
    <div
      className={`rounded-2xl border bg-zinc-950/60 p-5 shadow-lg shadow-black/30 backdrop-blur transition ${
        hasData ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-900 opacity-60'
      }`}
    >
      {/* Header Ejercicio & Selector de comparación */}
      <div className="mb-4 border-b border-zinc-800/60 pb-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-zinc-100">{stat.exercise}</h4>
          <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs text-zinc-400">
            {stat.sessionsInMonth} {stat.sessionsInMonth === 1 ? 'sesión' : 'sesiones'}
          </span>
        </div>

        {/* Selector de mes a comparar */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Comparar vs:</span>
          <select
            value={compareMonth}
            onChange={(e) => setCompareMonth(e.target.value as MonthKey)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-amber-400 outline-none focus:border-amber-500"
          >
            {availableMonths
              .filter((m) => m !== currentMonth) // Evita comparar el mes contra sí mismo
              .map((m) => (
                <option key={m} value={m}>
                  {formatMonth(m)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Grid de KPIs individuales */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <div>
          <p className="text-xs text-zinc-500">Carga media</p>
          <p className="font-semibold text-sky-400">
            {stat.avgLoadPerSet > 0 ? `${fmt(stat.avgLoadPerSet)} kg` : '—'}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Variación Carga</p>
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
          <p className="text-xs text-zinc-500">Variación Vol.</p>
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
    </div>
  );
}

export default function StatsCards({ sessions = [], month, onMonthChange }: Props) {
  const availableMonths = useMemo(() => getAvailableMonths(sessions || []), [sessions]);
  const summary = useMemo(() => computeMonthSummary(sessions || [], month), [sessions, month]);

  // Estados para la calculadora global
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [manual1RM, setManual1RM] = useState<number | ''>('');
  const [calcGoal, setCalcGoal] = useState<TrainingGoal>('hipertrofia');

  // Primer ejercicio para inicializar el selector
  const activeExerciseName = selectedExercise || EXERCISES[0];

  // Obtener 1RM del ejercicio seleccionado para la calculadora
  const currentEx1RM = useMemo(() => {
    const filtered = sessions.filter((s) => s.exercise === activeExerciseName);
    return filtered.reduce((max, s) => {
      const rm = s.weight * (1 + s.reps / 30);
      return rm > max ? rm : max;
    }, 0);
  }, [sessions, activeExerciseName]);

  const activeRM = typeof manual1RM === 'number' && manual1RM > 0 ? manual1RM : currentEx1RM;
  const prescription = activeRM > 0 ? getGoalRecommendation(activeRM, calcGoal) : null;

  const summaryCards = [
    { label: 'Sesiones del mes', value: summary?.sessions ?? 0, icon: Dumbbell, accent: 'text-amber-400' },
    { label: 'Mejor 1RM estimado (kg)', value: summary?.best1RM && summary.best1RM > 0 ? fmt(summary.best1RM) : '—', icon: Gauge, accent: 'text-rose-400' },
    { label: 'Volumen total del mes (kg·rep)', value: summary?.totalVolume && summary.totalVolume > 0 ? fmt(summary.totalVolume) : '—', icon: TrendingUp, accent: 'text-emerald-400' },
    { label: 'Repeticiones del mes', value: summary?.totalReps ?? 0, icon: Repeat, accent: 'text-sky-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de mes Global */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Calendar className="h-4 w-4 text-amber-400" />
          <span>Resumen correspondiente a:</span>
        </div>
        <select
          value={month}
          onChange={(e) => onMonthChange(e.target.value as MonthKey)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-zinc-100 outline-none transition focus:border-amber-500 sm:w-64"
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

      {/* Tarjetas globales del mes */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 backdrop-blur">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
                <Icon className={`h-5 w-5 ${card.accent}`} />
              </div>
              <p className="text-2xl font-bold text-zinc-100">{card.value}</p>
              <p className="mt-1 text-xs text-zinc-400">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* CALCULADORA DE CARGA */}
      <div className="rounded-2xl border border-amber-500/30 bg-zinc-950/80 p-5 shadow-xl shadow-amber-500/5 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-zinc-100">Calculadora de Carga y Prescripción</h3>
          </div>
          <span className="text-xs text-zinc-400">Carga recomendada según tu 1RM</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Seleccionar Ejercicio</label>
              <select
                value={activeExerciseName}
                onChange={(e) => {
                  setSelectedExercise(e.target.value);
                  setManual1RM('');
                }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500"
              >
                {EXERCISES.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-400">O ingresar 1RM manual (kg)</label>
              <input
                type="number"
                placeholder="Ej. 100"
                value={manual1RM}
                onChange={(e) => setManual1RM(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-zinc-400">Seleccionar Objetivo</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'hipertrofia', label: 'Hipertrofia' },
                { id: 'fuerza', label: 'Fuerza Máx.' },
                { id: 'potencia', label: 'Potencia' },
                { id: 'resistencia', label: 'Resistencia' },
              ].map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => setCalcGoal(g.id as TrainingGoal)}
                  className={`rounded-xl p-2.5 text-xs font-medium transition ${
                    calcGoal === g.id
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            {prescription ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-amber-400">{prescription.label}</p>
                  <span className="text-[10px] text-zinc-500">{prescription.intensityRange}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-zinc-500">Peso Sugerido</span>
                    <strong className="text-base text-zinc-100">
                      {prescription.weightMin} - {prescription.weightMax} kg
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500">Series y Reps</span>
                    <strong className="text-zinc-200">
                      {prescription.sets} × {prescription.reps}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500">Descanso</span>
                    <strong className="text-sky-400">{prescription.rest}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500">1RM Base</span>
                    <strong className="text-zinc-300">{fmt(activeRM)} kg</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-zinc-500">
                Selecciona un ejercicio con 1RM o ingresa un peso manual.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MÉTRICAS POR EJERCICIO (Cada una con su propio mes de comparación) */}
      <div>
        <h3 className="mb-3 px-1 text-sm font-medium text-zinc-300">
          Métricas por ejercicio · {formatMonth(month)}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {EXERCISES.map((ex) => (
            <ExerciseStatCard
              key={ex}
              exercise={ex}
              sessions={sessions}
              currentMonth={month}
              availableMonths={availableMonths}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
