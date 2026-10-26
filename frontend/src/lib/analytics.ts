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
    productId?: string;
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

interface QueuedFBQEvent {
  type: 'track' | 'trackCustom';
  eventName: string;
  params: Record<string, unknown>;
}

const fbqQueue: QueuedFBQEvent[] = [];
let fbqPollTimer: NodeJS.Timeout | null = null;

function flushFBQQueue() {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  while (fbqQueue.length > 0) {
    const item = fbqQueue.shift();
    if (item) {
      try {
        window.fbq(item.type, item.eventName, item.params);
      } catch {
        // silent fail
      }
    }
  }
  if (fbqPollTimer) {
    clearInterval(fbqPollTimer);
    fbqPollTimer = null;
  }
}

function startFBQPoll() {
  if (fbqPollTimer || typeof window === 'undefined') return;
  let attempts = 0;
  fbqPollTimer = setInterval(() => {
    attempts++;
    if (typeof window.fbq === 'function') {
      flushFBQQueue();
    } else if (attempts > 50) { // 10 seconds timeout
      if (fbqPollTimer) clearInterval(fbqPollTimer);
      fbqPollTimer = null;
    }
  }, 200);
}

function fireFBQ(eventName: string, params: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined') {
      if (typeof window.fbq === 'function') {
        window.fbq('track', eventName, params);
      } else {
        // Queue event and poll until Meta Pixel snippet creates window.fbq
        fbqQueue.push({ type: 'track', eventName, params });
        startFBQPoll();
      }
    }
  } catch {
    // Meta Pixel not loaded — silent fail
  }
}

function fireFBQCustom(eventName: string, params: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined') {
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', eventName, params);
      } else {
        // Queue event and poll until Meta Pixel snippet creates window.fbq
        fbqQueue.push({ type: 'trackCustom', eventName, params });
        startFBQPoll();
      }
    }
  } catch {
    // Meta Pixel not loaded — silent fail
  }
}

// ── Duplicate Purchase Guard ──────────────────────────────────────────

const PURCHASE_STORAGE_KEY = 'ora_tracked_purchases';
const MAX_TRACKED_PURCHASES = 50;

