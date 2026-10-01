import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const handlers: Record<string, () => Promise<{ default: (req: any, res: any) => Promise<void> }>> = {
  products: () => import('../../../server/api/products.js'),
  categories: () => import('../../../server/api/categories.js'),
  coupons: () => import('../../../server/api/coupons.js'),
  merchants: () => import('../../../server/api/merchants.js'),
  orders: () => import('../../../server/api/orders.js'),
  settings: () => import('../../../server/api/settings.js'),
  upload: () => import('../../../server/api/upload.js'),
};
async function dispatch(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  const loadHandler = handlers[resource];
  if (!loadHandler) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let body: unknown = undefined;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  }
  const query = Object.fromEntries(request.nextUrl.searchParams);
  let status = 200;
  const headers = new Headers();
  let resolve!: (response: Response) => void;
  const done = new Promise<Response>((r) => { resolve = r; });
  let settled = false;
  const finish = (payload: unknown) => { if (!settled) { settled = true; resolve(payload === undefined ? new Response(null, { status, headers }) : NextResponse.json(payload, { status, headers })); } };
  const response = { status(code: number) { status = code; return this; }, setHeader(key: string, value: string) { headers.set(key, value); return this; }, json(payload: unknown) { finish(payload); return this; }, end() { finish(undefined); return this; } };
  const req = { method: request.method, query, body, headers: Object.fromEntries(request.headers) };
  try { const { default: handler } = await loadHandler(); await handler(req, response); if (!settled) finish({ error: 'Empty response' }); } catch (error) { if (!settled) { status = 500; finish({ error: error instanceof Error ? error.message : 'Server error' }); } }
  return done;
}
export { dispatch as GET, dispatch as POST, dispatch as PUT, dispatch as DELETE, dispatch as OPTIONS };
