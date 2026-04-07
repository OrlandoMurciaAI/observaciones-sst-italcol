import type { APIRoute } from 'astro';
import clientPromise from '../../lib/mongodb';

export const GET: APIRoute = async ({ request, cookies }) => {
  const session = cookies.get('sst_session');
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const url = new URL(request.url);
  const plant = url.searchParams.get('plant') || "";

  try {
    const client = await clientPromise;
    const db = client.db("sst_italcol");
    
    // Observers by plant
    const observers = await db.collection("observers")
      .find({ plant })
      .project({ name: 1, _id: 0 })
      .toArray();

    // Tasks by plant
    const tasks = await db.collection("tasks")
      .find({ plant })
      .project({ name: 1, _id: 0 })
      .toArray();

    return new Response(JSON.stringify({ 
      observers: observers.map(o => o.name), 
      tasks: tasks.map(t => t.name) 
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = cookies.get('sst_session');
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const { type, name, plant } = await request.json();
    if (!type || !name || !plant) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });

    const client = await clientPromise;
    const db = client.db("sst_italcol");
    const collection = type === 'observer' ? db.collection("observers") : db.collection("tasks");

    // Upsert to avoid duplicates
    await collection.updateOne(
        { name, plant },
        { $set: { name, plant } },
        { upsert: true }
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
