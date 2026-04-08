import type { APIRoute } from 'astro';
import { getClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const rawData = await request.text();
    if (!rawData) {
        return new Response(JSON.stringify({ success: false, message: "Petición vacía" }), { status: 400 });
    }
    const { email, password } = JSON.parse(rawData);

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, message: "Email y contraseña requeridos" }), { status: 400 });
    }

    // En Astro 6 + Cloudflare, preferimos usar import.meta.env que ya mapea las variables
    // o el objeto runtime si estuviera disponible (pero sin .env redundante)
    const supabase = await getClient();
    
    console.log("Supabase URL presence:", !!import.meta.env.SUPABASE_URL ? "Exists" : "MISSING");

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
      console.error('Supabase Auth Error:', error.message);
      return new Response(JSON.stringify({ success: false, message: error.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set session cookie
    if (data.session) {
      cookies.set('sst_session', data.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: data.session.expires_in
      });

      cookies.set('sst_refresh', data.session.refresh_token, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('Server Internal Error:', e);
    return new Response(JSON.stringify({ 
        success: false, 
        message: "Error interno en el servidor de autentificación",
        details: e.message 
    }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ cookies }) => {
  const session = cookies.get('sst_session');
  return new Response(JSON.stringify({ authenticated: !!session }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  try {
    const supabase = await getClient();
    await supabase.auth.signOut();
  } catch (e) {
    // Si falla el sign out en el servidor, igualmente borramos las cookies localmente
  }
  
  cookies.delete('sst_session', { path: '/' });
  cookies.delete('sst_refresh', { path: '/' });
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
