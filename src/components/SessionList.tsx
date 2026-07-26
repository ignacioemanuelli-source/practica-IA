import { Trash2, Loader2, Inbox } from 'lucide-react';
import { useState } from 'react';
import { supabase, type WorkoutSession } from '@/lib/supabase';

type Props = {
  sessions: WorkoutSession[];
  loading: boolean;
  onChanged: () => void;
};

const formatDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function SessionList({ sessions, loading, onChanged }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from('workout_sessions').delete().eq('id', id);
    setDeletingId(null);
    onChanged();
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-xl shadow-black/40 backdrop-blur">
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">Historial de sesiones</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm text-zinc-400">
            Aún no hay sesiones registradas.
            <br />
            Completa el formulario para añadir la primera.
          </p>
        </div>
      ) : (
        <div className="-mx-2 max-h-[28rem] overflow-y-auto px-2">
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700 hover:bg-zinc-900/70"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold text-zinc-100">{s.exercise}</span>
                    <span className="shrink-0 text-xs text-zinc-500">{formatDate(s.date)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span>
                      <span className="font-medium text-amber-400">{s.weight} kg</span> · peso
                    </span>
                    <span>
                      <span className="font-medium text-sky-400">{s.reps}</span> · reps
                    </span>
                    <span>
                      <span className="font-medium text-emerald-400">{s.sets}</span> · series
                    </span>
                    <span className="text-zinc-500">
                      Volumen:{' '}
                      <span className="font-medium text-zinc-300">
                        {(s.weight * s.reps * s.sets).toLocaleString('es-ES')} kg·rep
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
                  aria-label="Eliminar sesión"
                >
                  {deletingId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

