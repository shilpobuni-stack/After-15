import supabase from './db-client.js';
import { requireMerchant } from './_auth.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET' && req.query?.code) {
      const code = String(req.query.code).trim().toUpperCase();
      if (!/^[A-Z0-9_-]{2,32}$/.test(code)) return res.status(400).json({ error: 'সঠিক কুপন কোড দিন' });
      const { data, error } = await supabase.from('coupons').select('code,discount_percent,active,expires_at').eq('code', code).maybeSingle();
      if (error) throw error;
      if (!data || !data.active || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) {
        return res.status(404).json({ error: 'কুপনটি বৈধ নয় বা মেয়াদ শেষ' });
      }
      return res.status(200).json({ code: data.code, discount_percent: Number(data.discount_percent) });
    }
    const user = await requireMerchant(req, res);
    if (!user) return;
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('coupons').select('code,discount_percent,active,expires_at').order('code');
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const code = String(req.body?.code || '').trim().toUpperCase();
      const discount_percent = Number(req.body?.discount_percent);
      const expires_at = req.body?.expires_at || null;
      if (!/^[A-Z0-9_-]{2,32}$/.test(code) || !Number.isFinite(discount_percent) || discount_percent <= 0 || discount_percent > 100 || (expires_at && !Number.isFinite(Date.parse(expires_at)))) {
        return res.status(400).json({ error: 'কোড, ছাড় বা মেয়াদ সঠিক নয়' });
      }
      const row = { code, discount_percent, active: req.body.active !== false, expires_at };
      const query = req.method === 'POST'
        ? supabase.from('coupons').insert(row)
        : supabase.from('coupons').update(row).eq('code', code);
      const { data, error } = await query.select('code,discount_percent,active,expires_at').single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const code = String(req.body?.code || '').trim().toUpperCase();
      if (!code) return res.status(400).json({ error: 'কোড দিন' });
      const { error } = await supabase.from('coupons').delete().eq('code', code);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('coupons API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
