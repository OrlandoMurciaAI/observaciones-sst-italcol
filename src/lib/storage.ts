import { ATRIBUTOS_COMPORTAMIENTO } from '../constants/behaviors';

export interface ObservationData {
    id: string;
    timestamp: number;
    plant: string;
    task: string;
    observer: string;
    fecha: string;
    responses: Record<number, {
        estado: 'seguro' | 'riesgoso' | 'no-aplica',
        motivo?: string,
        clasificacion?: 'A' | 'B' | 'C'
    }>;
    barrerasC?: string;
    seguimiento?: string;
    firma?: string;
    synced?: boolean; // New: tracking sync status
}

const STORAGE_KEY = 'sst_observations';

export const saveObservationToLocal = (data: ObservationData) => {
    const existing = getObservationsFromLocal();
    const newData = { ...data, synced: false };
    existing.push(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    
    // Attempt sync immediate if online
    if (typeof window !== 'undefined' && navigator.onLine) {
        syncPendingObservations();
    }
};

export const getObservationsFromLocal = (): ObservationData[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

// Real Sync Logic with Supabase
export const syncPendingObservations = async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    const observations = getObservationsFromLocal();
    const pending = observations.filter(o => !o.synced);
    
    if (pending.length === 0) {
        console.log('[OfflineSync] No hay registros pendientes.');
        return;
    }

    console.log(`[OfflineSync] Sincronizando ${pending.length} registros con Supabase...`);

    try {
        // Enviar con synced: true para que en el cloud se guarde como tal
        const observationsToSync = pending.map(obs => ({ ...obs, synced: true }));
        
        const response = await fetch('/api/sync', {
            method: 'POST',
            body: JSON.stringify({ observations: observationsToSync })
        });

        if (response.ok) {
            console.log(`[OfflineSync] Servidor respondió OK. Actualizando metadatos...`);
            
            // Sync metadata
            for (const obs of pending) {
                if (obs.observer) await saveMetadata('observer', obs.observer, obs.plant);
                if (obs.task) await saveMetadata('task', obs.task, obs.plant);
            }

            // Mark as synced locally
            const updated = observations.map(obs => {
                if (pending.find(p => p.id === obs.id)) return { ...obs, synced: true };
                return obs;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            
            console.log(`[OfflineSync] Sincronización finalizada exitosamente.`);
            window.dispatchEvent(new CustomEvent('sst-synced'));
        } else {
            const err = await response.json();
            console.error('[OfflineSync] Error del servidor:', err);
        }
    } catch (e) {
        console.error('[OfflineSync] Error de red al sincronizar:', e);
    }
};

export const saveMetadata = async (type: 'observer' | 'task', name: string, plant: string) => {
    if (!name || !plant) return;
    try {
        await fetch('/api/metadata', {
            method: 'POST',
            body: JSON.stringify({ type, name, plant })
        });
    } catch (e) {
        // Silently fail metadata save if offline
    }
};

export const getMetadataSuggestions = async (plant: string) => {
    if (!plant || !navigator.onLine) return { observers: [], tasks: [] };
    try {
        const response = await fetch(`/api/metadata?plant=${encodeURIComponent(plant)}`);
        if (response.ok) return await response.json();
    } catch (e) {
        return { observers: [], tasks: [] };
    }
};

// Initialize listeners for online status
if (typeof window !== 'undefined') {
    window.addEventListener('online', syncPendingObservations);
}

export const exportToCSV = (observations: ObservationData[]) => {
    const headers = [
        'ID', 'Timestamp', 'Sync Status', 'Planta', 'Tarea', 'Observador', 'Fecha',
        ...ATRIBUTOS_COMPORTAMIENTO.map(b => `[${b.id}] ${b.title} - Estado`),
        ...ATRIBUTOS_COMPORTAMIENTO.map(b => `[${b.id}] ${b.title} - Motivo`),
        ...ATRIBUTOS_COMPORTAMIENTO.map(b => `[${b.id}] ${b.title} - Clasificación`),
        'Barreras C', 'Seguimiento'
    ];

    const rows = observations.map(obs => {
        const row = [
            obs.id,
            obs.timestamp,
            obs.synced ? 'Enviado' : 'Pendiente',
            obs.plant,
            obs.task,
            obs.observer,
            obs.fecha,
        ];

        ATRIBUTOS_COMPORTAMIENTO.forEach(b => {
            const resp = (obs.responses || {})[b.id] || { estado: 'no-aplica' };
            row.push(resp.estado);
        });
        ATRIBUTOS_COMPORTAMIENTO.forEach(b => {
            const resp = (obs.responses || {})[b.id] || {};
            row.push(resp.motivo || '');
        });
        ATRIBUTOS_COMPORTAMIENTO.forEach(b => {
            const resp = (obs.responses || {})[b.id] || {};
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
