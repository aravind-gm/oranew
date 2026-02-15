/**
 * ═══════════════════════════════════════════════════════════════════════
 * ORA Jewellery — Phase 2C: Full-Funnel Conversion Tracking
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Unified analytics layer for GA4 + Meta Pixel.
 * Fires structured eCommerce events to both platforms simultaneously.
 *
 * Features:
 *   ✓ GA4 standard eCommerce schema
 *   ✓ Meta Pixel standard events
 *   ✓ window.dataLayer push for GTM compatibility
 *   ✓ Duplicate purchase prevention (sessionStorage)
 *   ✓ Enhanced Conversions (SHA-256 hashed PII)
 *   ✓ Debug mode via NEXT_PUBLIC_ANALYTICS_DEBUG=true
 *   ✓ Graceful failure — never crashes if IDs missing
 */

// ── Types ─────────────────────────────────────────────────────────────

/** Standard GA4 eCommerce item */
interface GA4Item {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
}

interface ViewItemParams {
  id: string;
  name: string;
  price: number;
  category?: string;
}

interface AddToCartParams {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface CartParams {
  items: Array<{
    id: string;
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  total: number;
}

interface PaymentInfoParams {
  orderId: string;
  total: number;
  paymentMethod?: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
}

interface PurchaseParams {
  orderId: string;
  orderNumber?: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
}

interface EnhancedConversionsData {
  email?: string;
  phone?: string;
}

// ── Globals ───────────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

// ── Debug Logging ─────────────────────────────────────────────────────

const IS_DEBUG =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';

function debugLog(eventName: string, payload: Record<string, unknown>) {
  if (!IS_DEBUG) return;
  console.log(
    `%c[Analytics] ${eventName}`,
    'color: #D4AF77; font-weight: bold;',
    payload
  );
}

// ── SHA-256 Hashing (Enhanced Conversions) ────────────────────────────

async function sha256(value: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(value.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
}

// ── DataLayer Push ────────────────────────────────────────────────────

function pushToDataLayer(event: string, data: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ecommerce: null }); // clear previous
  window.dataLayer.push({ event, ecommerce: data });
}

// ── Core Dispatchers ──────────────────────────────────────────────────

function fireGA4(eventName: string, params: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
    }
  } catch {
    // GA4 not loaded — silent fail
  }
}

function fireFBQ(eventName: string, params: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, params);
    }
  } catch {
    // Meta Pixel not loaded — silent fail
  }
}

// ── Duplicate Purchase Guard ──────────────────────────────────────────

const PURCHASE_STORAGE_KEY = 'ora_tracked_purchases';

function isPurchaseTracked(orderId: string): boolean {
  try {
    const tracked = sessionStorage.getItem(PURCHASE_STORAGE_KEY);
    if (!tracked) return false;
    const ids: string[] = JSON.parse(tracked);
    return ids.includes(orderId);
  } catch {
    return false;
  }
}

function markPurchaseTracked(orderId: string): void {
  try {
    const tracked = sessionStorage.getItem(PURCHASE_STORAGE_KEY);
    const ids: string[] = tracked ? JSON.parse(tracked) : [];
    ids.push(orderId);
    sessionStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // sessionStorage unavailable — silent
  }
}

// ── Helper: Build GA4 items array ─────────────────────────────────────

