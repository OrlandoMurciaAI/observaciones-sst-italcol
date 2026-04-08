// Helper to safely get Cloudflare environment variables in Astro 6
export async function getRuntimeEnv() {
  try {
    // @ts-ignore - cloudflare:workers only exists in Cloudflare environment
    const { env } = await import('cloudflare:workers');
    return env;
  } catch (e) {
    // Fallback to import.meta.env for local development
    return import.meta.env;
  }
}
