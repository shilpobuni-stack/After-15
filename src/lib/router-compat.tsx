'use client';
import React, { createContext, useContext } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation';
const OutletContext = createContext<React.ReactNode>(null);
export function OutletProvider({ children, outlet }: { children: React.ReactNode; outlet: React.ReactNode }) { return <OutletContext.Provider value={outlet}>{children}</OutletContext.Provider>; }
export function Outlet() { return <>{useContext(OutletContext)}</>; }
type Props = Omit<React.ComponentProps<typeof NextLink>, 'href'> & { to: string; end?: boolean; className?: string };
export function Link({ to, end: _end, ...props }: Props) { void _end; return <NextLink href={to} {...props} />; }
export function NavLink({ to, end, className, ...props }: Props) {
  const pathname = usePathname();
  const target = to.split('?')[0];
  const active = end ? pathname === target : target === '/' ? pathname === '/' : pathname === target || pathname.startsWith(target + '/');
  return <NextLink href={to} {...props} className={[className, active ? 'active' : ''].filter(Boolean).join(' ')} />;
}
export function useNavigate() { const router = useRouter(); return (to: string) => router.push(to); }
export function useParams() { const pathname = usePathname(); return { section: pathname?.split('/')[2] }; }
export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const params = useNextSearchParams(); const router = useRouter(); const pathname = usePathname();
  return [new URLSearchParams(params.toString()), (next) => { const query = new URLSearchParams(next).toString(); router.push(pathname + (query ? `?${query}` : '')); }];
}
