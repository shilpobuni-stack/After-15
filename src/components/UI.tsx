import { useEffect, useRef, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  Heart,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { fmt, money, totalStock, type Product } from '../lib/types';

export function BrandMark({ size = 47 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <path d="M18 14 10 3M27 12 23 2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="25" cy="29" r="17" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10 23c7-3 19 1 28 14M13 17c11-1 21 7 28 15M20 13c10 3 15 8 21 15M9 30c10-5 21 0 26 11M11 37c8-5 14-4 20 8M33 15c-5 3-8 7-11 12M39 21c-5 2-8 5-11 10M17 43c1-6 4-11 8-14M39 39c7 0 10 3 6 7-5 5-12 0-7-4 4-3 8 7 14 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Modal({
  title,
  children,
  onClose,
  className = '',
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    const active = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const nodes = Array.from(
          ref.current?.querySelectorAll(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
          ) ?? []
        ).filter((el) => (el as HTMLElement).offsetParent !== null) as HTMLElement[];
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      active?.focus?.();
    };
  }, []);

  return (
    <div
      className={`modal-backdrop ${drawer ? 'drawer-backdrop' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${drawer ? 'drawer' : 'modal'} ${className}`}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="বন্ধ করুন">
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  description,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} className="confirm-modal">
      <div className="confirm-icon">
        <Trash2 size={30} strokeWidth={1.4} />
      </div>
      <p>{description}</p>
      <div className="confirm-buttons">
        <button className="button secondary" onClick={onClose} type="button">
          বাতিল
        </button>
        <button className="button primary" onClick={onConfirm} type="button">
          হ্যাঁ, মুছে ফেলুন
        </button>
      </div>
    </Modal>
  );
}

export function Quantity({
  value,
  onChange,
  max = 99,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="quantity">
      <button aria-label="পরিমাণ কমান" disabled={value <= 1} onClick={() => onChange(value - 1)} type="button">
        <Minus size={15} />
      </button>
      <span>{fmt(value)}</span>
      <button aria-label="পরিমাণ বাড়ান" disabled={value >= max} onClick={() => onChange(value + 1)} type="button">
        <Plus size={15} />
      </button>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { wishlist, toggleWish, setSelectedProduct, addToCart, categories } = useStore();
  const wished = wishlist.includes(product.id);
  return (
    <article className="product-card">
      <div className="product-photo">
        <button
          className="product-image-button"
          onClick={() => setSelectedProduct({ id: product.id })}
          aria-label={`${product.name} বিস্তারিত দেখুন`}
        >
          <img loading="lazy" src={product.image} alt={product.name} />
        </button>
        {product.badge && (
          <span className={`product-badge ${product.badge === 'নতুন' ? 'new' : ''}`}>
            {product.badge === 'বেস্টসেলার' && <span>✧</span>} {product.badge}
          </span>
        )}
        <button
          className={`wish-button ${wished ? 'is-wished' : ''}`}
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? 'পছন্দ থেকে সরান' : 'পছন্দের তালিকায় রাখুন'}
        >
          <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
        </button>
        <button className="quick-view" onClick={() => setSelectedProduct({ id: product.id })}>
          একটু দেখে নিন <ArrowRight size={15} />
        </button>
      </div>
      <div className="product-info">
        <div className="product-meta">
          <span>{categories.find((c) => c.id === product.category)?.name}</span>
        </div>
        <button className="product-title" onClick={() => setSelectedProduct({ id: product.id })}>
          {product.name}
        </button>
        {product.shades.length ? (
          <div className="card-shades">
            {product.shades.slice(0, 5).map((s) => (
              <button
                key={s.id}
                className={product.variantLabel === 'সাইজ' ? 'size-pill' : s.image ? 'photo-swatch' : ''}
                style={product.variantLabel === 'সাইজ' ? { width: 'auto', minWidth: 36, padding: '3px 7px', borderRadius: 999, background: '#fff1f2', color: '#9f1239', fontSize: 11, border: '1px solid #fecdd3' } : { background: s.color }}
                title={`${s.name} · ${s.code}`}
                aria-label={`${s.name} ${product.variantLabel === 'সাইজ' ? 'সাইজ' : 'শেড'} দেখুন`}
                onClick={() => setSelectedProduct({ id: product.id, shadeId: s.id })}
              >
                {product.variantLabel === 'সাইজ' ? s.name : s.image && <img src={s.image} alt="" loading="lazy" />}
              </button>
            ))}
            <button className="more-shades" onClick={() => setSelectedProduct({ id: product.id })}>
              {product.shades.length > 5 ? `+${fmt(product.shades.length - 5)}` : fmt(product.shades.length)} {product.variantLabel === 'সাইজ' ? 'সাইজ' : 'শেড'}
            </button>
          </div>
        ) : (
          <div className="product-stock">
            <Check size={13} /> {totalStock(product) > 0 ? 'আপনার সৃষ্টির জন্য প্রস্তুত' : 'এই মুহূর্তে স্টকে নেই'}
          </div>
        )}
        <div className="product-bottom">
          <div className="price">
            <strong>{money(product.price)}</strong>
            {product.oldPrice > product.price && <del>{money(product.oldPrice)}</del>}
          </div>
          <button
            className="mini-cart"
            disabled={totalStock(product) === 0}
            aria-label={`${product.name} ${product.shades.length ? `${product.variantLabel === 'সাইজ' ? 'সাইজ' : 'শেড'} বাছুন` : 'ব্যাগে যোগ করুন'}`}
            onClick={() => (product.shades.length ? setSelectedProduct({ id: product.id }) : addToCart(product, '', 1))}
          >
            <ShoppingBag size={17} />
            <span>{product.shades.length ? `${product.variantLabel === 'সাইজ' ? 'সাইজ' : 'শেড'} বেছে কিনুন` : 'ব্যাগে যোগ করুন'}</span>
            <Plus size={11} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function EmptyState({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Package size={34} strokeWidth={1.3} />
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function ToggleField({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="toggle-field">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`toggle ${value ? 'on' : ''}`}
      >
        <span />
      </button>
    </label>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return <span className={`status-pill ${active ? 'active' : 'inactive'}`}>{active ? 'সক্রিয়' : 'লুকানো'}</span>;
}
