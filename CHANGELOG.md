# Changelog: Sistema de Observaciones de Comportamiento Italcol SST

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.4.0] - 2026-04-08
### Añadido
- **Filtros de Gestión Avanzados**: Incorporación de selectores dinámicos para Planta, Observador y Tarea en la tabla de registros.
- **Rango Inteligente**: Carga automática del último mes de datos al iniciar el Dashboard y la Tabla de observaciones.

### Cambiado
- **Normalización de Esquema de Datos**: Transición completa de la nomenclatura interna a inglés (`plant`, `task`, `observer`, `responses`) para total consistencia con la base de datos Supabase.
- **Migración a Svelte 5 Runes**: Refactorización del Dashboard y la Tabla de Observaciones para utilizar reactividad nativa con `$state`, `$derived` y `$effect`.
- **Optimización de Interfaz**: Eliminación de vistas redundantes en dispositivos móviles para una navegación más fluida.

### Corregido
- **Bug de Dashboard Vacío**: Resolución del problema de mapeo de datos que impedía la visualización de gráficos tras la migración.

## [1.3.0] - 2026-04-07
### Añadido
- **Migración a Supabase (PostgreSQL)**: Reemplazo total de la infraestructura de backend para mayor estabilidad y seguridad.
- **Administrador de Registros SST**: Nueva página `/table` con filtros de fecha avanzados (optimización server-side).
- **Editor Integral de Observaciones**: Interfaz para editar todas las respuestas, motivos de riesgo, clasificación y seguimiento de forma remota.
- **Relaciones Geográficas**: Soporte para segmentación por plantas y observadores directamente en la base de datos distribuida.

### Cambiado
- **Refactorización de APIs**: Migración de rutas de MongoDB a Supabase con mapeo automático de campos (Inglés/Español).
- **Controladores Svelte 5**: Migración completa de eventos `on:click` a `onclick` para compatibilidad nativa con Svelte 5.
- **Astro Config**: Optimización de SSR para entornos Edge de Cloudflare y manejo de dependencias externas.

### Corregido
- **Persistencia de Filtros**: Los filtros de fecha ahora persisten entre recargas de página para mayor eficiencia del usuario.
- **Mapeo de Datos**: Resolución del bug que causaba que la tabla apareciera vacía debido al desajuste de nombres de columnas en la base de datos.

## [1.2.0] - 2026-04-07
### Añadido
- **Diseño Responsive del Dashboard**: Optimización completa para dispositivos móviles, tablets y escritorio.
- **Grillas Dinámicas**: KPIs y gráficos que se adaptan al ancho de pantalla.
- **Soporte Offline-First**: Implementación de sincronización automática que detecta la conexión a internet.
- **Validación Avanzada**: Nuevo flujo de confirmación antes de enviar observaciones para asegurar la integridad de los datos.

### Cambiado
- **Refactorización del Dashboard**: Mejora en el rendimiento de los cálculos de KPIs y agregaciones de datos.
- **Componentes de UI**: Migración a un sistema de diseño más premium con variables globales de CSS.

### Corregido
- **Bug de Recarga**: Se corrigió el problema donde el formulario se reiniciaba accidentalmente durante la evaluación de comportamientos.
- **Conflictos de Importación**: Resolución de errores de compilación en Astro relacionados con nombres de componentes.

## [1.1.0] - 2026-04-07
### Añadido
- **Panel de Inteligencia SST**: Dashboard interactivo con Chart.js para visualización de tendencias de riesgo.
- **Análisis de Causas Raíz**: Algoritmo básico de nube de palabras para identificar fallas sistémicas en los comentarios.
- **Exportación de Datos**: Función para exportar las observaciones filtradas a formato CSV.
- **Gestión de Sesiones**: Sistema de autenticación con cookies y persistencia en el lado del servidor.

## [1.0.0] - 2026-04-06
### Añadido
- **Lanzamiento Inicial**: Estructura base del proyecto con Astro 6.1.4 y Svelte 5.
- **Formulario de Captura**: Sistema de categorías para observar actos seguros y riesgosos.
- **Conectividad MongoDB**: Integración con MongoDB Atlas para el almacenamiento de observaciones y catálogos.
- **Autocompletado Inteligente**: Sugerencias dinámicas para observadores y tareas basadas en el historial de la planta.
- **Sistema de Diseño**: Configuración inicial de colores industriales (Italcol), tipografía Outfit/Inter y sombras premium.

---
*Fin del registro histórico hasta la fecha.*
