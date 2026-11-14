// lib/location.ts — the customer's delivery location (decides which prices they see).
// Stored in localStorage (full details) and a cookie (slug only, so server pages can read it).
// Browser-only helpers check `typeof window`; the server only uses LOCATION_COOKIE.

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const STORAGE_KEY = 'mv_location';
export const LOCATION_COOKIE = 'mv_location';

export interface DeliveryLocation {
  _id: string;
  name: string;
  slug: string;
  pincode: string;
  place: string;
}

export interface LocationOption {
  _id: string;
  name: string;
  slug: string;
}

export class LocationError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

// ─────────────────────────── storage ───────────────────────────

export function getStoredLocation(): DeliveryLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const loc = raw ? JSON.parse(raw) : null;
    return loc && loc.slug && loc._id ? loc : null;
  } catch {
    return null;
  }
}

export function storeLocation(loc: DeliveryLocation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(loc.slug)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function clearStoredLocation() {
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${LOCATION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

// ─────────────── send the location with every API request ───────────────
// The backend prices products and carts for the location in the X-Location header.
// Wrapping fetch once means every existing API call gets it without changes.

let fetchWrapped = false;
export function installLocationHeader() {
  if (typeof window === 'undefined' || fetchWrapped || !API_URL) return;
  fetchWrapped = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const loc = getStoredLocation();
    if (loc && url.startsWith(API_URL)) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('X-Location')) headers.set('X-Location', loc.slug);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
}

// ─────────────────────────── API ───────────────────────────

const authToken = () => (typeof window === 'undefined' ? null : localStorage.getItem('otp_auth_token'));

/** Active locations, and whether location pricing is switched on at all. */
export async function fetchLocations(): Promise<{ enabled: boolean; locations: LocationOption[] }> {
  const res = await fetch(`${API_URL}/api/locations`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load locations');
  const data = await res.json();
  return { enabled: data.enabled === true, locations: data.data || [] };
}

/** Which location delivers to this pincode. Throws LocationError(NOT_SERVICEABLE) if none. */
export async function resolvePincode(pincode: string): Promise<LocationOption> {
  const res = await fetch(`${API_URL}/api/locations/resolve?pincode=${encodeURIComponent(pincode)}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new LocationError(data.message || 'Could not check this pincode', data.code);
  return data.data;
}

/** Location saved on the customer's account (null if none / not logged in). */
export async function fetchMyLocation(): Promise<DeliveryLocation | null> {
  const token = authToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/location`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data?.location) return null;
    return { ...data.data.location, pincode: data.data.pincode, place: data.data.place };
  } catch {
    return null;
  }
}

/** Save the location on the customer's account so other devices / the app know it. */
export async function saveMyLocation(pincode: string, place: string) {
  const token = authToken();
  if (!token) return;
  try {
    await fetch(`${API_URL}/api/auth/location`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pincode, place }),
    });
  } catch {
    // Not critical: the location is still stored in this browser
  }
}

/**
 * A guest's cart lives in this browser with the old location's prices.
 * Re-price it for the new location and drop packs not sold there.
 */
export async function repriceGuestCart(slug: string) {
  const raw = localStorage.getItem('guestCart');
  if (!raw) return;
  try {
    const cart = JSON.parse(raw);
    if (!cart.items?.length) return;
    const res = await fetch(`${API_URL}/api/products?location=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return;
    const products: any[] = (await res.json()).data || [];
    const byId = new Map(products.map(p => [String(p._id), p]));

    cart.items = cart.items.filter((item: any) => {
      const productId = String(item.product?._id || item.productId || item.product);
      const product = byId.get(productId);
      if (!product) return false; // not sold in this location
      if (item.variantId) {
        const pack = (product.variants || []).find((v: any) => String(v._id) === String(item.variantId));
        if (!pack) return false;
        item.price = pack.price;
        item.originalPrice = pack.originalPrice || pack.price;
      } else {
        item.price = product.basePrice;
        item.originalPrice = product.originalPrice || product.basePrice;
      }
      if (item.product && typeof item.product === 'object') item.product = product;
      return true;
    });
    cart.totalItems = cart.items.reduce((s: number, i: any) => s + i.quantity, 0);
    cart.totalPrice = cart.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    cart.totalOriginalPrice = cart.items.reduce((s: number, i: any) => s + (i.originalPrice || i.price) * i.quantity, 0);
    cart.totalSavings = cart.totalOriginalPrice - cart.totalPrice;
    localStorage.setItem('guestCart', JSON.stringify(cart));
  } catch {
    // Leave the cart as it is; the server re-prices it at login/checkout anyway
  }
}

// ─────────────── "Use my current location" (Google Maps geocoder) ───────────────

function loadGoogleMaps(): Promise<any> {
  const w = window as any;
  if (w.google?.maps?.Geocoder) return Promise.resolve(w.google);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error('Maps is not configured'));
  return new Promise((resolve, reject) => {
    let tries = 0;
    const poll = () => {
      if (w.google?.maps?.Geocoder) return resolve(w.google);
      if (++tries > 100) return reject(new Error('Maps failed to load'));
      setTimeout(poll, 100);
    };
    if (!document.querySelector('script[data-google-maps="true"]')) {
      // Same script the checkout map uses, so it is only loaded once
      w.initMvLocationMaps = () => {};
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=initMvLocationMaps&loading=async`;
      script.async = true;
      script.setAttribute('data-google-maps', 'true');
      script.onerror = () => reject(new Error('Maps failed to load'));
      document.head.appendChild(script);
    }
    poll();
  });
}

/** GPS → { pincode, place }. Throws a friendly message on failure. */
export async function detectPincode(): Promise<{ pincode: string; place: string }> {
  if (!navigator.geolocation) throw new Error('Your browser cannot detect location. Please enter your pincode.');
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, () =>
      reject(new Error('Location permission was not given. Please enter your pincode.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }));

  const google = await loadGoogleMaps().catch(() => {
    throw new Error('Could not detect your area. Please enter your pincode.');
  });
  const results: any[] = await new Promise((resolve) => {
    new google.maps.Geocoder().geocode(
      { location: { lat: pos.coords.latitude, lng: pos.coords.longitude } },
      (res: any[], status: string) => resolve(status === 'OK' ? res : [])
    );
  });
  const comps: any[] = results.flatMap(r => r.address_components || []);
  const get = (type: string) => comps.find(c => c.types?.includes(type))?.long_name || '';
  const pincode = get('postal_code');
  if (!pincode) throw new Error('Could not find your pincode. Please enter it.');
  const place = get('sublocality_level_1') || get('sublocality') || get('locality') || get('administrative_area_level_2');
  return { pincode, place };
}
