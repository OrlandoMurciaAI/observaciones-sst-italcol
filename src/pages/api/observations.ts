import type { APIRoute } from 'astro';
import clientPromise from '../../lib/mongodb';

export const GET: APIRoute = async ({ cookies }) => {
  // Simple session check
  const session = cookies.get('sst_session');
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("sst_italcol");
    const collection = db.collection("observations");

    // Fetch all observations for the dashboard
    // In a real app, we might add server-side filtering here
    const observations = await collection.find({}).sort({ timestamp: -1 }).toArray();

    return new Response(JSON.stringify(observations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('Fetch error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
