// lib/addons.ts — masala & other add-ons offered at checkout
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AddonOption {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string | null;
  stock: number;
}

export interface AddonGroup {
  category: { _id: string; name: string };
  addons: AddonOption[];
}

/** Add-ons the shop has switched ON (in an ON category, with stock), grouped by category. */
export async function fetchCheckoutAddons(): Promise<AddonGroup[]> {
  const res = await fetch(`${API_URL}/api/addons`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

/** Set how many of an add-on are in the logged-in customer's cart (0 removes it). */
export async function setCartAddon(addonId: string, quantity: number) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('otp_auth_token') : null;
  const res = await fetch(`${API_URL}/api/cart/addons`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ addonId, quantity }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Could not update add-on');
  return data.data;
}

export const addonImageUrl = (image?: string | null) =>
  !image ? null : image.startsWith('http') ? image : `${process.env.NEXT_PUBLIC_IMG_URL}/${image}`;
