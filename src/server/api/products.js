import supabase from './db-client.js';
import { requireMerchant } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'PUT') {
      const user = await requireMerchant(req, res);
      if (!user) return;

      const body = req.body || {};
      if (!body.id || !body.name) return res.status(400).json({ error: 'id ও name প্রয়োজন' });

      const row = {
        id: String(body.id),
        name: String(body.name),
        english: String(body.english || ''),
        description: String(body.description || ''),
        category: String(body.category || ''),
        price: Number(body.price || 0),
        old_price: Number(body.old_price ?? body.oldPrice ?? 0),
        weight: Number(body.weight || 0),
        stock: Number(body.stock || 0),
        image: String(body.image || ''),
        badge: String(body.badge || ''),
        featured: !!body.featured,
        active: body.active !== false,
        shades: Array.isArray(body.shades) ? body.shades : [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('products')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await requireMerchant(req, res);
      if (!user) return;

      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id প্রয়োজন' });
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('products API error:', err);
    res.status(500).json({ error: err.message });
  }
}
