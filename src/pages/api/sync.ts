import type { APIRoute } from 'astro';
import clientPromise from '../../lib/mongodb';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Simple session check
  const session = cookies.get('sst_session');
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { observations } = await request.json();
    const client = await clientPromise;
    const db = client.db("sst_italcol");
    const collection = db.collection("observations");

    // Upsert each observation based on ID
    const results = await Promise.all(observations.map(async (obs: any) => {
      const { _id, ...data } = obs;
      return collection.replaceOne({ id: obs.id }, data, { upsert: true });
    }));

    return new Response(JSON.stringify({ success: true, count: results.length }), { status: 200 });
  } catch (e: any) {
    console.error('Sync error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
