import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import crypto from 'node:crypto';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const uuidv4 = () => crypto.randomUUID();

const PLANTS = ['Planta Palermo', 'Planta Buga', 'Planta Cali'];
const OBSERVERS = ['Carlos Mendoza', 'Patricia Rojas', 'Andrés Felipe', 'Sofía Gómez'];

const TASKS = [
    { name: 'Cargue de granel', risk: 0.3 },
    { name: 'Mantenimiento en alturas', risk: 0.7 },
    { name: 'Limpieza de silos', risk: 0.6 },
    { name: 'Operación de caldera', risk: 0.2 },
    { name: 'Despacho de bultos', risk: 0.1 },
    { name: 'Inspección de rack', risk: 0.05 }
];

const BEHAVIORS = [
    { id: 1, title: "EPP", reasons: ['No usa casco', 'Gafas rayadas', 'Guantes rotos', 'Sin chaleco reflectivo'] },
    { id: 2, title: "Ayudas Mecánicas", reasons: ['Sobreesfuerzo físico', 'Coche en mal estado', 'No solicita ayuda'] },
    { id: 8, title: "Tareas de Alto Riesgo", reasons: ['Arnés sin certificar', 'Sin punto de anclaje', 'Escalera inestable', 'Permiso vencido'] },
    { id: 14, title: "Orden y Aseo", reasons: ['Herramientas en pasillo', 'Derrame de aceite', 'Basura acumulada', 'Obstrucción de extintores'] },
    { id: 12, title: "Ojos en la Tarea", reasons: ['Uso de celular', 'Charla con compañeros', 'Distracción al caminar'] }
];

async function seed() {
    console.log("Iniciando seeding en Supabase...");

    const observations = [];
    const monthStart = dayjs('2026-03-01');
    const monthEnd = dayjs('2026-03-31');

    for (let i = 0; i < 100; i++) {
        let date = monthStart.add(Math.floor(Math.random() * 31), 'day');
        
        if (date.day() === 0 || date.day() === 6) {
            if (Math.random() > 0.3) {
                date = date.add(1, 'day');
                if (date.isAfter(monthEnd)) date = date.subtract(3, 'day');
            }
        }

        const taskObj = TASKS[Math.floor(Math.random() * TASKS.length)];
        const plant = PLANTS[Math.floor(Math.random() * PLANTS.length)];
        const observer = OBSERVERS[Math.floor(Math.random() * OBSERVERS.length)];

        const respuestas = {};
        let hasRisk = false;
        let barrerasCStr = "";

        [1, 2, 8, 14, 12].forEach(batchId => {
            const rand = Math.random();
            if (rand < 0.2) {
                respuestas[batchId] = { estado: 'no-aplica' };
            } else if (rand < (taskObj.risk + 0.1)) {
                hasRisk = true;
                const behaviorDtl = BEHAVIORS.find(b => b.id === batchId);
                const motivo = behaviorDtl 
                    ? behaviorDtl.reasons[Math.floor(Math.random() * behaviorDtl.reasons.length)]
                    : "Condición no segura detectada";
                
                const isBarrierC = Math.random() < 0.3;
                if (isBarrierC) barrerasCStr += `${behaviorDtl?.title || 'Riesgo'}: ${motivo}. `;

                respuestas[batchId] = {
                    estado: 'riesgoso',
                    clasificacion: isBarrierC ? 'C' : (Math.random() > 0.5 ? 'A' : 'B'),
                    motivo: motivo
                };
            } else {
                respuestas[batchId] = { estado: 'seguro' };
            }
        });

        observations.push({
            local_id: uuidv4(),
            timestamp: date.valueOf(),
            fecha: date.format('YYYY-MM-DD'),
            planta: plant,
            observador: observer,
            tarea: taskObj.name,
            respuestas,
            barreras_c: barrerasCStr || null,
            seguimiento: hasRisk ? "Se realiza retroalimentación inmediata." : "",
            synced: true,
            updated_at: new Date().toISOString()
        });
    }

    try {
        // Insert Observations
        const { error: obsError } = await supabase.from('observations').insert(observations);
        if (obsError) throw obsError;
        console.log(`Insertados 100 registros en 'observations'.`);

        // Seed Observers
        const observerDocs = [];
        PLANTS.forEach(plant => {
            OBSERVERS.forEach(name => {
                observerDocs.push({ name, plant });
            });
        });

        await supabase.from('observers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error: obsDataError } = await supabase.from('observers').insert(observerDocs);
        if (obsDataError) throw obsDataError;

        // Seed Tasks
        const taskDocs = TASKS.map(t => ({
            name: t.name,
            plant: PLANTS[Math.floor(Math.random() * PLANTS.length)]
        }));

        await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error: taskDataError } = await supabase.from('tasks').insert(taskDocs);
        if (taskDataError) throw taskDataError;

        console.log("Seeding completado con éxito en Supabase.");
    } catch (error) {
        console.error("Error en el seeding:", error.message || error);
    }
}

seed();
