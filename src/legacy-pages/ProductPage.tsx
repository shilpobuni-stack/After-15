import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Copy,
  Facebook,
  Heart,
  MessageCircle,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
  Zap,
  ZoomIn,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { EmptyState, ProductCard, Quantity } from '../components/UI';
import { fmt, money, type Product } from '../lib/types';

export default function ProductPage({ id }: { id: string }) {
  const { products, cloud } = useStore();
  const [params] = useSearchParams();
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 6000);
    return () => clearTimeout(t);
  }, []);
  const product = products.find((p) => p.id === id && p.active);
  if (!cloud.lastSynced && !waited) {
    return (
      <div className="container" style={{ minHeight: '55vh', paddingTop: 60 }}>
        লোড হচ্ছে…
      </div>
    );
  }
  if (!product) {
    return (
      <div className="container not-found">
        <EmptyState
          title="এই পণ্যটি খুঁজে পাওয়া যায়নি"
          text="পণ্যটি হয়তো সরিয়ে ফেলা হয়েছে, অথবা লিংকটি ভুল।"
        >
          <Link className="button primary" to="/shop">
            সব পণ্য দেখুন
          </Link>
        </EmptyState>
      </div>
    );
  }
  return <ProductView key={product.id} product={product} initialShade={params.get('shade') || undefined} />;
}

