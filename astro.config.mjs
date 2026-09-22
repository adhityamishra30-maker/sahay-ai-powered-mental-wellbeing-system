import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: {
    host: true, // Allows other devices on the same Wi-Fi to access http://<YOUR_IP>:4321
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
