-- Tabla: observers
-- Descripción: Catálogo de observadores por planta para autocompletado inteligente.

CREATE TABLE IF NOT EXISTS observers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plant TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(name, plant)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_observers_plant ON observers(plant);

-- RLS (Row Level Security)
ALTER TABLE observers ENABLE ROW LEVEL SECURITY;

-- Políticas
-- 1. Acceso total solo para Administradores Autenticados
DROP POLICY IF EXISTS "Admin Full Observers" ON observers;
DROP POLICY IF EXISTS "Public View Observers" ON observers;

CREATE POLICY "Admin Full Observers" ON observers 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Permisos base
GRANT ALL ON TABLE observers TO authenticated;
GRANT ALL ON TABLE observers TO service_role;



