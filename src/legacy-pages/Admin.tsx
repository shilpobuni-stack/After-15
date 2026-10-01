import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  Filter,
  Home,
  ImagePlus,
  Info,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Trash2,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import {
  ACCENT_COLORS,
  BADGES,
  ORDER_STATUSES,
  SHADE_PALETTE,
  deliveryCharge,
  downloadReceipt,
  fmt,
  formatDate,
  money,
  totalStock,
  uid,
  uploadImage,
  weightLabel,
  type Category,
  type Order,
  type Product,
  type Settings as StoreSettings,
  type Shade,
} from '../lib/types';
import { BrandMark, ConfirmModal, EmptyState, Field, Modal, StatusBadge, ToggleField } from '../components/UI';
import { CouponsAdmin, StaffAccessAdmin } from '../components/AdminExtras';

const NAV: [string, string, typeof LayoutDashboard][] = [
  ['overview', 'ড্যাশবোর্ড', LayoutDashboard],
  ['products', 'পণ্য ব্যবস্থাপনা', Package],
  ['shades', 'শেড লাইব্রেরি', Palette],
  ['categories', 'ক্যাটাগরি', Filter],
  ['orders', 'অর্ডার', Package],
  ['delivery', 'ডেলিভারি ও ওজন', Truck],
  ['appearance', 'স্টোর ও ডিজাইন', Settings],
  ['content', 'কনটেন্ট ও যোগাযোগ', Phone],
  ['staff', 'স্টাফ অ্যাক্সেস', Shield],
  ['coupons', 'কুপন কোড', Save],
  ['data', 'ডেটা ও ব্যাকআপ', Download],
  ['storage', 'অনলাইন স্টোরেজ', Cloud],
];

