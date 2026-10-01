import { createClient } from '@supabase/supabase-js';

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!projectUrl || !publicKey) {
  console.warn('Supabase configuration is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

const supabase = createClient(
  projectUrl || 'https://invalid.supabase.co',
  publicKey || 'missing-publishable-key',
);

export default supabase;
