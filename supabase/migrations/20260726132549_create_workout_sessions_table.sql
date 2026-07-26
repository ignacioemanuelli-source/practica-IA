/*
# Create workout_sessions table (single-tenant, no auth)

1. New Tables
- `workout_sessions`
  - `id` (uuid, primary key)
  - `date` (date, not null) — the day the session took place
  - `exercise` (text, not null) — name of the exercise (e.g. Sentadilla, Press de banca)
  - `weight` (numeric, not null) — weight lifted in kilograms
  - `reps` (integer, not null) — repetitions performed per set
  - `sets` (integer, not null) — number of sets performed
  - `created_at` (timestamptz) — record creation time
2. Security
- Enable RLS on `workout_sessions`.
- Allow anon + authenticated full CRUD (intentionally public/shared single-tenant app, no sign-in).
3. Notes
- No user_id column because there is no sign-in flow.
- Index on `date` to speed up date-range queries and dashboard ordering.
*/

CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  exercise text NOT NULL,
  weight numeric(6,2) NOT NULL CHECK (weight >= 0),
  reps integer NOT NULL CHECK (reps > 0),
  sets integer NOT NULL CHECK (sets > 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions (date DESC);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workout_sessions" ON workout_sessions;
CREATE POLICY "anon_select_workout_sessions" ON workout_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workout_sessions" ON workout_sessions;
CREATE POLICY "anon_insert_workout_sessions" ON workout_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workout_sessions" ON workout_sessions;
CREATE POLICY "anon_update_workout_sessions" ON workout_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workout_sessions" ON workout_sessions;
CREATE POLICY "anon_delete_workout_sessions" ON workout_sessions FOR DELETE
  TO anon, authenticated USING (true);
