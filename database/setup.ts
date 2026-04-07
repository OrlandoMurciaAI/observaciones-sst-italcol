import { MongoClient, ServerApiVersion } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = client.db("sst_italcol");
    
    console.log("Iniciando creación de índices...");

    // Índices para Observers
    await db.collection("observers").createIndex({ name: 1, plant: 1 }, { unique: true });
    console.log("✓ Índice único en collection 'observers' creado.");

    // Índices para Tasks
    await db.collection("tasks").createIndex({ name: 1, plant: 1 }, { unique: true });
    console.log("✓ Índice único en collection 'tasks' creado.");

    // Índices para Reports
    await db.collection("observations").createIndex({ id: 1 }, { unique: true });
    console.log("✓ Índice único en collection 'observations' creado.");

    console.log("¡Configuración de base de datos completada!");
  } catch (e: any) {
    console.error("Error al configurar base de datos:", e.message);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
