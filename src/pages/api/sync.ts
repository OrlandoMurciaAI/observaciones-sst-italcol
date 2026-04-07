import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get('sst_session')?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { observations } = await request.json();
    if (!observations || !Array.isArray(observations)) {
        return new Response(JSON.stringify({ error: "No observations provided" }), { status: 400 });
    }

    const rows = observations.map((obs: any) => {
      return {
        local_id: obs.id || obs._id,
        timestamp: obs.timestamp,
        fecha: obs.fecha,
        planta: obs.plant,
        observador: obs.observer,
        tarea: obs.task,
        respuestas: obs.responses,
        barreras_c: obs.barrerasC,
        seguimiento: obs.seguimiento,
        synced: true,
        updated_at: new Date().toISOString()
      };
    });

    const client = getSupabase(accessToken);
    const { data, error } = await client
      .from('observations')
      .upsert(rows, { onConflict: 'local_id' });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, count: rows.length }), { status: 200 });
  } catch (e: any) {
    console.error('Sync error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
