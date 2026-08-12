/*
# Create research data tables for Geometric Quest experiment

1. Purpose
   Store gameplay session data for an A/B experiment on AI-assisted jump correction.
   The game is a single-player auto-scroll platformer. No sign-in is required —
   data is intentionally public/shared so the anon-key client can write telemetry.

2. New Tables

   - `sessions`: One row per play session (one stage attempt).
     - `id` (uuid, PK)
     - `session_token` (text, random ID generated client-side to group attempts by player)
     - `condition` (text: 'A' = manual skill selection, 'B' = AI-assisted)
     - `world` (int, which world 1-5)
     - `stage` (int, which stage within the world)
     - `difficulty` (int, 1=easy, 2=normal, 3=hard)
     - `skill` (text, which skill was selected, or null)
     - `cleared` (boolean, whether the stage was cleared)
     - `time_ms` (int, duration of the attempt in milliseconds)
     - `deaths` (int, number of deaths in this attempt)
     - `jump_count` (int, total jumps performed)
     - `ai_jump_adjustment` (float, the AI jump height correction applied, 0.0 = none)
     - `created_at` (timestamptz)

   - `jump_events`: Individual jump telemetry events.
     - `id` (uuid, PK)
     - `session_id` (uuid, FK to sessions)
     - `session_token` (text, for grouping)
     - `world` (int)
     - `stage` (int)
     - `difficulty` (int)
     - `skill` (text, nullable)
     - `condition` (text, 'A' or 'B')
     - `x_position` (float, player x when jump started)
     - `y_position` (float, player y when jump started)
     - `jump_velocity` (float, initial jump velocity applied)
     - `base_jump_velocity` (float, the unmodified base jump velocity)
     - `ai_adjustment` (float, correction factor applied by AI, 0.0 if condition A)
     - `cleared` (boolean, whether this attempt cleared the stage)
     - `created_at` (timestamptz)

3. Security
   - RLS enabled on both tables.
   - Allow anon + authenticated full CRUD — data is intentionally public for research.
   - No user_id / no auth required.
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL,
  condition text NOT NULL DEFAULT 'A',
  world int NOT NULL DEFAULT 1,
  stage int NOT NULL DEFAULT 1,
  difficulty int NOT NULL DEFAULT 2,
  skill text,
  cleared boolean NOT NULL DEFAULT false,
  time_ms int NOT NULL DEFAULT 0,
  deaths int NOT NULL DEFAULT 0,
  jump_count int NOT NULL DEFAULT 0,
  ai_jump_adjustment float NOT NULL DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS jump_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  condition text NOT NULL DEFAULT 'A',
  world int NOT NULL,
  stage int NOT NULL,
  difficulty int NOT NULL,
  skill text,
  x_position float NOT NULL DEFAULT 0,
  y_position float NOT NULL DEFAULT 0,
  jump_velocity float NOT NULL DEFAULT 0,
  base_jump_velocity float NOT NULL DEFAULT 0,
  ai_adjustment float NOT NULL DEFAULT 0.0,
  cleared boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jump_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_jump_events" ON jump_events;
CREATE POLICY "anon_select_jump_events" ON jump_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_jump_events" ON jump_events;
CREATE POLICY "anon_insert_jump_events" ON jump_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_jump_events" ON jump_events;
CREATE POLICY "anon_update_jump_events" ON jump_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_jump_events" ON jump_events;
CREATE POLICY "anon_delete_jump_events" ON jump_events FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for research queries
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_condition ON sessions(condition);
CREATE INDEX IF NOT EXISTS idx_sessions_difficulty ON sessions(difficulty);
CREATE INDEX IF NOT EXISTS idx_jump_events_token ON jump_events(session_token);
CREATE INDEX IF NOT EXISTS idx_jump_events_condition ON jump_events(condition);
CREATE INDEX IF NOT EXISTS idx_jump_events_difficulty ON jump_events(difficulty);
