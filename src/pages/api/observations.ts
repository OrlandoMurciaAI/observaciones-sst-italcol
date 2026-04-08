import type { APIRoute } from 'astro';
import { getClient, getAuthenticatedClient } from '../../lib/supabase';
import dayjs from 'dayjs';

export const GET: APIRoute = async ({ cookies, url, locals }) => {
  const accessToken = cookies.get('sst_session')?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const startDate = url.searchParams.get('from');
  const endDate = url.searchParams.get('to');

  try {
    // @ts-ignore
    const envData = locals.runtime?.env;
    const client = getAuthenticatedClient(accessToken, envData);
    
    let query = client
      .from('observations')
      .select('*', { count: 'exact' });

    if (startDate) query = query.gte('fecha', startDate);
    if (endDate) query = query.lte('fecha', endDate);
    
    // Si no hay fechas, devolver los últimos días (p.ej. 30) por defecto para que no salga vacío
    if (!startDate && !endDate) {
      query = query.gte('fecha', dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
    }

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

export const PATCH: APIRoute = async ({ request, cookies, locals }) => {
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

    // @ts-ignore
    const envData = locals.runtime?.env;
    const client = getAuthenticatedClient(accessToken, envData);
    
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

export const DELETE: APIRoute = async ({ request, cookies, locals }) => {
  const accessToken = cookies.get('sst_session')?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

    // @ts-ignore
    const envData = locals.runtime?.env;
    const client = getAuthenticatedClient(accessToken, envData);
    
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
