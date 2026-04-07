# Italcol SST - Estructura de Datos (MongoDB)

Este documento describe la estructura de las colecciones utilizadas en el sistema de Observaciones de Comportamiento de Italcol, optimizado para MongoDB.

Base de Datos: `sst_italcol`

## 1. Colección: `observations`
Almacena los reportes completos de SST.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `String` | Identificador único del reporte (Local ID). |
| `timestamp` | `Number` | Marca de tiempo en milisegundos. |
| `planta` | `String` | Nombre de la planta donde se realizó. |
| `observador` | `String` | Nombre completo del observador. |
| `tarea` | `String` | Descripción de la tarea observada. |
| `fecha` | `String` | Fecha en formato `YYYY-MM-DD`. |
| `respuestas` | `Object` | Diccionario de IDs de comportamiento y su estado. |
| `barrerasC` | `String` | Texto libre sobre barreras de tipo C. |
| `seguimiento`| `String` | Acciones tomadas tras el reporte. |
| `synced` | `Boolean`| Estado de sincronía con la nube. |

## 2. Colección: `observers`
Catálogo de observadores por planta para autocompletado inteligente.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `name` | `String` | Nombre completo (Unique por planta). |
| `plant` | `String` | Nombre de la planta asociada. |

## 3. Colección: `tasks`
Historial de tareas registradas para selección rápida.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `name` | `String` | Descripción de la tarea. |
| `plant` | `String` | Planta asociada. |

## 4. Índices Recomendados
Para garantizar rapidez en la búsqueda y evitar duplicados en metadatos, se recomiendan los siguientes índices en el cluster:

```javascript
// Único para evitar duplicar nombres en sugerencias
db.observers.createIndex({ "name": 1, "plant": 1 }, { unique: true });
db.tasks.createIndex({ "name": 1, "plant": 1 }, { unique: true });

// Rápido para reportes por ID
db.observations.createIndex({ "id": 1 });
```

---
> [!IMPORTANT]
> El sistema utiliza inserciones con **Upsert** (`replaceOne` con `upsert: true`) para manejar la sincronización offline de forma segura sin generar duplicados.
