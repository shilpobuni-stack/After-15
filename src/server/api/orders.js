import supabase from './db-client.js';
import { requireMerchant } from './_auth.js';
import { createOrderAccessToken, mapTrackingOrder, verifyOrderAccessToken } from './_order-access.js';

function calcDelivery(settings, weight, region, subtotal) {
  if (Number(settings.free_threshold ?? 2000) > 0 && subtotal >= Number(settings.free_threshold ?? 2000)) return 0;
  const steps = settings.weight_enabled !== false
    ? Math.ceil(Math.max(0, weight - Number(settings.base_weight ?? 500)) / Math.max(1, Number(settings.weight_step ?? 500)))
    : 0;
  return Number(settings[region] ?? (region === 'outside' ? 130 : 80)) + steps * Number(settings.extra_charge ?? 20);
}

function mapOrder(n) {
  return {
    id: String(n.id),
    created_at: n.created_at,
    createdAt: n.created_at,
    name: n.name,
    phone: n.phone,
    address: n.address,
    region: n.region,
    note: n.note || '',
    items: n.items || [],
    subtotal: Number(n.subtotal || 0),
    weight: Number(n.weight || 0),
    delivery: Number(n.delivery || 0),
    total: Number(n.total || 0),
    status: n.status || 'অপেক্ষমাণ',
    admin_note: n.admin_note || '',
    adminNote: n.admin_note || '',
  };
}

function mapOwnedOrder(n) {
  return { ...mapOrder(n), accessToken: createOrderAccessToken(n) };
}

function genericNotFound(res) {
  return res.status(404).json({ error: 'অর্ডারটি পাওয়া যায়নি। অর্ডার আইডি ও ফোন নম্বর যাচাই করুন।' });
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const phone = digits.startsWith('880') && digits.length === 13 ? `0${digits.slice(3)}` : digits;
  return /^01[3-9][0-9]{8}$/.test(phone) ? phone : '';
}

function parseOrderId(value) {
  const id = String(value || '').trim().toUpperCase();
  return /^KS-[A-Z0-9]+-[A-Z0-9]{4}$/.test(id) ? id : '';
}

async function customerTrack(body, res) {
  if (body.action === 'track') {
    const claims = verifyOrderAccessToken(body.accessToken);
    if (!claims) return genericNotFound(res);
    const { data, error } = await supabase.from('orders').select('*').eq('id', claims.id).maybeSingle();
    if (error) throw error;
    if (!data || String(data.created_at) !== claims.createdAt) return genericNotFound(res);
    return res.status(200).json(mapTrackingOrder(data));
  }

  if (body.action === 'track-verify') {
    const id = parseOrderId(body.orderId);
    const phone = normalizePhone(body.phone);
    if (!id || !phone) return genericNotFound(res);
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).eq('phone', phone).maybeSingle();
    if (error) throw error;
    if (!data) return genericNotFound(res);
    return res.status(200).json(mapTrackingOrder(data));
  }
  return null;
}

