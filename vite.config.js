import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    allowedHosts: ['game1.bozmen.xyz']
  }
}); 