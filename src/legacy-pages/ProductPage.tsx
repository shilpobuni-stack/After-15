import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronRight, Copy, Heart, Package, Search } from 'lucide-react';
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
  const { products, categories, wishlist, toggleWish, addToCart, setPanel, notify } = useStore();
  const isSize = product.variantLabel === 'সাইজ';
  const defaultShade = product.shades.find((s) => s.stock > 0)?.id || product.shades[0]?.id || '';
  const startShade =
    initialShade && product.shades.some((s) => s.id === initialShade) ? initialShade : defaultShade;
  const [shadeId, setShadeId] = useState(startShade);
  const [qty, setQty] = useState(1);
  const [filter, setFilter] = useState('');
  const shade = product.shades.find((s) => s.id === shadeId);
  const stock = product.shades.length ? shade?.stock ?? 0 : product.stock;
  const category = categories.find((c) => c.id === product.category);
  const wished = wishlist.includes(product.id);
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/product/${encodeURIComponent(product.id)}`
      );
      notify('লিংক কপি হয়েছে');
    } catch {
      notify('লিংক কপি করা যায়নি');
    }
  }

  return (
    <div className="container product-page">
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
              ? `${shade.name} · ${shade.code} — এই ${isSize ? 'সাইজের' : 'শেডের সুতার'} ছবি`
              : 'যত্নে বাছাই, ভালোবাসায় বোনা'}
          </span>
        </div>
        <div className="detail-info">
          <span className="section-kicker">{product.english}</span>
          <h1>{product.name}</h1>
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
                            {stock > 0 ? (stock <= 5 ? `মাত্র ${fmt(stock)}টি বাকি আছে!` : `${fmt(stock)}টি স্টকে আছে`) : 'স্টকে নেই'}
            </span>
          </div>

          {product.shades.length > 0 && (
            <div className="detail-shades">
              <div className="shade-selection-label">
                <strong>
                  {isSize ? 'সাইজ নির্বাচন করুন' : 'আপনার শেড বাছুন'}{' '}
                  <span>({fmt(product.shades.length)}টি)</span>
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
                    placeholder={isSize ? 'সাইজ বা কোড খুঁজুন...' : 'রঙ বা কোড খুঁজুন...'}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              )}
              <div
                className="shade-swatch-grid"
                style={isSize ? { display: 'flex', flexWrap: 'wrap' } : undefined}
              >
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    className={
                      isSize
                        ? ''
                        : `shade-swatch ${s.id === shadeId ? 'selected' : ''} ${s.stock === 0 ? 'out' : ''} ${s.image ? 'has-photo' : ''}`
                    }
                    style={
                      isSize
                        ? {
                            padding: '9px 17px',
                            borderRadius: 999,
                            border: `2px solid ${s.id === shadeId ? 'var(--accent)' : '#fecdd3'}`,
                            background: s.id === shadeId ? '#fff1f2' : '#fff',
                            opacity: s.stock === 0 ? 0.5 : 1,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }
                        : { background: s.color }
                    }
                    onClick={() => setShadeId(s.id)}
                    title={`${s.name} · ${s.code} · ${s.stock}টি`}
                    aria-label={`${s.name} ${s.code}`}
                  >
                    {isSize ? (
                      s.name
                    ) : (
                      <>
                        {s.image && <img src={s.image} alt="" loading="lazy" />}
                        <span className="swatch-code">{s.code}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="detail-actions" style={{ display: 'flex', gap: 8, marginTop: 23 }}>
            <Quantity value={qty} max={Math.max(1, stock)} onChange={setQty} />
            <button
              className="button primary"
              style={{ flex: 1 }}
              disabled={stock === 0 || (product.shades.length > 0 && !shade)}
              onClick={() => {
                if (addToCart(product, product.shades.length ? shadeId : '', qty)) setQty(1);
              }}
            >
              ব্যাগে যোগ করুন <Package size={17} />
            </button>
            <button
              type="button"
              className={`button secondary detail-wish ${wished ? 'is-wished' : ''}`}
              onClick={() => toggleWish(product.id)}
              aria-label={wished ? 'পছন্দ থেকে সরান' : 'পছন্দের তালিকায় রাখুন'}
            >
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="product-contact-row">
            <button
              type="button"
              className="button secondary full-width"
              disabled={stock === 0 || (product.shades.length > 0 && !shade)}
              onClick={() => {
                if (addToCart(product, product.shades.length ? shadeId : '', qty)) {
                  setQty(1);
                  setPanel('cart');
                }
              }}
            >
              অর্ডার করুন <ArrowRight size={17} />
            </button>
            <button type="button" className="button secondary full-width" onClick={copyLink}>
              পণ্যের লিংক কপি করুন <Copy size={16} />
            </button>
          </div>
        </div>
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
    </div>
  );
}
