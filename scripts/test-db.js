import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno manualmente para el script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ [ERROR] No se encontró MONGODB_URI en el archivo .env');
  process.exit(1);
}

async function runTest() {
  const client = new MongoClient(uri);

  try {
    console.log('⏳ Intentando conectar a MongoDB Atlas...');
    await client.connect();
    
    console.log('✅ [SUCCESS] ¡Conexión exitosa!');
    
    const db = client.db("sst_italcol");
    const ping = await db.command({ ping: 1 });
    
    console.log('📡 Ping a la base de datos:', ping);
    
    // Listar colecciones
    const collections = await db.listCollections().toArray();
    console.log('📦 Colecciones encontradas:', collections.map(c => c.name));

  } catch (e) {
    console.error('❌ [ERROR] Fallo al conectar a MongoDB:');
    console.error(e.message);
    
    if (e.message.includes('whitelsited') || e.message.includes('IP address')) {
      console.log('\n💡 Tip: Asegúrate de que la IP 0.0.0.0/0 esté permitida en el panel de Network Access en Atlas.');
    }
  } finally {
    await client.close();
  }
}

runTest();
