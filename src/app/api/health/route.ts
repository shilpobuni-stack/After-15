import { NextResponse } from 'next/server';
import supabase from '../../../server/api/db-client.js';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const report: Record<string, unknown> = {
    supabaseProject: url ? url.replace(/^https?:\/\//, '').split('.')[0] : 'NOT SET',
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasOrderSecret: Boolean(process.env.ORDER_ACCESS_TOKEN_SECRET),
    hasAdminEmails: Boolean(process.env.ADMIN_EMAILS),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
  };
  const tables: Record<string, string> = {};
  for (const table of ['products', 'categories', 'orders', 'coupons', 'settings', 'merchants']) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      tables[table] = error ? `ERROR: ${error.message}` : `rows: ${count ?? 0}`;
    } catch (e) {
      tables[table] = `ERROR: ${e instanceof Error ? e.message : 'unknown'}`;
    }
  }
  report.tables = tables;
  return NextResponse.json(report);
                            }