function getStoredTrackedPurchases(storage: Storage): string[] {
  try {
    const raw = storage.getItem(PURCHASE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isPurchaseTracked(...orderIds: Array<string | undefined | null>): boolean {
  const validIds = orderIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  if (validIds.length === 0) return true;

  try {
    // 1. Check current tab session storage
    if (typeof sessionStorage !== 'undefined') {
      const sessionIds = getStoredTrackedPurchases(sessionStorage);
      if (validIds.some((id) => sessionIds.includes(id))) return true;
    }

    // 2. Check persistent local storage (cross-tab / return visits)
    if (typeof localStorage !== 'undefined') {
      const localIds = getStoredTrackedPurchases(localStorage);
      if (validIds.some((id) => localIds.includes(id))) return true;
    }

    return false;
  } catch {
    return false;
  }
}

function markPurchaseTracked(...orderIds: Array<string | undefined | null>): void {
  const validIds = orderIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  if (validIds.length === 0) return;

  // Persist in current session storage
  try {
    if (typeof sessionStorage !== 'undefined') {
      const sessionIds = getStoredTrackedPurchases(sessionStorage);
      let changed = false;
      for (const id of validIds) {
        if (!sessionIds.includes(id)) {
          sessionIds.push(id);
          changed = true;
        }
      }
      if (changed) {
        sessionStorage.setItem(
          PURCHASE_STORAGE_KEY,
          JSON.stringify(sessionIds.slice(-MAX_TRACKED_PURCHASES))
        );
      }
    }
  } catch {
    // Storage quota or private mode restriction
  }

  // Persist in local storage across tabs and sessions
  try {
    if (typeof localStorage !== 'undefined') {
      const localIds = getStoredTrackedPurchases(localStorage);
      let changed = false;
      for (const id of validIds) {
        if (!localIds.includes(id)) {
          localIds.push(id);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(
          PURCHASE_STORAGE_KEY,
          JSON.stringify(localIds.slice(-MAX_TRACKED_PURCHASES))
        );
      }
    }
  } catch {
    // Storage quota or private mode restriction
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
    begin_checkout: 'InitiateCheckout',
    add_payment_info: 'AddPaymentInfo',
    purchase: 'Purchase',
    search: 'Search',
    add_to_wishlist: 'AddToWishlist',
    customize_product: 'CustomizeProduct', // genuine product customization only
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
  fireFBQCustom('ViewCart', fbPayload); // Custom event for cart view (avoids polluting standard CustomizeProduct)
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

// ── Purchase (with duplicate guard & input validation) ────────────────

export function trackPurchase({
  orderId,
  orderNumber,
  total,
  subtotal,
  tax,
  shipping,
  items,
}: PurchaseParams): boolean {
  const primaryId = orderId || orderNumber || '';
  if (!primaryId) {
    debugLog('purchase [SKIPPED — missing order identifier]', {});
    return false;
  }

  const numericTotal = Number(total);
  if (isNaN(numericTotal) || numericTotal <= 0) {
    debugLog('purchase [SKIPPED — invalid positive amount]', { total });
    return false;
  }

  // ── Duplicate prevention ──
  if (isPurchaseTracked(orderId, orderNumber)) {
    debugLog('purchase [SKIPPED — already tracked]', { orderId, orderNumber });
    return false;
  }

  const hasRealItems = Array.isArray(items) && items.length > 0;
  const validItems = hasRealItems
    ? items.filter((i) => Boolean(i.id || i.productId))
    : [];

  const ga4Payload: Record<string, unknown> = {
    transaction_id: orderNumber || orderId,
    currency: 'INR',
    value: numericTotal,
    tax: Number(tax) || 0,
    shipping: Number(shipping) || 0,
    ...(validItems.length > 0 && { items: toGA4Items(validItems) }),
  };

  const fbPayload: Record<string, unknown> = {
    value: numericTotal,
    currency: 'INR',
    order_id: orderNumber || orderId,
    ...(validItems.length > 0 && {
      content_type: 'product',
      content_ids: validItems.map((i) => i.id || i.productId || ''),
      contents: validItems.map((i) => ({
        id: i.id || i.productId || '',
        quantity: Number(i.quantity) || 1,
        item_price: Number(i.price) || 0,
      })),
      num_items: validItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0),
    }),
  };

  debugLog('purchase', { ga4: ga4Payload, fb: fbPayload });
  fireGA4('purchase', ga4Payload);
  fireFBQ('Purchase', fbPayload);
  pushToDataLayer('purchase', { ...ga4Payload, subtotal: Number(subtotal) || numericTotal });

  markPurchaseTracked(orderId, orderNumber);
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
 * Normalises phone numbers to Meta's Advanced Matching requirements:
 * - Strip formatting characters (spaces, dashes, parentheses, dots).
 * - Remove leading zeros.
 * - For Indian 10-digit mobile numbers, prefix with country code '91'.
 * - Preserve already present country codes (11-15 digits) without double-prefixing.
 * - Return empty string if length is outside valid international range (10-15 digits).
 */
function normalizePhoneForMeta(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';

  let digits = rawPhone.replace(/\D/g, '');
  digits = digits.replace(/^0+/, '');

  if (!digits) return '';

  // Standard Indian 10-digit mobile numbers matching /^[6-9]\d{9}$/: prepend country code 91
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  // Already prefixed Indian number (12 digits starting with 91 followed by valid 10-digit mobile)
  if (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  // Other international formats (11-15 digits)
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  return '';
}

function normalizeEmail(rawEmail: string): string {
  if (!rawEmail || typeof rawEmail !== 'string') return '';
  return rawEmail.trim().toLowerCase();
}

/**
 * Send hashed email/phone for Enhanced Conversions.
 * Call this after login / at checkout when user info is available.
 */
export async function setEnhancedConversions({ email, phone }: EnhancedConversionsData) {
  if (typeof window === 'undefined') return;

  const normEmail = email ? normalizeEmail(email) : '';
  const normPhone = phone ? normalizePhoneForMeta(phone) : '';

  const hashedEmail = normEmail ? await sha256(normEmail) : undefined;
  const hashedPhone = normPhone ? await sha256(normPhone) : undefined;

  if (!hashedEmail && !hashedPhone) return;

  // Never log raw customer PII or hashes in production or debug mode
  debugLog('enhanced_conversions', { hasEmail: !!hashedEmail, hasPhone: !!hashedPhone });

  // GA4 Enhanced Conversions (GA4 user_data accepts normalized email and E.164 phone)
  if (window.gtag) {
    window.gtag('set', 'user_data', {
      ...(normEmail && { email: normEmail }),
      ...(normPhone && { phone_number: normPhone.startsWith('+') ? normPhone : `+${normPhone}` }),
    });
  }

  // Meta Advanced Matching (hashed)
  if (window.fbq) {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (pixelId) {
      window.fbq('init', pixelId, {
        ...(hashedEmail && { em: hashedEmail }),
        ...(hashedPhone && { ph: hashedPhone }),
      });
    }
  }
}
