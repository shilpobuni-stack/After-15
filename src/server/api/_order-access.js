import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function signingKey() {
  return String(process.env.ORDER_ACCESS_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '');
}

export function createOrderAccessToken(order) {
  const key = signingKey();
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to issue secure order access tokens.');
  const payload = Buffer.from(JSON.stringify({
    id: String(order.id),
    createdAt: String(order.created_at || order.createdAt),
    nonce: randomBytes(32).toString('base64url'),
  })).toString('base64url');
  const signature = createHmac('sha256', key).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyOrderAccessToken(token) {
  const key = signingKey();
  if (!key || typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null;

  const expected = createHmac('sha256', key).update(parts[0]).digest();
  const supplied = Buffer.from(parts[1], 'base64url');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (typeof claims.id !== 'string' || typeof claims.createdAt !== 'string' || typeof claims.nonce !== 'string') return null;
    if (!/^[A-Za-z0-9_-]{40,}$/.test(claims.nonce)) return null;
    return claims;
  } catch {
    return null;
  }
}

export function mapTrackingOrder(order) {
  const items = Array.isArray(order.items) ? order.items.map((item) => ({
    name: String(item?.name || ''),
    shade: String(item?.shade || ''),
    quantity: Number(item?.quantity || 0),
    price: Number(item?.price || 0),
    image: String(item?.image || ''),
  })) : [];
  return {
    id: String(order.id),
    created_at: order.created_at,
    createdAt: order.created_at,
    items,
    subtotal: Number(order.subtotal || 0),
    delivery: Number(order.delivery || 0),
    total: Number(order.total || 0),
    status: String(order.status || 'অপেক্ষমাণ'),
  };
}
