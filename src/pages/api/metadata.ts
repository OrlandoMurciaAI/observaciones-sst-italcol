import type { APIRoute } from 'astro';
import { getClient, getAuthenticatedClient, getSafeEnv } from '../../lib/supabase';

export const GET: APIRoute = async ({ request, cookies, locals }) => {
  const sessionToken = cookies.get('sst_session')?.value;
  if (!sessionToken) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const url = new URL(request.url);
  const plant = url.searchParams.get('plant') || "";

  try {
    const envData = await getSafeEnv();
    const client = getAuthenticatedClient(sessionToken, envData);
    
    // Observers by plant
    const { data: observers, error: obsError } = await client
      .from('observers')
      .select('name')
      .eq('plant', plant);

    // Tasks by plant
    const { data: tasks, error: taskError } = await client
      .from('tasks')
      .select('name')
      .eq('plant', plant);

    if (obsError) throw obsError;
    if (taskError) throw taskError;

    return new Response(JSON.stringify({ 
      observers: (observers || []).map((o: any) => o.name), 
      tasks: (tasks || []).map((t: any) => t.name) 
    }), { status: 200 });
  } catch (e: any) {
    console.error('Metadata fetch error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const sessionToken = cookies.get('sst_session')?.value;
  if (!sessionToken) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const { type, name, plant } = await request.json();
    if (!type || !name || !plant) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });

    const table = type === 'observer' ? "observers" : "tasks";
    
    const envData = await getSafeEnv();
    const client = getAuthenticatedClient(sessionToken, envData);

    // Upsert to avoid duplicates
    const { error } = await client
        .from(table)
        .upsert({ name, plant }, { onConflict: 'name,plant' });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    console.error('Metadata POST error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
