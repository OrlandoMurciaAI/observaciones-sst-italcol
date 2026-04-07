import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [
    svelte({
      compilerOptions: {
        runes: true // Forzar el uso de Svelte 5 Runes ($state, $derived, etc.)
      }
    })
  ],
  vite: {
    ssr: {
      noExternal: ['lucide-svelte', 'chart.js'], // Asegurar que estas librerías se empaqueten para el entorno Edge
    },
    resolve: {
      alias: {
        // Mantenemos esto por compatibilidad con scripts locales que usen punycode (como seed.js)
        'punycode': 'punycode/',
      },
    }
  }
});