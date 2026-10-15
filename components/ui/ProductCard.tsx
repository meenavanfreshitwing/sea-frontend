// src/components/ProductCard.tsx
import { Product } from '@/types/product';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap } from 'lucide-react';
import Image from 'next/image';
import { Stars } from '@/components/reviews/StarRating';
import { useLanguage } from '@/context/LanguageContext';
import { formatWeight } from '@/lib/weight';


interface ProductCardProps {
  product: Product;
}

// Format price with commas
const formatPrice = (price: number): string => {
  return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || '0';
};

// ============= OFFER LOGIC =============
const getProductOfferInfo = (product: Product) => {
  if (product.variants && product.variants.length > 0) {
    const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
    
    if (defaultVariant?.originalPrice && 
        defaultVariant?.price && 
        parseFloat(defaultVariant.originalPrice.toString()) > parseFloat(defaultVariant.price.toString())) {
      
      const original = parseFloat(defaultVariant.originalPrice.toString());
      const discounted = parseFloat(defaultVariant.price.toString());
      const discountPercentage = defaultVariant.discountPercentage || 
        ((original - discounted) / original) * 100;
      
      return {
        hasOffer: true,
        originalPrice: original,
        discountedPrice: discounted,
        discountPercentage: Math.round(discountPercentage * 100) / 100
      };
    }
    
    return {
      hasOffer: false,
      originalPrice: parseFloat(defaultVariant?.price?.toString() || '0'),
      discountedPrice: parseFloat(defaultVariant?.price?.toString() || '0'),
      discountPercentage: 0
    };
  }
  
  if (product.hasOffer && 
      product.originalPrice && 
      product.basePrice &&
      parseFloat(product.originalPrice.toString()) > parseFloat(product.basePrice.toString())) {
    
    const original = parseFloat(product.originalPrice.toString());
    const discounted = parseFloat(product.basePrice.toString());
    const discountPercentage = product.discountPercentage || 
      ((original - discounted) / original) * 100;
    
    return {
      hasOffer: true,
      originalPrice: original,
      discountedPrice: discounted,
      discountPercentage: Math.round(discountPercentage * 100) / 100
    };
  }
  
  return {
    hasOffer: false,
    originalPrice: parseFloat(product.basePrice?.toString() || '0'),
    discountedPrice: parseFloat(product.basePrice?.toString() || '0'),
    discountPercentage: 0
  };
};

// ============= WEIGHT LOGIC =============
const getProductWeight = (product: Product): { weight: number; weightUnit: string } | null => {
  if (product.variants && product.variants.length > 0) {
    const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
    
    if (defaultVariant?.weight && defaultVariant?.weightUnit) {
      return {
        weight: defaultVariant.weight,
        weightUnit: defaultVariant.weightUnit
      };
    }
  }
  
  if ((product as any)?.weight && (product as any)?.weightUnit) {
    return {
      weight: (product as any).weight,
      weightUnit: (product as any).weightUnit
    };
  }
  
  return null;
};

// '500 gram' -> '500 g', '1000 gram' -> '1 kg', '2 piece' -> '2 pcs'
const shortWeight = (info: { weight: number; weightUnit: string }) => formatWeight(info.weight, info.weightUnit);

