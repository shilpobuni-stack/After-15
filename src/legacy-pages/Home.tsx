import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Palette, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useStore } from '../lib/store';
import { BrandMark, ProductCard } from '../components/UI';
import { fmt, money } from '../lib/types';

export default function Home() {
  const { settings, categories, products } = useStore();
  const [tab, setTab] = useState('popular');
  const shadeCount = new Set(
    products.filter((p) => p.active && p.variantLabel !== 'সাইজ').flatMap((p) => p.shades.map((s) => s.code))
  ).size;
  const featured = products
    .filter((p) =>
      p.active &&
      (tab === 'new'
        ? p.badge === 'নতুন'
        : tab === 'cotton'
          ? ['cotton', 'wool'].includes(p.category)
          : tab === 'tools'
            ? ['hooks', 'tools'].includes(p.category)
            : p.featured)
    )
    .slice(0, settings.featuredCount);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> {settings.heroEyebrow}
            </div>
            <h1>
              {settings.heroTitle}
              <br />
              <em>
                {settings.heroAccent}
                <svg viewBox="0 0 420 15" fill="none" aria-hidden="true">
                  <path
                    d="M2 9c92-10 273-9 414-3M30 14c121-10 251-8 360-5"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </em>
            </h1>
            <p>{settings.heroDescription}</p>
            <div className="hero-buttons">
              <Link className="button primary" to="/shop">
                {settings.heroButtonText} <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" to="/shades">
                <Palette size={18} /> শেড কালেকশন
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <MapPin size={16} /> সারা দেশে হোম ডেলিভারি
              </span>
              <span>
                <ShieldCheck size={16} /> COD · বিকাশ · নগদ
              </span>
              <span>
                <Palette size={16} /> {fmt(shadeCount)}টি মনের মতো শেড
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-frame">
              <img
                className="hero-photo"
                src={settings.heroImage}
                alt="রঙিন সুতা ও কুশি কাঁটার কালেকশন"
                fetchPriority="high"
              />
              <div className="image-soft-overlay" />
            </div>
            <div className="handmade-stamp">
              <span>HANDPICKED</span>
              <BrandMark size={33} />
              <span>WITH LOVE</span>
            </div>
            <div className="hero-floating-card">
              <span className="floating-icon">
                <Palette size={23} />
              </span>
              <div>
                <strong>এক সুতা, অসংখ্য সম্ভাবনা</strong>
                <small>পছন্দের শেডে বুনুন নিজের গল্প</small>
              </div>
              <span className="floating-swatches">
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="hero-sparkle">✧</div>
            <svg className="thread-decoration" viewBox="0 0 115 97" fill="none" aria-hidden="true">
              <path
                d="M110 90C34 91 58 55 40 32 25 13 2 36 18 47 39 62 63 17 34 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 5"
              />
            </svg>
          </div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="container trust-items">
          <div>
            <MapPin size={21} />
            <span>
              <strong>দেশজুড়ে ডেলিভারি</strong>
              <small>ঢাকায় {money(settings.inside)} থেকে</small>
            </span>
          </div>
          <div>
            <ShieldCheck size={21} />
            <span>
              <strong>মানসম্মত উপকরণ</strong>
              <small>যত্নে বেছে নেওয়া সুতা</small>
            </span>
          </div>
          <Link to="/shades">
            <Palette size={21} />
            <span>
              <strong>শেড কালেকশন</strong>
              <small>{fmt(shadeCount)}টি শেড ঘুরে দেখুন</small>
            </span>
          </Link>
          <div>
            <ShieldCheck size={21} />
            <span>
              <strong>ভালোবাসায় প্যাক করা</strong>
              <small>আপনার শখের সঙ্গী</small>
            </span>
          </div>
        </div>
      </div>

      {settings.showCategories && (
        <section className="section categories-section container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">আপনার শখের ঠিকানা</span>
              <h2>{settings.categoriesTitle}</h2>
            </div>
            <Link className="text-link" to="/shop">
              সব ক্যাটাগরি <ArrowRight size={16} />
            </Link>
          </div>
          <div className="category-grid">
            {categories.map((c, i) => (
              <Link key={c.id} to={`/shop?category=${c.id}`} className={`category-card category-${i % 6}`}>
                <div className="category-image">
                  <img loading="lazy" src={c.image} alt={c.name} />
                  <span className="category-arrow">
                    <ArrowRight size={17} />
                  </span>
                </div>
                <h3>{c.name}</h3>
                <span>
                  {fmt(products.filter((p) => p.active && p.category === c.id).length)}টি পণ্য{' '}
                  <Sparkles size={12} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section featured-section container">
        <div className="section-heading">
          <div>
            <span className="section-kicker">আপনাদের পছন্দ, আমাদের ভালোবাসা</span>
            <h2>
              {settings.featuredTitle} <span className="heading-sparkle">✧</span>
            </h2>
          </div>
          <Link className="text-link" to="/shop">
            সব পণ্য দেখুন <ArrowRight size={16} />
          </Link>
        </div>
        <div className="product-filter-tabs">
          {(
            [
              ['popular', 'সবচেয়ে জনপ্রিয়'],
              ['new', 'নতুন এসেছে'],
              ['cotton', 'সুতা কালেকশন'],
              ['tools', 'কুশি ও টুলস'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {id === 'popular' && <Star size={14} />} {label}
            </button>
          ))}
          <span className="filter-caption">আপনার পরের সৃষ্টির জন্য, যত্নে বাছাই করা</span>
        </div>
        <div className="product-grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {featured.length === 0 && (
          <p className="empty-inline">এই কালেকশনে নতুন পণ্য শিগগিরই আসছে।</p>
        )}
      </section>

      {settings.showShades && (
        <section className="container shade-feature">
          <div className="shade-feature-copy">
            <span className="section-kicker">
              <Palette size={15} /> রঙের জগতে, একটু হারিয়ে যান
            </span>
            <h2 style={{ whiteSpace: 'pre-line' }}>{settings.shadeTitle}</h2>
            <p>{settings.shadeDescription}</p>
            <Link className="button primary" to="/shades">
              শেড কালেকশন ঘুরে দেখুন <ArrowRight size={17} />
            </Link>
            <span className="shade-feature-note">
              <span /> আলাদা শেড কোড <span /> প্রতিটি শেডের স্টক দেখুন
            </span>
          </div>
          <div className="shade-feature-image">
            <img
              loading="lazy"
              src={settings.shadeImage}
              alt="পৃথিবীর রঙে সাজানো সুতার শেড কালেকশন"
            />
            <span className="shade-photo-tag">
              <Palette size={16} /> রঙেই হোক নিজের পরিচয়
            </span>
          </div>
        </section>
      )}

      {settings.showStory && (
        <section className="container story-teaser">
          <div className="story-symbol">
            <BrandMark size={75} />
            <span>made with love</span>
          </div>
          <div>
            <span className="section-kicker">শুধু একটি দোকান নয়</span>
            <h2>{settings.storyTitle}</h2>
            <p>{settings.about}</p>
          </div>
          <Link className="text-link" to="/about">
            আমাদের গল্প <ArrowRight size={18} />
          </Link>
        </section>
      )}

      {settings.showDelivery && (
        <section className="container delivery-banner">
          <div className="delivery-banner-icon">
            <MapPin size={34} strokeWidth={1.4} />
          </div>
          <div>
            <h3>আপনার সৃষ্টির উপকরণ, পৌঁছে যাবে আপনার কাছে।</h3>
            <p>
              ঢাকায় {money(settings.inside)}, ঢাকার বাইরে {money(settings.outside)} থেকে।{' '}
              ডেলিভারি চার্জ চেকআউটে স্বয়ংক্রিয়ভাবে যোগ হবে।
            </p>
          </div>
          <Link className="button secondary" to="/shop">
            পণ্য দেখুন
          </Link>
        </section>
      )}
    </>
  );
}
