export interface Behavior {
    id: number;
    title: string;
    description: string;
}

export const ATRIBUTOS_COMPORTAMIENTO: Behavior[] = [
    { id: 1, title: "EPP", description: "Uso adecuado de elementos de protección personal (Casco, gafas, guantes, etc)." },
    { id: 2, title: "Ayudas Mecánicas", description: "Hacer uso de ayudas mecánicas para el traslado de cargas pesadas." },
    { id: 3, title: "Demarcación / Señalización", description: "Respetar la demarcación de áreas y señales de advertencia." },
    { id: 4, title: "Levantamiento de Cargas", description: "Mantener la espalda recta y usar las piernas al levantar cargas." },
    { id: 5, title: "Elementos de Atrapamiento", description: "Evitar el uso de joyas, ropa suelta o cabello largo sin recoger cerca de máquinas." },
    { id: 6, title: "Línea de Peligro", description: "Mantenerse fuera del radio de acción de maquinaria en movimiento o cargas suspendidas." },
    { id: 7, title: "Herramientas", description: "Uso de herramientas adecuadas para la labor y almacenamiento seguro." },
    { id: 8, title: "Tareas de Alto Riesgo", description: "Contar con los permisos y condiciones para trabajos en alturas, espacios confinados, etc." },
    { id: 9, title: "LOTO / Energías", description: "Control de energías peligrosas (Bloqueo y Etiquetado) antes de intervenir equipos." },
    { id: 10, title: "Trasvase de Químicos", description: "Realizar trasvase de sustancias químicas de forma segura y con etiquetas correspondientes." },
    { id: 11, title: "Almacenamiento Químicos", description: "Garantizar que los productos químicos estén en lugares ventilados y compatibles." },
    { id: 12, title: "Ojos en la Tarea", description: "Mantener la atención en la actividad, evitando distracciones (celular, charlas)." },
    { id: 13, title: "Zonas Demarcadas", description: "Respetar los pasillos peatonales y áreas de circulación vehicular." },
    { id: 14, title: "Orden y Aseo", description: "Mantener el área de trabajo limpia y libre de obstáculos." },
    { id: 15, title: "Superficies / Escaleras", description: "Uso de calzado adecuado y tres puntos de apoyo en escaleras." },
    { id: 16, title: "Seguridad en Máquinas", description: "No anular ni retirar dispositivos de seguridad de los equipos." },
    { id: 17, title: "Conducción Segura", description: "Respetar límites de velocidad y uso obligatorio de cinturón de seguridad." },
];
