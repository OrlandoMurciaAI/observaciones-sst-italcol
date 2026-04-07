-- Tabla: tasks
-- Descripción: Historial de tareas registradas para selección rápida.

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plant TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(name, plant)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tasks_plant ON tasks(plant);

-- RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Políticas
-- El público puede leer para el autocompletado si fuese necesario
CREATE POLICY "Public Read Tasks" ON tasks FOR SELECT TO anon USING (true);
-- Solo trabajadores registrados pueden registrar nuevas tareas
CREATE POLICY "Admin Full Tasks" ON tasks FOR ALL TO authenticated USING (true);
