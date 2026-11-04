type Item = { id: string; name: string; price: number; quantity: number };

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type TrackData = {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  items?: Item[];
  value?: number;
  orderId?: string;
};

const GA_EVENTS = {
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
} as const;

export function track(event: keyof typeof GA_EVENTS, data: TrackData) {
  if (typeof window === 'undefined') return;
  try {
    const items: Item[] =
      data.items ||
      (data.id ? [{ id: data.id, name: data.name || '', price: data.price || 0, quantity: data.quantity || 1 }] : []);
    const value = data.value ?? items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    window.fbq?.('track', event, {
      content_ids: items.map((i) => i.id),
      content_type: 'product',
      contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
      value,
      currency: 'BDT',
    });
    window.gtag?.('event', GA_EVENTS[event], {
      currency: 'BDT',
      value,
      transaction_id: data.orderId,
      items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
    });
  } catch {
    /* tracking must never break the shop */
  }
  }