function Heading({
  kicker,
  title,
  description,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-page-heading">
      <div>
        {kicker && <span className="section-kicker">{kicker}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { cloud } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onFile(file?: File | null) {
    if (!file) return;
    if (!cloud.isMerchant) {
      setErr('ছবি আপলোড করতে মার্চেন্ট লগইন প্রয়োজন।');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'আপলোড ব্যর্থ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="image-field">
      <span>{label}</span>
      {value && (
        <div className="image-preview">
          <img src={value} alt="ছবির প্রিভিউ" />
          <button type="button" onClick={() => onChange('')} aria-label="ছবি সরান">
            <X size={14} />
          </button>
        </div>
      )}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="ছবির URL অথবা আপলোড করুন" />
      <div className="image-field-actions">
        <button type="button" className="button secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> {busy ? 'অপেক্ষা করুন' : 'ছবি আপলোড'}
        </button>
        <small>JPG, PNG বা WebP · স্বয়ংক্রিয় WebP সংকোচন</small>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {err && <p className="cloud-error">{err}</p>}
    </div>
  );
}

function ShadeImageCell({
  shade,
  onSaved,
}: {
  shade: Shade;
  onSaved: (s: Shade) => void;
}) {
  const { cloud } = useStore();
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file?: File | null) {
    if (!file || !cloud.isMerchant) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onSaved({ ...shade, image: url });
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shade-image-cell">
      <button type="button" className="shade-image-upload" onClick={() => galRef.current?.click()} aria-label="ছবি আপলোড">
        {shade.image ? (
          <img src={shade.image} alt={`${shade.name} সুতার ছবি`} />
        ) : busy ? (
          <span>অপেক্ষা করুন</span>
        ) : (
          <>
            <ImagePlus size={20} />
            <span>{busy ? 'অপেক্ষা করুন' : 'ছবি'}</span>
          </>
        )}
      </button>
      <div className="shade-image-actions">
        <button type="button" onClick={() => camRef.current?.click()}>
          <Camera size={14} /> ক্যামেরা
        </button>
        <button type="button" onClick={() => galRef.current?.click()}>
          <ImagePlus size={14} /> গ্যালারি
        </button>
      </div>
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={galRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function MerchantLogin() {
  const { cloud } = useStore();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await cloud.signIn(String(fd.get('email') || ''), String(fd.get('password') || ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'লগইন ব্যর্থ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="merchant-login" onSubmit={onSubmit}>
      <span className="icon sage">
        <Shield size={27} />
      </span>
      <h2>মার্চেন্ট লগইন</h2>
      <p>শুধু অনুমোদিত মার্চেন্ট অ্যাকাউন্ট দিয়ে স্টোর পরিচালনা করুন।</p>
      <label className="field">
        <span>মার্চেন্ট ইমেইল</span>
        <input name="email" type="email" required placeholder="merchant@example.com" autoComplete="email" />
        <small>ইমেইল এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন</small>
      </label>
      <label className="field">
        <span>পাসওয়ার্ড</span>
        <input name="password" type="password" required placeholder="আপনার পাসওয়ার্ড" autoComplete="current-password" />
      </label>
      {error && <p className="cloud-error">{error}</p>}
      <button className="button primary full-width" type="submit" disabled={busy}>
        {busy ? 'প্রবেশ করা হচ্ছে...' : 'মার্চেন্ট লগইন'}
      </button>
      <p style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>অনুমোদিত মার্চেন্ট অ্যাকাউন্ট প্রয়োজন</p>
    </form>
  );
}

function Overview() {
  const { products, categories, settings, merchantOrders, cloud } = useStore();
  const lowStock = products.reduce(
    (a, p) => a + p.shades.filter((s) => s.stock > 0 && s.stock < 5).length,
    0
  );
  const stats = [
    {
      label: 'সক্রিয় পণ্য',
      value: fmt(products.filter((p) => p.active).length),
      note: `${fmt(products.length)}টি মোট`,
      icon: Package,
      color: 'rose',
    },
    {
      label: 'অনলাইন অর্ডার',
      value: fmt(merchantOrders.length),
      note: cloud.lastSynced ? `সিঙ্ক ${cloud.lastSynced}` : 'লগইন করুন',
      icon: Package,
      color: 'sage',
    },
    {
      label: 'ক্যাটাগরি',
      value: fmt(categories.length),
      note: 'স্টোর সেকশন',
      icon: Filter,
      color: 'terracotta',
    },
    {
      label: 'কম স্টক শেড',
      value: fmt(lowStock),
      note: '৫টির কম',
      icon: Palette,
      color: 'gold',
    },
  ];

  return (
    <>
      <Heading
        kicker="স্বাগতম"
        title="স্টোর ড্যাশবোর্ড"
        description="পণ্য, অর্ডার ও ডিজাইন — সব এক জায়গায়।"
      >
        <Link className="button primary" to="/admin/products">
          <Plus size={17} /> পণ্য যোগ করুন
        </Link>
      </Heading>
      <div className="admin-stats">
        {stats.map((s) => (
          <div className="admin-stat" key={s.label}>
            <div>
              <span>{s.label}</span>
              <i className={`stat-icon ${s.color}`}>
                <s.icon size={18} />
              </i>
            </div>
            <strong>{s.value}</strong>
            <small>{s.note}</small>
          </div>
        ))}
      </div>
      <div className="admin-quick-actions">
        <Link to="/admin/shades">
          <span className="icon sage">
            <Palette size={24} />
          </span>
          <div>
            <h3>রঙের লাইব্রেরি সাজান</h3>
            <p>একই সুতায় অসংখ্য শেড ও আলাদা স্টক।</p>
          </div>
        </Link>
        <Link to="/admin/delivery">
          <span className="icon terracotta">
            <Truck size={24} />
          </span>
          <div>
            <h3>ওজনভিত্তিক ডেলিভারি</h3>
            <p>বেস ওজন, অতিরিক্ত চার্জ ও ফ্রি থ্রেশহোল্ড।</p>
          </div>
        </Link>
      </div>
      <div className="admin-card-columns">
        <div className="admin-card">
          <div className="admin-card-heading">
            <h2>সাম্প্রতিক অর্ডার</h2>
            <Link className="text-link" to="/admin/orders">
              সব দেখুন <ArrowRight size={15} />
            </Link>
          </div>
          {merchantOrders.length ? (
            <div className="mini-table-orders">
              {merchantOrders.slice(0, 5).map((o) => (
                <Link to="/admin/orders" key={o.id}>
                  <span className="order-initial">{o.name.slice(0, 1)}</span>
                  <div>
                    <strong>{o.name}</strong>
                    <small>
                      {fmt(o.items.reduce((a, i) => a + i.quantity, 0))}টি · {money(o.total)}
                    </small>
                  </div>
                  <span className="status-pill">{o.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <>
              <p className="muted">লগইন করলে অনলাইন অর্ডার এখানে দেখা যাবে।</p>
              <div style={{ textAlign: 'center', paddingBottom: 20 }}>
                <Link className="text-link" to="/">
                  স্টোরে ঘুরে আসুন <ArrowRight size={15} />
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="admin-card store-snapshot">
          <div className="admin-card-heading">
            <h2>স্টোরের এক ঝলক</h2>
          </div>
          <div>
            <span>স্টোরের নাম</span>
            <strong>{settings.name}</strong>
          </div>
          <div>
            <span>ওজনভিত্তিক চার্জ</span>
            <strong>{settings.weightEnabled ? 'চালু' : 'বন্ধ'}</strong>
          </div>
          <div>
            <span>ঢাকায় ডেলিভারি</span>
            <strong>{money(settings.inside)} থেকে</strong>
          </div>
          <div>
            <span>ফ্রি ডেলিভারি</span>
            <strong>{settings.freeThreshold > 0 ? money(settings.freeThreshold) + '+' : 'নেই'}</strong>
          </div>
          <div>
            <span>কম স্টকের শেড</span>
            <strong>{fmt(lowStock)}টি</strong>
          </div>
          <Link className="button secondary full-width" to="/admin/appearance">
            স্টোর কাস্টমাইজ করুন <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <div className="admin-tip">
        <Info size={26} />
        <div>
          <h3>আপনার স্টোর, আপনার নিয়ন্ত্রণে</h3>
          <p>হোমপেজের লেখা, ছবি, ডেলিভারি চার্জ — সব আপনার নিয়ন্ত্রণে।</p>
        </div>
        <Link to="/admin/appearance">
          শুরু করুন <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}

function ProductEditor({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: Product;
  categories: Category[];
  onClose: () => void;
  onSave: (p: Product) => Promise<void>;
}) {
  const [form, setForm] = useState<Product>({ ...product, shades: product.shades.map((s) => ({ ...s })) });
  const [tab, setTab] = useState<'info' | 'shades'>('info');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const filtered = form.shades.filter(
    (s) =>
      !q.trim() ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.code.toLowerCase().includes(q.toLowerCase())
  );
  const stockSum = form.shades.reduce((a, s) => a + s.stock, 0);

  function set(field: keyof Product, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function applyPreset() {
    setForm((f) => ({
      ...f,
      shades: SHADE_PALETTE.map(([name, color], i) => ({
        id: `s-${i + 1}`,
        code: `Y-${String(i + 1).padStart(2, '0')}`,
        name,
        color,
        stock: 12 + (i * 7) % 28,
      })),
    }));
  }

  function importBulk() {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const added: Shade[] = [];
    for (const line of lines) {
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      if (parts.length < 2) continue;
      const [code, name, color = '#cccccc', stock = '10'] = parts;
      added.push({
        id: uid('sh'),
        code,
        name,
        color: form.variantLabel === 'সাইজ' ? undefined : color.startsWith('#') ? color : `#${color}`,
        stock: form.variantLabel === 'সাইজ' ? Number(parts[2] ?? 10) || 0 : Number(stock) || 0,
      });
    }
    if (added.length) setForm((f) => ({ ...f, shades: [...f.shades, ...added] }));
    setBulkOpen(false);
    setBulkText('');
  }

  async function save() {
    setBusy(true);
    try {
      await onSave({
        ...form,
        stock: form.shades.length ? 0 : form.stock,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={product.id ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য'} onClose={onClose} className="product-editor">
      <div className="editor-tabs">
        <button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>
          <Package size={16} /> পণ্যের তথ্য
        </button>
        <button className={tab === 'shades' ? 'active' : ''} onClick={() => setTab('shades')}>
          <Palette size={16} /> {form.variantLabel === 'সাইজ' ? 'সাইজ' : 'শেড'} ও স্টক <span>{fmt(form.shades.length)}</span>
        </button>
      </div>
      {tab === 'info' ? (
        <div className="editor-fields">
          <div className="form-grid">
            <Field label="পণ্যের নাম *">
              <input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="ইংরেজি সার্চ নাম">
              <input value={form.english} onChange={(e) => set('english', e.target.value)} />
            </Field>
            <Field label="ক্যাটাগরি *">
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ব্যাজ">
              <select value={form.badge} onChange={(e) => set('badge', e.target.value)}>
                <option value="">কোনো ব্যাজ নয়</option>
                {BADGES.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="মূল্য (৳) *">
              <input type="number" value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
            </Field>
            <Field label="আগের মূল্য (৳)" hint="আগের মূল্য বেশি হলে সাশ্রয় দেখাবে">
              <input type="number" value={form.oldPrice} onChange={(e) => set('oldPrice', Number(e.target.value))} />
            </Field>
            <Field label="প্রতি প্যাক ওজন (গ্রাম)" hint="ডেলিভারি হিসাবে যোগ হবে">
              <input type="number" value={form.weight} onChange={(e) => set('weight', Number(e.target.value))} />
            </Field>
            <Field label="ভ্যারিয়েন্টের ধরন">
              <select value={form.variantLabel || 'শেড'} onChange={(e) => set('variantLabel', e.target.value)}>
                <option value="শেড">শেড (রং)</option>
                <option value="সাইজ">সাইজ</option>
              </select>
            </Field>
            <Field label={form.shades.length ? `${form.variantLabel || 'শেড'} না থাকলে স্টক` : 'স্টক (টি)'}>
              <input type="number" value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} />
            </Field>
          </div>
          <Field label="পণ্যের বিবরণ">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} />
          </Field>
          <ImageField label="পণ্যের ছবি" value={form.image} onChange={(url) => set('image', url)} />
          <div className="form-grid">
            <ToggleField value={form.active} onChange={(v) => set('active', v)} label="পণ্যটি দেখান" />
            <ToggleField value={form.featured} onChange={(v) => set('featured', v)} label="ফিচার্ড হিসেবে দেখান" />
          </div>
        </div>
      ) : (
        <div className="shade-panel">
          <div className="notice">
            <Palette size={17} />
            <span>{form.variantLabel === 'সাইজ' ? 'প্রতিটি সাইজের নাম, কোড ও আলাদা স্টক দিন।' : 'একই সুতায় যত খুশি শেড যোগ করুন। প্রতিটি শেডের আলাদা স্টক।'}</span>
          </div>
          <div className="editor-actions">
            {form.variantLabel !== 'সাইজ' && <button type="button" className="button secondary" onClick={applyPreset}>
              <Palette size={15} /> 36 রঙের প্রিসেট
            </button>}
            <button type="button" className="button secondary" onClick={() => setBulkOpen(!bulkOpen)}>
              <Plus size={15} /> বাল্ক শেড যোগ
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  shades: [...f.shades, { id: uid('sh'), code: '', name: '', color: f.variantLabel === 'সাইজ' ? undefined : '#cccccc', stock: 0 }],
                }))
              }
            >
              <Plus size={15} /> নতুন {form.variantLabel === 'সাইজ' ? 'সাইজ' : 'শেড'}
            </button>
          </div>
          {bulkOpen && (
            <div className="bulk-shades">
              <h4>অনেক {form.variantLabel === 'সাইজ' ? 'সাইজ' : 'শেড'} একসাথে যোগ</h4>
              <p>প্রতি লাইনে: {form.variantLabel === 'সাইজ' ? 'কোড, সাইজের নাম, স্টক' : 'কোড, নাম, রঙ, স্টক'}</p>
              <code>{form.variantLabel === 'সাইজ' ? 'HOOK-25, 2.5mm, 20' : 'Y-101, সেজ গ্রিন, #8b9d7d, 20'}</code>
              <Field label="বাল্ক শেডের তথ্য">
                <textarea
                  rows={5}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="CSV / TXT পেস্ট করুন"
                />
              </Field>
              <button type="button" className="button primary" onClick={importBulk}>
                <Plus size={15} /> তালিকা থেকে যোগ করুন
              </button>
            </div>
          )}
          <div className="input-with-icon">
            <Search size={16} />
            <input aria-label="শেড খুঁজুন" placeholder="শেড খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {form.shades.length > 0 ? (
            <>
              <div className="shade-editor-header">
                <span>{form.variantLabel === 'সাইজ' ? 'রং' : 'সুতার ছবি'}</span>
                <span>{form.variantLabel === 'সাইজ' ? 'সাইজের নাম' : 'শেডের নাম'}</span>
                <span>কোড</span>
                <span>স্টক</span>
                <span />
              </div>
              <div className="shade-editor-list">
                {filtered.map((s) => (
                  <div className="shade-edit-row" key={s.id}>
                    {form.variantLabel === 'সাইজ' ? <span>—</span> : <input
                      type="color"
                      value={s.color || '#cccccc'}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shades: f.shades.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)),
                        }))
                      }
                      title="রঙের নাম"
                    />}
                    <input
                      value={s.name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shades: f.shades.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)),
                        }))
                      }
                      placeholder={form.variantLabel === 'সাইজ' ? 'যেমন 2.5mm' : 'শেডের নাম'}
                    />
                    <input
                      value={s.code}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shades: f.shades.map((x) => (x.id === s.id ? { ...x, code: e.target.value } : x)),
                        }))
                      }
                      placeholder="শেড কোড"
                    />
                    <input
                      type="number"
                      value={s.stock}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shades: f.shades.map((x) =>
                            x.id === s.id ? { ...x, stock: Number(e.target.value) } : x
                          ),
                        }))
                      }
                      placeholder="শেড স্টক"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, shades: f.shades.filter((x) => x.id !== s.id) }))}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="shade-editor-total">
                <span>মোট {fmt(form.shades.length)}টি শেড</span>
                <span>
                  মোট স্টক <strong>{fmt(stockSum)}টি</strong>
                </span>
              </div>
            </>
          ) : (
            <p className="muted">শেড নেই। প্রিসেট বা নতুন শেড দিয়ে শুরু করুন।</p>
          )}
        </div>
      )}
      <div className="editor-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          বাতিল
        </button>
        <button type="button" className="button primary" onClick={save} disabled={busy || !form.name}>
          <Save size={16} /> {busy ? 'সেভ হচ্ছে...' : 'পণ্য সেভ করুন'}
        </button>
      </div>
    </Modal>
  );
}

