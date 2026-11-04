'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import '../lib/analytics';

export default function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    window.fbq?.('track', 'PageView');
    window.gtag?.('event', 'page_view', { page_path: pathname, page_location: window.location.href });
  }, [pathname]);
  return null;
}
