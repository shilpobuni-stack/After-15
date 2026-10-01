'use client';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { StoreProvider } from '../lib/store';
import { OutletProvider, Link } from '../lib/router-compat';
import { Layout } from './Layout';
import Home from '../legacy-pages/Home';
import Shop, { AboutPage, ShadesPage } from '../legacy-pages/Shop';
import { PrivacyPolicy, TermsPage, ReturnPolicy } from '../legacy-pages/Policies';
import Admin from '../legacy-pages/Admin';
import { EmptyState } from './UI';
function RouteContent() {
  const pathname = usePathname();
  let content: React.ReactNode;
  switch (pathname) {
    case '/': content = <Home />; break;
    case '/shop': content = <Shop />; break;
    case '/shades': content = <ShadesPage />; break;
    case '/about': content = <AboutPage />; break;
    case '/privacy-policy': content = <PrivacyPolicy />; break;
    case '/terms': content = <TermsPage />; break;
    case '/return-policy': content = <ReturnPolicy />; break;
    default: content = <div className="container not-found"><EmptyState title="এই পাতাটি খুঁজে পাওয়া যায়নি" text="চলুন, আপনার শখের ঠিকানায় ফিরে যাই।"><Link className="button primary" to="/">হোমে ফিরে যান</Link></EmptyState></div>;
  }
  return <StoreProvider>{pathname?.startsWith('/admin') ? <Admin /> : <OutletProvider outlet={content}><Layout /></OutletProvider>}</StoreProvider>;
}
export default function RouteView() { return <Suspense fallback={<div className="container" style={{ minHeight: '65vh', paddingTop: 60 }}>লোড হচ্ছে…</div>}><RouteContent /></Suspense>; }
