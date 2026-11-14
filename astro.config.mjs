import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://yashajmera23.github.io',
  base: process.env.NODE_ENV === 'production' ? '/agency-site' : '/',
  server: { port: 4321, host: true },
});
