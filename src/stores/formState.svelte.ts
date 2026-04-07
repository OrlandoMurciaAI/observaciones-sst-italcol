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
        this.resetInternal();
        this.loadFromLocal();
        
        // Auto-save effect
        if (typeof window !== 'undefined') {
            $effect.root(() => {
                $effect(() => {
                    this.saveToLocal();
                });
            });
        }
    }

    toJSON() {
        return {
            planta: this.planta,
            tarea: this.tarea,
            observador: this.observador,
            fecha: this.fecha,
            respuestas: $state.snapshot(this.respuestas),
            barrerasC: this.barrerasC,
            seguimiento: this.seguimiento,
            firma: this.firma
        };
    }

    stats = $derived.by(() => {
        const resValues = Object.values(this.respuestas);
        const evaluated = resValues.filter(r => r.estado !== 'no-aplica');
        const total = evaluated.length;
        const seguros = evaluated.filter(r => r.estado === 'seguro').length;
        const porcentaje = total > 0 ? (seguros / total) * 100 : 100;
        return { total, seguros, porcentaje: Math.round(porcentaje) };
    });

    isValid() {
        if (!this.tarea) return { valid: false, message: 'La tarea observada es obligatoria.' };
        
        const resValues = Object.entries(this.respuestas);
        for (const [id, res] of resValues) {
            if (res.estado === 'riesgoso') {
                if (!res.clasificacion) {
                    return { 
                        valid: false, 
                        message: `El comportamiento #${id} está marcado como riesgoso pero no tiene clasificación del control (A, B o C).` 
                    };
                }
            }
        }
        return { valid: true };
    }

    saveToLocal() {
        if (typeof window === 'undefined') return;
        localStorage.setItem(SESSION_KEY, JSON.stringify(this.toJSON()));
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

    resetInternal() {
        this.tarea = '';
        this.barrerasC = '';
        this.seguimiento = '';
        this.firma = '';
        
        // Poblamos con N/A por defecto
        const defaultRespuestas: Record<number, any> = {};
        for(let i=1; i<=17; i++) {
            defaultRespuestas[i] = { estado: 'no-aplica' };
        }
        this.respuestas = defaultRespuestas;
    }

    reset() {
        this.resetInternal();
        if (typeof window !== 'undefined') {
            this.saveToLocal();
        }
    }
}

export const formState = new ObservationFormState();
