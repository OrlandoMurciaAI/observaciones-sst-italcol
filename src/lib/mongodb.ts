import { MongoClient } from 'mongodb';

const uri = import.meta.env.MONGODB_URI || "";
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

/**
 * Obtiene o crea la conexión a MongoDB.
 * En desarrollo (Node) usa una variable global para el hot-reload.
 * En producción (Cloudflare) crea un singleton robusto.
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!uri) throw new Error('Añade MONGODB_URI a tu .env');

  // Si estamos en desarrollo
  if (import.meta.env.DEV) {
    if (!(globalThis as any)._mongoClientPromise) {
      client = new MongoClient(uri);
      (globalThis as any)._mongoClientPromise = client.connect();
    }
    return (globalThis as any)._mongoClientPromise;
  }

  // Si ya tenemos una promesa viva, la reusamos
  if (clientPromise) {
    return clientPromise;
  }

  // Configuración optimizada para Cloudflare/Serverless
  client = new MongoClient(uri, {
    // Tiempos de espera agresivos para fallar rápido y reintentar si el socket muere
    connectTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10, // Pocas pero eficientes
    minPoolSize: 0, 
    retryWrites: true
  });

  clientPromise = client.connect();
  
  // Si la conexión falla, reseteamos la promesa para el próximo intento
  clientPromise.catch(() => {
    clientPromise = null;
    client = null;
  });

  return clientPromise;
}

/**
 * Helper para obtener la instancia de la base de datos ya conectada.
 */
export async function getDb(dbName = "sst_italcol") {
  const conn = await getMongoClient();
  return conn.db(dbName);
}

// Mantenemos una exportación por defecto para evitar romper todo de golpe
export default getMongoClient();
