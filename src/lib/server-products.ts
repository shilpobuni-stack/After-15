import supabase from '../server/api/db-client.js';

export type MetaProduct = {
  id: string;
  name: string;
  english: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
};

export function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function getMetaProduct(id: string): Promise<MetaProduct | null> {
  try {
    const { data } = await supabase
      .from('products')
      .select('id,name,english,description,price,image,stock,active,shades')
      .eq('id', id)
      .maybeSingle();
    if (!data || data.active === false) return null;
    const shades: { stock?: number }[] = Array.isArray(data.shades) ? data.shades : [];
    const total = shades.length
      ? shades.reduce((sum, s) => sum + Number(s.stock || 0), 0)
      : Number(data.stock || 0);
    return {
      id: String(data.id),
      name: String(data.name || ''),
      english: String(data.english || ''),
      description: String(data.description || ''),
      price: Number(data.price || 0),
      image: String(data.image || ''),
      inStock: total > 0,
    };
  } catch {
    return null;
  }
}

export async function listProductIds(): Promise<{ id: string; updated: string }[]> {
  try {
    const { data } = await supabase.from('products').select('id,active,updated_at,created_at');
    return (data || [])
      .filter((p: { active?: boolean }) => p.active !== false)
      .map((p: { id: string; updated_at?: string; created_at?: string }) => ({
        id: String(p.id),
        updated: String(p.updated_at || p.created_at || ''),
      }));
  } catch {
    return [];
  }
              }
