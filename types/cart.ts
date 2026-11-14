import { Product, ProductVariant } from './product';

export interface CartItem {
  _id: string;
  product: Product | string;
  quantity: number;
  price: number;
  originalPrice?: number;
  variantId?: string;
  variantName?: string;
  selectedVariant?: ProductVariant;
  productName?: string;
  productImage?: string;
  weight?: number;
  weightUnit?: string;
  createdAt: string;
  updatedAt: string;
}

/** Masala & other extras picked at checkout (server carts only) */
export interface CartAddon {
  _id?: string;
  addon: string;
  name: string;
  categoryName?: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface Cart {
  _id: string;
  user: string;
  guestId?: string;
  items: CartItem[];
  addons?: CartAddon[];
  /** Included in totalPrice */
  addonsTotal?: number;
  totalPrice: number;
  totalItems: number;
  totalOriginalPrice?: number;
  totalSavings?: number;
  /** Items the server removed because their fish/pack no longer exists */
  removedItems?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartData {
  productId: string;
  quantity: number;
  variantId?: string;
  guestId?: string;
}

export interface UpdateCartItemData {
  quantity: number;
  guestId?: string;
}

export interface RemoveCartItemData {
  guestId?: string;
}

export interface ClearCartData {
  guestId?: string;
}

export interface MergeCartData {
  guestId: string;
}

// Guest cart types (for localStorage)
export interface GuestCartItem {
  _id?: string;
  product: string | Product;
  productId?: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  variantId?: string;
  variantName?: string;
  productName?: string;
  productImage?: string;
  weight?: number;
  weightUnit?: string;
}

export interface GuestCart {
  items: GuestCartItem[];
  totalPrice: number;
  totalItems: number;
  totalOriginalPrice?: number;
  totalSavings?: number;
  guestId: string;
}

// API Response types
export interface CartResponse {
  success: boolean;
  data: Cart;
  guestId?: string;
  message?: string;
}

export interface CartListResponse {
  success: boolean;
  data: Cart;
}

export interface AddToCartResponse {
  success: boolean;
  data: Cart;
  guestId: string;
  message?: string;
}