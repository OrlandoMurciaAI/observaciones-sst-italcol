import { MongoClient } from 'mongodb';
import dayjs from 'dayjs';
import crypto from 'node:crypto';

// Use crypto.randomUUID() instead of uuidv4()
const uuidv4 = () => crypto.randomUUID();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/observaciones_sst";
const DB_NAME = "observaciones_sst"; // Change to your actual db name if different

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
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log("Conectado a MongoDB...");
        const db = client.db();

        const observations = [];
        const monthStart = dayjs('2026-03-01');
        const monthEnd = dayjs('2026-03-31');

        for (let i = 0; i < 100; i++) {
            // Select random date in March
            let date = monthStart.add(Math.floor(Math.random() * 31), 'day');
            
            // Bias towards weekdays
            if (date.day() === 0 || date.day() === 6) {
                if (Math.random() > 0.3) {
                    date = date.add(1, 'day'); // Shift to Monday
                    if (date.isAfter(monthEnd)) date = date.subtract(3, 'day');
                }
            }

            // Time bias
            const randTime = Math.random();
            let hour;
            if (randTime < 0.6) hour = Math.floor(Math.random() * 8) + 6; // Morning 6-14h
            else if (randTime < 0.9) hour = Math.floor(Math.random() * 8) + 14; // Afternoon 14-22h
            else hour = Math.floor(Math.random() * 8) + 22; // Night 22-06h

            const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
            const time = `${hour.toString().padStart(2, '0')}:${minutes}`;

            const taskObj = TASKS[Math.floor(Math.random() * TASKS.length)];
            const plant = PLANTS[Math.floor(Math.random() * PLANTS.length)];
            const observer = OBSERVERS[Math.floor(Math.random() * OBSERVERS.length)];

            const respuestas = {};
            let hasRisk = false;
            let isOutOfControl = false;

            // Generate behavior responses
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach(batchId => {
                const rand = Math.random();
                if (rand < 0.2) {
                    respuestas[batchId] = { estado: 'no-aplica' };
                } else if (rand < (taskObj.risk + 0.1)) {
                    // Risk
                    hasRisk = true;
                    const behaviorDtl = BEHAVIORS.find(b => b.id === batchId);
                    const motivo = behaviorDtl 
                        ? behaviorDtl.reasons[Math.floor(Math.random() * behaviorDtl.reasons.length)]
                        : "Condición no segura detectada";
                    
                    // Determine if Barrera C (out of control)
                    const barrierC = Math.random() < 0.3; // 30% chance of systematic barrier if risky
                    if (barrierC) isOutOfControl = true;

                    respuestas[batchId] = {
                        estado: 'riesgoso',
                        clasificacion: barrierC ? 'C' : (Math.random() > 0.5 ? 'A' : 'B'),
                        motivo: motivo
                    };
                } else {
                    respuestas[batchId] = { estado: 'seguro' };
                }
            });

            observations.push({
                _id: uuidv4(),
                fecha: date.format('YYYY-MM-DD'),
                hora: time,
                planta: plant,
                observador: observer,
                tarea: taskObj.name,
                respuestas,
                seguimiento: hasRisk ? "Se realiza retroalimentación inmediata." : "",
                syncStatus: 'synced',
                createdAt: new Date()
            });
        }

        // Insert Observations
        await db.collection('observations').insertMany(observations);
        console.log(`Insertados 100 registros en 'observations'.`);

        // Seed Observers and Tasks
        const observerDocs = OBSERVERS.map(name => ({
            id: uuidv4(),
            nombre: name,
            planta: PLANTS[Math.floor(Math.random() * PLANTS.length)],
            createdAt: new Date()
        }));

        const taskDocs = TASKS.map(t => ({
            id: uuidv4(),
            nombre: t.name,
            lastUsed: new Date()
        }));

        await db.collection('observers').deleteMany({});
        await db.collection('observers').insertMany(observerDocs);
        
        await db.collection('tasks').deleteMany({});
        await db.collection('tasks').insertMany(taskDocs);

        console.log("Seeding completado con éxito.");

    } catch (error) {
        console.error("Error en el seeding:", error);
    } finally {
        await client.close();
    }
}

seed();
