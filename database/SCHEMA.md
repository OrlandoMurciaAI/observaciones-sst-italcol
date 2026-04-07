# Italcol SST - Estructura de Datos (Supabase / Postgres)

Este proyecto ha migrado de MongoDB a **Supabase (PostgreSQL)** para mejorar la compatibilidad con el entorno de ejecución de Cloudflare y simplificar la gestión de datos relacionales.

## 1. Tablas en Supabase

### `observations`
Almacena los reportes completos de SST recolectados en campo.

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | Clave primaria autogenerada en base de datos. |
| `local_id` | `Text` | Identificador único generado por el cliente (Unique). |
| `timestamp` | `BigInt` | Marca de tiempo en milisegundos para ordenamiento. |
| `planta` | `Text` | Nombre de la planta donde se realizó la observación. |
| `observador` | `Text` | Nombre completo del observador. |
| `tarea` | `Text` | Descripción de la tarea observada. |
| `fecha` | `Date` | Fecha de la observación (YYYY-MM-DD). |
| `respuestas` | `Jsonb` | Diccionario de IDs de comportamiento y sus estados. |
| `barreras_c` | `Text` | Texto libre sobre barreras de tipo C. |
| `seguimiento` | `Text` | Acciones tomadas tras el reporte. |
| `synced` | `Boolean` | Estado de sincronía (siempre true si está en nube). |
| `updated_at` | `Timestamptz` | Última modificación del registro. |

### `observers`
Catálogo de observadores por planta para el autocompletado inteligente.

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `name` | `Text` | Nombre completo del observador. |
| `plant` | `Text` | Planta asociada. |
| *Constraint* | `Unique` | `(name, plant)` evita duplicados. |

### `tasks`
Historial de tareas registradas para selección rápida en el formulario.

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `name` | `Text` | Descripción de la tarea. |
| `plant` | `Text` | Planta asociada. |
| *Constraint* | `Unique` | `(name, plant)` evita duplicados. |

## 2. Aplicación de Cambios
Los scripts de creación de tablas se encuentran en la carpeta `/database`:
1.  [`00_init.sql`](./00_init.sql): Extensiones necesarias.
2.  [`01_observations.sql`](./01_observations.sql): Estructura de reportes y políticas RLS (Admin Only para lectura/escritura).
3.  [`02_observers.sql`](./02_observers.sql): Catálogo de personal.
4.  [`03_tasks.sql`](./03_tasks.sql): Historial de actividades.

Para aplicar cambios, ejecuta los scripts en orden en el **Editor SQL** de Supabase.

---

## 3. Seguridad (RLS)
El sistema implementa **Row Level Security (RLS)** con los siguientes principios:
-   **Público (Anon)**: Solo puede insertar registros (sincronizar desde planta) y leer catálogos (observers/tasks) para autocompletado. No tiene acceso de lectura a los reportes de otros.
-   **Admin (Authenticated)**: Control total sobre todos los registros previo login con **Supabase Auth**.

---

## [Legacy] Documentación MongoDB
*Histórico: Este proyecto utilizó MongoDB inicialmente. Los esquemas originales se conservan en `database/SCHEMA_MONGODB.md` (renombrado).*
