import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase';

export const GET: APIRoute = async ({ cookies, url }) => {
  const accessToken = cookies.get('sst_session')?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const startDate = url.searchParams.get('from');
  const endDate = url.searchParams.get('to');

  try {
    const client = getSupabase(accessToken);
    let query = client
      .from('observations')
      .select('*');
    
    if (startDate) query = query.gte('fecha', startDate);
    if (endDate) query = query.lte('fecha', endDate);
    
    const { data: rawObservations, error } = await query.order('timestamp', { ascending: false });

    if (error) throw error;

    // Map back to app format for Svelte frontend
    const observations = rawObservations.map((obs: any) => ({
      _id: obs.local_id,
      timestamp: obs.timestamp,
      fecha: obs.fecha,
      plant: obs.planta,
      observer: obs.observador,
      task: obs.tarea,
      responses: obs.respuestas,
      barrerasC: obs.barreras_c,
      seguimiento: obs.seguimiento,
      updatedAt: obs.updated_at
    }));

    return new Response(JSON.stringify(observations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('Fetch error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get('sst_session')?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { id, plant, observer, task, responses, barrerasC, timestamp, fecha, seguimiento } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

    const payload: any = { 
        planta: plant,
        observador: observer,
        tarea: task,
        respuestas: responses,
        barreras_c: barrerasC,
        timestamp,
        fecha,
        seguimiento,
        updated_at: new Date().toISOString() 
    };

    const client = getSupabase(accessToken);
    const { error } = await client
      .from('observations')
      .update(payload)
      .eq('local_id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    console.error('Update error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get('sst_session')?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

    const client = getSupabase(accessToken);
    const { error } = await client
      .from('observations')
      .delete()
      .eq('local_id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    console.error('Delete error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
