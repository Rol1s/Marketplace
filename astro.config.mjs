import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

function sitemapPriority(url) {
  const path = new URL(url).pathname;

  if (path === '/' || path === '/sortament/') return { priority: 1.0, changefreq: 'weekly' };

  const sections = ['/truby/', '/shvellery/', '/dvutavry/', '/listy/', '/ugolki/', '/shpunt/'];
  if (sections.some((s) => path === s)) return { priority: 0.8, changefreq: 'weekly' };

  if (path === '/calculator/' || path === '/marki-stali/' || path === '/bu-metall/')
    return { priority: 0.8, changefreq: 'monthly' };

  if (path.includes('/bu-metall/') && !path.match(/^\/[^/]+\/bu-metall/))
    return { priority: 0.6, changefreq: 'monthly' };

  if (path.includes('/vus')) return { priority: 0.6, changefreq: 'monthly' };

  if (path.match(/^\/[^/]+\//)) return { priority: 0.4, changefreq: 'monthly' };

  return { priority: 0.7, changefreq: 'monthly' };
}

export default defineConfig({
  site: 'https://nikamet.pro',
  integrations: [
    react(),
    sitemap({
      serialize(item) {
        const { priority, changefreq } = sitemapPriority(item.url);
        item.priority = priority;
        item.changefreq = changefreq;
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