// Get product image
const getProductImage = (product: Product) => {
  const imgBaseUrl = process.env.NEXT_PUBLIC_IMG_URL;
  
  if (product.variants && product.variants.length > 0) {
    const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
    
    if (defaultVariant?.images?.[0]?.image) {
      const imagePath = defaultVariant.images[0].image;
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
      if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.replace('uploads/', '');
      }
      return `${imgBaseUrl}/${cleanPath}`;
    }
  }
  
  if (product.images?.[0]?.image) {
    const imagePath = product.images[0].image;
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.replace('uploads/', '');
    }
    return `${imgBaseUrl}/${cleanPath}`;
  }
  
  return '/no-photo.svg';
};

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { addToCart, cart } = useCart();
  const router = useRouter();

  const offerInfo = getProductOfferInfo(product);
  const hasValidOffer = offerInfo.hasOffer && offerInfo.originalPrice > offerInfo.discountedPrice;
  const weightInfo = getProductWeight(product);
  
  const isInCart = cart?.items?.some(item => {
    const productId = typeof item.product === 'string' ? item.product : item.product?._id;
    return productId === product._id;
  }) || false;
  
  const isOutOfStock = product.stock <= 0;
  const imageUrl = getProductImage(product);

  const handleCardClick = () => {
    router.push(`/products/${product.slug}`);
  };

  // The pack shown on the card (its price and weight) is the one bought from here
  const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];

  // Buy Now: straight to checkout with just this fish (1 pack); checkout asks guests to log in
  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    sessionStorage.setItem('buyNowItem', JSON.stringify({
      product,
      quantity: 1,
      selectedVariant: defaultVariant,
      price: defaultVariant ? defaultVariant.price : product.basePrice,
      productName: product.name,
      variantName: defaultVariant?.variantName || defaultVariant?.name || null,
    }));
    router.push('/checkout?buyNow=true');
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAddingToCart) return;
    
    try {
      setIsAddingToCart(true);
      
      const displayedImageUrl = imageUrl;
      let imageFilename = '';
      if (displayedImageUrl && displayedImageUrl !== '/no-photo.svg') {
        imageFilename = displayedImageUrl.split('/').pop() || '';
      }
      
      const productWithImage = {
        ...product,
        images: [{ image: imageFilename }]
      };
      
      await addToCart(productWithImage, 1, defaultVariant);
    } catch (error) {
      console.error('Failed to add product to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const categoryName = typeof product.category === 'object' && product.category ? product.category.name : '';
  const { t } = useLanguage();

  return (
    <div
      onClick={handleCardClick}
      className="group w-full max-w-[320px] sm:max-w-[340px] md:max-w-[360px] lg:max-w-[380px] xl:max-w-[400px] 2xl:max-w-[420px] mx-auto bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_8px_24px_-8px_rgba(6,59,92,0.12)] hover:shadow-[0_30px_60px_-15px_rgba(0,143,184,0.25)] border border-[#EAF8FC] transition-all duration-500 cursor-pointer"
    >
      {/* IMAGE SECTION — full bleed, no padding */}
      <div className="relative aspect-[4/3] bg-[#F8FCFD] overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            priority
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 480px) 100vw, (max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 400px"
          />
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <span className="rounded-full bg-[#063B5C] px-3 py-1 text-xs font-bold text-white sm:text-sm">{t('product.soldOut')}</span>
          </div>
        )}

        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#EAF8FC]">
            <span className="text-[#315A6E]/60 text-xs sm:text-sm">{t('product.noImage')}</span>
          </div>
        )}

        {/* IN CART BADGE */}
        {isInCart && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 rounded-full w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center text-[12px] sm:text-xs md:text-sm font-bold shadow-lg" style={{ backgroundColor: "#063B5C", color: "#00A9E0" }}>
            ✓
          </div>
        )}
      </div>

