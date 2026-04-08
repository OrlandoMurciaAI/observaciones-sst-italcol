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
    svelte() // Svelte 5 detecta automáticamente el uso de Runes en cada componente.
  ],
  vite: {
    ssr: {
      noExternal: ['lucide-svelte', 'chart.js'], 
    }
  }
});