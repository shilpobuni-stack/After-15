import type { Metadata } from 'next';
import RouteView from '../../../components/RouteView';
import { getMetaProduct, safeDecode } from '../../../lib/server-products';
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

const siteOrigin = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')).replace(/\/$/, '');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getMetaProduct(safeDecode(id));
  if (!product) return { title: 'পণ্য | কুশি শিল্প', robots: { index: false, follow: true } };
  const title = `${product.name} | কুশি শিল্প`;
  const description = (product.description || `${product.name} — কুশি শিল্প`).slice(0, 160);
  const url = `/product/${encodeURIComponent(product.id)}`;
  const images = product.image ? [{ url: product.image, alt: product.name }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', locale: 'bn_BD', siteName: 'কুশি শিল্প', title, description, url, images },
    twitter: { card: 'summary_large_image', title, description, images: product.image ? [product.image] : undefined },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const product = await getMetaProduct(safeDecode(id));
  const origin = siteOrigin();
  const image = product?.image ? (product.image.startsWith('/') ? origin + product.image : product.image) : undefined;
  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image,
        sku: product.id,
        offers: {
          '@type': 'Offer',
          url: `${origin}/product/${encodeURIComponent(product.id)}`,
          priceCurrency: 'BDT',
          price: product.price,
          availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      }
    : null;
  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      )}
      <RouteView />
    </>
  );
    }
