# Documentación del Sistema: Italcol SST - Observaciones de Comportamiento

## 1. Contexto del Proyecto
Este proyecto es una aplicación web diseñada para la captura de observaciones de comportamiento en entornos industriales, específicamente para Italcol. El objetivo principal es recolectar datos sobre actos seguros y riesgosos en las plantas para prevenir accidentes y mejorar la cultura de seguridad.

### Arquitectura y Construcción
- **Framework**: Astro 6.1.4 (SSR y estático).
- **Frontend**: Svelte 5.x para la interactividad de los formularios.
- **Base de Datos**: MongoDB (Atlas).
- **Estilos**: Vanilla CSS con variables globales y un enfoque en diseño premium y responsivo.
- **Offline-First**: Implementa lógica de sincronización local (`localStorage`) que detecta automáticamente la conexión a internet para subir datos pendientes a la nube.

### Colecciones (MongoDB)
1. **`observations`**: Contiene los reportes de comportamiento. Incluye planta, observador, tarea, fecha, respuestas detalladas por categoría y seguimiento.
2. **`observers`**: Almacena nombres de observadores por planta para el autocompletado inteligente.
3. **`tasks`**: Registra tareas previas para agilizar la captura de datos.

---

## 2. Dashboard de Observaciones
El Dashboard es el centro de comando para los administradores de SST. Permite transformar los datos crudos en información accionable.

### Datos Utilizados
El dashboard consume directamente la colección `observations`. Los datos son procesados en el servidor para generar agregaciones por:
- Tiempo (fechas).
- Ubicación (plantas).
- Personal (observadores).
- Categorías de riesgo.

### Interpretación de KPIs
- **Total de Observaciones**: Volumen general de actividad preventiva. Un descenso puede indicar complacencia o falta de tiempo del personal.
- **Índice de Riesgo (%)**: Porcentaje de observaciones que contienen al menos un comportamiento riesgoso. Permite medir la criticidad del entorno.
- **Eficiencia de Control**: Muestra el porcentaje de riesgos que son mitigados inmediatamente vs. los que quedan fuera de control del trabajador.
- **Barreras Sistémicas (Tipo C)**: El KPI más crítico. Identifica situaciones donde el trabajador no puede actuar de forma segura debido a factores externos (diseño, herramientas, procedimientos).

### Análisis de Causas Raíz
El sistema procesa los comentarios de los reportes riesgosos mediante una nube de palabras clave, permitiendo identificar patrones como "EPP defectuoso", "Falta de espacio" o "Iluminación deficiente" sin leer cada reporte individualmente.

### Filtros Dinámicos
El dashboard permite segmentar la información por:
- **Tarea Crítica**: Identificar qué labores operativas concentran mayor riesgo accidentológico.
- **Planta**: Comparar el desempeño de seguridad entre diferentes instalaciones.
- **Observador**: Evaluar la calidad y constancia de los reportes por parte del personal de SST.
- **Periodo de Tiempo**: Analizar tendencias y efectividad de campañas de seguridad mensuales.

---

## 3. Extensibilidad Futura
El sistema está diseñado para ser escalable:
- **Nuevas Gráficas**: Se pueden añadir análisis de correlación entre tipos de tareas y riesgos específicos.
- **Notificaciones**: Integración con servicios de mensajería (Telegram/Email) cuando se detecte un comportamiento crítico riesgoso.
- **Machine Learning**: En el futuro, los datos recolectados se pueden usar para predecir zonas de riesgo o periodos con mayor probabilidad de incidentes.
- **Exportación Avanzada**: Incluir formatos como PDF para reportes mensuales automáticos.
