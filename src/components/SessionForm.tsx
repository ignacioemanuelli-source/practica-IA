import { useState } from 'react';
import { Dumbbell, PlusCircle, Check, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EXERCISES } from '@/lib/stats';

type Props = {
  onSaved: () => void;
};

export default function SessionForm({ onSaved }: Props) {
  const [exercise, setExercise] = useState<string>(EXERCISES[0]);
  const [weight, setWeight] = useState<number | ''>('');
  const [reps, setReps] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !reps || weight <= 0 || reps <= 0) return;

    setSaving(true);
    setSuccess(false);

    const { error } = await supabase.from('workout_sessions').insert([
      {
        exercise,
        weight: Number(weight),
        reps: Number(reps),
        date,
      },
    ]);

    setSaving(false);

    if (!error) {
      setSuccess(true);
      setWeight('');
      setReps('');
      onSaved();
      setTimeout(() => setSuccess(false), 2500);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-zinc-950/80 p-5 shadow-xl shadow-amber-500/5 backdrop-blur">
      {/* Encabezado idéntico en estructura y dimensiones */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-amber-400" />
          <h3 className="font-semibold text-zinc-100">Registrar Nueva Sesión</h3>
        </div>
        <span className="text-xs text-zinc-400">Guarda tus series y repeticiones</span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Grid idéntico de 3 columnas (md:grid-cols-3) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Columna 1: Selección de Ejercicio y Carga */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Seleccionar Ejercicio</label>
              <select
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
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
              <label className="mb-1 block text-xs text-zinc-400">Carga / Peso (kg)</label>
              <input
                type="number"
                min={1}
                step="any"
                placeholder="Ej. 80"
                value={weight}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setWeight('');
                  } else {
                    const parsed = Number(raw);
                    setWeight(Number.isNaN(parsed) ? '' : parsed);
                  }
                }}
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Columna 2: Repeticiones y Fecha */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Repeticiones</label>
              <input
                type="number"
                min={1}
                placeholder="Ej. 10"
                value={reps}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setReps('');
                  } else {
                    const parsed = Number(raw);
                    setReps(Number.isNaN(parsed) ? '' : parsed);
                  }
                }}
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-400">Fecha de la sesión</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Columna 3: Tarjeta equivalente al bloque de "Prescripción" */}
          <div className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-amber-400">Confirmación de Carga</p>
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              </div>
              <p className="text-[10px] text-zinc-400">
                Asegúrate de registrar tus series efectivas con técnica controlada.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition ${
                success
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 active:scale-95'
              } disabled:opacity-50`}
            >
              {success ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>¡Guardado con éxito!</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>{saving ? 'Guardando...' : 'Guardar Sesión'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
