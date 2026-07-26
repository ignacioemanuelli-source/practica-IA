/** 1. Componente independiente para la Calculadora */
export function TrainingCalculator({ sessions = [] }: { sessions: WorkoutSession[] }) {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [manual1RM, setManual1RM] = useState<number | ''>('');
  const [calcGoal, setCalcGoal] = useState<TrainingGoal>('hipertrofia');

  const activeExerciseName = selectedExercise || EXERCISES[0];

  const currentEx1RM = useMemo(() => {
    const filtered = sessions.filter((s) => s.exercise === activeExerciseName);
    return filtered.reduce((max, s) => Math.max(max, epley1RM(s.weight, s.reps)), 0);
  }, [sessions, activeExerciseName]);

  const activeRM = typeof manual1RM === 'number' && manual1RM > 0 ? manual1RM : currentEx1RM;
  const prescription = activeRM > 0 ? getGoalRecommendation(activeRM, calcGoal) : null;

  return (
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
              min={1}
              step="any"
              placeholder="Ej. 100"
              value={manual1RM}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setManual1RM('');
                } else {
                  const parsed = Number(raw);
                  setManual1RM(Number.isNaN(parsed) ? '' : parsed);
                }
              }}
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
                    ? 'bg-amber-500 font-bold text-zinc-950 shadow'
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
  );
}

/** 2. Componente independiente para KPIs globales y métricas por ejercicio */
export function StatsSection({ sessions = [], month, onMonthChange }: Props) {
  const availableMonths = useMemo(() => getAvailableMonths(sessions || []), [sessions]);
  const summary = useMemo(() => computeMonthSummary(sessions || [], month), [sessions, month]);

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

      {/* MÉTRICAS POR EJERCICIO */}
      <div>
        <h3 className="mb-3 px-1 text-sm font-medium text-zinc-300">
          Métricas por ejercicio · {formatMonth(month)}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {EXERCISES.map((ex) => {
            const exerciseSessions = sessions.filter((s) => s.exercise === ex);
            return (
              <ExerciseStatCard
                key={ex}
                exercise={ex}
                sessions={exerciseSessions}
                currentMonth={month}
                availableMonths={availableMonths}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}