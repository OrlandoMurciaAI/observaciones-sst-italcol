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
-- 1. Acceso total solo para Administradores Autenticados
DROP POLICY IF EXISTS "Admin Full Tasks" ON tasks;
DROP POLICY IF EXISTS "Public View Tasks" ON tasks;

CREATE POLICY "Admin Full Tasks" ON tasks 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Permisos base
GRANT ALL ON TABLE tasks TO authenticated;
GRANT ALL ON TABLE tasks TO service_role;