function ProductView({ product, initialShade }: { product: Product; initialShade?: string }) {
  const { products, categories, settings, wishlist, toggleWish, addToCart, setPanel, notify } = useStore();
  const isSize = product.variantLabel === 'সাইজ';
  const defaultShade = product.shades.find((s) => s.stock > 0)?.id || product.shades[0]?.id || '';
  const startShade =
    initialShade && product.shades.some((s) => s.id === initialShade) ? initialShade : defaultShade;
  const [shadeId, setShadeId] = useState(startShade);
  const [picked, setPicked] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [filter, setFilter] = useState('');
  const [zoom, setZoom] = useState(false);
  const shade = product.shades.find((s) => s.id === shadeId);
  const stock = product.shades.length ? shade?.stock ?? 0 : product.stock;
  const category = categories.find((c) => c.id === product.category);
  const wished = wishlist.includes(product.id);
  const needsShade = product.shades.length > 0 && !shade;
  const canBuy = stock > 0 && !needsShade;
  const discountPercent =
    product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const freeLimit = Number(settings.freeThreshold ?? 2000);
  const mainSrc = picked || shade?.image || product.image;

  const gallery = useMemo(() => {
    const seen = new Set<string>();
    const list: { src: string; shadeId?: string; label: string }[] = [];
    const add = (src: string | undefined, label: string, sid?: string) => {
      if (src && !seen.has(src)) {
        seen.add(src);
        list.push({ src, shadeId: sid, label });
      }
    };
    add(product.image, product.name);
        (product.images || []).forEach((src, i) => add(src, `${product.name} · ছবি ${i + 2}`));
    product.shades.forEach((s) => add(s.image, `${s.name} · ${s.code}`, s.id));
    return list.slice(0, 10);
  }, [product]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q
      ? product.shades.filter(
          (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
        )
      : product.shades;
  }, [product.shades, filter]);

  const related = products
    .filter((p) => p.active && p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  useEffect(() => {
    const previous = document.title;
    document.title = `${product.name} | কুশি শিল্প`;
    return () => {
      document.title = previous;
    };
  }, [product.name]);

  useEffect(() => {
    track('ViewContent', { id: product.id, name: product.name, price: product.price });
  }, [product.id]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  const productUrl = () => `${window.location.origin}/product/${encodeURIComponent(product.id)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(productUrl());
      notify('লিংক কপি হয়েছে');
    } catch {
      notify('লিংক কপি করা যায়নি');
    }
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${product.name}\n${productUrl()}`)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl())}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function add(openBag: boolean) {
    if (addToCart(product, product.shades.length ? shadeId : '', qty)) {
      setQty(1);
      if (openBag) setPanel('cart');
    }
  }

  function pickShade(sid: string) {
    setShadeId(sid);
    setPicked(null);
  }

  const stockLabel =
    stock <= 0 ? 'স্টকে নেই' : stock <= 5 ? `মাত্র ${fmt(stock)}টি বাকি আছে!` : 'স্টকে আছে';
  const stockClass = stock <= 0 ? 'out' : stock <= 5 ? 'low' : 'ok';

  return (
    <div className="container pp">
      <div className="breadcrumb">
        <Link to="/">হোম</Link>
        <ChevronRight size={13} />
        <Link to="/shop">সব পণ্য</Link>
        {category && (
          <>
            <ChevronRight size={13} />
            <Link to={`/shop?category=${category.id}`}>{category.name}</Link>
          </>
        )}
        <ChevronRight size={13} />
        <span>{product.name}</span>
      </div>

      <div className="pp-grid">
        <div className="pp-gallery">
          <div className="pp-main" onClick={() => setZoom(true)}>
            <img
              src={mainSrc}
              alt={shade?.image ? `${product.name} · ${shade.name} · ${shade.code}` : product.name}
            />
            <div className="pp-tag">
              {discountPercent > 0 && <span className="off">-{fmt(discountPercent)}%</span>}
              {product.badge && <span>{product.badge}</span>}
            </div>
            <button
              type="button"
              className={`pp-heart ${wished ? 'on' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleWish(product.id);
              }}
              aria-label={wished ? 'পছন্দ থেকে সরান' : 'পছন্দের তালিকায় রাখুন'}
            >
              <Heart size={21} fill={wished ? 'currentColor' : 'none'} />
            </button>
            <span className="pp-zoomhint">
              <ZoomIn size={14} /> বড় করে দেখুন
            </span>
          </div>
          {gallery.length > 1 && (
            <div className="pp-thumbs">
              {gallery.map((g) => (
                <button
                  key={g.src}
                  type="button"
                  className={g.src === mainSrc ? 'on' : ''}
                  onClick={() => {
                    if (g.shadeId) pickShade(g.shadeId);
                    else setPicked(g.src);
                  }}
                  aria-label={g.label}
                  title={g.label}
                >
                  <img src={g.src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pp-info">
          {category && (
            <Link className="pp-cat" to={`/shop?category=${category.id}`}>
              {category.name}
            </Link>
          )}
          <h1>{product.name}</h1>
          {product.english && <div className="pp-en">{product.english}</div>}

          <div className="pp-price">
            <strong>{money(product.price)}</strong>
            {discountPercent > 0 && <del>{money(product.oldPrice)}</del>}
            {discountPercent > 0 && (
              <span className="save">{money(product.oldPrice - product.price)} সাশ্রয়</span>
            )}
          </div>

          <span className={`pp-stock ${stockClass}`}>{stockLabel}</span>

          {product.shades.length > 0 && (
            <div className="pp-block">
              <div className="pp-label">
                <strong>{isSize ? 'সাইজ বাছুন' : 'আপনার শেড বাছুন'}</strong>
                <span>{shade ? `${shade.name} · ${shade.code}` : `${fmt(product.shades.length)}টি বিকল্প`}</span>
              </div>
              {product.shades.length > 8 && (
                <div className="input-with-icon" style={{ marginBottom: 12 }}>
                  <Search size={15} />
                  <input
                    aria-label="শেড খুঁজুন"
                    placeholder={isSize ? 'সাইজ বা কোড খুঁজুন...' : 'রঙ বা কোড খুঁজুন...'}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              )}
              <div className="pp-swatches">
                {filtered.map((s) =>
                  isSize ? (
                    <button
                      key={s.id}
                      type="button"
                      className={`pp-pill ${s.id === shadeId ? 'on' : ''} ${s.stock === 0 ? 'out' : ''}`}
                      onClick={() => pickShade(s.id)}
                      title={`${s.name} · ${s.code} · ${s.stock}টি`}
                    >
                      {s.name}
                    </button>
                  ) : (
                    <button
                      key={s.id}
                      type="button"
                      className={`pp-sw ${s.id === shadeId ? 'on' : ''} ${s.stock === 0 ? 'out' : ''}`}
                      style={{ background: s.color }}
                      onClick={() => pickShade(s.id)}
                      title={`${s.name} · ${s.code} · ${s.stock}টি`}
                      aria-label={`${s.name} ${s.code}`}
                    >
                      {s.image && <img src={s.image} alt="" loading="lazy" />}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="pp-buy">
            <Quantity value={qty} max={Math.max(1, stock)} onChange={setQty} />
            <div className="pp-total">
              মোট <b>{money(product.price * qty)}</b>
            </div>
          </div>

          <div className="pp-actions">
            <button
              type="button"
              className="button pp-cta pp-btn-add"
              disabled={!canBuy}
              onClick={() => add(false)}
            >
              <ShoppingBag size={18} /> ব্যাগে যোগ করুন
            </button>
            <button
              type="button"
              className="button pp-cta pp-btn-buy"
              disabled={!canBuy}
              onClick={() => add(true)}
            >
              <Zap size={18} /> এখনই কিনুন
            </button>
          </div>

          <div className="pp-trust">
            <div>
              <Wallet size={22} />
              <span>
                <b>ক্যাশ অন ডেলিভারি</b>
                <small>পণ্য হাতে পেয়ে টাকা দিন</small>
              </span>
            </div>
            <div>
              <Truck size={22} />
              <span>
                <b>সারা বাংলাদেশে ডেলিভারি</b>
                <small>
                  {freeLimit > 0 ? `${money(freeLimit)}-এর অর্ডারে ফ্রি` : 'ঢাকা সিটি ও সারাদেশে'}
                </small>
              </span>
            </div>
            <div>
              <ShieldCheck size={22} />
              <span>
                <b>বিকাশ · নগদ · রকেট</b>
                <small>সহজ অগ্রিম পেমেন্ট</small>
              </span>
            </div>
            <div>
              <MessageCircle size={22} />
              <span>
                <b>WhatsApp-এ সহায়তা</b>
                <small>পণ্য নিয়ে প্রশ্ন? মেসেজ দিন</small>
              </span>
            </div>
          </div>

          <div className="pp-share">
            <span>
              <Share2 size={15} /> শেয়ার করুন
            </span>
            <button type="button" onClick={shareWhatsApp}>
              <MessageCircle size={15} /> WhatsApp
            </button>
            <button type="button" onClick={shareFacebook}>
              <Facebook size={15} /> Facebook
            </button>
            <button type="button" onClick={copyLink}>
              <Copy size={15} /> লিংক কপি
            </button>
          </div>
        </div>
      </div>

      <div className="pp-sections">
        {product.description && (
          <details open>
            <summary>পণ্যের বিবরণ</summary>
            <div className="body">{product.description}</div>
          </details>
        )}
        <details>
          <summary>ডেলিভারি ও চার্জ</summary>
          <div className="body">
            ঢাকা সিটির ভিতরে ডেলিভারি চার্জ {money(Number(settings.inside ?? 80))}, ঢাকা সিটির বাইরে{' '}
            {money(Number(settings.outside ?? 130))}।
            {freeLimit > 0 ? ` অর্ডারের মোট মূল্য ${money(freeLimit)} বা তার বেশি হলে ডেলিভারি চার্জ লাগবে না।` : ''}
            {settings.weightEnabled !== false ? ' পণ্যের ওজন বেশি হলে সামান্য অতিরিক্ত চার্জ যোগ হতে পারে।' : ''} সঠিক
            চার্জ চেকআউটে ঠিকানা দেওয়ার সঙ্গে সঙ্গে দেখানো হয়।
          </div>
        </details>
        <details>
          <summary>পেমেন্ট পদ্ধতি</summary>
          <div className="body">
            ক্যাশ অন ডেলিভারিতে পণ্য হাতে পেয়ে টাকা দিতে পারবেন। চাইলে বিকাশ, নগদ, রকেট বা ব্যাংকে অগ্রিম
            পেমেন্ট করে চেকআউটে ট্রানজেকশন আইডি দিন।
          </div>
        </details>
      </div>

      {related.length > 0 && (
        <section className="section" style={{ paddingInline: 0 }}>
          <div className="section-heading">
            <div>
              <span className="section-kicker">আরও দেখুন</span>
              <h2>একই ধরনের পণ্য</h2>
            </div>
          </div>
          <div className="product-grid" style={{ marginTop: 22 }}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="pp-sticky">
        <div className="p">
          <small>মোট</small>
          <b>{money(product.price * qty)}</b>
        </div>
        <button type="button" className="button pp-btn-add" disabled={!canBuy} onClick={() => add(false)}>
          ব্যাগে যোগ করুন
        </button>
        <button type="button" className="button pp-btn-buy" disabled={!canBuy} onClick={() => add(true)}>
          এখনই কিনুন
        </button>
      </div>

      {zoom && (
        <div className="pp-zoom" onClick={() => setZoom(false)} role="dialog" aria-label="ছবি বড় করে দেখুন">
          <img src={mainSrc} alt={product.name} />
        </div>
      )}
    </div>
  );
}