function toGA4Items(
  items: Array<{ id: string; name: string; price: number; quantity: number; category?: string }>
): GA4Item[] {
  return items.map((item) => ({
    item_id: item.id,
    item_name: item.name,
    price: Number(item.price) || 0,
    quantity: item.quantity,
    item_category: item.category || 'Jewellery',
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API — Full-Funnel Events
// ═══════════════════════════════════════════════════════════════════════

/** Generic event (for backward compat / custom events) */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  const safeParams = params || {};
  debugLog(eventName, safeParams);

  fireGA4(eventName, safeParams);

  // Map GA4 event names to FB standard events
  const fbEventMap: Record<string, string> = {
    page_view: 'PageView',
    view_item: 'ViewContent',
    add_to_cart: 'AddToCart',
    view_cart: 'CustomizeProduct', // closest FB standard
    begin_checkout: 'InitiateCheckout',
    add_payment_info: 'AddPaymentInfo',
    purchase: 'Purchase',
    search: 'Search',
    add_to_wishlist: 'AddToWishlist',
  };

  const fbEvent = fbEventMap[eventName];
  if (fbEvent) {
    fireFBQ(fbEvent, safeParams);
  }

  pushToDataLayer(eventName, safeParams);
}

// ── Page View ─────────────────────────────────────────────────────────

/** Track page view (fires on route change) */
export function trackPageView(url?: string) {
  const path = url || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const payload = { page_path: path, page_location: typeof window !== 'undefined' ? window.location.href : '' };

  debugLog('page_view', payload);
  fireGA4('page_view', payload);
  fireFBQ('PageView', {});
  pushToDataLayer('page_view', payload);
}

// ── View Item (Product Page) ──────────────────────────────────────────

export function trackViewItem({ id, name, price, category }: ViewItemParams) {
  const ga4Payload = {
    currency: 'INR',
    value: Number(price) || 0,
    items: toGA4Items([{ id, name, price, quantity: 1, category }]),
  };

  const fbPayload = {
    content_ids: [id],
    content_name: name,
    content_type: 'product',
    content_category: category || 'Jewellery',
    value: Number(price) || 0,
    currency: 'INR',
  };

  debugLog('view_item', { ga4: ga4Payload, fb: fbPayload });
  fireGA4('view_item', ga4Payload);
  fireFBQ('ViewContent', fbPayload);
  pushToDataLayer('view_item', ga4Payload);
}

// ── Add to Cart ───────────────────────────────────────────────────────

export function trackAddToCart({ id, name, price, quantity, category }: AddToCartParams) {
  const value = (Number(price) || 0) * quantity;

  const ga4Payload = {
    currency: 'INR',
    value,
    items: toGA4Items([{ id, name, price, quantity, category }]),
  };

  const fbPayload = {
    content_ids: [id],
    content_name: name,
    content_type: 'product',
    value,
    currency: 'INR',
    num_items: quantity,
  };

  debugLog('add_to_cart', { ga4: ga4Payload, fb: fbPayload });
  fireGA4('add_to_cart', ga4Payload);
  fireFBQ('AddToCart', fbPayload);
  pushToDataLayer('add_to_cart', ga4Payload);
}

// ── View Cart ─────────────────────────────────────────────────────────

export function trackViewCart({ items, total }: CartParams) {
  const ga4Payload = {
    currency: 'INR',
    value: total,
    items: toGA4Items(
      items.map((i) => ({
        id: i.productId || i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        category: i.category,
      }))
    ),
  };

  const fbPayload = {
    content_ids: items.map((i) => i.productId || i.id),
    content_type: 'product',
    value: total,
    currency: 'INR',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
  };

  debugLog('view_cart', { ga4: ga4Payload, fb: fbPayload });
  fireGA4('view_cart', ga4Payload);
  fireFBQ('CustomizeProduct', fbPayload); // FB doesn't have native view_cart
  pushToDataLayer('view_cart', ga4Payload);
}

// ── Begin Checkout ────────────────────────────────────────────────────

export function trackBeginCheckout({ items, total }: CartParams) {
  const ga4Payload = {
    currency: 'INR',
    value: total,
    items: toGA4Items(
      items.map((i) => ({
        id: i.productId || i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        category: i.category,
      }))
    ),
  };

  const fbPayload = {
    content_ids: items.map((i) => i.productId || i.id),
    content_type: 'product',
    value: total,
    currency: 'INR',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
  };

  debugLog('begin_checkout', { ga4: ga4Payload, fb: fbPayload });
  fireGA4('begin_checkout', ga4Payload);
  fireFBQ('InitiateCheckout', fbPayload);
  pushToDataLayer('begin_checkout', ga4Payload);
}

// ── Add Payment Info ──────────────────────────────────────────────────

export function trackAddPaymentInfo({ orderId, total, paymentMethod, items }: PaymentInfoParams) {
  const ga4Payload: Record<string, unknown> = {
    currency: 'INR',
    value: total,
    payment_type: paymentMethod || 'razorpay',
    ...(items && { items: toGA4Items(items) }),
  };

  const fbPayload = {
    value: total,
    currency: 'INR',
    content_category: 'payment',
    order_id: orderId,
  };

  debugLog('add_payment_info', { ga4: ga4Payload, fb: fbPayload });
  fireGA4('add_payment_info', ga4Payload);
  fireFBQ('AddPaymentInfo', fbPayload);
  pushToDataLayer('add_payment_info', ga4Payload);
}

// ── Purchase (with duplicate guard) ───────────────────────────────────

export function trackPurchase({
  orderId,
  orderNumber,
  total,
  subtotal,
  tax,
  shipping,
  items,
}: PurchaseParams): boolean {
  // ── Duplicate prevention ──
  if (isPurchaseTracked(orderId)) {
    debugLog('purchase [SKIPPED — already tracked]', { orderId });
    return false;
  }

  const ga4Payload = {
    transaction_id: orderNumber || orderId,
    currency: 'INR',
    value: total,
    tax,
    shipping,
    items: toGA4Items(items),
  };

  const fbPayload = {
    content_ids: items.map((i) => i.id),
    content_type: 'product',
    value: total,
    currency: 'INR',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    order_id: orderNumber || orderId,
  };

  debugLog('purchase', { ga4: ga4Payload, fb: fbPayload });
  fireGA4('purchase', ga4Payload);
  fireFBQ('Purchase', fbPayload);
  pushToDataLayer('purchase', { ...ga4Payload, subtotal });

  markPurchaseTracked(orderId);
  return true;
}

// ── Search ────────────────────────────────────────────────────────────

export function trackSearch(searchTerm: string) {
  const payload = { search_term: searchTerm };
  debugLog('search', payload);
  fireGA4('search', payload);
  fireFBQ('Search', { search_string: searchTerm });
  pushToDataLayer('search', payload);
}

// ── Add to Wishlist ───────────────────────────────────────────────────

export function trackAddToWishlist({ id, name, price, category }: ViewItemParams) {
  const ga4Payload = {
    currency: 'INR',
    value: Number(price) || 0,
    items: toGA4Items([{ id, name, price, quantity: 1, category }]),
  };

  const fbPayload = {
    content_ids: [id],
    content_name: name,
    content_type: 'product',
    value: Number(price) || 0,
    currency: 'INR',
  };

  debugLog('add_to_wishlist', { ga4: ga4Payload, fb: fbPayload });
  fireGA4('add_to_wishlist', ga4Payload);
  fireFBQ('AddToWishlist', fbPayload);
  pushToDataLayer('add_to_wishlist', ga4Payload);
}

// ── Enhanced Conversions (hashed PII) ─────────────────────────────────

/**
 * Send hashed email/phone for Enhanced Conversions.
 * Call this after login / at checkout when user info is available.
 */
export async function setEnhancedConversions({ email, phone }: EnhancedConversionsData) {
  if (typeof window === 'undefined') return;

  const userData: Record<string, string> = {};
  if (email) userData.sha256_email_address = await sha256(email);
  if (phone) userData.sha256_phone_number = await sha256(phone);

  if (Object.keys(userData).length === 0) return;

  debugLog('enhanced_conversions', userData);

  // GA4 Enhanced Conversions
  if (window.gtag) {
    window.gtag('set', 'user_data', {
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phone && { phone_number: phone.trim() }),
    });
  }

  // Meta Advanced Matching (hashed)
  if (window.fbq) {
    window.fbq('init', process.env.NEXT_PUBLIC_META_PIXEL_ID || '', {
      em: email ? await sha256(email) : undefined,
      ph: phone ? await sha256(phone) : undefined,
    });
  }
}
