import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bynextmonday.com',
  base: '/',
  server: { port: 4321, host: true },
});
