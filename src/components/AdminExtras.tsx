import { useEffect, useState, type FormEvent } from 'react';
import { authHeaders } from '../lib/types';

type Merchant = { email: string; added_at: string };
type Coupon = { code: string; discount_percent: number; active: boolean; expires_at: string | null };

async function request(path: string, method = 'GET', body?: object) {
  const res = await fetch(path, { method, headers: await authHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'অনুরোধটি সম্পন্ন হয়নি');
  return data;
}

export function StaffAccessAdmin() {
  const [list, setList] = useState<Merchant[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function refresh() {
    try { setList(await request('/api/merchants')); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'তালিকা পাওয়া যায়নি'); }
  }
  useEffect(() => { void refresh(); }, []);
  async function add(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try { await request('/api/merchants', 'POST', { email }); setEmail(''); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'যোগ করা যায়নি'); }
    finally { setBusy(false); }
  }
  async function remove(value: string) {
    if (!window.confirm(`${value} সরাতে চান?`)) return;
    setBusy(true); setError('');
    try { await request('/api/merchants', 'DELETE', { email: value }); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'সরানো যায়নি'); }
    finally { setBusy(false); }
  }
  return <>
    <div className="admin-page-heading"><div><span className="section-kicker">মার্চেন্ট</span><h1>স্টাফ অ্যাক্সেস</h1><p>অনুমোদিত ইমেইল যোগ বা সরান। ADMIN_EMAILS-এ থাকা ইমেইল এখান থেকে সরানো যায় না।</p></div></div>
    <section className="admin-card settings-card">
      <div className="admin-card-heading"><h2>অনুমোদিত স্টাফ</h2></div>
      <form onSubmit={add} className="field">
        <span>নতুন ইমেইল</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" />
        <button className="button primary" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>ইমেইল যোগ করুন</button>
      </form>
      {error && <p className="cloud-error">{error}</p>}
      {list.map((item) => <div key={item.email} className="order-summary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <span>{item.email}</span><button className="button secondary small-button" type="button" disabled={busy} onClick={() => remove(item.email)}>সরান</button>
      </div>)}
    </section>
  </>;
}

export function CouponsAdmin() {
  const [list, setList] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ code: '', discount_percent: 10, active: true, expires_at: '' });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function refresh() {
    try { setList(await request('/api/coupons')); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'তালিকা পাওয়া যায়নি'); }
  }
  useEffect(() => { void refresh(); }, []);
  async function save(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await request('/api/coupons', editing ? 'PUT' : 'POST', {
        ...form, code: form.code.trim().toUpperCase(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });
      setForm({ code: '', discount_percent: 10, active: true, expires_at: '' });
      setEditing(false); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'সেভ করা যায়নি'); }
    finally { setBusy(false); }
  }
  async function remove(code: string) {
    if (!window.confirm(`${code} কুপন মুছতে চান?`)) return;
    setBusy(true); setError('');
    try { await request('/api/coupons', 'DELETE', { code }); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'মুছা যায়নি'); }
    finally { setBusy(false); }
  }
  return <>
    <div className="admin-page-heading"><div><span className="section-kicker">অফার</span><h1>কুপন কোড</h1><p>কুপন তৈরি, সম্পাদনা বা মুছে ফেলুন।</p></div></div>
    <section className="admin-card settings-card">
      <div className="admin-card-heading"><h2>{editing ? 'কুপন সম্পাদনা' : 'নতুন কুপন'}</h2></div>
      <form onSubmit={save}>
        <div className="form-grid">
          <label className="field"><span>কোড</span><input required minLength={2} maxLength={32} pattern="[A-Za-z0-9_-]+" disabled={editing} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></label>
          <label className="field"><span>ছাড় (%)</span><input required type="number" min={0.01} max={100} step="any" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} /></label>
          <label className="field"><span>মেয়াদ শেষ (ঐচ্ছিক)</span><input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> চালু আছে</label>
        </div>
        <button className="button primary" type="submit" disabled={busy}>{editing ? 'পরিবর্তন সেভ করুন' : 'কুপন তৈরি করুন'}</button>
        {editing && <button className="button secondary" type="button" onClick={() => { setEditing(false); setForm({ code: '', discount_percent: 10, active: true, expires_at: '' }); }}>বাতিল</button>}
      </form>
      {error && <p className="cloud-error">{error}</p>}
    </section>
    <section className="admin-card settings-card" style={{ marginTop: 20 }}>
      <div className="admin-card-heading"><h2>সব কুপন</h2></div>
      {list.map((item) => <div key={item.code} className="order-summary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span><strong>{item.code}</strong> · {item.discount_percent}% ছাড় · {item.active ? 'চালু' : 'বন্ধ'}{item.expires_at ? ` · ${new Date(item.expires_at).toLocaleDateString('bn-BD')}` : ''}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button className="button secondary small-button" type="button" onClick={() => { setEditing(true); setForm({ ...item, expires_at: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : '' }); }}>এডিট</button>
          <button className="button secondary small-button" type="button" disabled={busy} onClick={() => remove(item.code)}>মুছুন</button>
        </span>
      </div>)}
    </section>
  </>;
}
