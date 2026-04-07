import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { username, password } = await request.json();

  const adminUser = import.meta.env.ADMIN_USER || "admin";
  const adminPass = import.meta.env.ADMIN_PASS || "admin";

  if (username === adminUser && password === adminPass) {
    // Simple session cookie
    cookies.set('sst_session', 'authenticated', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: false, message: "Credenciales inválidas" }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const GET: APIRoute = async ({ cookies }) => {
  const session = cookies.get('sst_session');
  return new Response(JSON.stringify({ authenticated: !!session }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete('sst_session', { path: '/' });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
