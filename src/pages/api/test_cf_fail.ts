export const GET = async () => { await import("cloudflare:workers"); return new Response(JSON.stringify({ error: "401 tester" }), { status: 401 }); }
