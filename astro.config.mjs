import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mohamedelsonny.github.io',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: { prefixDefaultLocale: false },
  },
});
