import { createClient } from '@supabase/supabase-js';

/**
 * Obtiene las variables de entorno de varias fuentes posibles.
 * En Astro 6 + Cloudflare, preferimos el módulo 'cloudflare:workers'.
 */
async function getKeys(runtimeEnv?: any) {
    let env = runtimeEnv;
    
    // Si no se pasó env, intentamos obtenerlo de cloudflare:workers (solo prod)
    if (!env) {
        try {
            // @ts-ignore
            const cf = await import('cloudflare:workers');
            env = cf.env;
        } catch {
            // No estamos en Cloudflare o es desarrollo local, usamos import.meta.env
            env = import.meta.env;
        }
    }

    const url = env?.SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
    const key = env?.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';
    
    return { url, key };
}

/**
 * Crea o devuelve un cliente de Supabase basado en el entorno disponible.
 * Esta es la forma recomendada de obtener el cliente en rutas API de Astro.
 */
export async function getClient(runtimeEnv?: any) {
    const { url, key } = await getKeys(runtimeEnv);
    
    if (!url || !key) {
        console.error('CRITICAL: Supabase credentials not found. URL:', !!url, 'Key:', !!key);
    }
    
    return createClient(url, key);
}

/**
 * Crea un cliente con el token de acceso del usuario para operaciones con RLS.
 */
export async function getAuthenticatedClient(accessToken: string, runtimeEnv?: any) {
    const { url, key } = await getKeys(runtimeEnv);

    return createClient(url, key, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
}
