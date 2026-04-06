import { ATRIBUTOS_COMPORTAMIENTO } from '../constants/behaviors';

export interface ObservationData {
    id: string;
    timestamp: number;
    planta: string;
    tarea: string;
    observador: string;
    fecha: string;
    respuestas: Record<number, {
        estado: 'seguro' | 'riesgoso' | 'no-aplica',
        motivo?: string,
        clasificacion?: 'A' | 'B' | 'C'
    }>;
    barrerasC?: string;
    seguimiento?: string;
    firma?: string;
}

const STORAGE_KEY = 'sst_observations';

export const saveObservationToLocal = (data: ObservationData) => {
    const existing = getObservationsFromLocal();
    existing.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const getObservationsFromLocal = (): ObservationData[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const exportToCSV = (observations: ObservationData[]) => {
    const headers = [
        'ID', 'Timestamp', 'Planta', 'Tarea', 'Observador', 'Fecha',
        ...ATRIBUTOS_COMPORTAMIENTO.map(b => `[${b.id}] ${b.title} - Estado`),
        ...ATRIBUTOS_COMPORTAMIENTO.map(b => `[${b.id}] ${b.title} - Motivo`),
        ...ATRIBUTOS_COMPORTAMIENTO.map(b => `[${b.id}] ${b.title} - Clasificación`),
        'Barreras C', 'Seguimiento'
    ];

    const rows = observations.map(obs => {
        const row = [
            obs.id,
            obs.timestamp,
            obs.planta,
            obs.tarea,
            obs.observador,
            obs.fecha,
        ];

        // Respuestas
        ATRIBUTOS_COMPORTAMIENTO.forEach(b => {
            const resp = obs.respuestas[b.id] || { estado: 'no-aplica' };
            row.push(resp.estado);
        });
        ATRIBUTOS_COMPORTAMIENTO.forEach(b => {
            const resp = obs.respuestas[b.id] || {};
            row.push(resp.motivo || '');
        });
        ATRIBUTOS_COMPORTAMIENTO.forEach(b => {
            const resp = obs.respuestas[b.id] || {};
            row.push(resp.clasificacion || '');
        });

        row.push(obs.barrerasC || '');
        row.push(obs.seguimiento || '');
        
        return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SST_Observations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
