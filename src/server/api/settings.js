import supabase from './db-client.js';
import { requireMerchant } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'main')
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(200).json({});
      return res.status(200).json(mapSettings(data));
    }

    if (req.method === 'PUT') {
      const user = await requireMerchant(req, res);
      if (!user) return;

      const body = req.body || {};
      const row = {
        id: 'main',
        name: body.name ?? '',
        tagline: body.tagline ?? '',
        announcement: body.announcement ?? '',
        announcement_enabled: body.announcementEnabled !== false && body.announcement_enabled !== false,
        hero_eyebrow: body.heroEyebrow ?? body.hero_eyebrow ?? '',
        hero_title: body.heroTitle ?? body.hero_title ?? '',
        hero_accent: body.heroAccent ?? body.hero_accent ?? '',
        hero_description: body.heroDescription ?? body.hero_description ?? '',
        hero_image: body.heroImage ?? body.hero_image ?? '',
        hero_button_text: body.heroButtonText ?? body.hero_button_text ?? '',
        categories_title: body.categoriesTitle ?? body.categories_title ?? '',
        featured_title: body.featuredTitle ?? body.featured_title ?? '',
        featured_count: Number(body.featuredCount ?? body.featured_count ?? 4),
        shade_title: body.shadeTitle ?? body.shade_title ?? '',
        shade_description: body.shadeDescription ?? body.shade_description ?? '',
        shade_image: body.shadeImage ?? body.shade_image ?? '',
        story_title: body.storyTitle ?? body.story_title ?? '',
        show_story: body.showStory !== false && body.show_story !== false,
        show_delivery: body.showDelivery !== false && body.show_delivery !== false,
        show_categories: body.showCategories !== false && body.show_categories !== false,
        show_shades: body.showShades !== false && body.show_shades !== false,
        accent: body.accent ?? '#e6004c',
        about: body.about ?? '',
        email: body.email ?? '',
        phone: body.phone ?? '',
        address: body.address ?? '',
        inside: Number(body.inside ?? 80),
        outside: Number(body.outside ?? 130),
        weight_enabled: body.weightEnabled !== false && body.weight_enabled !== false,
        base_weight: Number(body.baseWeight ?? body.base_weight ?? 500),
        weight_step: Number(body.weightStep ?? body.weight_step ?? 500),
        extra_charge: Number(body.extraCharge ?? body.extra_charge ?? 20),
        free_threshold: Number(body.freeThreshold ?? body.free_threshold ?? 2000),
        faqs: Array.isArray(body.faqs) ? body.faqs : [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('settings')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;

      // Return camelCase for frontend
      return res.status(200).json(mapSettings(data));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('settings API error:', err);
    res.status(500).json({ error: err.message });
  }
}

function mapSettings(d) {
  if (!d) return {};
  return {
    name: d.name,
    tagline: d.tagline,
    announcement: d.announcement,
    announcementEnabled: d.announcement_enabled,
    heroEyebrow: d.hero_eyebrow,
    heroTitle: d.hero_title,
    heroAccent: d.hero_accent,
    heroDescription: d.hero_description,
    heroImage: d.hero_image,
    heroButtonText: d.hero_button_text,
    categoriesTitle: d.categories_title,
    featuredTitle: d.featured_title,
    featuredCount: d.featured_count,
    shadeTitle: d.shade_title,
    shadeDescription: d.shade_description,
    shadeImage: d.shade_image,
    storyTitle: d.story_title,
    showStory: d.show_story,
    showDelivery: d.show_delivery,
    showCategories: d.show_categories,
    showShades: d.show_shades,
    accent: d.accent,
    about: d.about,
    email: d.email,
    phone: d.phone,
    address: d.address,
    inside: d.inside,
    outside: d.outside,
    weightEnabled: d.weight_enabled,
    baseWeight: d.base_weight,
    weightStep: d.weight_step,
    extraCharge: d.extra_charge,
    freeThreshold: d.free_threshold,
    faqs: d.faqs || [],
  };
}
