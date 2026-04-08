export const GET = () => { import("cloudflare:workers").then(m => console.log(m.env)).catch(console.error); return new Response("ok"); }
