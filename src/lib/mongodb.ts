import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = import.meta.env.MONGODB_URI || "";
const client = new MongoClient(uri, {
    // @ts-ignore
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let clientPromise: Promise<MongoClient>;

if (!import.meta.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env');
}

// @ts-ignore
if (import.meta.env.DEV) {
    // In development mode, use a global variable
    if (!(globalThis as any)._mongoClientPromise) {
        (globalThis as any)._mongoClientPromise = client.connect();
    }
    clientPromise = (globalThis as any)._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    clientPromise = client.connect();
}
  
  // Export a module-scoped MongoClient promise. By doing this in a
  // separate module, the client can be shared across functions.
  export default clientPromise;
