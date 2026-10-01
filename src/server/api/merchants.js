import supabase from './db-client.js';
import { requireMerchant } from './_auth.js';

export default async function handler(req, res) {
  const user = await requireMerchant(req, res);
  if (!user) return;
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('merchants').select('email,added_at').order('added_at');
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'সঠিক ইমেইল দিন' });
      const { data, error } = await supabase.from('merchants').insert({ email }).select('email,added_at').single();
      if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.message });
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ error: 'ইমেইল দিন' });
      const { error } = await supabase.from('merchants').delete().eq('email', email);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('merchants API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
