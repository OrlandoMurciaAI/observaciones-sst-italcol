import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ success: false, message: "Email y contraseña requeridos" }), { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
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

    // Also set refresh token for longer lived sessions if needed
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
};

export const GET: APIRoute = async ({ cookies }) => {
  const session = cookies.get('sst_session');
  // Simple check: if we have a token, we consider authenticated for the UI
  // The API routes will verify the token with Supabase for real security
  return new Response(JSON.stringify({ authenticated: !!session }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  await supabase.auth.signOut();
  cookies.delete('sst_session', { path: '/' });
  cookies.delete('sst_refresh', { path: '/' });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
