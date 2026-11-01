import type { MetadataRoute } from 'next';
import { listProductIds } from '../lib/server-products';
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kushishilpo.vercel.app').replace(/\/$/, '');
  const pages: MetadataRoute.Sitemap = ['/', '/shop', '/shades', '/about'].map((p) => ({ url: origin + p }));
  const products = await listProductIds();
  const items: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${origin}/product/${encodeURIComponent(p.id)}`,
    lastModified: p.updated ? new Date(p.updated) : undefined,
  }));
  return [...pages, ...items];
                  }
