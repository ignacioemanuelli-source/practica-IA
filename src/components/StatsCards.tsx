
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
  // Meses elegibles para comparar (excluimos el mes actual)
  const validCompareMonths = useMemo(
    () => availableMonths.filter((m) => m !== currentMonth),
    [availableMonths, currentMonth]
  );

  // Función helper para encontrar el mejor mes por defecto disponible
  const getDefaultCompareMonth = (): MonthKey => {
    const idealPrev = getPreviousMonthKey(currentMonth);
    // Si el mes anterior estricto existe en los datos, usamos ese
    if (validCompareMonths.includes(idealPrev)) return idealPrev;
    // Si no, tomamos el primer mes anterior que tengamos registrado
    return validCompareMonths[0] || currentMonth;
  };

  // Estado local
  const [compareMonth, setCompareMonth] = useState<MonthKey>(getDefaultCompareMonth);

  // Reajustar cuando cambia el mes principal
  useEffect(() => {
    setCompareMonth(getDefaultCompareMonth());
  }, [currentMonth, validCompareMonths]);

  // Cálculo memoizado de las métricas
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
          {validCompareMonths.length > 0 ? (
            <select
              value={compareMonth}
              onChange={(e) => setCompareMonth(e.target.value as MonthKey)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-amber-400 outline-none focus:border-amber-500 cursor-pointer"
            >
              {validCompareMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonth(m)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-zinc-600 italic">Sin meses previos</span>
          )}
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