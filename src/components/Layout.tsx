import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  ChevronDown,
  Facebook,
  Heart,
  Home,
  Instagram,
  LayoutGrid,
  Menu,
  MessageCircle,
  Package,
  Palette,
  Phone,
  Rocket,
  Search,
  ShoppingBag,
  Smartphone,
  Sparkles,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { BrandMark } from './UI';
import { Overlays } from './Overlays';
import { PolicyModal, type PolicyKind } from './PolicyModal';
import { fmt, money, whatsappLink } from '../lib/types';

export function Layout() {
  const { settings, cart, wishlist, setPanel, categories, products, panel } = useStore();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [policy, setPolicy] = useState<PolicyKind | null>(null);
  const navigate = useNavigate();
  const bagCount = cart.reduce((a, c) => a + c.quantity, 0);
  const bagTotal = cart.reduce(
  (a, c) => a + (products.find((p) => p.id === c.productId)?.price ?? 0) * c.quantity,
  0
);
    const [dialOpen, setDialOpen] = useState(false);
  const [bagNudge, setBagNudge] = useState(false);
  const hasBag = bagCount > 0;
  useEffect(() => {
    if (!hasBag) return;
    const t = setInterval(() => {
      setBagNudge(true);
      setTimeout(() => setBagNudge(false), 1600);
    }, 30000);
    return () => clearInterval(t);
  }, [hasBag]);
  const fbUrl = settings.facebookUrl || '';
  const fbId = fbUrl.match(/[?&]id=(\d+)/)?.[1];
  const fbName = fbUrl.replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop();
  const messengerUrl = fbUrl ? `https://m.me/${fbId || fbName}` : '';
  
  const year = new Date().getFullYear();

  return (
    <>
      {settings.announcementEnabled && (
        <div className="announcement">
          <div className="container announcement-inner">
            <span>
              <Sparkles size={13} />
              {settings.announcement}
              {settings.freeThreshold > 0 && (
                <>
                  {' '}
                  <span className="announcement-divider">|</span> {money(settings.freeThreshold)}+ অর্ডারে
                  ফ্রি ডেলিভারি
                </>
              )}
            </span>
            <button onClick={() => setPanel('orders')}>
              অর্ডার ট্র্যাক করুন <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      <header className="site-header">
        <div className="container main-header">
          <button
            className="icon-button mobile-menu-button"
            aria-label="মেনু খুলুন"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
          <Link to="/" className="brand" aria-label={`${settings.name} হোম`}>
            <span className="reference-brand-mark" aria-hidden="true">
              <BrandMark size={27} />
            </span>
            <span>
              <strong>{settings.name}</strong>
              <small>{settings.tagline}</small>
            </span>
          </Link>
          <form
            className="header-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/shop?q=${encodeURIComponent(query)}`);
              setMobileOpen(false);
            }}
          >
            <Search size={19} />
            <input
              aria-label="পণ্য খুঁজুন"
              placeholder="আপনার পছন্দের সুতা, শেড বা কুশি কাঁটা খুঁজুন..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button aria-label="সার্চ করুন" type="submit">
              <Search size={17} />
            </button>
          </form>
          <div className="header-actions">
            <button
              className="icon-button account-button"
              aria-label="আমার অর্ডার"
              onClick={() => setPanel('orders')}
            >
              <User size={21} />
            </button>
            <button
              className="icon-button heart-header"
              aria-label="পছন্দের পণ্য"
              onClick={() => setPanel('wishlist')}
            >
              <Heart size={21} />
              {wishlist.length > 0 && <span className="tiny-count">{fmt(wishlist.length)}</span>}
            </button>
            <span className="action-divider" />
            <button
              className="bag-button"
              onClick={() => setPanel('cart')}
              aria-label={`শপিং ব্যাগ, ${bagCount}টি পণ্য`}
            >
              <span className="bag-icon">
                <ShoppingBag size={22} />
                <b>{fmt(bagCount)}</b>
              </span>
              <span>আমার ব্যাগ</span>
            </button>
          </div>
        </div>

        <div className={`nav-shell ${mobileOpen ? 'mobile-open' : ''}`}>
          <div className="container navigation">
            <div className="nav-links">
              <div className="category-dropdown">
                <button
                  className="category-toggle"
                  onClick={() => setCatOpen(!catOpen)}
                  aria-expanded={catOpen}
                >
                  <Menu size={17} /> সব ক্যাটাগরি <ChevronDown size={14} />
                </button>
                {catOpen && (
                  <>
                    <button
                      className="dropdown-dismiss"
                      aria-label="ক্যাটাগরি বন্ধ করুন"
                      onClick={() => setCatOpen(false)}
                    />
                    <div className="category-menu">
                      {categories.map((c) => (
                        <Link
                          key={c.id}
                          to={`/shop?category=${c.id}`}
                          onClick={() => {
                            setCatOpen(false);
                            setMobileOpen(false);
                          }}
                        >
                          <img src={c.image} alt="" />
                          {c.name}
                          <ArrowRight size={15} />
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <NavLink to="/" end onClick={() => setMobileOpen(false)}>
                হোম
              </NavLink>
              <NavLink to="/shop" onClick={() => setMobileOpen(false)}>
                সব পণ্য
              </NavLink>
              <NavLink to="/shades" onClick={() => setMobileOpen(false)}>
                শেড কালেকশন <span className="nav-new">নতুন</span>
              </NavLink>
              <NavLink to="/shop?filter=new" className="new-link" onClick={() => setMobileOpen(false)}>
                নতুন এসেছে
              </NavLink>
              <NavLink to="/about" onClick={() => setMobileOpen(false)}>
                আমাদের গল্প
              </NavLink>
            </div>
            <Link className="admin-link" to="/admin">
              <Package size={15} /> অ্যাডমিন প্যানেল <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <section className="bottom-promise">
        <div className="container promises">
          <div>
            <MapPin />
            <span>
              <strong>দেশজুড়ে ডেলিভারি</strong>
              <small>যত্ন করে পৌঁছে দিই আপনার কাছে</small>
            </span>
          </div>
          <div>
            <Palette />
            <span>
              <strong>{fmt(shadeCount)}টি শেডের সমাহার</strong>
              <small>প্রতিটি সৃষ্টির জন্য মনের মতো রঙ</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <strong>যত্নে বাছাই করা উপকরণ</strong>
              <small>আপনার শখের সাথে আপস নয়</small>
      <footer className="site-footer">
        <div className="container sf-top">
          <div className="sf-brand">
            <Link to="/" className="brand">
              <span className="reference-brand-mark" aria-hidden="true">
                <BrandMark size={27} />
              </span>
              <span>
                <strong>{settings.name}</strong>
                <small>{settings.tagline}</small>
              </span>
            </Link>
            <p>একটুখানি শখ, একরাশ রঙ, আর অনেকখানি ভালোবাসা।</p>
          </div>
          <nav className="sf-cols" aria-label="ফুটার">
            <div>
              <h4>ঘুরে দেখুন</h4>
              <Link to="/shop">সব পণ্য</Link>
              <Link to="/shades">শেড কালেকশন</Link>
              <Link to="/shop?filter=new">নতুন এসেছে</Link>
              <Link to="/about">আমাদের গল্প</Link>
            </div>
            <div>
              <h4>সহায়তা ও নীতি</h4>
              <button type="button" onClick={() => setPanel('orders')}>আমার অর্ডার</button>
              <button type="button" onClick={() => setPanel('help')}>সাধারণ জিজ্ঞাসা</button>
              <button type="button" onClick={() => setPolicy('privacy')}>গোপনীয়তা নীতি</button>
              <button type="button" onClick={() => setPolicy('terms')}>ব্যবহারের শর্তাবলি</button>
              <button type="button" onClick={() => setPolicy('return')}>ফেরত নীতি</button>
              <button type="button" onClick={() => setPolicy('shipping')}>শিপিং নীতি</button>
            </div>
          </nav>
          <div className="sf-contact">
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>
              <Phone size={15} /> {fmt(settings.phone)}
            </a>
            <a href={whatsappLink(undefined, settings.whatsappNumber || settings.phone)} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={15} /> WhatsApp
            </a>
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer">
                <Facebook size={15} /> Facebook
              </a>
            )}
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
                <Instagram size={15} /> Instagram
              </a>
            )}
          </div>
        </div>
        <div className="container sf-pay">
          <span>পেমেন্ট:</span>
          <i className="cod"><Banknote size={14} /> ক্যাশ অন ডেলিভারি (COD)</i>
          <i className="bkash"><Wallet size={14} /> বিকাশ</i>
          <i className="nagad"><Smartphone size={14} /> নগদ</i>
          <i className="rocket"><Rocket size={14} /> রকেট</i>
        </div>
        <div className="container footer-bottom">
          <span>
            © {fmt(year)} {settings.name} । সর্বস্বত্ব সংরক্ষিত।
          </span>
          <span>
            বাংলাদেশে ভালোবাসায় তৈরি <Heart size={11} />
          </span>
          <Link to="/admin">
            স্টোর পরিচালনা <ArrowRight size={12} />
          </Link>
        </div>
      </footer>

      <nav className="mobile-store-nav" aria-label="মোবাইল নেভিগেশন">
        <NavLink to="/" end>
          <Home size={20} />
          <span>হোম</span>
        </NavLink>
        <NavLink to="/shop">
          <LayoutGrid size={20} />
          <span>পণ্য</span>
        </NavLink>
                <NavLink to="/shades">
          <Palette size={20} />
          <span>শেড</span>
        </NavLink>
        <button onClick={() => setPanel('orders')} aria-label="মোবাইল অর্ডার ট্র্যাক">
          <Package size={20} />
          <span>ট্র্যাক</span>
        </button>
      </nav>
      {bagCount > 0 && panel !== 'cart' && (
        <button
          key={bagCount}
          type="button"
          className={`floating-bag ${bagNudge ? 'nudge' : ''}`}
          onClick={() => setPanel('cart')}
          aria-label={`ব্যাগ খুলুন, ${bagCount}টি পণ্য`}
        >
          <span className="fb-icon">
            <ShoppingBag size={22} />
            <i>{fmt(bagCount)}</i>
          </span>
          <span className="floating-bag-text">
            <strong>আমার ব্যাগ</strong>
            <small>{money(bagTotal)}</small>
          </span>
          <span className="fb-go">
            দেখুন <ArrowRight size={15} />
          </span>
        </button>
      )}
            <div className={`help-dial ${dialOpen ? 'open' : ''}`}>
        <div className="help-dial-items">
          <a
            className="dial-item dial-wa"
            href={whatsappLink(undefined, settings.phone)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setDialOpen(false)}
          >
            <span>WhatsApp</span>
            <b>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </b>
          </a>
                    <a
            className="dial-item dial-call"
            href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
            onClick={() => setDialOpen(false)}
          >
            <span>কল করুন</span>
            <b>
              <Phone size={22} />
            </b>
          </a>
          {messengerUrl && (
            <a
              className="dial-item dial-ms"
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDialOpen(false)}
            >
              <span>মেসেঞ্জার</span>
              <b>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.13.26.35.27.57l.05 1.78c.04.57.61.94 1.13.71l1.98-.87c.17-.07.36-.09.53-.04.91.25 1.87.38 2.9.38 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm6 7.46l-2.94 4.67c-.47.74-1.47.93-2.18.4l-2.34-1.75a.6.6 0 00-.72 0l-3.16 2.4c-.42.32-.97-.19-.69-.64l2.94-4.67c.47-.74 1.47-.93 2.18-.4l2.34 1.75c.22.16.5.16.72 0l3.16-2.4c.42-.32.97.19.69.64z" />
                </svg>
              </b>
            </a>
          )}
          <button
            type="button"
            className="dial-item dial-faq"
            onClick={() => {
              setDialOpen(false);
              setPanel('help');
            }}
          >
            <span>সাধারণ জিজ্ঞাসা</span>
            <b>?</b>
          </button>
        </div>
        <button
          type="button"
          className="help-dial-main"
          aria-label="সহায়তা"
          aria-expanded={dialOpen}
          onClick={() => setDialOpen((o) => !o)}
        >
          {dialOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>
      <Overlays />
      {policy && <PolicyModal kind={policy} onClose={() => setPolicy(null)} />}
    </>
  );
}
