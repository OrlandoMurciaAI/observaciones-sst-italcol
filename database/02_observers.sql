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
-- El público puede leer para el autocompletado si fuese necesario
CREATE POLICY "Public Read Observers" ON observers FOR SELECT TO anon USING (true);
-- Solo trabajadores registrados pueden añadir nuevos nombres
CREATE POLICY "Admin Full Observers" ON observers FOR ALL TO authenticated USING (true);
