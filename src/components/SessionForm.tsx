import { useState } from 'react';
import { Dumbbell, PlusCircle, Check } from 'lucide-react';
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
      {/* Encabezado identico a la calculadora */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-amber-400" />
          <h3 className="font-semibold text-zinc-100">Registrar Nueva Sesión</h3>
        </div>
        <span className="text-xs text-zinc-400">Guarda tus series y repeticiones</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Layout en Grid horizontal (3 columnas en pantallas medianas) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Seleccionar Ejercicio */}
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Ejercicio</label>
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

          {/* Peso levandado */}
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

          {/* Repeticiones */}
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
        </div>

        {/* Fila inferior: Fecha y Botón de envío */}
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-1/3">
            <label className="mb-1 block text-xs text-zinc-400">Fecha de la sesión</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-end justify-end sm:w-1/3">
            <button
              type="submit"
              disabled={saving}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition sm:w-auto ${
                success
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 active:scale-98'
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