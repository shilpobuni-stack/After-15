import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Filter,
  Palette,
  Search,
  X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { BrandMark, EmptyState, ProductCard } from '../components/UI';
import { fmt, money, totalStock, whatsappLink } from '../lib/types';

export default function Shop() {
  const { products, categories } = useStore();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const isNew = params.get('filter') === 'new';
  const [maxPrice, setMaxPrice] = useState(2000);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState('popular');
  const [search, setSearch] = useState(q);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const filtered = useMemo(() => {
    const term = (search || q).trim().toLowerCase();
    let list = products.filter((p) => p.active);
    if (category) list = list.filter((p) => p.category === category);
    if (isNew) list = list.filter((p) => p.badge === 'নতুন');
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.english.toLowerCase().includes(term) ||
          p.shades.some(
            (s) => s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term)
          )
      );
    }
    list = list.filter((p) => p.price <= maxPrice);
    if (inStock) list = list.filter((p) => totalStock(p) > 0);
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'bn'));
    return list;
  }, [products, category, q, search, maxPrice, inStock, sort, isNew]);

  const clear = () => {
    setParams({});
    setSearch('');
    setMaxPrice(2000);
    setInStock(false);
    setSort('popular');
  };

  return (
    <div className="container shop-page">
      <div className="breadcrumb">
        <Link to="/">হোম</Link>
        <ChevronRight size={13} />
        <span>সব পণ্য</span>
      </div>
      <div className="page-heading">
        <div>
          <span className="section-kicker">
            {q || search ? 'আপনার খোঁজের ফলাফল' : 'আপনার সৃষ্টির সব সঙ্গী'}
          </span>
          <h1>মন ভরে বাছুন, ভালোবেসে বুনুন</h1>
          <p>প্রতিটি নতুন সৃষ্টির জন্য যত্নে বেছে নেওয়া সুতা ও উপকরণ।</p>
        </div>
        <span className="page-heading-icon">
          <BrandMark size={52} />
        </span>
      </div>
      <div className="shop-layout">
        <aside className="shop-filters">
          <h3>
            <Filter size={17} /> আপনার পছন্দমতো
          </h3>
          <h4>ক্যাটাগরি</h4>
          <button className={category ? '' : 'selected'} onClick={() => setParam('category', '')}>
            <span>সব পণ্য</span>
            <span>{fmt(products.filter((p) => p.active).length)}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={category === c.id ? 'selected' : ''}
              onClick={() => setParam('category', c.id)}
            >
              <span>{c.name}</span>
              <span>{fmt(products.filter((p) => p.active && p.category === c.id).length)}</span>
            </button>
          ))}
          <div className="filter-price">
            <h4>আপনার বাজেট</h4>
            <input
              aria-label="সর্বোচ্চ মূল্য"
              type="range"
              min={100}
              max={2000}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
            <span>
              {money(0)} <b>{money(maxPrice)} পর্যন্ত</b>
            </span>
          </div>
          <label className="checkbox-label">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />{' '}
            শুধু স্টকে আছে
          </label>
          <button className="clear-filters" onClick={clear}>
            <X size={14} /> সব ফিল্টার মুছুন
          </button>
          <Link className="sidebar-promo" to="/shades">
            <Palette size={26} />
            <h4>রঙ নিয়ে ভাবছেন?</h4>
            <p>সব শেড এক জায়গায় দেখুন</p>
            <span>
              শেড কালেকশন <ArrowRight size={14} />
            </span>
          </Link>
        </aside>
        <div className="shop-results">
          <div className="shop-search">
            <Search size={17} />
            <input
              aria-label="ক্যাটালগে খুঁজুন"
              placeholder="নাম, শেড বা কোড দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setParam('q', '');
                }}
                aria-label="সার্চ মুছুন"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="results-toolbar">
            <span>{fmt(filtered.length)}টি পণ্য পাওয়া গেছে</span>
            <label>
              পণ্য সাজান{' '}
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="পণ্য সাজান">
                <option value="popular">সাজান: জনপ্রিয়তা অনুযায়ী</option>
                <option value="price-asc">দাম: কম থেকে বেশি</option>
                <option value="price-desc">দাম: বেশি থেকে কম</option>
                <option value="name">নাম অনুযায়ী</option>
              </select>
            </label>
          </div>
          {filtered.length ? (
            <div className="product-grid shop-product-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="এই খোঁজে কোনো পণ্য পাওয়া যায়নি"
              text="অন্য কোনো নাম বা শেড দিয়ে খুঁজুন, অথবা ফিল্টার সরিয়ে দেখুন।"
            >
              <button className="button primary" onClick={clear}>
                সব পণ্য দেখুন
              </button>
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShadesPage() {
  const { products, setSelectedProduct } = useStore();
  const yarnProducts = products.filter((p) => p.active && p.shades.length && p.variantLabel !== 'সাইজ');
  const [selectedId, setSelectedId] = useState('');
  const selected = yarnProducts.find((p) => p.id === selectedId) || yarnProducts[0];
  const [stockOnly, setStockOnly] = useState(false);
  const [q, setQ] = useState('');
  const shades = useMemo(() => {
    if (!selected) return [];
    const term = q.trim().toLowerCase();
    return selected.shades.filter(
      (s) =>
        !(stockOnly && s.stock <= 0) &&
        !(term && !(s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term)))
    );
  }, [selected, q, stockOnly]);

  return (
    <div className="container shades-page">
      <div className="breadcrumb">
        <Link to="/">হোম</Link>
        <ChevronRight size={13} />
        <span>শেড কালেকশন</span>
      </div>
      <div className="shade-page-hero">
        <div>
          <span className="section-kicker">
            <Palette size={15} /> মনের মতো রঙ, নিজের মতো সৃষ্টি
          </span>
          <h1>আপনার রঙের ছোট্ট পৃথিবী।</h1>
          <p>একই সুতার সব শেড একসাথে। রঙ বাছুন, কোড মিলিয়ে নিন, তারপর বুনুন মনের আনন্দে।</p>
        </div>
        <div className="decorative-swatches">
          {['#829171', '#d39c90', '#e2d3b3', '#c3a155', '#9cb5c4', '#aea1bd'].map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="shade-management-entry">
        <span>দোকানের শেডের ছবি পরিবর্তন করতে চান?</span>
        <Link
          to={`/admin/shades${selected ? `?product=${encodeURIComponent(selected.id)}` : ''}`}
          className="text-link"
        >
          মার্চেন্ট: শেডের ছবি আপলোড <ArrowRight size={15} />
        </Link>
      </div>
      <div className="shade-product-tabs">
        {yarnProducts.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={p.id === selected?.id ? 'active' : ''}
          >
            <img src={p.image} alt="" />
            <span>
              {p.name}
              <small>
                {fmt(p.shades.length)}টি শেড · {money(p.price)}
              </small>
            </span>
            {p.id === selected?.id && <Check size={17} />}
          </button>
        ))}
      </div>
      {selected && (
        <>
          <div className="shade-toolbar">
            <div>
              <h2>{selected.name}</h2>
              <p>{fmt(shades.length)}টি শেড দেখানো হচ্ছে · পছন্দের রঙে ক্লিক করুন</p>
            </div>
            <div className="shade-tools">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={stockOnly}
                  onChange={(e) => setStockOnly(e.target.checked)}
                />{' '}
                স্টকে আছে
              </label>
              <div className="input-with-icon">
                <Search size={16} />
                <input
                  aria-label="শেড খুঁজুন"
                  placeholder="রঙ বা শেড কোড খুঁজুন"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="shade-library-grid">
            {shades.map((s) => (
              <button
                key={s.id}
                className="shade-library-card"
                onClick={() => setSelectedProduct({ id: selected.id, shadeId: s.id })}
              >
                <div className="shade-big-swatch" style={{ background: s.color }}>
                  {s.image ? (
                    <img className="shade-yarn-photo" src={s.image} alt={`${s.name} সুতার ছবি`} loading="lazy" />
                  ) : (
                    <BrandMark size={68} />
                  )}
                  <span>
                    <ArrowRight size={19} />
                  </span>
                </div>
                <div>
                  <strong>{s.name}</strong>
                  <small>{s.code}</small>
                  <span className={`stock-label ${s.stock === 0 ? 'out' : ''}`}>
                    <i />
                    {s.stock > 0 ? `${fmt(s.stock)}টি স্টকে আছে` : 'স্টকে নেই'}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {shades.length === 0 && (
            <EmptyState title="এই নামে কোনো শেড নেই" text="অন্য রঙ বা শেড কোড দিয়ে খুঁজুন।" />
          )}
          <p className="color-disclaimer">
            রঙের কথা: স্ক্রিনের সেটিংস ও আলোর কারণে বাস্তব রঙে সামান্য পার্থক্য হতে পারে। একই প্রজেক্টের
            জন্য একসাথে প্রয়োজনীয় সুতা অর্ডার করুন।
          </p>
        </>
      )}
    </div>
  );
}

export function AboutPage() {
  const { settings, setPanel } = useStore();
  return (
    <div className="container about-page">
      <div className="breadcrumb">
        <Link to="/">হোম</Link>
        <ChevronRight size={13} />
        <span>আমাদের গল্প</span>
      </div>
      <div className="about-hero">
        <div>
          <span className="section-kicker">শখের বুননে, ভালোবাসার গল্প</span>
          <h1>
            হাতে বোনা প্রতিটি সৃষ্টিতে,
            <br />
            <em>থাকুক আপনার গল্প।</em>
          </h1>
          <p>{settings.about}</p>
          <Link to="/shop" className="button primary">
            আপনার গল্প শুরু হোক <ArrowRight size={17} />
          </Link>
        </div>
        <img src={settings.heroImage} alt="কুশি শিল্পের ভালোবাসায় বেছে নেওয়া সুতার ঝুড়ি" />
      </div>
      <div className="about-values">
        <div>
          <Palette />
          <h3>শখের প্রতি ভালোবাসা</h3>
          <p>ছোট্ট একটি সৃষ্টিও এনে দিতে পারে অনেক আনন্দ। সেই আনন্দের সঙ্গী হতে চাই আমরা।</p>
        </div>
        <div>
          <Palette />
          <h3>রঙের স্বাধীনতা</h3>
          <p>মনের মতো শেড খুঁজে পাওয়া এখন সহজ। প্রতিটি রঙের আলাদা কোড ও স্টকের তথ্য।</p>
        </div>
        <div>
          <Check />
          <h3>যত্নে বাছাই</h3>
          <p>আপনার সৃষ্টির উপকরণগুলো বেছে নিই যত্ন করে, যেন বুননের প্রতিটি মুহূর্ত হয় সুন্দর।</p>
        </div>
      </div>
      <div className="contact-section">
        <span className="section-kicker">আপনার পাশে</span>
        <h2>নতুন শুরুতে সাহায্য লাগবে?</h2>
        <p>ডেলিভারি, শেড বা অর্ডার সম্পর্কে আপনার প্রশ্নের উত্তর জানুন।</p>
        {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
        <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>{settings.phone}</a>
        <a href={whatsappLink(undefined, settings.phone)} target="_blank" rel="noopener noreferrer">
          WhatsApp: {settings.phone}
        </a>
        <span>{settings.address}</span>
        <button className="button secondary" onClick={() => setPanel('help')}>
          সাধারণ জিজ্ঞাসা
        </button>
      </div>
    </div>
  );
}