{/* CONTENT SECTION - OPTIMIZED FOR MOBILE */}
<div className="px-2.5 xs:px-3 sm:px-4 md:px-5 py-2.5 xs:py-3 sm:py-4 md:py-5">
  {/* Category/Weight */}
  {(weightInfo || categoryName) && (
    <p className="text-[12px] sm:text-[13px] font-semibold text-[#315A6E] mb-1">
      {weightInfo ? t('product.netWeight', { weight: shortWeight(weightInfo) }) : categoryName}
    </p>
  )}

  {/* PRODUCT NAME - up to two lines so long fish names stay readable */}
  <h3 className="text-[13px] xs:text-[14px] sm:text-[15px] md:text-[17px] lg:text-[18px] xl:text-[19px] font-semibold text-[#063B5C] tracking-tight leading-tight mb-1.5 xs:mb-2 sm:mb-3 md:mb-4 group-hover:text-[#008FB8] transition-colors line-clamp-2">
    {product.name}
  </h3>

  {(product.numberOfReviews ?? 0) > 0 && (
    <div className="-mt-1 mb-2 flex items-center gap-1 text-[12px] text-[#315A6E]">
      <Stars value={product.rating ?? 0} size={13} />
      <span>({product.numberOfReviews})</span>
    </div>
  )}

  {/* Mobile: Stock & Price in Same Row */}
  <div className="flex flex-wrap items-center justify-between gap-1.5 xs:gap-2 mb-1.5 xs:mb-2 sm:mb-3 md:hidden">
    {/* Stock Status */}
    <div>
      {!isOutOfStock ? (
        <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#008FB8' }}>
          <span className="w-1 h-1 xs:w-1 xs:h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#008FB8' }}></span>
          <span className="text-[12px] md:text-[12px] whitespace-nowrap">{t('product.inStock')}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
          <span className="w-1 h-1 xs:w-1 xs:h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full"></span>
          <span className="text-[12px] md:text-[12px] whitespace-nowrap">{t('product.soldOut')}</span>
        </div>
      )}
    </div>

    {/* Price */}
    <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-wrap">
      {hasValidOffer && (
        <span className="text-[#315A6E]/50 line-through text-[12px] font-medium">
          ₹{formatPrice(offerInfo.originalPrice)}
        </span>
      )}
      <span className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#063B5C] whitespace-nowrap">
        ₹{formatPrice(offerInfo.discountedPrice)}
      </span>
        {weightInfo && (
          <span className="ml-1 text-xs font-medium text-[#315A6E]">{t('product.perWeight', { weight: shortWeight(weightInfo) })}</span>
        )}
    </div>
  </div>

  {/* Desktop: Stock & Price Separate - Original Layout */}
  <div className="hidden md:block">
    {/* Stock Status */}
    <div className="mb-2 sm:mb-3">
      {!isOutOfStock ? (
        <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#008FB8' }}>
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#008FB8' }}></span>
          <span className="text-[12px] md:text-[12px]">{t('product.inStock')}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full"></span>
          <span className="text-[12px] md:text-[12px]">{t('product.soldOut')}</span>
        </div>
      )}
    </div>

    {/* Price & Action Row - Desktop Original */}
    <div className="flex flex-wrap items-center justify-between pt-2 sm:pt-3 md:pt-4 gap-2">
      <div className="flex flex-col">
        <p className="text-[12px] text-[#315A6E]/60 font-medium">{t('product.price')}</p>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {hasValidOffer && (
            <span className="text-[#315A6E]/50 line-through text-[12px] font-medium">
              ₹{formatPrice(offerInfo.originalPrice)}
            </span>
          )}
          <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#063B5C]">
            ₹{formatPrice(offerInfo.discountedPrice)}
          </span>
        {weightInfo && (
          <span className="ml-1 text-xs font-medium text-[#315A6E]">{t('product.perWeight', { weight: shortWeight(weightInfo) })}</span>
        )}
        </div>
      </div>

    </div>
  </div>

  {/* Add to Cart + Buy Now (phone and desktop) */}
  <div className="mt-2 grid grid-cols-1 gap-1.5 sm:mt-3 sm:grid-cols-2 sm:gap-2">
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isOutOfStock || isAddingToCart}
      className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-white px-1.5 text-[12px] font-bold text-[#063B5C] ring-2 ring-inset ring-[#063B5C] transition active:scale-95 hover:bg-[#F0F9FC] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:text-[13px]"
    >
      <ShoppingBag size={15} className="hidden shrink-0 sm:block" aria-hidden="true" />
      <span className="truncate">{isAddingToCart ? '…' : t('product.addToCart')}</span>
    </button>
    <button
      type="button"
      onClick={handleBuyNow}
      disabled={isOutOfStock}
      className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-[#063B5C] px-1.5 text-[12px] font-bold text-white shadow-sm transition active:scale-95 hover:bg-[#0B4F8A] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:text-[13px]"
    >
      <Zap size={15} className="hidden shrink-0 sm:block" aria-hidden="true" />
      <span className="truncate">{isOutOfStock ? t('product.soldOut') : t('product.buyNow')}</span>
    </button>
  </div>
</div>
    </div>
  );
}