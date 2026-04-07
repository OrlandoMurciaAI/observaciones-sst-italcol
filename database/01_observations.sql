-- Tabla: observations
-- Descripción: Almacena los reportes completos de SST recolectados en campo.

CREATE TABLE IF NOT EXISTS observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id TEXT UNIQUE NOT NULL, -- ID único generado por el cliente
    timestamp BIGINT NOT NULL,
    planta TEXT NOT NULL,
    observador TEXT NOT NULL,
    tarea TEXT NOT NULL,
    fecha DATE NOT NULL,
    respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
    barreras_c TEXT,
    seguimiento TEXT,
    synced BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_observations_local_id ON observations(local_id);
CREATE INDEX IF NOT EXISTS idx_observations_planta ON observations(planta);
CREATE INDEX IF NOT EXISTS idx_observations_fecha ON observations(fecha);

-- RLS (Row Level Security)
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Admin All Access" ON observations FOR ALL TO authenticated USING (true);
-- Nota: Se ha eliminado el acceso anónimo para inserción por requerimiento de seguridad.
