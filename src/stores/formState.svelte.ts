const SESSION_KEY = 'sst_current_session';

export class ObservationFormState {
    planta = $state('Planta Palermo');
    tarea = $state('');
    observador = $state('');
    fecha = $state(new Date().toISOString().split('T')[0]);
    respuestas = $state<Record<number, {
        estado: 'seguro' | 'riesgoso' | 'no-aplica',
        motivo?: string,
        clasificacion?: 'A' | 'B' | 'C'
    }>>({});
    barrerasC = $state('');
    seguimiento = $state('');
    firma = $state('');

    constructor() {
        this.loadFromLocal();
        
        // Auto-save effect
        $effect.root(() => {
            $effect(() => {
                this.saveToLocal();
            });
        });
    }

    stats = $derived.by(() => {
        const resValues = Object.values(this.respuestas);
        const evaluated = resValues.filter(r => r.estado !== 'no-aplica');
        const total = evaluated.length;
        const seguros = evaluated.filter(r => r.estado === 'seguro').length;
        const porcentaje = total > 0 ? (seguros / total) * 100 : 100;
        return { total, seguros, porcentaje: Math.round(porcentaje) };
    });

    saveToLocal() {
        if (typeof window === 'undefined') return;
        const data = {
            planta: this.planta,
            tarea: this.tarea,
            observador: this.observador,
            fecha: this.fecha,
            respuestas: this.respuestas,
            barrerasC: this.barrerasC,
            seguimiento: this.seguimiento,
            firma: this.firma
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    }

    loadFromLocal() {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.planta = data.planta || 'Planta Palermo';
                this.tarea = data.tarea || '';
                this.observador = data.observador || '';
                this.fecha = data.fecha || new Date().toISOString().split('T')[0];
                this.respuestas = data.respuestas || {};
                this.barrerasC = data.barrerasC || '';
                this.seguimiento = data.seguimiento || '';
                this.firma = data.firma || '';
            } catch (e) {
                console.error('Error loading session:', e);
            }
        }
    }

    reset() {
        this.planta = 'Planta Palermo';
        this.tarea = '';
        this.observador = '';
        this.fecha = new Date().toISOString().split('T')[0];
        this.respuestas = {};
        this.barrerasC = '';
        this.seguimiento = '';
        this.firma = '';
        if (typeof window !== 'undefined') {
            localStorage.removeItem(SESSION_KEY);
        }
    }
}

export const formState = new ObservationFormState();
