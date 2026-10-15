'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Product, ProductVariant } from '@/types/product';
import { ShoppingBag, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface AddToCartButtonProps {
  product: Product;
  selectedVariant?: ProductVariant;
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
  compact?: boolean; // New prop for compact mode
  /** Render only the button (the page shows its own quantity selector) */
  buttonOnly?: boolean;
  buttonClassName?: string;
}

export default function AddToCartButton({ 
  product, 
  selectedVariant,
  quantity: externalQuantity,
  onQuantityChange,
  compact = false, // Default to false for backward compatibility
  buttonOnly = false,
  buttonClassName = '',
}: AddToCartButtonProps) {
  const { t } = useLanguage();
  const [internalQuantity, setInternalQuantity] = useState(1);
  const quantity = externalQuantity !== undefined ? externalQuantity : internalQuantity;
  const setQuantity = onQuantityChange || setInternalQuantity;  
  const { addToCart, loading, addingProductId, cart } = useCart();

  const isAdding = loading && addingProductId === product._id;

  // Check for same variant in cart
  const isInCart = cart?.items?.some(item => {
    const productId = typeof item.product === 'string' ? item.product : item.product._id;
    const sameProduct = productId === product._id;
    
    const itemVariantId = item.selectedVariant?._id || item.variantId;
    const selectedVariantId = selectedVariant?._id || selectedVariant?.variantName;
    const sameVariant = !selectedVariantId || itemVariantId === selectedVariantId;
    
    return sameProduct && sameVariant;
  }) || false;

  const getMaxQuantity = () => {
    if (selectedVariant) {
      return Math.max(0, selectedVariant.stock);
    }
    return Math.max(0, product.stock);
  };

  const handleAddToCart = async () => {
    console.log('🛒 Adding to cart:', {
      productId: product._id,
      productName: product.name,
      selectedVariant: selectedVariant?.variantName || selectedVariant?.name,
      quantity,
    });

    try {
      await addToCart(product, quantity, selectedVariant);
      console.log('✅ Add to cart successful');
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const maxQuantity = getMaxQuantity();
  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : product.stock <= 0;

  // Compact mode styles
  if (buttonOnly) {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock || isAdding}
        className={`${buttonClassName} ${
          isOutOfStock || isAdding
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : isInCart
              ? 'bg-[#EAF8FC] text-[#063B5C] ring-2 ring-inset ring-[#008FB8] hover:bg-[#d9f1f8]'
              : 'bg-white text-[#063B5C] ring-2 ring-inset ring-[#063B5C] hover:bg-[#EAF8FC]'
        }`}
      >
        {isAdding ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" aria-hidden="true" />
            <span>{t('product.adding')}</span>
          </>
        ) : isOutOfStock ? (
          <span>{t('product.outOfStock')}</span>
        ) : isInCart ? (
          <>
            <Check className="h-5 w-5" aria-hidden="true" />
            <span>{t('product.inCart')}</span>
          </>
        ) : (
          <>
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            <span>{t('product.addToCart')}</span>
          </>
        )}
      </button>
    );
  }

  if (compact) {
    return (
      <div className="space-y-1.5">
        {/* Quantity Selector - Compact */}
        {!isOutOfStock && (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-xs text-[#315A6E]">Qty:</span>
            <div className="flex items-center border border-[#B8DCE7] rounded-md">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-1.5 py-0.5 hover:bg-[#EAF8FC] transition-colors disabled:opacity-50 cursor-pointer text-xs"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="px-1.5 py-0.5 min-w-6 text-center text-xs text-[#063B5C]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                className="px-1.5 py-0.5 hover:bg-[#EAF8FC] transition-colors disabled:opacity-50 cursor-pointer text-xs"
                disabled={quantity >= maxQuantity}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Add to Cart Button - Compact */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className="w-full py-1.5 px-2 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{
            backgroundColor: isOutOfStock || isAdding ? '#ccc' : '#064B6A',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            if (!isOutOfStock && !isAdding) {
              e.currentTarget.style.backgroundColor = '#008FB8';
            }
          }}
          onMouseLeave={(e) => {
            if (!isOutOfStock && !isAdding) {
              e.currentTarget.style.backgroundColor = '#064B6A';
            }
          }}
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>{t('product.adding')}</span>
            </>
          ) : isOutOfStock ? (
            <span>{t('product.outOfStock')}</span>
          ) : isInCart ? (
            <>
              <Check size={12} />
              <span>{t('product.inCart')}</span>
            </>
          ) : (
            <>
              <ShoppingBag size={12} />
              <span>{t('product.addToCart')}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Original mode (for backward compatibility)
  return (
    <div className="space-y-3">
      {!isOutOfStock && (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-[#315A6E]">{t('product.quantity')}</span>
          <div className="flex items-center border border-[#B8DCE7] rounded-lg">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-10 w-10 items-center justify-center text-xl hover:bg-[#EAF8FC] transition-colors disabled:opacity-40 cursor-pointer"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="min-w-10 px-2 text-center text-base font-semibold text-[#063B5C]" aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="flex h-10 w-10 items-center justify-center text-xl hover:bg-[#EAF8FC] transition-colors disabled:opacity-40 cursor-pointer"
              disabled={quantity >= maxQuantity}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          {maxQuantity > 0 && maxQuantity <= 10 && (
            <span className="text-sm font-medium text-amber-700">
              {t('product.onlyLeft', { n: maxQuantity })}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock || isAdding}
        className="w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
        style={{
          backgroundColor: isOutOfStock || isAdding ? '#ccc' : '#064B6A',
          color: 'white'
        }}
        onMouseEnter={(e) => {
          if (!isOutOfStock && !isAdding) {
            e.currentTarget.style.backgroundColor = '#008FB8';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOutOfStock && !isAdding) {
            e.currentTarget.style.backgroundColor = '#064B6A';
          }
        }}
      >
        {isAdding ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>{t('product.adding')}</span>
          </>
        ) : isOutOfStock ? (
          <span>{t('product.outOfStock')}</span>
        ) : isInCart ? (
          <>
            <Check size={16} />
            <span>{t('product.inCart')}</span>
          </>
        ) : (
          <>
            <ShoppingBag size={16} />
            <span>{t('product.addToCart')}</span>
          </>
        )}
      </button>
    </div>
  );
}