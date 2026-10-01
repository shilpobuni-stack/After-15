import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Heart,
  Info,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import {
  PAYMENT_OPTIONS,
  STORE_PHONE,
  downloadReceipt,
  fmt,
  formatDate,
  money,
  whatsappLink,
  type Order,
  type PaymentMethod,
  type Product,
} from '../lib/types';
import { EmptyState, Modal, ProductCard, Quantity } from './UI';

function ProductDetail({ product, initialShade }: { product: Product; initialShade?: string }) {
  const { setSelectedProduct, setPanel, addToCart } = useStore();
  const defaultShade =
    product.shades.find((s) => s.stock > 0)?.id || product.shades[0]?.id || '';
  const [shadeId, setShadeId] = useState(initialShade || defaultShade);
  const [qty, setQty] = useState(1);
  const [filter, setFilter] = useState('');
  const shade = product.shades.find((s) => s.id === shadeId);
  const stock = product.shades.length ? shade?.stock ?? 0 : product.stock;
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q
      ? product.shades.filter(
          (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
        )
      : product.shades;
  }, [product.shades, filter]);

  return (
    <Modal title={product.name} onClose={() => setSelectedProduct(null)} className="product-modal">
      <div className="product-detail-layout">
        <div className="detail-photo">
          <img
            src={shade?.image || product.image}
            alt={
              shade?.image
                ? `${product.name} · ${shade.name} · ${shade.code}`
                : product.name
            }
          />
          <span>
            <Heart size={14} />{' '}
            {shade?.image
              ? `${shade.name} · ${shade.code} — এই ${product.variantLabel === 'সাইজ' ? 'সাইজের' : 'শেডের সুতার'} ছবি`
              : 'যত্নে বাছাই, ভালোবাসায় বোনা'}
          </span>
        </div>
        <div className="detail-info">
          <span className="section-kicker">{product.english}</span>
          <h2>{product.name}</h2>
          <div className="detail-price">
            <strong>{money(product.price)}</strong>
            {product.oldPrice > product.price && <del>{money(product.oldPrice)}</del>}
            {product.oldPrice > product.price && (
              <span>{fmt(Math.round((1 - product.price / product.oldPrice) * 100))}% সাশ্রয়</span>
            )}
          </div>
          <p className="detail-description">{product.description}</p>
          <div className="detail-weight">
            <span className={stock > 0 ? 'in-stock' : 'out-of-stock'}>
              {stock > 0 ? `${fmt(stock)}টি স্টকে আছে` : 'স্টকে নেই'}
            </span>
          </div>

          {product.shades.length > 0 && (
            <div className="detail-shades">
              <div className="shade-selection-label">
                <strong>
                  {product.variantLabel === 'সাইজ' ? 'সাইজ নির্বাচন করুন' : 'আপনার শেড বাছুন'} <span>({fmt(product.shades.length)}টি)</span>
                </strong>
                {shade && (
                  <span>
                    নির্বাচিত: {shade.name} · {shade.code}
                  </span>
                )}
              </div>
              {product.shades.length > 8 && (
                <div className="input-with-icon">
                  <Search size={15} />
                  <input
                    aria-label="শেড খুঁজুন"
                    placeholder={product.variantLabel === 'সাইজ' ? 'সাইজ বা কোড খুঁজুন...' : 'রঙ বা কোড খুঁজুন...'}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              )}
              <div className="shade-swatch-grid" style={product.variantLabel === 'সাইজ' ? { display: 'flex', flexWrap: 'wrap' } : undefined}>
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    className={product.variantLabel === 'সাইজ' ? '' : `shade-swatch ${s.id === shadeId ? 'selected' : ''} ${s.stock === 0 ? 'out' : ''} ${s.image ? 'has-photo' : ''}`}
                    style={product.variantLabel === 'সাইজ' ? { padding: '9px 17px', borderRadius: 999, border: `2px solid ${s.id === shadeId ? 'var(--accent)' : '#fecdd3'}`, background: s.id === shadeId ? '#fff1f2' : '#fff', opacity: s.stock === 0 ? 0.5 : 1, fontWeight: 600, cursor: 'pointer' } : { background: s.color }}
                    onClick={() => setShadeId(s.id)}
                    title={`${s.name} · ${s.code} · ${s.stock}টি`}
                    aria-label={`${s.name} ${s.code}`}
                  >
                    {product.variantLabel === 'সাইজ' ? s.name : <>{s.image && <img src={s.image} alt="" loading="lazy" />}<span className="swatch-code">{s.code}</span></>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="detail-actions">
            <Quantity value={qty} max={Math.max(1, stock)} onChange={setQty} />
            <button
              className="button primary"
              disabled={stock === 0 || (product.shades.length > 0 && !shade)}
              onClick={() => {
                if (addToCart(product, product.shades.length ? shadeId : '', qty)) {
                  setQty(1);
                }
              }}
            >
              ব্যাগে যোগ করুন <Package size={17} />
            </button>
          </div>
          <div className="product-contact-row">
            <button
              type="button"
              className="button secondary full-width"
              onClick={() => {
                setSelectedProduct(null);
                setPanel('cart');
              }}
            >
              চেকআউটে যান <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CartDrawer() {
  const { cart, setCart, products, settings, setPanel, placeOrder, notify } = useStore();
  const [step, setStep] = useState<'cart' | 'checkout' | 'done'>('cart');
  const [region, setRegion] = useState<'inside' | 'outside'>('inside');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [trxId, setTrxId] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [doneOrder, setDoneOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef({ signature: '', id: '' });
  const needsTrx = payment === 'bkash' || payment === 'nagad' || payment === 'rocket';

  function isValidTrxId(value: string) {
    // bKash / Nagad / Rocket: 8–15 alphanumeric, no spaces/special chars
    return /^[A-Z0-9]{8,15}$/.test(value);
  }

  const lines = cart.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return [];
    const shade = product.shades.find((s) => s.id === item.shadeId);
    return [
      {
        ...item,
        product,
        shade,
        stock: product.shades.length ? shade?.stock ?? 0 : product.stock,
      },
    ];
  });
  const subtotal = lines.reduce((a, l) => a + l.product.price * l.quantity, 0);
  const delivery = lines.length ? (region === 'inside' ? 80 : 150) : 0;
  const discount = coupon ? Math.round(subtotal * coupon.percent / 100) : 0;
  const stockIssue = lines.some((l) => !l.product.active || l.quantity > l.stock);
  const bagCount = cart.reduce((a, c) => a + c.quantity, 0);

  function setQty(productId: string, shadeId: string, quantity: number) {
    setCart((prev) =>
      prev.map((c) => (c.productId === productId && c.shadeId === shadeId ? { ...c, quantity } : c))
    );
  }
  function remove(productId: string, shadeId: string) {
    setCart((prev) => prev.filter((c) => !(c.productId === productId && c.shadeId === shadeId)));
  }

  async function applyCoupon() {
    setCouponBusy(true);
    setCouponError('');
    setCoupon(null);
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(couponInput.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'কুপনটি বৈধ নয়');
      setCoupon({ code: data.code, percent: Number(data.discount_percent) });
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'কুপন যাচাই করা যায়নি');
    } finally {
      setCouponBusy(false);
    }
  }

  async function onCheckout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (!lines.length || stockIssue) {
      notify('কিছু পণ্যের স্টক পরিবর্তন হয়েছে। ব্যাগটি যাচাই করুন।');
      setStep('cart');
      return;
    }
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const address = String(fd.get('address') ?? '').trim();
    if (name.length < 2 || address.length < 8) {
      notify('সম্পূর্ণ নাম ও ঠিকানা দিন।');
      return;
    }
    const payLabel = PAYMENT_OPTIONS.find((p) => p.id === payment)?.label || 'ক্যাশ অন ডেলিভারি';
    const trx = String(fd.get('trxId') ?? trxId);
    if (needsTrx) {
      if (!trx) {
        notify('বিকাশ/নগদ/রকেটের জন্য ট্রানজেকশন আইডি বাধ্যতামূলক।');
        setError('ট্রানজেকশন আইডি দিন।');
        return;
      }
      if (!isValidTrxId(trx)) {
        notify('সঠিক ট্রানজেকশন আইডি দিন (৮–১৫ অক্ষর/সংখ্যা, স্পেস ছাড়া)।');
        setError('ভুল ট্রানজেকশন আইডি — অর্ডার নিশ্চিত করা যায়নি।');
        return;
      }
    }
    const userNote = String(fd.get('note') ?? '').trim();
    const noteWithTrx = needsTrx
      ? `TrxID: ${trx}${userNote ? `\n${userNote}` : ''}`
      : userNote;
    const customer = {
      name,
      phone: String(fd.get('phone')),
      address,
      region,
      payment: payLabel,
      note: noteWithTrx,
    };
    setSubmitting(true);
    setError('');
    try {
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify({ customer, cart, total: subtotal - discount + delivery, couponCode: coupon?.code }))
      );
      const signature = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join(
        ''
      );
      if (requestRef.current.signature !== signature) {
        try {
          const saved = JSON.parse(sessionStorage.getItem('kushi-checkout-request') || 'null');
          requestRef.current =
            saved?.signature === signature
              ? saved
              : { signature, id: crypto.randomUUID() };
          sessionStorage.setItem('kushi-checkout-request', JSON.stringify(requestRef.current));
        } catch {
          requestRef.current = { signature, id: crypto.randomUUID() };
        }
      }
      const order = await placeOrder(customer, requestRef.current.id, subtotal - discount + delivery, coupon?.code);
      try {
        sessionStorage.removeItem('kushi-checkout-request');
      } catch {
        /* ignore */
      }
      setDoneOrder(order);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  }

  const summary = (
    <div className="order-summary">
      <div>
        <span>পণ্যের মোট মূল্য</span>
        <strong>{money(subtotal)}</strong>
      </div>
      <div>
        <span>ডেলিভারি চার্জ</span>
        <strong>{delivery === 0 ? 'ফ্রি' : money(delivery)}</strong>
      </div>
      {coupon && <div><span>কুপন ছাড় ({coupon.code})</span><strong>−{money(discount)}</strong></div>}
      <div className="summary-total">
        <span>সর্বমোট</span>
        <strong>{money(subtotal - discount + delivery)}</strong>
      </div>
    </div>
  );

  return (
    <Modal
      title={
        step === 'checkout'
          ? 'অর্ডারের তথ্য'
          : step === 'done'
            ? 'আপনার অনলাইন অর্ডার'
            : `আমার ব্যাগ (${fmt(bagCount)})`
      }
      drawer
      onClose={() => setPanel(null)}
    >
      {step === 'done' && doneOrder ? (
        <div className="order-success">
          <div className="success-icon">
            <Check size={49} strokeWidth={1.4} />
          </div>
          <span className="section-kicker">ধন্যবাদ, {doneOrder.name}</span>
          <h2>
            আপনার অর্ডার
            <br />
            সংরক্ষিত হয়েছে!
          </h2>
          <p>
            অর্ডার নম্বর <strong>{doneOrder.id}</strong>
          </p>
          <div className="notice">
            <Info size={19} />
            <span>
              অর্ডারটি সংরক্ষিত হয়েছে। পেমেন্ট: {doneOrder.payment || 'ক্যাশ অন ডেলিভারি'}।
              প্রশ্ন থাকলে WhatsApp {settings.phone}-এ যোগাযোগ করুন।
            </span>
          </div>
          <div className="success-recap">
            <span>মোট {money(doneOrder.total)}</span>
          </div>
          <button className="button primary full-width" onClick={() => downloadReceipt(doneOrder, settings.phone)}>
            <Download size={17} /> রশিদ ডাউনলোড করুন
          </button>
          <button className="button secondary full-width" onClick={() => setPanel('orders')}>
            আমার অর্ডার দেখুন <ArrowRight size={17} />
          </button>
        </div>
      ) : step === 'cart' ? (
        lines.length ? (
          <div className="cart-content">
            {settings.freeThreshold > 0 && (
              <div className="free-shipping">
                <p>
                  <Truck size={17} />
                  {subtotal >= settings.freeThreshold
                    ? 'দারুণ! আপনার ডেলিভারি একদম ফ্রি।'
                    : `আর ${money(settings.freeThreshold - subtotal)} কেনাকাটায় ফ্রি ডেলিভারি`}
                </p>
                <div>
                  <span style={{ width: `${Math.min(100, (subtotal / settings.freeThreshold) * 100)}%` }} />
                </div>
              </div>
            )}
            <div className="cart-items">
              {lines.map((l) => (
                <div className="cart-item" key={`${l.productId}-${l.shadeId}`}>
                  <img
                    src={l.shade?.image || l.product.image}
                    alt={`${l.product.name}${l.shade ? ` · ${l.shade.name}` : ''}`}
                  />
                  <div className="cart-item-info">
                    <h3>{l.product.name}</h3>
                    <p>
                      {l.shade && (
                        <>
                          {!l.shade.image && <i style={{ background: l.shade.color }} />}
                          {l.shade.name} · {l.shade.code}
                        </>
                      )}
                    </p>
                    <div>
                      <Quantity
                        value={l.quantity}
                        max={Math.max(1, l.stock)}
                        onChange={(q) => setQty(l.productId, l.shadeId, q)}
                      />
                      <strong>{money(l.product.price * l.quantity)}</strong>
                    </div>
                    {l.quantity > l.stock && (
                      <span className="field-error">স্টকে আছে {fmt(l.stock)}টি। পরিমাণ কমান।</span>
                    )}
                  </div>
                  <button
                    className="remove-item"
                    aria-label={`${l.product.name} ব্যাগ থেকে সরান`}
                    onClick={() => remove(l.productId, l.shadeId)}
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
            <label className="field">
              <span>
                <MapPin size={15} /> ডেলিভারি এলাকা
              </span>
              <select value={region} onChange={(e) => setRegion(e.target.value as 'inside' | 'outside')}>
                <option value="inside">ঢাকার ভিতরে</option>
                <option value="outside">ঢাকার বাইরে</option>
              </select>
            </label>
            {summary}
            <button
              className="button primary full-width"
              disabled={stockIssue}
              onClick={() => setStep('checkout')}
            >
              অর্ডার করতে এগিয়ে যান <ArrowRight size={17} />
            </button>
            <p className="cart-note">
              COD · বিকাশ · নগদ · রকেট · WhatsApp {settings.phone}
            </p>
          </div>
        ) : (
          <EmptyState title="ব্যাগ এখনো খালি" text="পছন্দের সুতা বা শেড বেছে ব্যাগে যোগ করুন।">
            <Link className="button primary" to="/shop" onClick={() => setPanel(null)}>
              পণ্য ঘুরে দেখুন <ArrowRight size={16} />
            </Link>
          </EmptyState>
        )
      ) : (
        <form className="checkout-form" onSubmit={onCheckout}>
          <button type="button" className="back-button" onClick={() => setStep('cart')}>
            <ArrowLeft size={16} /> ব্যাগে ফিরে যান
          </button>
          <div className="notice">
            <Info size={17} />
            <span>
              অর্ডার অনলাইনে সংরক্ষিত হলে সরাসরি মার্চেন্টের কাছে পৌঁছাবে। মূল্য, শেডের স্টক ও
              ডেলিভারি চার্জ সার্ভারে যাচাই করা হয়।
            </span>
          </div>
          <label className="field">
            <span>আপনার নাম *</span>
            <input name="name" required minLength={2} maxLength={120} placeholder="সম্পূর্ণ নাম" autoComplete="name" />
          </label>
          <label className="field">
            <span>মোবাইল নম্বর *</span>
            <input
              name="phone"
              type="tel"
              required
              pattern="01[3-9][0-9]{8}"
              title="11 সংখ্যার বাংলাদেশি নম্বর, যেমন 01818898944"
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
            />
          </label>
          <label className="field">
            <span>ডেলিভারি এলাকা *</span>
            <select value={region} onChange={(e) => setRegion(e.target.value as 'inside' | 'outside')}>
              <option value="inside">ঢাকার ভিতরে</option>
              <option value="outside">ঢাকার বাইরে</option>
            </select>
          </label>
          <label className="field">
            <span>সম্পূর্ণ ঠিকানা *</span>
            <input
              name="address"
              required
              minLength={8}
              placeholder="বাসা, রাস্তা, এলাকা, থানা ও জেলা"
              autoComplete="street-address"
            />
          </label>
          <fieldset className="field payment-methods">
            <span>পেমেন্ট পদ্ধতি *</span>
            <div className="payment-options" role="radiogroup" aria-label="পেমেন্ট পদ্ধতি">
              {PAYMENT_OPTIONS.map((opt) => (
                <label key={opt.id} className={`payment-option ${payment === opt.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value={opt.id}
                    checked={payment === opt.id}
                    onChange={() => setPayment(opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {payment !== 'cod' && (
              <small className="payment-hint">
                {payment === 'bkash' && (settings.bkashNumber ? `বিকাশ: ${settings.bkashNumber} (Personal) — এই নম্বরে টাকা পাঠিয়ে নিচের ঘরে ট্রানজেকশন আইডি দিন।` : 'বিকাশ নম্বর জানতে দোকানে যোগাযোগ করুন।')}
                {payment === 'nagad' && (settings.nagadNumber ? `নগদ: ${settings.nagadNumber} (Personal) — এই নম্বরে টাকা পাঠিয়ে নিচের ঘরে ট্রানজেকশন আইডি দিন।` : 'নগদ নম্বর জানতে দোকানে যোগাযোগ করুন।')}
                {payment === 'rocket' && `রকেট: ${settings.phone} — এই নম্বরে টাকা পাঠিয়ে নিচের ঘরে ট্রানজেকশন আইডি দিন।`}
                {payment === 'card' && 'কার্ড/অন্যান্য পেমেন্ট ডেলিভারির সময় বা মার্চেন্টের নির্দেশে সম্পন্ন হবে।'}
              </small>
            )}
          </fieldset>
          {needsTrx && (
            <label className="field">
              <span>ট্রানজেকশন আইডি *</span>
              <input
                name="trxId"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                required
                minLength={8}
                maxLength={15}
                pattern="[A-Za-z0-9]{8,15}"
                title="৮–১৫ অক্ষর/সংখ্যার সঠিক ট্রানজেকশন আইডি"
                placeholder="যেমন: 8N7XXXXXXX"
                autoComplete="off"
                inputMode="text"
              />
              <small>অ্যাপ/SMS-এর TrxID হুবহু লিখুন — ভুল আইডি দিলে অর্ডার নিশ্চিত হবে না।</small>
            </label>
          )}
          <label className="field">
            <span>বিশেষ নির্দেশনা (ঐচ্ছিক)</span>
            <textarea name="note" rows={2} placeholder="ডেলিভারি সম্পর্কে কিছু বলতে চাইলে..." />
          </label>
          <div className="field">
            <span>কুপন কোড (ঐচ্ছিক)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCoupon(null); setCouponError(''); }} placeholder="কুপন কোড" />
              <button className="button secondary" type="button" onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()}>
                {couponBusy ? 'যাচাই হচ্ছে...' : 'প্রয়োগ করুন'}
              </button>
            </div>
            {couponError && <small className="field-error">{couponError}</small>}
            {coupon && <small>{coupon.percent}% ছাড় প্রয়োগ হয়েছে</small>}
          </div>
          {summary}
          {error && <p className="cloud-error">{error}</p>}
          <button className="button primary full-width" type="submit" disabled={submitting}>
            {submitting ? 'অর্ডার পাঠানো হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}
          </button>
          <p className="cart-note">
            সাহায্য লাগলে{' '}
            <a href={whatsappLink(undefined, settings.phone)} target="_blank" rel="noopener noreferrer">
              WhatsApp {settings.phone}
            </a>
          </p>
        </form>
      )}
    </Modal>
  );
}

function OrdersModal() {
  const { orders, searchOrders, setPanel, settings, notify } = useStore();
  const [q, setQ] = useState('');
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const list = results ?? orders;

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    const customerPhone = phone.trim();
    if (!term || !customerPhone) {
      setResults(null);
      notify('অর্ডার আইডি এবং অর্ডারে ব্যবহৃত ফোন নম্বর দুটিই দিন।');
      return;
    }
    setLoading(true);
    try {
      const found = await searchOrders(term, customerPhone);
      setResults(found);
    } catch (err) {
      setResults(null);
      notify(err instanceof Error ? err.message : 'অর্ডারের বর্তমান অবস্থা জানা যায়নি।');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="আমার অর্ডার" onClose={() => setPanel(null)} className="orders-modal">
      <p className="muted">
        এই ডিভাইসের সুরক্ষিত অর্ডার ও অবস্থা এখানে দেখুন। অন্য ডিভাইস থেকে খুঁজতে অর্ডার আইডি এবং অর্ডারে
        ব্যবহৃত ফোন নম্বর—দুটিই দিন।
      </p>
      <form className="order-search" onSubmit={onSearch}>
        <input
          aria-label="অর্ডার আইডি"
          placeholder="অর্ডার আইডি (যেমন KS-...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          aria-label="অর্ডারের ফোন নম্বর"
          type="tel"
          inputMode="tel"
          placeholder="অর্ডারের ফোন নম্বর"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="submit" className="button primary" disabled={loading}>
          <Search size={16} /> খুঁজুন
        </button>
      </form>
      {results && (
        <button
          className="back-button"
          onClick={() => {
            setResults(null);
            setQ('');
            setPhone('');
          }}
        >
          <X size={14} /> সব অর্ডার দেখুন
        </button>
      )}
      {list.length ? (
        <div className="order-list">
          {list.map((o) => (
            <details className="order-list-item" key={o.id}>
              <summary>
                <div>
                  <strong>{o.id}</strong>
                  <small>
                    {formatDate(o.createdAt)} · {fmt(o.items.reduce((a, i) => a + i.quantity, 0))}টি পণ্য ·{' '}
                    {money(o.total)}
                  </small>
                </div>
                <span className="status-pill">{o.status}</span>
                <ChevronDown size={16} />
              </summary>
              <div className="order-detail-lines">
                {o.items.map((item, idx) => (
                  <div key={idx}>
                    <span>
                      {item.name} {item.shade && <small>{item.shade}</small>} × {fmt(item.quantity)}
                    </span>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                ))}
                <div>
                  <span>ডেলিভারি</span>
                  <span>{money(o.delivery)}</span>
                </div>
                {o.address && <p><MapPin size={14} />{o.address}</p>}
                {o.phone && o.address && <button className="text-link" onClick={() => downloadReceipt(o, settings.phone)}>
                  <Download size={15} /> রসিদ ডাউনলোড
                </button>}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <EmptyState
          title={results ? 'অর্ডারটি পাওয়া যায়নি' : 'আপনার প্রথম সৃষ্টির অপেক্ষায়'}
          text={
            results
              ? 'অর্ডার আইডি ও অর্ডারে ব্যবহৃত ফোন নম্বর মিলিয়ে আবার চেষ্টা করুন।'
              : 'অর্ডার করলে তার তথ্য ও অবস্থা এখানে দেখতে পাবেন।'
          }
        />
      )}
    </Modal>
  );
}

function InfoModal({ privacy = false }: { privacy?: boolean }) {
  const { settings, setPanel } = useStore();
  return (
    <Modal
      title={privacy ? 'তথ্য ও গোপনীয়তা' : 'সাধারণ জিজ্ঞাসা'}
      onClose={() => setPanel(null)}
      className="info-modal"
    >
      {privacy ? (
        <div className="privacy-copy">
          <ShieldCheck size={38} />
          <h3>আপনার তথ্য কোথায় থাকে?</h3>
          <p>
            পণ্য, সেটিংস ও অর্ডার স্টোরের অনলাইন ডাটাবেসে রাখা হয়। শেডের ছবি অনলাইন image storage-এ থাকে।
            ব্যাগ, পছন্দের তালিকা আপনার ব্রাউজারে থাকে।
          </p>
          <p>
            অনলাইনে অর্ডার করলে নাম, ফোন ও ডেলিভারির ঠিকানা মার্চেন্ট দেখতে পান। অন্য গ্রাহকের অর্ডার আপনার
            সেশনে দেখা যায় না। পেমেন্ট: ক্যাশ অন ডেলিভারি, বিকাশ, নগদ, রকেট বা কার্ড।
          </p>
          <h3>অ্যাডমিন সম্পর্কে</h3>
          <p>মার্চেন্ট ইমেইল-পাসওয়ার্ড দিয়ে লগইন করে অর্ডার তালিকা ও ক্যাটালগ পরিচালনা করেন।</p>
          <p>
            যোগাযোগ: <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>{settings.phone}</a> ·{' '}
            <a href={whatsappLink(undefined, settings.phone)} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </p>
        </div>
      ) : (
        <>
          <div className="info-hero">
            <Heart size={34} />
            <h3>নতুন শুরুতে আমরা আছি পাশে।</h3>
            <p>সুতা, শেড আর অর্ডার নিয়ে আপনার সাধারণ প্রশ্নগুলো।</p>
          </div>
          <div className="faq-list">
            {settings.faqs.map((f, i) => (
              <details key={i} open={i === 0}>
                <summary>
                  {f.question} <ChevronDown size={16} />
                </summary>
                <p>{f.answer.replaceAll(STORE_PHONE, settings.phone)}</p>
              </details>
            ))}
          </div>
          <div className="notice">
            <Truck size={17} />
            <span>
              ঢাকায় {money(settings.inside)} থেকে, ঢাকার বাইরে {money(settings.outside)} থেকে ডেলিভারি।
              যোগাযোগ: {settings.phone}
            </span>
          </div>
          <div className="product-contact-row" style={{ marginTop: 12 }}>
            <a
              className="button primary full-width"
              href={whatsappLink(undefined, settings.phone)}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp: {settings.phone}
            </a>
            <a className="button secondary full-width" href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>
              কল করুন
            </a>
          </div>
        </>
      )}
    </Modal>
  );
}

export function Overlays() {
  const { selectedProduct, products, panel, setPanel, wishlist, toast } = useStore();
  const product = products.find((p) => p.id === selectedProduct?.id);

  return (
    <>
      {product && selectedProduct ? (
        <ProductDetail
          key={`${product.id}-${selectedProduct.shadeId ?? ''}`}
          product={product}
          initialShade={selectedProduct.shadeId}
        />
      ) : (
        <>
          {panel === 'cart' && <CartDrawer />}
          {panel === 'orders' && <OrdersModal />}
          {panel === 'help' && <InfoModal />}
          {panel === 'privacy' && <InfoModal privacy />}
          {panel === 'wishlist' && (
            <Modal
              title={`মনের পছন্দ (${fmt(wishlist.length)})`}
              onClose={() => setPanel(null)}
              className="wishlist-modal"
            >
              {products.filter((p) => p.active && wishlist.includes(p.id)).length ? (
                <div className="product-grid wishlist-grid">
                  {products
                    .filter((p) => p.active && wishlist.includes(p.id))
                    .map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                </div>
              ) : (
                <EmptyState
                  title="প্রিয়গুলো জমিয়ে রাখুন"
                  text="পণ্যের পাশে হার্ট চিহ্নে ক্লিক করে পছন্দের তালিকা তৈরি করুন।"
                >
                  <Link className="button primary" to="/shop" onClick={() => setPanel(null)}>
                    পণ্য দেখুন <ArrowRight size={16} />
                  </Link>
                </EmptyState>
              )}
            </Modal>
          )}
        </>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={17} />
          </span>
          {toast}
        </div>
      )}
    </>
  );
}
