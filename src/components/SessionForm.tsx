import { useState, type FormEvent } from 'react';
import { Dumbbell, Calendar, Plus, Loader2 } from 'lucide-react';
import { supabase, type WorkoutSessionInput } from '@/lib/supabase';
import { EXERCISES } from '@/lib/stats';

type Props = {
  onSaved: () => void;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function SessionForm({ onSaved }: Props) {
  const [form, setForm] = useState<WorkoutSessionInput>({
    date: todayISO(),
    exercise: '',
    weight: 0,
    reps: 0,
    sets: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = (field: keyof WorkoutSessionInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.exercise.trim()) {
      setError('Selecciona un ejercicio.');
      return;
    }
    if (form.weight < 0) {
      setError('El peso no puede ser negativo.');
      return;
    }
    if (form.reps <= 0) {
      setError('Las repeticiones deben ser mayores que cero.');
      return;
    }
    if (form.sets <= 0) {
      setError('Las series deben ser mayores que cero.');
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from('workout_sessions').insert({
      date: form.date,
      exercise: form.exercise.trim(),
      weight: Number(form.weight),
      reps: Number(form.reps),
      sets: Number(form.sets),
    });

    setSaving(false);

    if (insertError) {
      setError('No se pudo guardar la sesión. Inténtalo de nuevo.');
      return;
    }

    setSuccess(true);
    setForm({
      date: todayISO(),
      exercise: '',
      weight: 0,
      reps: 0,
      sets: 0,
    });
    onSaved();
  };

  const fieldBase =
    'w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-xl shadow-black/40 backdrop-blur"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Registrar sesión</h2>
          <p className="text-sm text-zinc-400">
            Añade los datos de tu entrenamiento de fuerza.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Fecha
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              className={`${fieldBase} pl-10`}
              required
            />
          </div>
        </div>

        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Ejercicio
          </label>
          <select
            value={form.exercise}
            onChange={(e) => update('exercise', e.target.value)}
            className={fieldBase}
            required
          >
            <option value="" disabled>
              Selecciona un ejercicio
            </option>
            {EXERCISES.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Peso (kg)
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={form.weight === 0 ? '' : form.weight}
            onChange={(e) => update('weight', e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
            className={fieldBase}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Repeticiones
          </label>
          <input
            type="number"
            min={1}
            value={form.reps === 0 ? '' : form.reps}
            onChange={(e) => update('reps', e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
            className={fieldBase}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Series
          </label>
          <input
            type="number"
            min={1}
            value={form.sets === 0 ? '' : form.sets}
            onChange={(e) => update('sets', e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
            className={fieldBase}
            required
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
      {success && !error && (
        <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          Sesión guardada correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
        Guardar sesión
      </button>
    </form>
  );
}
