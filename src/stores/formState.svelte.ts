export class ObservationFormState {
    planta = $state('');
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

    stats = $derived.by(() => {
        const resValues = Object.values(this.respuestas);
        const evaluated = resValues.filter(r => r.estado !== 'no-aplica');
        const total = evaluated.length;
        const seguros = evaluated.filter(r => r.estado === 'seguro').length;
        const porcentaje = total > 0 ? (seguros / total) * 100 : 100;
        return { total, seguros, porcentaje: Math.round(porcentaje) };
    });

    reset() {
        this.planta = '';
        this.tarea = '';
        this.observador = '';
        this.fecha = new Date().toISOString().split('T')[0];
        this.respuestas = {};
        this.barrerasC = '';
        this.seguimiento = '';
        this.firma = '';
    }
}

export const formState = new ObservationFormState();
