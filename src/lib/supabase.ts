import { createClient } from '@supabase/supabase-js';

/**
 * Obtiene las variables de entorno de varias fuentes posibles.
 * En Astro con Cloudflare, priorizamos el objeto runtime.env proporcionado por el adaptador.
 */
function getKeys(runtimeEnv?: any) {
    // 1. Intentar desde el runtimeEnv (locals.runtime.env en Cloudflare)
    // 2. Intentar desde import.meta.env (definidas en build-time o .env local)
    // @ts-ignore
    const url = runtimeEnv?.SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
    // @ts-ignore
    const key = runtimeEnv?.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';
    
    return { url, key };
}

/**
 * Cliente estático básico.
 * NOTA: En Cloudflare SSR, estas variables pueden estar vacías si no se bajan en el build.
 */
const { url: defaultUrl, key: defaultKey } = getKeys();
export const supabase = createClient(defaultUrl, defaultKey);

/**
 * Crea o devuelve un cliente de Supabase basado en el entorno disponible.
 * Esta es la forma recomendada de obtener el cliente en rutas API de Astro.
 */
export function getClient(runtimeEnv?: any) {
    const { url, key } = getKeys(runtimeEnv);
    
    if (!url || !key) {
        console.error('CRITICAL: Supabase credentials not found. URL:', !!url, 'Key:', !!key);
    }
    
    return createClient(url, key);
}

/**
 * Crea un cliente con el token de acceso del usuario para operaciones con RLS.
 */
export function getAuthenticatedClient(accessToken: string, runtimeEnv?: any) {
    const { url, key } = getKeys(runtimeEnv);

    return createClient(url, key, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
}
