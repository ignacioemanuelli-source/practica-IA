import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dumbbell, Activity } from 'lucide-react';
import { supabase, type WorkoutSession } from '@/lib/supabase';
import { getAvailableMonths, type MonthKey } from '@/lib/stats';
import SessionForm from '@/components/SessionForm';
import SessionList from '@/components/SessionList';
import { TrainingCalculator, StatsSection } from '@/components/StatsCards';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function App() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<MonthKey>(currentMonth());

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSessions(data as WorkoutSession[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const availableMonths = useMemo(() => getAvailableMonths(sessions), [sessions]);
  const effectiveMonth =
    availableMonths.length === 0
      ? month
      : availableMonths.includes(month)
      ? month
      : availableMonths[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Seguimiento de Progreso</h1>
              <p className="text-sm text-zinc-400">
                Registra y sigue el progreso de tus entrenamientos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-400">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>{sessions.length} sesiones en registro</span>
          </div>
        </header>

        {/* 1. CALCULADORA DE CARGA Y PRESCRIPCIÓN */}
        <section>
          <TrainingCalculator sessions={sessions} />
        </section>

        {/* 2. REGISTRO DE SESIÓN */}
        <section className="mx-auto max-w-2xl">
          <SessionForm onSaved={fetchSessions} />
        </section>

        {/* 3. KPIS Y MÉTRICAS POR EJERCICIO */}
        <section>
          <StatsSection
            sessions={sessions}
            month={effectiveMonth}
            onMonthChange={setMonth}
          />
        </section>

        {/* 4. HISTORIAL DE SESIONES */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">Historial de Registros</h3>
          <SessionList sessions={sessions} loading={loading} onChanged={fetchSessions} />
        </section>

        <footer className="pt-6 text-center text-xs text-zinc-600">
          Tus sesiones se guardan de forma segura en la base de datos del proyecto.
        </footer>
      </div>
    </div>
  );
}