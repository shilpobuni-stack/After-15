import type { Metadata, Viewport } from 'next';
import '../index.css';
const origin = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')).replace(/\/$/, '');
export const metadata: Metadata = {
  metadataBase: new URL(origin),
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: '/' },
  title: 'কুশি শিল্প — শখের বুননে, ভালোবাসার গল্প',
  description: 'কুশি শিল্প — আপনার শখের বুননের সঙ্গী। রঙিন সুতা, অসংখ্য শেড, কুশি কাঁটা ও ক্রাফট উপকরণ এক ঠিকানায়।',
  openGraph: { type: 'website', locale: 'bn_BD', siteName: 'কুশি শিল্প', title: 'কুশি শিল্প — শখের বুননে, ভালোবাসার গল্প', description: 'কুশি শিল্প — আপনার শখের বুননের সঙ্গী। রঙিন সুতা, অসংখ্য শেড, কুশি কাঁটা ও ক্রাফট উপকরণ এক ঠিকানায়।', images: [{ url: '/images/reference-rose-yarn.webp', alt: 'কুশি শিল্পের রঙিন সুতা ও ক্রোশেট উপকরণ' }] },
  twitter: { card: 'summary_large_image', title: 'কুশি শিল্প — শখের বুননে, ভালোবাসার গল্প', description: 'রঙিন সুতা, অসংখ্য শেড, কুশি কাঁটা ও ক্রাফট উপকরণ এক ঠিকানায়।', images: ['/images/reference-rose-yarn.webp'] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: '#e6004c', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bn"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Store', name: 'কুশি শিল্প', description: 'কুশি শিল্প — আপনার শখের বুননের সঙ্গী।', url: origin + '/', image: origin + '/images/reference-rose-yarn.webp', areaServed: { '@type': 'Country', name: 'Bangladesh' }, currenciesAccepted: 'BDT' }).replace(/</g, '\\u003c') }} /></head><body>{children}</body></html>;
}