function ProductsAdmin() {
  const { products, categories, saveProduct, deleteProduct } = useStore();
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const list = products.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (!q.trim() ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.english.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <Heading kicker="ক্যাটালগ" title="পণ্য ব্যবস্থাপনা">
        <button
          className="button primary"
          onClick={() =>
            setEditing({
              id: uid('p'),
              name: '',
              english: '',
              description: '',
              category: categories[0]?.id || 'cotton',
              price: 0,
              oldPrice: 0,
              weight: 100,
              stock: 0,
              image: '/images/cotton.webp',
              badge: '',
              featured: false,
              active: true,
              shades: [],
            })
          }
        >
          <Plus size={17} /> নতুন পণ্য
        </button>
      </Heading>
      <div className="admin-card">
        <div className="admin-table-toolbar">
          <div className="input-with-icon">
            <Search size={16} />
            <input
              aria-label="পণ্য খুঁজুন"
              placeholder="পণ্য খুঁজুন..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="ক্যাটাগরি ফিল্টার">
            <option value="">সব ক্যাটাগরি</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="muted">{fmt(list.length)}টি পণ্য</span>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>পণ্যের নাম</th>
                <th>মূল্য</th>
                <th>ওজন</th>
                <th>স্টক ও শেড</th>
                <th>অবস্থা</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <img src={p.image} alt="" />
                      <div>
                        <strong>{p.name}</strong>
                        <small className="table-subtext">
                          {categories.find((c) => c.id === p.category)?.name}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {money(p.price)}
                    {p.oldPrice > p.price && <small className="old-price">{money(p.oldPrice)}</small>}
                  </td>
                  <td>{weightLabel(p.weight)}</td>
                  <td>
                    {fmt(totalStock(p))}টি
                    <small className="table-subtext">
                      {p.shades.length ? `${fmt(p.shades.length)}টি শেড` : 'শেড নেই'}
                    </small>
                  </td>
                  <td>
                    <button
                      onClick={() => saveProduct({ ...p, active: !p.active })}
                      style={{ background: 'transparent', border: 0 }}
                    >
                      <StatusBadge active={p.active} />
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => setEditing(p)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-button" onClick={() => setDeleting(p)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && <p className="muted" style={{ padding: 20 }}>কোনো পণ্য নেই। নতুন পণ্য যোগ করুন।</p>}
      </div>
      {editing && (
        <ProductEditor
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={saveProduct}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="পণ্যটি মুছবেন?"
          description={`${deleting.name} স্থায়ীভাবে মুছে যাবে।`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteProduct(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function ShadesAdmin() {
  const { products, saveProduct } = useStore();
  const [params] = useSearchParams();
  const yarn = products.filter((p) => p.shades.length || true);
  const [selectedId, setSelectedId] = useState(params.get('product') || yarn[0]?.id || '');
  const selected = products.find((p) => p.id === selectedId);
  const [q, setQ] = useState('');
  const [productQ, setProductQ] = useState('');
  const [editing, setEditing] = useState<Shade | null>(null);
  const [tick, setTick] = useState(0);
  const productList = yarn.filter(
    (p) => !productQ.trim() || p.name.toLowerCase().includes(productQ.toLowerCase())
  );
  const shades =
    selected?.shades.filter(
      (s) =>
        !q.trim() ||
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.code.toLowerCase().includes(q.toLowerCase())
    ) || [];

  async function patchShade(updated: Shade) {
    if (!selected) return;
    const next = {
      ...selected,
      shades: selected.shades.map((s) => (s.id === updated.id ? updated : s)),
    };
    await saveProduct(next);
    setTick((t) => t + 1);
  }

  return (
    <>
      <Heading kicker="রঙ" title="শেড লাইব্রেরি" description="প্রতিটি শেডের ছবি, কোড ও স্টক মোবাইল থেকেই।">
        <Link className="button primary" to="/admin/products">
          <Plus size={17} /> শেড যোগ / এডিট
        </Link>
      </Heading>
      <div className="upload-note">
        <Upload size={22} />
        <div>
          <strong>মোবাইল থেকেই শেডের ছবি তুলুন</strong>
          <p>প্রতিটি শেডের নিচে ক্যামেরা বা গ্যালারি দিয়ে ছবি আপলোড করুন।</p>
        </div>
      </div>
      <div className="admin-shade-layout">
        <div className="admin-card shade-product-selector">
          <h3>সুতার কালেকশন</h3>
          <div className="input-with-icon shade-product-search">
            <Search size={15} />
            <input
              aria-label="সুতা খুঁজুন"
              placeholder="সুতা খুঁজুন"
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
            />
          </div>
          {productList.map((p) => (
            <button
              key={p.id}
              className={p.id === selectedId ? 'active' : ''}
              onClick={() => setSelectedId(p.id)}
            >
              <img src={p.image} alt="" />
              <div>
                <strong>{p.name}</strong>
                <small>
                  {fmt(p.shades.length)}টি শেড · {fmt(totalStock(p))} স্টক
                </small>
              </div>
            </button>
          ))}
          <Link className="text-link" to="/admin/products">
            <Plus size={15} /> নতুন সুতা যোগ করুন
          </Link>
        </div>
        <div className="admin-card admin-shade-catalog">
          {selected ? (
            <>
              <div className="admin-card-heading">
                <div>
                  <h2>{selected.name}</h2>
                  <small>
                    {fmt(selected.shades.length)}টি শেড · মোট স্টক {fmt(totalStock(selected))}
                  </small>
                </div>
                <button
                  className="button secondary"
                  onClick={() =>
                    setEditing({ id: uid('sh'), code: '', name: '', color: '#cccccc', stock: 0 })
                  }
                >
                  <Plus size={15} /> শেড সম্পাদনা
                </button>
              </div>
              <div style={{ margin: '12px 20px 0' }}>
                <div className="input-with-icon">
                  <Search size={16} />
                  <input
                    aria-label="শেড খুঁজুন"
                    placeholder="শেড খুঁজুন"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>
              <div className="admin-swatch-grid" key={tick}>
                {shades.map((s) => (
                  <div className="admin-shade-card" key={s.id}>
                    <button
                      className="admin-shade-preview"
                      aria-label={`${s.name} এডিট`}
                      style={{ background: s.color }}
                      onClick={() => setEditing(s)}
                    >
                      {s.image && <img src={s.image} alt="" loading="lazy" />}
                      <span className="preview-edit">
                        <Edit3 size={14} />
                      </span>
                    </button>
                    <div className="admin-shade-card-info">
                      <strong>{s.name}</strong>
                      <small>{s.code}</small>
                      <span>{fmt(s.stock)}টি স্টকে</span>
                    </div>
                    <div style={{ padding: '0 12px 12px' }}>
                      <ShadeImageCell
                        shade={s}
                        onSaved={async (u) => {
                          await patchShade(u);
                          setTick((t) => t + 1);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {shades.length === 0 && <p className="muted" style={{ padding: 20 }}>শেড নেই। পণ্য এডিটরে শেড যোগ করুন।</p>}
            </>
          ) : (
            <EmptyState title="সুতা বেছে নিন" text="বাম পাশ থেকে একটি সুতা বেছে শেড দেখুন।" />
          )}
        </div>
      </div>
      {editing && selected && (
        <Modal title="শেড তথ্য" onClose={() => setEditing(null)} className="info-modal">
          <form
            className="shade-info-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const exists = selected.shades.some((s) => s.id === editing.id);
              const nextShades = exists
                ? selected.shades.map((s) => (s.id === editing.id ? editing : s))
                : [...selected.shades, editing];
              await saveProduct({ ...selected, shades: nextShades });
              setEditing(null);
            }}
          >
            <Field label="রঙের নাম">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </Field>
            <div className="form-grid">
              <Field label="শেড কোড">
                <input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required />
              </Field>
              <Field label="শেড স্টক">
                <input
                  type="number"
                  value={editing.stock}
                  onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="রঙ">
              <input
                type="color"
                value={editing.color}
                onChange={(e) => setEditing({ ...editing, color: e.target.value })}
              />
            </Field>
            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setEditing(null)}>
                বাতিল
              </button>
              <button type="submit" className="button primary">
                <Save size={16} /> শেড সেভ করুন
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function CategoriesAdmin() {
  const { categories, products, saveCategory, deleteCategory } = useStore();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  return (
    <>
      <Heading kicker="সেকশন" title="ক্যাটাগরি সাজান">
        <button
          className="button primary"
          onClick={() => setEditing({ id: uid('cat'), name: '', image: '/images/cotton.webp' })}
        >
          <Plus size={17} /> নতুন ক্যাটাগরি
        </button>
      </Heading>
      <div className="admin-category-grid">
        {categories.map((c) => (
          <div className="admin-category-card" key={c.id}>
            <img src={c.image} alt="" />
            <h3>{c.name}</h3>
            <span>{fmt(products.filter((p) => p.category === c.id).length)}টি পণ্য</span>
            <div>
              <button className="button secondary" onClick={() => setEditing(c)}>
                <Edit3 size={14} /> এডিট
              </button>
              <button
                className="icon-button"
                onClick={() => {
                  if (products.some((p) => p.category === c.id)) {
                    alert('এই ক্যাটাগরিতে পণ্য আছে। আগে পণ্য সরান।');
                    return;
                  }
                  setDeleting(c);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal title="ক্যাটাগরি" onClose={() => setEditing(null)} className="info-modal">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await saveCategory(editing);
                setEditing(null);
              } catch (err) {
                alert(err instanceof Error ? err.message : 'সেভ ব্যর্থ');
              }
            }}
          >
            <Field label="ক্যাটাগরির নাম">
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </Field>
            <ImageField
              label="ক্যাটাগরির ছবি"
              value={editing.image}
              onChange={(url) => setEditing({ ...editing, image: url })}
            />
            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setEditing(null)}>
                বাতিল
              </button>
              <button type="submit" className="button primary">
                <Save size={16} /> ক্যাটাগরি সেভ করুন
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <ConfirmModal
          title="ক্যাটাগরি মুছবেন?"
          description={`${deleting.name} মুছে যাবে।`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteCategory(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function OrdersAdmin() {
  const { merchantOrders, updateOrder, refreshOrders, ordersLoading, settings } = useStore();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtered = merchantOrders.filter((o) => {
    const term = q.trim().toLowerCase();
    const matchQ =
      !term ||
      o.id.toLowerCase().includes(term) ||
      o.name.toLowerCase().includes(term) ||
      o.phone.includes(term);
    const matchS = !status || o.status === status;
    return matchQ && matchS;
  });
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    if (!selected) return;
    const live = merchantOrders.find((o) => o.id === selected.id);
    if (live) {
      setEditStatus(live.status);
      setEditNote(live.adminNote);
    }
  }, [selected?.id, merchantOrders]);

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await updateOrder(selected, editStatus, editNote);
      setSelected({ ...selected, status: editStatus, adminNote: editNote });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'সেভ ব্যর্থ');
    } finally {
      setSaving(false);
    }
  }

  function exportCsv(withItems: boolean) {
    const rows = [
      withItems
        ? ['id', 'date', 'name', 'phone', 'address', 'region', 'items', 'subtotal', 'delivery', 'total', 'weight', 'status', 'note', 'adminNote', 'source']
        : ['id', 'date', 'name', 'phone', 'total', 'status', 'region'],
    ];
    for (const o of filtered) {
      if (withItems) {
        rows.push([
          o.id,
          o.createdAt,
          o.name,
          o.phone,
          o.address,
          o.region,
          o.items.map((i) => `${i.name}${i.shade ? '(' + i.shade + ')' : ''} x${i.quantity}`).join('; '),
          String(o.subtotal),
          String(o.delivery),
          String(o.total),
          String(o.weight),
          o.status,
          o.note,
          o.adminNote,
          o.source,
        ]);
      } else {
        rows.push([o.id, o.createdAt, o.name, o.phone, String(o.total), o.status, o.region]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = withItems ? 'orders-full.csv' : 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Heading kicker="বিক্রি" title="অর্ডার ব্যবস্থাপনা">
        <div className="form-actions">
          <button className="button secondary" onClick={() => refreshOrders()}>
            <RefreshCw size={15} /> {ordersLoading ? 'অর্ডার পড়া হচ্ছে...' : 'রিফ্রেশ'}
          </button>
          <button className="button secondary" onClick={() => exportCsv(true)}>
            <Download size={15} /> পণ্যসহ CSV
          </button>
          <button className="button secondary" onClick={() => exportCsv(false)}>
            <Download size={15} /> অর্ডার এক্সপোর্ট
          </button>
        </div>
      </Heading>
      <div className="sync-note">
        <Check size={15} /> সকল ক্রেতার অনলাইন অর্ডার এখানে দেখা যায়
        {useStore().cloud.lastSynced && ` · সর্বশেষ সিঙ্ক ${useStore().cloud.lastSynced}`}
      </div>
      <div className="admin-card merchant-orders">
        <div className="admin-table-toolbar">
          <div className="input-with-icon">
            <Search size={16} />
            <input
              aria-label="অর্ডার খুঁজুন"
              placeholder="নাম, ফোন বা অর্ডার আইডি"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            aria-label="অর্ডারের অবস্থা"
          >
            <option value="">সব অবস্থা</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="muted">{fmt(filtered.length)}টি অর্ডার</span>
        </div>
        <div className="table-scroll desktop-orders">
          <table className="admin-table">
            <thead>
              <tr>
                <th>অর্ডার</th>
                <th>গ্রাহক</th>
                <th>অর্ডার করা পণ্য / শেড</th>
                <th>মোট</th>
                <th>ওজন</th>
                <th>অবস্থা</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {slice.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button className="text-link" onClick={() => setSelected(o)}>
                      {o.id}
                    </button>
                    <small className="table-subtext">{formatDate(o.createdAt)}</small>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <strong>{o.name}</strong>
                      <small className="table-subtext">{o.phone}</small>
                    </div>
                  </td>
                  <td>
                    <button className="text-link" onClick={() => setSelected(o)} aria-label="পণ্য দেখুন">
                      <span className="items-preview">
                        {o.items[0]?.image && <img src={o.items[0].image} alt="" />}
                        <span>
                          <span>
                            <strong>{o.items[0]?.name}</strong>
                            <small>{o.items[0]?.shade || ''}</small>
                          </span>
                          <small>{fmt(o.items.length)}টি লাইন</small>
                        </span>
                      </span>
                    </button>
                    <small className="table-subtext">ডেলিভারি {money(o.delivery)}</small>
                  </td>
                  <td>
                    <strong>{money(o.total)}</strong>
                  </td>
                  <td>
                    <small className="table-subtext">{weightLabel(o.weight)}</small>
                  </td>
                  <td>
                    <select
                      aria-label="অবস্থা"
                      value={o.status}
                      disabled={saving}
                      onChange={(e) => updateOrder(o, e.target.value, o.adminNote).catch((err) => setError(err.message))}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="button secondary" onClick={() => setSelected(o)}>
                      <Eye size={14} /> বিস্তারিত
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mobile-orders">
          {slice.map((o) => (
            <div className="mobile-order-card" key={o.id}>
              <div className="mobile-order-top">
                <span className="mobile-id">{o.id}</span>
                <span className="status-pill">{o.status}</span>
              </div>
              <div className="mobile-order-customer">
                <strong>{o.name}</strong>
                <small>{o.phone}</small>
                <small>{formatDate(o.createdAt)}</small>
              </div>
              <div className="mobile-order-items">
                {o.items.slice(0, 2).map((item, i) => (
                  <div key={i}>
                    {item.image && <img src={item.image} alt="" />}
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.shade || 'শেড নেই'} × {fmt(item.quantity)}
                      </small>
                    </div>
                  </div>
                ))}
                {o.items.length > 2 && <p>আরও {fmt(o.items.length - 2)}টি</p>}
              </div>
              <div className="mobile-order-bottom">
                <span>
                  <strong>{money(o.total)}</strong>
                  <small>
                    {weightLabel(o.weight)} · {money(o.delivery)}
                  </small>
                </span>
                <button className="button secondary" onClick={() => setSelected(o)}>
                  সম্পূর্ণ অর্ডার
                </button>
              </div>
            </div>
          ))}
        </div>
        {!filtered.length && <p className="muted" style={{ padding: 20 }}>এখনো কোনো অর্ডার আসেনি।</p>}
        {pages > 1 && (
          <div className="pagination">
            <span>
              মোট {fmt(filtered.length)}টি
            </span>
            <div>
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={17} />
              </button>
              <span>
                {fmt(page + 1)} / {fmt(pages)}
              </span>
              <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="admin-fineprint">অর্ডার বাতিল করলে স্টক স্বয়ংক্রিয়ভাবে ফেরত যোগ হয় না — প্রয়োজনে ম্যানুয়ালি আপডেট করুন।</p>
      {error && <p className="cloud-error">{error}</p>}
      {selected && (
        <Modal title="অর্ডার বিস্তারিত" onClose={() => setSelected(null)} className="order-modal">
          <div className="order-title">
            <div>
              <span>অর্ডার আইডি</span>
              <strong>{selected.id}</strong>
              <small>{formatDate(selected.createdAt)}</small>
            </div>
            <span className="status-pill">{selected.status}</span>
          </div>
          <div className="order-customer-grid">
            <section>
              <h3>
                <Phone size={14} /> ক্রেতার তথ্য
              </h3>
              <strong>{selected.name}</strong>
              <a href={`tel:${selected.phone}`}>
                <Phone size={14} /> {selected.phone}
              </a>
            </section>
            <section>
              <h3>
                <MapPin size={14} /> ডেলিভারির ঠিকানা
              </h3>
              <p>{selected.address}</p>
              <small>{selected.region === 'inside' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'}</small>
            </section>
          </div>
          <div className="order-lines-heading">
            <h3>অর্ডার করা সব পণ্য</h3>
            <span>{fmt(selected.items.length)}টি লাইন</span>
          </div>
          <div className="order-lines">
            {selected.items.map((item, i) => (
              <div className="order-line" key={i}>
                {item.image && <img src={item.image} alt="" />}
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.shade || 'এই পণ্যে শেড নেই'}</small>
                  <small>পরিমাণ: {fmt(item.quantity)}</small>
                  <small>প্রতি পিস {weightLabel(item.weight || 0)} · {money(item.price)}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="order-summary">
            <div>
              <span>পণ্যের মোট মূল্য</span>
              <strong>{money(selected.subtotal)}</strong>
            </div>
            <div>
              <span>ওজন ({weightLabel(selected.weight)})</span>
              <strong>{weightLabel(selected.weight)}</strong>
            </div>
            <div>
              <span>ডেলিভারি</span>
              <strong>{selected.delivery === 0 ? 'ফ্রি' : money(selected.delivery)}</strong>
            </div>
            <div className="summary-total">
              <span>মোট</span>
              <strong>{money(selected.total)}</strong>
            </div>
          </div>
          <div className="order-meta">
            <span>
              <Package size={14} /> পেমেন্ট: {selected.payment || 'ক্যাশ অন ডেলিভারি'}
            </span>
            <span>{selected.source === 'cloud' ? 'অনলাইন অর্ডার' : 'লোকাল'}</span>
          </div>
          <div className="notice">
            <Info size={17} />
            <span>
              <strong>ক্রেতার নির্দেশনা</strong>
              <br />
              {selected.note || 'কোনো বিশেষ নির্দেশনা নেই'}
            </span>
          </div>
          <div className="order-controls">
            <Field label="অর্ডারের অবস্থা">
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="মার্চেন্ট নোট">
              <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={3} />
            </Field>
            <button className="button primary" onClick={save} disabled={saving}>
              <Save size={15} /> {saving ? 'সেভ হচ্ছে...' : 'নোট ও অবস্থা সেভ'}
            </button>
            <p className="save-note">
              <Check size={13} /> সার্ভার নিশ্চিত করার পর গ্রাহকও আপডেট দেখবেন
            </p>
          </div>
          <button className="button secondary full-width" onClick={() => downloadReceipt(selected, settings.phone)}>
            <Download size={16} /> ছবি ও সব তথ্যসহ অর্ডার রসিদ
          </button>
        </Modal>
      )}
    </>
  );
}

function DeliveryAdmin() {
  const { settings, saveSettings } = useStore();
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [demoW, setDemoW] = useState(800);
  const [demoRegion, setDemoRegion] = useState<'inside' | 'outside'>('inside');
  const [demoSub, setDemoSub] = useState(500);
  useEffect(() => setForm(settings), [settings]);

  const charge = deliveryCharge(form, demoW, demoRegion, demoSub);
  const steps = form.weightEnabled
    ? Math.ceil(Math.max(0, demoW - form.baseWeight) / Math.max(1, form.weightStep))
    : 0;

  async function save() {
    setBusy(true);
    try {
      await saveSettings(form);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading kicker="শিপিং" title="ডেলিভারি ও ওজন">
        <button className="button primary" onClick={save} disabled={busy}>
          <Save size={17} /> {busy ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
        </button>
      </Heading>
      <div className="settings-columns">
        <div className="settings-stack">
          <section className="admin-card settings-card">
            <div className="admin-card-heading">
              <h2>
                <Truck size={19} /> এলাকাভিত্তিক বেস চার্জ
              </h2>
            </div>
            <p className="muted">নির্ধারিত বেস ওজন পর্যন্ত এই চার্জ প্রযোজ্য।</p>
            <div className="form-grid" style={{ marginTop: 14 }}>
              <Field label="ঢাকার ভিতরে (৳)">
                <input
                  type="number"
                  value={form.inside}
                  onChange={(e) => setForm({ ...form, inside: Number(e.target.value) })}
                />
              </Field>
              <Field label="ঢাকার বাইরে (৳)">
                <input
                  type="number"
                  value={form.outside}
                  onChange={(e) => setForm({ ...form, outside: Number(e.target.value) })}
                />
              </Field>
            </div>
          </section>
          <section className="admin-card settings-card">
            <div className="admin-card-heading">
              <h2>
                <Package size={19} /> ওজনভিত্তিক অতিরিক্ত চার্জ
              </h2>
            </div>
            <p className="muted">ওজনের প্রতি ধাপে অতিরিক্ত চার্জ যোগ হবে।</p>
            <div style={{ marginTop: 12 }}>
              <ToggleField
                value={form.weightEnabled}
                onChange={(v) => setForm({ ...form, weightEnabled: v })}
                label="ওজনভিত্তিক চার্জ বাড়বে"
              />
            </div>
            <div className="form-grid">
              <Field label="বেস ওজন (গ্রাম)" hint="এই ওজন পর্যন্ত শুধু বেস চার্জ">
                <input
                  type="number"
                  value={form.baseWeight}
                  onChange={(e) => setForm({ ...form, baseWeight: Number(e.target.value) })}
                />
              </Field>
              <Field label="ওজনের ধাপ (গ্রাম)" hint="প্রতি ধাপে কত গ্রাম ধরা হবে">
                <input
                  type="number"
                  value={form.weightStep}
                  onChange={(e) => setForm({ ...form, weightStep: Number(e.target.value) })}
                />
              </Field>
              <Field label="প্রতি ধাপে চার্জ (৳)">
                <input
                  type="number"
                  value={form.extraCharge}
                  onChange={(e) => setForm({ ...form, extraCharge: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="notice">
              <Info size={17} />
              <span>
                উদাহরণ: {weightLabel(form.baseWeight)} পর্যন্ত বেস চার্জ, তারপর প্রতি {weightLabel(form.weightStep)}-এ{' '}
                {money(form.extraCharge)}
              </span>
            </div>
          </section>
          <section className="admin-card settings-card">
            <div className="admin-card-heading">
              <h2>
                <Check size={19} /> ফ্রি ডেলিভারি
              </h2>
            </div>
            <Field label="ফ্রি ডেলিভারি থ্রেশহোল্ড (৳)" hint="0 হলে ফ্রি নেই; পৌঁছালে সব চার্জও মওকুফ।">
              <input
                type="number"
                value={form.freeThreshold}
                onChange={(e) => setForm({ ...form, freeThreshold: Number(e.target.value) })}
              />
            </Field>
          </section>
        </div>
        <div className="admin-card delivery-preview">
          <span className="section-kicker">লাইভ ক্যালকুলেটর</span>
          <h2>হিসাবটা দেখে নিন</h2>
          <p className="muted">সেভ করার আগেই আপনার নিয়ম যাচাই করুন।</p>
          <Field label="পার্সেল ওজন (গ্রাম)">
            <input type="number" value={demoW} onChange={(e) => setDemoW(Number(e.target.value))} />
          </Field>
          <Field label="ডেলিভারি এলাকা">
            <select value={demoRegion} onChange={(e) => setDemoRegion(e.target.value as 'inside' | 'outside')}>
              <option value="inside">ঢাকার ভিতরে</option>
              <option value="outside">ঢাকার বাইরে</option>
            </select>
          </Field>
          <Field label="অর্ডার মূল্য (৳)">
            <input type="number" value={demoSub} onChange={(e) => setDemoSub(Number(e.target.value))} />
          </Field>
          <div className="calc-breakdown">
            <div>
              <span>বেস চার্জ</span>
              <strong>{money(form[demoRegion])}</strong>
            </div>
            <div>
              <span>ওজনের ধাপ</span>
              <strong>{fmt(steps)}টি</strong>
            </div>
            {form.freeThreshold > 0 && demoSub >= form.freeThreshold && (
              <div>
                <span>ফ্রি ডেলিভারি</span>
                <strong>প্রযোজ্য</strong>
              </div>
            )}
          </div>
          <div className="calc-result">
            <span>ডেলিভারি চার্জ</span>
            <strong>{charge === 0 ? 'ফ্রি' : money(charge)}</strong>
          </div>
          <div className="calc-illustration">
            <Truck size={32} strokeWidth={1.3} />
            <span>যত্নে পৌঁছাবে, ঠিক সময়ে</span>
          </div>
        </div>
      </div>
    </>
  );
}

function AppearanceAdmin({ kind }: { kind: 'appearance' | 'content' }) {
  const { settings, saveSettings } = useStore();
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  useEffect(() => setForm(settings), [settings]);

  async function save() {
    setBusy(true);
    try {
      await saveSettings(form);
    } finally {
      setBusy(false);
    }
  }

  function set<K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <>
      <Heading
        kicker={kind === 'appearance' ? 'ডিজাইন' : 'কনটেন্ট'}
        title={kind === 'appearance' ? 'স্টোর ও ডিজাইন' : 'কনটেন্ট ও যোগাযোগ'}
      >
        <button className="button primary" onClick={save} disabled={busy}>
          <Save size={17} /> {busy ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
        </button>
      </Heading>
      <div className="settings-wide">
        {kind === 'appearance' ? (
          <>
            <section className="admin-card settings-card">
              <div className="admin-card-heading">
                <h2>স্টোরের পরিচয়</h2>
              </div>
              <div className="form-grid">
                <Field label="স্টোরের নাম *">
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} />
                </Field>
                <Field label="ট্যাগলাইন">
                  <input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
                </Field>
              </div>
              <div className="color-field">
                <Field label="ব্র্যান্ডের রঙ">
                  <input type="color" value={form.accent} onChange={(e) => set('accent', e.target.value)} />
                </Field>
                <span>{form.accent}</span>
                <div className="color-options">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      style={{ background: c }}
                      className={form.accent === c ? 'selected' : ''}
                      onClick={() => set('accent', c)}
                    >
                      {form.accent === c && <Check size={17} />}
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <section className="admin-card settings-card">
              <div className="admin-card-heading">
                <h2>হোমপেজের হিরো</h2>
              </div>
              <Field label="ছোট লেখা">
                <input value={form.heroEyebrow} onChange={(e) => set('heroEyebrow', e.target.value)} />
              </Field>
              <div className="form-grid">
                <Field label="মূল শিরোনাম">
                  <input value={form.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
                </Field>
                <Field label="রঙিন শিরোনাম">
                  <input value={form.heroAccent} onChange={(e) => set('heroAccent', e.target.value)} />
                </Field>
              </div>
              <Field label="বিবরণ">
                <textarea value={form.heroDescription} onChange={(e) => set('heroDescription', e.target.value)} rows={3} />
              </Field>
              <ImageField label="হিরো ছবি" value={form.heroImage} onChange={(url) => set('heroImage', url)} />
              <Field label="হিরোর বাটনের লেখা">
                <input value={form.heroButtonText} onChange={(e) => set('heroButtonText', e.target.value)} />
              </Field>
            </section>
            <section className="admin-card settings-card">
              <div className="admin-card-heading">
                <h2>
                  <Palette size={18} /> কালেকশনের ডিসপ্লে
                </h2>
              </div>
              <p className="muted">সেকশনের শিরোনাম, সংখ্যা ও ছবি নিয়ন্ত্রণ করুন।</p>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <Field label="ক্যাটাগরির শিরোনাম">
                  <input value={form.categoriesTitle} onChange={(e) => set('categoriesTitle', e.target.value)} />
                </Field>
                <Field label="ফিচার্ড পণ্যের শিরোনাম">
                  <input value={form.featuredTitle} onChange={(e) => set('featuredTitle', e.target.value)} />
                </Field>
              </div>
              <Field label="হোমে কতটি ফিচার্ড পণ্য থাকবে">
                <input
                  type="number"
                  value={form.featuredCount}
                  onChange={(e) => set('featuredCount', Number(e.target.value))}
                />
              </Field>
              <Field label="শেড ব্যানার শিরোনাম">
                <textarea value={form.shadeTitle} onChange={(e) => set('shadeTitle', e.target.value)} rows={2} />
              </Field>
              <Field label="শেড ব্যানারের বিবরণ">
                <textarea
                  value={form.shadeDescription}
                  onChange={(e) => set('shadeDescription', e.target.value)}
                  rows={2}
                />
              </Field>
              <ImageField label="শেড কালেকশন ছবি" value={form.shadeImage} onChange={(url) => set('shadeImage', url)} />
              <Field label="গল্প সেকশনের শিরোনাম">
                <input value={form.storyTitle} onChange={(e) => set('storyTitle', e.target.value)} />
              </Field>
            </section>
            <section className="admin-card settings-card">
              <div className="admin-card-heading">
                <h2>ঘোষণা ও হোমপেজ সেকশন</h2>
              </div>
              <ToggleField
                value={form.announcementEnabled}
                onChange={(v) => set('announcementEnabled', v)}
                label="ঘোষণা বার দেখান"
              />
              <Field label="ঘোষণার লেখা" hint="উপরে স্ক্রল বারে দেখাবে">
                <input value={form.announcement} onChange={(e) => set('announcement', e.target.value)} />
              </Field>
              <ToggleField value={form.showCategories} onChange={(v) => set('showCategories', v)} label="ক্যাটাগরি দেখান" />
              <ToggleField value={form.showShades} onChange={(v) => set('showShades', v)} label="শেড ব্যানার দেখান" />
              <ToggleField value={form.showStory} onChange={(v) => set('showStory', v)} label="গল্প দেখান" />
              <ToggleField value={form.showDelivery} onChange={(v) => set('showDelivery', v)} label="ডেলিভারি ব্যানার দেখান" />
            </section>
          </>
        ) : (
          <>
            <section className="admin-card settings-card">
              <div className="admin-card-heading">
                <h2>আমাদের গল্প</h2>
              </div>
              <Field label="গল্পের বিবরণ" hint="হোম ও অ্যাবাউট পেজে দেখা যাবে">
                <textarea value={form.about} onChange={(e) => set('about', e.target.value)} rows={5} />
              </Field>
            </section>
            <section className="admin-card settings-card">
              <div className="admin-card-heading">
                <h2>যোগাযোগের তথ্য</h2>
              </div>
              <div className="form-grid">
                <Field label="ফোন নম্বর">
                  <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01818898944" />
                </Field>
                <Field label="ইমেইল" hint="গ্রাহকের ইমেইল">
                  <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="hello@..." />
                </Field>
              </div>
              <Field label="ঠিকানা">
                <input value={form.address} onChange={(e) => set('address', e.target.value)} />
              </Field>
              <div className="form-grid">
                <Field label="Facebook লিংক">
                  <input value={form.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} placeholder="https://facebook.com/..." />
                </Field>
                <Field label="Instagram লিংক">
                  <input value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." />
                </Field>
                <Field label="WhatsApp নম্বর">
                  <input value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} placeholder="01XXXXXXXXX" />
                </Field>
                <Field label="বিকাশ নম্বর">
                  <input value={form.bkashNumber} onChange={(e) => set('bkashNumber', e.target.value)} placeholder="01XXXXXXXXX" />
                </Field>
                <Field label="নগদ নম্বর">
                  <input value={form.nagadNumber} onChange={(e) => set('nagadNumber', e.target.value)} placeholder="01XXXXXXXXX" />
                </Field>
              </div>
            </section>
            <section className="admin-card settings-card">
              <div className="admin-card-heading">
                <h2>সাধারণ জিজ্ঞাসা</h2>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setForm({ ...form, faqs: [...form.faqs, { question: '', answer: '' }] })}
                >
                  <Plus size={15} /> নতুন প্রশ্ন
                </button>
              </div>
              {form.faqs.map((f, i) => (
                <div className="faq-editor" key={i}>
                  <div>
                    <span>প্রশ্ন {fmt(i + 1)}</span>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setForm({ ...form, faqs: form.faqs.filter((_, j) => j !== i) })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <input
                    aria-label="প্রশ্ন"
                    value={f.question}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        faqs: form.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)),
                      })
                    }
                    placeholder="প্রশ্ন লিখুন"
                  />
                  <textarea
                    aria-label="উত্তর"
                    value={f.answer}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        faqs: form.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)),
                      })
                    }
                    rows={3}
                    style={{ marginTop: 8 }}
                    placeholder="উত্তর লিখুন"
                  />
                </div>
              ))}
            </section>
          </>
        )}
        <div className="bottom-save">
          <span>
            <Info size={14} /> সেভ করার পরই পরিবর্তন স্টোরে দেখা যাবে
          </span>
          <button className="button primary" onClick={save} disabled={busy}>
            <Save size={16} /> {busy ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
          </button>
        </div>
      </div>
    </>
  );
}

function DataAdmin() {
  const { products, categories, settings, merchantOrders, saveProduct, saveCategory, saveSettings } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const shadeCount = products.reduce((a, p) => a + p.shades.length, 0);
  const [pending, setPending] = useState<{
    products: Product[];
    categories: Category[];
    settings: StoreSettings;
  } | null>(null);

  function downloadBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      products,
      categories,
      settings,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `kushi-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFile(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.products) || !Array.isArray(data.categories) || !data.settings) {
          alert('অবৈধ ব্যাকআপ ফাইল');
          return;
        }
        setPending({ products: data.products, categories: data.categories, settings: data.settings });
        setConfirm(true);
      } catch {
        alert('ফাইল পড়া যায়নি');
      }
    };
    reader.readAsText(file);
  }

  async function restore() {
    if (!pending) return;
    setBusy(true);
    try {
      for (const c of pending.categories) await saveCategory(c);
      for (const p of pending.products) await saveProduct(p);
      await saveSettings(pending.settings);
      setConfirm(false);
      setPending(null);
      alert('ব্যাকআপ পুনরুদ্ধার হয়েছে');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'পুনরুদ্ধার ব্যর্থ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading kicker="ডেটা" title="ডেটা ও ব্যাকআপ" />
      <div className="data-cards">
        <div className="admin-card">
          <div className="data-icon">
            <Download size={27} />
          </div>
          <h2>সম্পূর্ণ স্টোরের ব্যাকআপ</h2>
          <p className="muted">পণ্য, শেড, ক্যাটাগরি ও সেটিংস JSON হিসেবে ডাউনলোড করুন।</p>
          <div className="backup-counts">
            <span>{fmt(products.length)}টি পণ্য</span>
            <span>{fmt(shadeCount)}টি শেড</span>
            <span>{fmt(categories.length)}টি ক্যাটাগরি</span>
            <span>{fmt(merchantOrders.length)}টি অর্ডার (রেফারেন্স)</span>
          </div>
          <button className="button primary" onClick={downloadBackup}>
            <Download size={16} /> ব্যাকআপ ডাউনলোড
          </button>
        </div>
        <div className="admin-card">
          <div className="data-icon sage">
            <Upload size={27} />
          </div>
          <h2>ব্যাকআপ ফিরিয়ে আনুন</h2>
          <p className="muted">আগে ডাউনলোড করা JSON ফাইল দিয়ে ক্যাটালগ পুনরুদ্ধার করুন।</p>
          <div className="notice">
            <Info size={17} />
            <span>বর্তমান পণ্য, অর্ডার স্ট্যাটাস ও সেটিংস ওভাররাইট হতে পারে।</span>
          </div>
          <button className="button secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> ব্যাকআপ ফাইল বাছুন
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <p className="cloud-error" style={{ marginTop: 14 }}>
            অনলাইন স্টোরে পুনরুদ্ধার করতে মার্চেন্ট লগইন প্রয়োজন।
          </p>
        </div>
      </div>
      <div className="admin-card data-explanation">
        <h3>আপনার ডেটা সম্পর্কে</h3>
        <p>অনলাইনে পণ্য, অর্ডার ও সেটিংস সংরক্ষিত থাকে। ব্যাগ ও পছন্দের তালিকা ব্রাউজারে থাকে।</p>
        <p>ব্যাকআপে গ্রাহকের অর্ডারের ব্যক্তিগত তথ্য অন্তর্ভুক্ত হয় না — শুধু ক্যাটালগ ও সেটিংস।</p>
      </div>
      {confirm && (
        <Modal title="ব্যাকআপ পুনরুদ্ধার" onClose={() => setConfirm(false)} className="confirm-modal">
          <div className="confirm-icon">
            <Download size={30} strokeWidth={1.4} />
          </div>
          <p>বর্তমান ক্যাটালগ ও সেটিংস ব্যাকআপ দিয়ে প্রতিস্থাপিত হবে। চালিয়ে যাবেন?</p>
          <div className="confirm-buttons">
            <button className="button secondary" type="button" onClick={() => setConfirm(false)}>
              বাতিল
            </button>
            <button className="button primary" type="button" onClick={restore} disabled={busy}>
              {busy ? 'সেভ হচ্ছে...' : 'পুনরুদ্ধার করুন'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function StorageAdmin() {
  const { products, categories, merchantOrders, cloud } = useStore();
  const shadeCount = products.reduce((a, p) => a + p.shades.length, 0);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Heading
        kicker="ক্লাউড"
        title="অনলাইন স্টোরেজ"
        description="সব ডিভাইস একই ডাটাবেসে সংযুক্ত।"
      />
      <div className="setup-grid">
        <div className="settings-stack">
          <section className="admin-card settings-card">
            <div className="admin-card-heading">
              <h2>
                <Cloud size={19} /> সংযোগের অবস্থা
              </h2>
            </div>
            <div className="connection-details">
              <Shield size={30} />
              <strong>অনলাইন স্টোরেজ সক্রিয়</strong>
              <p>সব ডিভাইস এই একই প্রজেক্ট ডাটাবেস ব্যবহার করছে।</p>
              <div className="backup-counts">
                <span>{fmt(products.length)}টি পণ্য</span>
                <span>{fmt(categories.length)}টি ক্যাটাগরি</span>
                <span>{fmt(shadeCount)}টি শেড</span>
                <span>{fmt(merchantOrders.length)}টি অর্ডার</span>
              </div>
              {cloud.lastSynced && <p>সর্বশেষ সিঙ্ক: {cloud.lastSynced}</p>}
              <div className="form-actions">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await cloud.refresh();
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <RefreshCw size={15} /> {busy ? 'পরীক্ষা হচ্ছে...' : 'সংযোগ পরীক্ষা'}
                </button>
                <Link className="button secondary" to="/admin/orders">
                  অর্ডার দেখুন <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </section>
        </div>
        <div className="settings-stack">
          <section className="admin-card cloud-login-card">
            {cloud.isMerchant ? (
              <>
                <div className="admin-card-heading">
                  <h2>
                    <Shield size={19} /> অনুমোদিত মার্চেন্ট
                  </h2>
                </div>
                <p className="muted">{cloud.user?.email}</p>
                <div className="notice">
                  <Check size={17} />
                  <span>ক্যাটালগ প্রকাশিত ও অর্ডার সিঙ্ক চালু আছে।</span>
                </div>
                <button className="button secondary" onClick={() => cloud.signOut()}>
                  <LogOut size={16} /> মার্চেন্ট লগআউট
                </button>
              </>
            ) : (
              <MerchantLogin />
            )}
          </section>
          <section className="admin-card cloud-security-note">
            <Shield size={21} />
            <div>
              <h3>নিরাপদ মার্চেন্ট অ্যাক্সেস</h3>
              <p>মার্চেন্ট ইমেইল-পাসওয়ার্ড দিয়ে শুধু অনুমোদিত অ্যাকাউন্ট লগইন করতে পারে।</p>
              <p>
                <Phone size={13} /> সমস্যা হলে মার্চেন্টের সাপোর্টে যোগাযোগ করুন।
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default function Admin() {
  const { section } = useParams();
  const n = section || 'overview';
  const { settings, cloud } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = NAV.find(([id]) => id === n)?.[1] || 'ড্যাশবোর্ড';
  const needsAuth = true;

  if (!cloud.isMerchant) {
    return (
      <div className="cloud-gate">
        <Link to="/" className="brand">
          <BrandMark size={43} />
          <span>
            <strong>{settings.name}</strong>
            <small>আপনার সৃজনশীল স্টোর</small>
          </span>
        </Link>
        <div className="admin-card cloud-login-card">
          <MerchantLogin />
          <Link className="text-link" to="/">
            স্টোরে ফিরে যান <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand">
          <BrandMark size={43} />
          <span>
            <strong>{settings.name}</strong>
            <small>আপনার সৃজনশীল স্টোর</small>
          </span>
        </Link>
        <span className="admin-workspace-label">স্টোর ম্যানেজমেন্ট</span>
        <nav>
          {NAV.map(([id, label, Icon]) => (
            <NavLink
              key={id}
              to={id === 'overview' ? '/admin' : `/admin/${id}`}
              end={id === 'overview'}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={18} />
              {label}
              {id === 'shades' && <span className="admin-nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div>
            <span className="admin-avatar">স</span>
            <span>
              <strong>স্টোর অ্যাডমিন</strong>
              <small>{cloud.isMerchant ? 'অনুমোদিত' : 'গেস্ট'}</small>
            </span>
          </div>
          <Link to="/">
            <Home size={16} /> স্টোরে ফিরে যান
          </Link>
          {cloud.isMerchant && (
            <button type="button" onClick={() => cloud.signOut()}>
              <LogOut size={16} /> মার্চেন্ট লগআউট
            </button>
          )}
        </div>
      </aside>
      {menuOpen && (
        <button className="admin-sidebar-overlay" aria-label="মেনু বন্ধ" onClick={() => setMenuOpen(false)} />
      )}
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <button
              className="icon-button admin-mobile-menu"
              aria-label="অ্যাডমিন মেনু"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={20} />
            </button>
            <span>স্টোর ম্যানেজমেন্ট</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <Link to="/" target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> স্টোর দেখুন <ArrowRight size={13} />
          </Link>
        </header>
        <div className="admin-content">
          {cloud.error && <p className="cloud-error">{cloud.error}</p>}
          {needsAuth && !cloud.isMerchant ? (
            <div style={{ maxWidth: 440, margin: '40px auto', background: 'transparent' }}>
              <div className="admin-card cloud-login-card">
                <MerchantLogin />
                <Link className="text-link" to="/">
                  স্টোরে ফিরে যান <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : n === 'overview' ? (
            <Overview />
          ) : n === 'products' ? (
            <ProductsAdmin />
          ) : n === 'shades' ? (
            <ShadesAdmin />
          ) : n === 'categories' ? (
            <CategoriesAdmin />
          ) : n === 'orders' ? (
            <OrdersAdmin />
          ) : n === 'delivery' ? (
            <DeliveryAdmin />
          ) : n === 'appearance' || n === 'content' ? (
            <AppearanceAdmin kind={n} />
          ) : n === 'staff' ? (
            <StaffAccessAdmin />
          ) : n === 'coupons' ? (
            <CouponsAdmin />
          ) : n === 'data' ? (
            <DataAdmin />
          ) : n === 'storage' ? (
            <StorageAdmin />
          ) : (
            <Overview />
          )}
        </div>
        <div className="admin-footer">
          <span>কুশি শিল্প মার্চেন্ট প্যানেল</span>
          <span>পরিবর্তনের পর সেভ করতে ভুলবেন না</span>
        </div>
      </div>
    </div>
  );
}
