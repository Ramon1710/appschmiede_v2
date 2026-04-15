import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myappschmiede.com').replace(/\/$/, '');
  const now = new Date();

  const routes = ['/', '/about', '/pricing', '/impressum', '/datenschutz', '/datenschutz/firebase', '/agb', '/stripe-subscriptions'];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.3,
  }));
}