function genOrderId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KS-${t}-${r}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { all } = req.query || {};
      if (all === '1' || all === 'true') {
        const merchant = await requireMerchant(req, res);
        if (!merchant) return;
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json((data || []).map(mapOrder));
      }
      if (req.query?.ids !== undefined || req.query?.search !== undefined || req.query?.track !== undefined) {
        return res.status(410).json({ error: 'অর্ডার দেখতে সুরক্ষিত ট্র্যাকিং যাচাই প্রয়োজন।' });
      }
      return res.status(400).json({ error: 'Missing query' });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (body.action === 'track' || body.action === 'track-verify') return customerTrack(body, res);

      const customer = body.customer || {};
      const items = Array.isArray(body.items) ? body.items : [];
      const requestId = body.requestId ? String(body.requestId).slice(0, 120) : null;
      const expectedTotal = Number(body.expectedTotal ?? -1);
      if (!customer.name || !customer.phone || !customer.address) return res.status(400).json({ error: 'নাম, ফোন ও ঠিকানা প্রয়োজন' });
      if (!/^01[3-9][0-9]{8}$/.test(String(customer.phone).trim())) return res.status(400).json({ error: 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)' });
      if (!items.length) return res.status(400).json({ error: 'ব্যাগ খালি' });
      if (items.length > 100 || !['inside', 'outside'].includes(customer.region)) return res.status(400).json({ error: 'অর্ডারের তথ্য সঠিক নয়' });
      const uniqueLines = new Set();
      for (const item of items) {
        if (!item || typeof item.productId !== 'string' || typeof item.shadeId !== 'string') return res.status(400).json({ error: 'পণ্যের তথ্য সঠিক নয়' });
        const key = `${item.productId}:${item.shadeId}`;
        if (uniqueLines.has(key)) return res.status(400).json({ error: 'একই পণ্য একাধিকবার দেওয়া হয়েছে' });
        uniqueLines.add(key);
      }

      if (requestId) {
        const { data: existing, error: existingError } = await supabase.from('orders').select('*').eq('request_id', requestId).maybeSingle();
        if (existingError) throw existingError;
        if (existing) {
          if (String(existing.phone || '') !== String(customer.phone).trim()) return res.status(409).json({ error: 'অর্ডারের অনুরোধটি ইতোমধ্যে ব্যবহৃত হয়েছে।' });
          return res.status(200).json(mapOwnedOrder(existing));
        }
      }

      const [{ data: products, error: productError }, { data: settingsRow, error: settingsError }] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('settings').select('*').eq('id', 'main').maybeSingle(),
      ]);
      if (productError) throw productError;
      if (settingsError) throw settingsError;
      const settings = settingsRow || {};
      const byId = Object.fromEntries((products || []).map((product) => [product.id, product]));

      const couponCode = String(body.couponCode || '').trim().toUpperCase();
      let coupon = null;
      if (couponCode) {
        if (!/^[A-Z0-9_-]{2,32}$/.test(couponCode)) return res.status(400).json({ error: 'সঠিক কুপন কোড দিন' });
        const { data: found, error: couponError } = await supabase.from('coupons').select('code,discount_percent,active,expires_at').eq('code', couponCode).maybeSingle();
        if (couponError) throw couponError;
        if (!found || !found.active || (found.expires_at && new Date(found.expires_at).getTime() <= Date.now())) return res.status(400).json({ error: 'কুপনটি বৈধ নয় বা মেয়াদ শেষ' });
        coupon = found;
      }

      const lineItems = [];
      const reservations = [];
      let subtotal = 0;
      let weight = 0;
      for (const cartItem of items) {
        const product = byId[cartItem.productId];
        if (!product || product.active === false) return res.status(400).json({ error: 'কিছু পণ্য আর পাওয়া যাচ্ছে না' });
        const quantity = Number(cartItem.quantity);
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) return res.status(400).json({ error: 'সঠিক পরিমাণ বেছে নিন' });
        const shades = Array.isArray(product.shades) ? product.shades : [];
        let shade = null;
        let stock = Number(product.stock || 0);
        if (shades.length) {
          shade = shades.find((entry) => entry.id === cartItem.shadeId);
          if (!shade) return res.status(400).json({ error: `${product.name} এর শেড বেছে নিন` });
          stock = Number(shade.stock || 0);
        }
        if (quantity > stock) return res.status(400).json({ error: `${product.name}${shade ? ' · ' + shade.name : ''} স্টকে নেই` });
        const price = Number(product.price || 0);
        const itemWeight = Number(product.weight || 0);
        if (!Number.isFinite(price) || price < 0 || !Number.isFinite(itemWeight) || itemWeight < 0) return res.status(400).json({ error: 'পণ্যের মূল্য বা ওজন সঠিক নয়' });
        lineItems.push({ productId: product.id, name: product.name, shade: shade ? `${shade.name} · ${shade.code}` : '', shadeId: shade?.id || '', quantity, price, weight: itemWeight, image: shade?.image || product.image || '' });
        subtotal += price * quantity;
        weight += itemWeight * quantity;
        reservations.push({ product, shade, quantity, stock });
      }

      const region = customer.region === 'outside' ? 'outside' : 'inside';
      const delivery = calcDelivery(settings, weight, region, subtotal);
      const discount = coupon ? Math.round(subtotal * Number(coupon.discount_percent) / 100) : 0;
      const total = subtotal - discount + delivery;
      if (!Number.isFinite(expectedTotal) || Math.abs(expectedTotal - total) > 1) return res.status(400).json({ error: 'মোট মূল্যে পরিবর্তন হয়েছে। পৃষ্ঠা রিফ্রেশ করে আবার চেষ্টা করুন।' });

      const paymentLabel = String(customer.payment || 'ক্যাশ অন ডেলিভারি').slice(0, 80);
      const mobilePay = /বিকাশ|নগদ|রকেট|bkash|nagad|rocket/i.test(paymentLabel);
      const userNote = String(customer.note || '').slice(0, 400);
      if (mobilePay && !/^TrxID: [A-Z0-9]{8,15}(?:\n|$)/.test(userNote)) return res.status(400).json({ error: 'ভুল বা অনুপস্থিত ট্রানজেকশন আইডি — অর্ডার নিশ্চিত করা যায়নি।' });
      const note = userNote ? `[পেমেন্ট: ${paymentLabel}]\n${userNote}` : `[পেমেন্ট: ${paymentLabel}]`;

      for (const { product, shade, quantity, stock } of reservations) {
        if (shade) {
          const { data: fresh, error: freshError } = await supabase.from('products').select('shades').eq('id', product.id).single();
          if (freshError) throw freshError;
          const freshShades = Array.isArray(fresh?.shades) ? fresh.shades : [];
          const freshShade = freshShades.find((entry) => entry.id === shade.id);
          const freshStock = Number(freshShade?.stock || 0);
          if (!freshShade || freshStock < quantity) return res.status(400).json({ error: `${product.name} · ${shade.name} স্টকে নেই` });
          const newShades = freshShades.map((entry) => entry.id === shade.id ? { ...entry, stock: freshStock - quantity } : entry);
          const { data: updated, error: updateError } = await supabase.from('products').update({ shades: newShades, stock: 0 }).eq('id', product.id).contains('shades', [freshShade]).select('id');
          if (updateError) throw updateError;
          if (!updated?.length) return res.status(400).json({ error: 'স্টক আপডেট ব্যর্থ — আবার চেষ্টা করুন' });
        } else {
          const { data: updated, error: updateError } = await supabase.from('products').update({ stock: stock - quantity }).eq('id', product.id).eq('stock', stock).gte('stock', quantity).select('id');
          if (updateError) throw updateError;
          if (!updated?.length) return res.status(400).json({ error: `${product.name} স্টকে নেই` });
        }
      }

      const order = {
        id: genOrderId(), request_id: requestId,
        name: String(customer.name).trim().slice(0, 120),
        phone: String(customer.phone).trim(),
        address: String(customer.address).trim(), region,
        note: coupon ? `${note}\n[কুপন: ${coupon.code}, ছাড়: ৳${discount}]` : note,
        items: lineItems, subtotal: subtotal - discount, weight, delivery, total,
        status: 'অপেক্ষমাণ', admin_note: '', created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (error) {
        if (String(error.message || '').includes('duplicate') && requestId) {
          const { data: again, error: againError } = await supabase.from('orders').select('*').eq('request_id', requestId).maybeSingle();
          if (againError) throw againError;
          if (again && String(again.phone || '') === String(customer.phone).trim()) return res.status(200).json(mapOwnedOrder(again));
        }
        throw error;
      }

      if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && settings.email) {
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL,
              to: [settings.email],
              subject: `নতুন অর্ডার ${data.id}`,
              text: `অর্ডার আইডি: ${data.id}\nকাস্টমার: ${data.name}\nফোন: ${data.phone}\nমোট: ৳${data.total}`,
            }),
            signal: AbortSignal.timeout(5000),
          });
          if (!response.ok) console.error('Order email failed:', response.status);
        } catch (mailError) {
          console.error('Order email failed:', mailError?.name || 'request failed');
        }
      }
      return res.status(201).json(mapOwnedOrder(data));
    }

    if (req.method === 'PUT') {
      const merchant = await requireMerchant(req, res);
      if (!merchant) return;
      const { id, status, note } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id প্রয়োজন' });
      const updates = {};
      if (status !== undefined) updates.status = String(status).slice(0, 80);
      if (note !== undefined) updates.admin_note = String(note).slice(0, 2000);
      if (!Object.keys(updates).length) return res.status(400).json({ error: 'আপডেট করার তথ্য প্রয়োজন' });
      const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(mapOrder(data));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('orders API failed:', error?.name || 'server error');
    if (!res.headersSent) return res.status(500).json({ error: 'অর্ডারের অনুরোধ সম্পন্ন করা যায়নি।' });
  }
}
