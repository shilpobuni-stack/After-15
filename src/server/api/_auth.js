import supabase from './db-client.js';

/** Verify the Supabase Auth bearer token and authorize a merchant on the server. */
export async function requireMerchant(req, res) {
  const rawAuthorization = req.headers?.authorization || req.headers?.Authorization || '';
  const token = String(rawAuthorization).replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Merchant authentication required.' });
    return null;
  }

  const { data, error: authError } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (authError || !user) {
    res.status(401).json({ error: 'Invalid or expired merchant session.' });
    return null;
  }

  const email = String(user.email || '').trim().toLowerCase();
  if (!email) {
    res.status(403).json({ error: 'Merchant access is not authorized.' });
    return null;
  }

  const allowedEmails = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (allowedEmails.includes(email)) return user;

  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('email')
    .ilike('email', email)
    .maybeSingle();
  if (merchantError || !merchant) {
    res.status(403).json({ error: 'Merchant access is not authorized.' });
    return null;
  }
  return user;
}
