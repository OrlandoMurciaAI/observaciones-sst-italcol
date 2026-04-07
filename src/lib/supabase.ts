import { createClient } from '@supabase/supabase-js';

// Intentamos obtener las variables de múltiples fuentes para máxima compatibilidad
const supabaseUrl = import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || '';

/**
 * Cliente estático (para desarrollo local o cuando las variables de meta.env funcionan)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Crea o devuelve un cliente de Supabase basado en el entorno disponible.
 * En Cloudflare Workers, es más fiable pasar el objeto 'env' de la plataforma.
 */
export function getClient(runtimeEnv?: any) {
    const url = runtimeEnv?.SUPABASE_URL || supabaseUrl;
    const key = runtimeEnv?.SUPABASE_ANON_KEY || supabaseAnonKey;
    
    if (!url || !key) {
        console.error('CRITICAL: Supabase credentials not found in any environment source');
        // No lanzamos error aquí para evitar que el módulo falle al importar, 
        // pero las llamadas posteriores fallarán con un mensaje claro.
    }
    
    return createClient(url, key);
}

/**
 * Crea un cliente con el token de acceso del usuario para operaciones con RLS.
 */
export function getAuthenticatedClient(accessToken: string, runtimeEnv?: any) {
    const url = runtimeEnv?.SUPABASE_URL || supabaseUrl;
    const key = runtimeEnv?.SUPABASE_ANON_KEY || supabaseAnonKey;

    return createClient(url, key, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
}
