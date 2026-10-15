'use client';

import { useState, useEffect, useRef } from 'react';
import CartChangedNotice from '@/components/CartChangedNotice';
import { useCart } from '@/context/CartContext';
import { formatWeight, itemWeight, totalGrams } from '@/lib/weight';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createOrder, getUserOrders, getWards } from '@/lib/order-api';
import { createRazorpayOrder, verifyPayment, paymentFailed } from '@/lib/payment-api';
import { getBookingAvailability } from '@/lib/booking-api';
import DeliveryDatePicker from '@/components/booking/DeliveryDatePicker';
import type { BookingAvailability, BookingDate } from '@/types/booking';
import HelpLine from '@/components/HelpLine';
import { useLanguage } from '@/context/LanguageContext';
import { dateLocale } from '@/lib/i18n/translations';
import { formatDeliveryDate, formatCutoffTime } from '@/lib/booking-api';
import type { TranslationKey } from '@/lib/i18n/translations';

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): RazorpayInstance;
    };
    google: any;
    initCheckoutMap?: () => void;
  }
}

interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void> | void;
  prefill: { name: string; email: string; contact: string };
  notes: { orderId: string; address: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayErrorResponse) => void) => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error: { code: string; description: string; source: string; step: string; reason: string };
}

interface FormData {
  name: string;
  email: string;
  phone: string;
    alternatePhone: string;   // ✅ NEW — optional

  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark: string;
  selectedWardId: number | null;
  selectedStreet: string;
}

interface PopupState {
  isOpen: boolean;
  type: 'error' | 'success' | 'info';
  title: string;
  message: string;
}

const getProductName = (product: any): string => {
  if (typeof product === 'string') return product;
  return product?.name || 'Product';
};

const getProductPrice = (item: any): number => {
  return item.price || 0;
};

export default function CheckoutPage() {
  const { t, lang } = useLanguage();
  const { cart, clearCart, loading: cartLoading } = useCart();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',   // ✅ NEW

    street: '',
    city: '',
    state: 'Tamil Nadu',
    postalCode: '',
    country: 'India',
    landmark: '',
    selectedWardId: null,
    selectedStreet: '',
  });

  const [loadingWards, setLoadingWards] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  // Chosen payment method (step 4) and the "payment not completed" box
  const [payMethod, setPayMethod] = useState<'online' | 'cod' | null>(null);
  const [payNotDone, setPayNotDone] = useState(false);
  const [authError, setAuthError] = useState('');
  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
  });
  const [paymentSettings, setPaymentSettings] = useState({
    razorpayEnabled: false,
    razorpayKeyId: '',
    cashOnDeliveryEnabled: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [wardInput, setWardInput] = useState('');

  // Delivery booking calendar
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlotId, setDeliverySlotId] = useState('');
  const selectedDateRef = useRef('');
  useEffect(() => {
    selectedDateRef.current = deliveryDate;
  }, [deliveryDate]);

  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [isBuyNowMode, setIsBuyNowMode] = useState(false);

  // ✅ Pin & map state
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  // Pin from the customer's last order, used as the map's starting point
  const savedPinRef = useRef<{ lat: number; lng: number } | null>(null);
  const [usedLastAddress, setUsedLastAddress] = useState(false);
  const streetRef = useRef('');
  const streetInputRef = useRef<HTMLInputElement>(null);

  const closePopup = () => {
    setPopup({ ...popup, isOpen: false });
  };

  const showErrorPopup = (message: string) => {
    setPopup({ isOpen: true, type: 'error', title: t('checkout.oops'), message });
  };

  const showSuccessPopup = (message: string) => {
    setPopup({ isOpen: true, type: 'success', title: t('checkout.success'), message });
  };

  // ── Delivery date ────────────────────────────────────────────
  // Returns the fresh availability so callers can re-check the chosen date
  const loadAvailability = async (): Promise<BookingAvailability | null> => {
    try {
      setAvailabilityLoading(true);
      const data = await getBookingAvailability();
      setAvailability(data);
      setAvailabilityError('');
      // The chosen date was blocked or closed meanwhile: clear it and tell the customer why
      const selected = selectedDateRef.current;
      const selectedDay = selected ? data.dates.find(d => d.date === selected) : undefined;
      if (selected && !selectedDay?.available) {
        selectedDateRef.current = '';
        setDeliveryDate('');
        setDeliverySlotId('');
        if (selectedDay) handleUnavailableDate(selectedDay);
      }
      return data;
    } catch (error: any) {
      setAvailabilityError(error.message || 'Could not load delivery dates');
      return null;
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleSelectDate = (date: string) => {
    setDeliveryDate(date);
    setDeliverySlotId('');
  };

  const handleUnavailableDate = (day: BookingDate) => {
    const reason = day.reason || '';
    const titleKeys: Record<string, TranslationKey> = {
      same_day: 'date.title.same_day',
      blocked: 'date.title.blocked',
      cutoff_passed: 'date.title.cutoff_passed',
    };
    const locale = dateLocale(lang);
    const messageByReason: Record<string, string> = {
      same_day: t('date.msg.same_day'),
      cutoff_passed: t('date.msg.cutoff_passed', {
        date: formatDeliveryDate(day.date, undefined, locale),
        time: formatCutoffTime(day.cutoffTime),
      }),
      past: t('date.msg.past'),
      beyond_window: t('date.msg.beyond_window', { days: availability?.config.maxAdvanceDays ?? 30 }),
      no_slots: t('date.msg.no_slots'),
    };
    setPopup({
      isOpen: true,
      type: 'info',
      title: t(titleKeys[reason] || 'date.title.default'),
      // Admin-written notices (blocked dates, bookings closed) are shown as written
      message: messageByReason[reason] || day.message || t('date.msg.default'),
    });
  };

  // Final check right before the order is sent (admin may have just blocked the date)
  const ensureDeliveryDate = async (): Promise<boolean> => {
    if (!deliveryDate) {
      showErrorPopup(t('checkout.err.selectDate'));
      return false;
    }
    const fresh = await loadAvailability();
    if (!fresh) {
      showErrorPopup(t('checkout.err.confirmDates'));
      return false;
    }
    const day = fresh.dates.find(d => d.date === deliveryDate);
    if (!day?.available) {
      setDeliveryDate('');
      if (day) handleUnavailableDate(day);
      else showErrorPopup(t('checkout.err.dateGone'));
      return false;
    }
    if (fresh.config.timeSlotsEnabled) {
      const slot = day.slots.find(s => s.slotId === deliverySlotId);
      if (!slot?.available) {
        setDeliverySlotId('');
        showErrorPopup(t('checkout.err.selectSlot'));
        return false;
      }
    }
    return true;
  };

  const hardRedirectHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  useEffect(() => {
    loadWards();
  }, []);

  const loadWards = async () => {
    try {
      setLoadingWards(true);
      await getWards();
    } catch (error) {
      console.error('❌ Error loading ward data:', error);
    } finally {
      setLoadingWards(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.phoneNumber && !formData.phone) {
        setFormData(prev => ({ ...prev, phone: user.phoneNumber || '' }));
      }
      if (user.email && !formData.email) {
        setFormData(prev => ({ ...prev, email: user.email || '' }));
      }
      if (user.name && !formData.name) {
        setFormData(prev => ({ ...prev, name: user.name || '' }));
      }
    }
  }, [user, formData.phone, formData.email, formData.name]);

  useEffect(() => {
    streetRef.current = formData.street;
  }, [formData.street]);

  // Repeat customers: fill in the address and map pin from their last order
  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;
    getUserOrders()
      .then(orders => {
        if (cancelled) return;
        const last = [...orders]
          .filter((o: any) => o.shippingAddress?.street)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] as any;
        if (!last) return;
        if (streetRef.current) return; // customer already started typing
        const addr = last.shippingAddress;
        setFormData(prev => ({
            ...prev,
            street: addr.street || '',
            city: addr.city || prev.city,
            state: addr.state || prev.state,
            postalCode: addr.postalCode || '',
            landmark: addr.landmark || '',
            alternatePhone: prev.alternatePhone || addr.alternatePhone || '',
        }));
        setUsedLastAddress(true);
        if (last.typedArea) setWardInput(last.typedArea);
        const { latitude: lat, longitude: lng, locationSource } = addr;
        if (locationSource === 'customer_selected' && typeof lat === 'number' && typeof lng === 'number') {
          savedPinRef.current = { lat, lng };
          setPinLat(lat);
          setPinLng(lng);
          // Map already on screen: move the pin there
          if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.setPosition({ lat, lng });
            mapInstanceRef.current.panTo({ lat, lng });
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, token]);

  const clearLastAddress = () => {
    setFormData(prev => ({ ...prev, street: '', postalCode: '', landmark: '' }));
    setWardInput('');
    setPinLat(null);
    setPinLng(null);
    savedPinRef.current = null;
    setUsedLastAddress(false);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('buyNow') === 'true') {
      const storedItem = sessionStorage.getItem('buyNowItem');
      if (storedItem) {
        setBuyNowItem(JSON.parse(storedItem));
        setIsBuyNowMode(true);
      }
    }
  }, []);

  useEffect(() => {
    if (user && !token) {
      setAuthError('Authentication token is missing. Please log in again.');
    } else {
      setAuthError('');
    }
  }, [user, token]);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setSettingsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/settings/public`);
      const data = await response.json();
      if (data.success) {
        const settings = data.data;
        setPaymentSettings({
          razorpayEnabled: settings.razorpayEnabled,
          razorpayKeyId: settings.razorpayKeyId || '',
          cashOnDeliveryEnabled: settings.cashOnDeliveryEnabled,
        });
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  // ============================================================
  // ✅ FIXED — Load Google Maps JS API (poll-based, always safe)
  // ============================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If Google API already loaded, mark ready immediately
    if (window.google && window.google.maps && window.google.maps.places) {
      setMapReady(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set in .env.local');
      setMapError('Map configuration missing. Contact support.');
      return;
    }

    // Always reassign the global callback
    window.initCheckoutMap = () => {
      setMapReady(true);
    };

    // If script tag already exists, poll for window.google
    const existing = document.querySelector('script[data-google-maps="true"]');
    if (existing) {
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(poll);
          setMapReady(true);
        } else if (tries > 50) {
          clearInterval(poll);
          setMapError('Map failed to initialize. Please refresh.');
        }
      }, 100);
      return () => clearInterval(poll);
    }

    // Otherwise inject the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initCheckoutMap&loading=async`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');
    script.onerror = () => {
      setMapError('Failed to load Google Maps. Check your internet or API key.');
    };
    document.head.appendChild(script);
  }, []);

  // ============================================================
  // ✅ FIXED — Initialize map (polls for mapRef.current)
  // ============================================================
  useEffect(() => {
    if (!mapReady) return;
    if (!window.google || !window.google.maps) return;
    if (mapInstanceRef.current) return;

    let attempts = 0;
    let intervalId: any = null;

    const tryInit = () => {
      attempts++;

      if (mapInstanceRef.current) {
        if (intervalId) clearInterval(intervalId);
        return;
      }

      if (!mapRef.current) {
        if (attempts > 50) {
          if (intervalId) clearInterval(intervalId);
          setMapError('Map container not ready.');
        }
        return;
      }

      if (intervalId) clearInterval(intervalId);

      const defaultCenter = savedPinRef.current || { lat: 10.0667, lng: 78.7833 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: 'Drag me to your exact door',
      });

      const geocoder = new window.google.maps.Geocoder();

      mapInstanceRef.current = map;
      markerRef.current = marker;
      geocoderRef.current = geocoder;

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (!pos) return;
        const lat = pos.lat();
        const lng = pos.lng();
        setPinLat(lat);
        setPinLng(lng);
        reverseGeocode(lat, lng);
      });

      map.addListener('click', (e: any) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition({ lat, lng });
        setPinLat(lat);
        setPinLng(lng);
        reverseGeocode(lat, lng);
      });

      // Autocomplete on street input
      if (streetInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(
          streetInputRef.current,
          {
            componentRestrictions: { country: 'in' },
            fields: ['geometry', 'formatted_address', 'name', 'address_components'],
          }
        );

        autocompleteRef.current = autocomplete;

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place || !place.geometry || !place.geometry.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          map.setCenter({ lat, lng });
          map.setZoom(17);
          marker.setPosition({ lat, lng });

          setPinLat(lat);
          setPinLng(lng);

          const formatted = place.formatted_address || place.name || '';
          const components = place.address_components || [];

          const getComp = (type: string) => {
            const c = components.find((x: any) => x.types?.includes(type));
            return c ? (c.long_name || '') : '';
          };

          const city =
            getComp('locality') ||
            getComp('administrative_area_level_2') ||
            getComp('sublocality') ||
            '';

          setFormData(prev => ({
            ...prev,
            street: formatted || prev.street,
            city: city || prev.city,
            state: getComp('administrative_area_level_1') || prev.state,
            postalCode: getComp('postal_code') || prev.postalCode,
            country: getComp('country') || prev.country,
          }));
        });
      }
    };

    tryInit();
    intervalId = setInterval(tryInit, 100);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [mapReady]);

  // Keep the calendar current: admin blocks/unblocks show without a reload
  useEffect(() => {
    loadAvailability();
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') loadAvailability();
    };
    const refreshOnFocus = () => loadAvailability();
    const interval = window.setInterval(refreshIfVisible, 60000);
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshOnFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // ✅ FIXED — Re-trigger map resize when tab regains focus
  // (fixes "mobile: map shows blank after switching tabs")
  // ============================================================
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        window.google?.maps?.event?.trigger(mapInstanceRef.current, 'resize');
        if (center) mapInstanceRef.current.setCenter(center);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, []);

  // ✅ Reverse geocode lat/lng → text
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results: any[], status: string) => {
        if (status !== 'OK' || !results || !results[0]) return;
        const result = results[0];
        const components = result.address_components || [];

        const getComp = (type: string) => {
          const c = components.find((x: any) => x.types?.includes(type));
          return c ? (c.long_name || '') : '';
        };

        const city =
          getComp('locality') ||
          getComp('administrative_area_level_2') ||
          getComp('sublocality') ||
          '';

        setFormData(prev => ({
          ...prev,
          street: result.formatted_address || prev.street,
          city: city || prev.city,
          state: getComp('administrative_area_level_1') || prev.state,
          postalCode: getComp('postal_code') || prev.postalCode,
          country: getComp('country') || prev.country,
        }));
      }
    );
  };

  // ✅ Use browser GPS
  const handleUseMyLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      showErrorPopup('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPinLat(lat);
        setPinLng(lng);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(17);
          markerRef.current.setPosition({ lat, lng });
        }
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        showErrorPopup('Could not get your location. Please allow location access or drop the pin manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAreaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWardInput(value);
  };

  const handleClearWard = () => {
    setWardInput('');
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const getDisplayItems = () => {
    if (isBuyNowMode && buyNowItem) {
      return [{
        _id: 'buynow',
        product: buyNowItem.product,
        quantity: buyNowItem.quantity,
        selectedVariant: buyNowItem.selectedVariant,
        price: buyNowItem.price,
      }];
    }
    return cart.items;
  };

  const getSubtotal = () => {
    if (isBuyNowMode && buyNowItem) return buyNowItem.price * buyNowItem.quantity;
    return cart.totalPrice || 0;
  };

  const buildCustomerPin = () => {
    if (pinLat === null || pinLng === null) return null;
    return { lat: pinLat, lng: pinLng };
  };

  const handleCashOnDelivery = async (): Promise<void> => {
    try {
      setLoading(true);
      setAuthError('');

      if (!formData.name || !formData.phone || !formData.street || !formData.city ||
          !formData.state || !formData.postalCode) {
        showErrorPopup(t('checkout.err.required'));
        setLoading(false);
        return;
      }

      if (pinLat === null || pinLng === null) {
        showErrorPopup(t('checkout.err.pin'));
        setLoading(false);
        return;
      }

      const displayItems = getDisplayItems();
      if (!displayItems || displayItems.length === 0) {
        showErrorPopup(t('checkout.err.noItems'));
        setLoading(false);
        return;
      }

      if (!(await ensureDeliveryDate())) {
        setLoading(false);
        return;
      }

      const orderData: any = {
        shippingAddress: {
          name: formData.name,
          email: formData.email,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
                    alternatePhone: formData.alternatePhone.trim(),   // ✅ NEW

          phone: formData.phone,
        },
        paymentMethod: 'cod',
        deliveryDate,
        deliverySlotId: deliverySlotId || undefined,
        typedArea: wardInput.trim(),
        customerPin: buildCustomerPin(),
        landmark: formData.landmark.trim(),
                alternatePhone: formData.alternatePhone.trim(),     // ✅ NEW — top-level too

      };

      if (isBuyNowMode) {
        orderData.skipCartClear = true;
        orderData.products = displayItems.map((item: any) => ({
          product: item.product._id,
          variantId: item.selectedVariant?._id,
          variantName: item.selectedVariant?.variantName,
          price: item.price,
          quantity: item.quantity,
        }));
      }

      const result = await createOrder(orderData);

      if (isBuyNowMode) {
        sessionStorage.removeItem('buyNowItem');
      } else {
        clearCart();
      }

      showSuccessPopup(`Order placed successfully! Order ID: ${result.order.orderId}`);
      setTimeout(() => {
        window.location.href = `/order-success?orderId=${result.order.orderId}&deliveryDate=${result.order.deliveryDate || deliveryDate}`;
      }, 2000);

    } catch (error: any) {
      if (error.code === 'CART_EMPTY' || error.message === 'Cart is empty') {
        hardRedirectHome();
        return;
      }

      let errorMessage = 'Unable to place your order. Please try again.';
      if (error.code === 'STREET_NOT_FOUND') {
        errorMessage = 'We could not verify your street address. Please check and try again.';
      } else if (error.code === 'DELIVERY_AREA_NOT_AVAILABLE') {
        errorMessage = 'Sorry, we currently deliver only to Karaikudi and surrounding areas. Please check your city.';
      } else if (error.code === 'INSUFFICIENT_STOCK') {
        errorMessage = 'Some items in your cart are out of stock. Please remove them and try again.';
      } else if (error.code === 'VARIANT_REQUIRED') {
        errorMessage = 'Please select a product variant before adding to cart.';
      } else if (error.code === 'MISSING_FIELD') {
        errorMessage = 'Please fill all required fields.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      loadAvailability();
      showErrorPopup(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async (): Promise<void> => {
    try {
      setPaymentLoading(true);
      setAuthError('');

      if (!paymentSettings.razorpayEnabled || !paymentSettings.razorpayKeyId) {
        showErrorPopup('Razorpay payment is not configured properly. Please use Cash on Delivery.');
        setPaymentLoading(false);
        return;
      }

      if (!formData.name || !formData.phone || !formData.street || !formData.city ||
          !formData.state || !formData.postalCode) {
        showErrorPopup(t('checkout.err.required'));
        setPaymentLoading(false);
        return;
      }

      if (pinLat === null || pinLng === null) {
        showErrorPopup(t('checkout.err.pin'));
        setPaymentLoading(false);
        return;
      }

      if (user && !token) {
        setAuthError('Your session has expired. Please log in again.');
        showErrorPopup('Your session has expired. Please log in again.');
        setPaymentLoading(false);
        return;
      }

      const displayItems = getDisplayItems();
      if (!displayItems || displayItems.length === 0) {
        showErrorPopup(t('checkout.err.noItems'));
        setPaymentLoading(false);
        return;
      }

      if (!(await ensureDeliveryDate())) {
        setPaymentLoading(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showErrorPopup('Razorpay SDK failed to load. Please check your internet connection.');
        setPaymentLoading(false);
        return;
      }

      const orderData: any = {
        shippingAddress: {
          name: formData.name,
          email: formData.email,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
                    alternatePhone: formData.alternatePhone.trim(),   // ✅ NEW

        },
        paymentMethod: 'razorpay',
        // Cart is emptied only after the payment succeeds (see handler below)
        skipCartClear: true,
        deliveryDate,
        deliverySlotId: deliverySlotId || undefined,
        typedArea: wardInput.trim(),
        customerPin: buildCustomerPin(),
        landmark: formData.landmark.trim(),
                alternatePhone: formData.alternatePhone.trim(),     // ✅ NEW — top-level too

      };

      if (isBuyNowMode) {
        orderData.skipCartClear = true;
        orderData.products = displayItems.map((item: any) => ({
          product: item.product._id,
          variantId: item.selectedVariant?._id,
          variantName: item.selectedVariant?.variantName,
          price: item.price,
          quantity: item.quantity,
        }));
      }

      const orderResult = await createOrder(orderData);
      const orderId = orderResult.order.orderId;

      const razorpayOrder = await createRazorpayOrder(orderId);

      const options: RazorpayOptions = {
        key: razorpayOrder.key || paymentSettings.razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'Meenavan Fresh',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResult.success) {
              if (isBuyNowMode) sessionStorage.removeItem('buyNowItem');
              else clearCart();
              showSuccessPopup(`Payment successful! Order ID: ${orderId}`);
              setTimeout(() => {
                window.location.href = `/order-success?orderId=${orderId}&deliveryDate=${deliveryDate}`;
              }, 2000);
            } else {
              hardRedirectHome();
            }
          } catch (error) {
            console.error('Verification error:', error);
            hardRedirectHome();
          }
          setPaymentLoading(false);
        },
        prefill: {
          name: formData.name || user?.name || 'Customer',
          email: formData.email,
          contact: formData.phone,
        },
        notes: { orderId, address: formData.street },
        theme: { color: '#064B6A' },
        modal: {
          // Customer closed the payment window without paying
          ondismiss: () => {
            paymentFailed(razorpayOrder.id).catch(() => {});
            setPaymentLoading(false);
            setPayNotDone(true);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      // Razorpay shows its own "Retry" inside the window; if the customer then closes it, ondismiss runs
      razorpay.on('payment.failed', function (response: RazorpayErrorResponse) {
        console.error('❌ Payment failed:', response.error);
      });

      razorpay.open();

    } catch (error: any) {
      if (error.code === 'CART_EMPTY' || error.message === 'Cart is empty') {
        hardRedirectHome();
        return;
      }

      console.error('Razorpay error:', error);
      let errorMessage = 'Payment initialization failed. Please try again or use Cash on Delivery.';
      if (error.code === 'STREET_NOT_FOUND') {
        errorMessage = 'We could not verify your street address. Please check and try again.';
      } else if (error.code === 'DELIVERY_AREA_NOT_AVAILABLE') {
        errorMessage = 'Sorry, we currently deliver only to Karaikudi and surrounding areas. Please check your city.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      loadAvailability();
      showErrorPopup(errorMessage);
      setPaymentLoading(false);
    }
  };

  const displayItems = getDisplayItems();
  const subtotal = getSubtotal();
  const tax = subtotal * 0.05;
  const shippingFee = 0;
  const total = subtotal + tax + shippingFee;

  // Orders need a logged-in customer: ask first, before the long form (cart is kept after login)
  if (!authLoading && !user) {
    const back = encodeURIComponent(isBuyNowMode ? '/checkout?buyNow=true' : '/checkout');
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F8FCFD] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#B8DCE7] bg-white p-6 text-center shadow-md sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF8FC] text-2xl" aria-hidden="true">📱</div>
          <h1 className="text-xl font-bold text-[#063B5C] sm:text-2xl">{t('checkout.loginTitle')}</h1>
          <p className="mt-2 text-[#315A6E]">{t('checkout.loginSub')}</p>
          <Link
            href={`/login?returnTo=${back}`}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#063B5C] font-bold text-white transition hover:bg-[#0B4F8A]"
          >
            {t('checkout.loginBtn')}
          </Link>
          <Link
            href={`/signup?returnTo=${back}`}
            className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-[#063B5C] font-bold text-[#063B5C] transition hover:bg-[#EAF8FC]"
          >
            {t('checkout.signupBtn')}
          </Link>
          <Link href="/cart" className="mt-4 inline-block text-sm font-medium text-[#008FB8] underline">
            {t('checkout.backToCart')}
          </Link>
        </div>
      </div>
    );
  }

  // Nothing to buy (e.g. opened /checkout directly or after the cart was emptied)
  if (user && !isBuyNowMode && !cartLoading && cart && displayItems.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F8FCFD] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#B8DCE7] bg-white p-6 text-center shadow-md sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF8FC] text-2xl" aria-hidden="true">🛒</div>
          <h1 className="text-xl font-bold text-[#063B5C] sm:text-2xl">{t('cart.emptyTitle')}</h1>
          <p className="mt-2 text-[#315A6E]">{t('cart.emptyText')}</p>
          <Link
            href="/products"
            className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#063B5C] font-bold text-white transition hover:bg-[#0B4F8A]"
          >
            {t('hero.shop')}
          </Link>
        </div>
      </div>
    );
  }

  if (settingsLoading || loadingWards) {
    return (
      <div className="min-h-screen bg-[#F8FCFD] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008FB8] mx-auto mb-4"></div>
          <p className="text-[#315A6E]">{loadingWards ? 'Loading data...' : 'Loading payment methods...'}</p>
        </div>
      </div>
    );
  }

  const isAnyPaymentMethodAvailable = paymentSettings.razorpayEnabled || paymentSettings.cashOnDeliveryEnabled;

  if (!isAnyPaymentMethodAvailable) {
    return (
      <div className="min-h-screen bg-[#F8FCFD] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-4">
            <h2 className="text-xl font-semibold text-[#063B5C] mb-2">{t('checkout.noPayments')}</h2>
            <p className="text-[#315A6E] mb-4">All payment methods are currently disabled. Please contact the store administrator.</p>
            <button
              onClick={() => router.push('/cart')}
              className="px-6 py-3 text-white font-medium rounded-lg"
              style={{ backgroundColor: '#064B6A' }}
            >
              {t('checkout.backToCart')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {popup.isOpen && (() => {
        const tone = {
          error: { bg: 'bg-gradient-to-r from-red-50 to-red-100', icon: 'bg-red-500', title: 'text-red-600', button: 'bg-gradient-to-r from-red-500 to-red-600', path: 'M6 18L18 6M6 6l12 12' },
          success: { bg: 'bg-gradient-to-r from-green-50 to-green-100', icon: 'bg-green-500', title: 'text-green-600', button: 'bg-gradient-to-r from-green-500 to-green-600', path: 'M5 13l4 4L19 7' },
          info: { bg: 'bg-gradient-to-r from-amber-50 to-amber-100', icon: 'bg-amber-500', title: 'text-amber-700', button: 'bg-gradient-to-r from-amber-500 to-amber-600', path: 'M12 8v4m0 4h.01' },
        }[popup.type];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePopup} />
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" role="alertdialog" aria-labelledby="checkout-popup-title">
              <div className={`pt-8 pb-4 text-center ${tone.bg}`}>
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${tone.icon} shadow-lg`}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tone.path} />
                  </svg>
                </div>
              </div>
              <div className="px-8 pt-4 pb-6 text-center">
                <h3 id="checkout-popup-title" className={`text-2xl font-bold mb-3 ${tone.title}`}>{popup.title}</h3>
                <p className="text-[#315A6E] text-base leading-relaxed">{popup.message}</p>
              </div>
              <div className="px-8 pb-8">
                <button
                  onClick={closePopup}
                  className={`w-full py-3 rounded-xl font-semibold text-white ${tone.button} shadow-lg`}
                >
                  {t('common.gotIt')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {payNotDone && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="pay-not-done-title">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-col items-center rounded-t-2xl bg-amber-50 px-6 pb-4 pt-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-2xl text-white" aria-hidden="true">!</span>
              <h2 id="pay-not-done-title" className="mt-3 text-xl font-bold text-amber-900">{t('pay.notDoneTitle')}</h2>
            </div>
            <div className="space-y-3 px-6 py-5">
              <p className="text-[15px] text-[#063B5C]">{t('pay.notDoneText')}</p>
              <p className="text-xs text-[#315A6E]">{t('pay.notDoneMoney')}</p>
              <button
                type="button"
                onClick={() => { setPayNotDone(false); handleRazorpayPayment(); }}
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#063B5C] font-bold text-white hover:bg-[#0B4F8A]"
              >
                {t('pay.tryAgain')}
              </button>
              {paymentSettings.cashOnDeliveryEnabled && (
                <button
                  type="button"
                  onClick={() => { setPayNotDone(false); setPayMethod('cod'); }}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-[#063B5C] font-bold text-[#063B5C] hover:bg-[#F0F9FC]"
                >
                  {t('pay.useCod')}
                </button>
              )}
              <button type="button" onClick={() => setPayNotDone(false)} className="w-full py-2 text-sm font-medium text-[#008FB8] underline">
                {t('pay.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#F8FCFD] py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#063B5C]">{t('checkout.title')}</h1>
          </div>
          <CartChangedNotice />
          <div className="mb-4 empty:hidden">
            {isBuyNowMode && (
              <div className="border px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm" style={{ backgroundColor: '#008FB8/10', borderColor: '#008FB8/20', color: '#008FB8' }}>
                <p>⚡ {t('checkout.buyNowMode')}</p>
              </div>
            )}
          </div>

          {authError && (
            <div className="mb-4 sm:mb-6 bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm sm:text-base">{authError}</span>
              </div>
              <div className="mt-2">
                <Link href="/login" className="text-red-600 underline font-semibold text-sm sm:text-base">Click here to log in again</Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 border border-[#B8DCE7]">
              <h2 className="text-lg sm:text-xl font-semibold text-[#063B5C] mb-4 sm:mb-6"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#063B5C] text-sm font-bold text-white align-middle" aria-hidden="true">1</span>{t('checkout.step1')}</h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#315A6E] mb-1">{t('checkout.fullName')}</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                    placeholder={t('checkout.fullNamePh')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#315A6E] mb-1">{t('checkout.email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                    placeholder="your@email.com"
                  />
                </div>

                      <div>
                  <label className="block text-sm font-medium text-[#315A6E] mb-1">{t('checkout.phone')}</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                    placeholder={t('checkout.phonePh')}
                  />
                </div>

                {/* ✅ NEW — Alternate phone (optional) */}
                <div>
                  <label className="block text-sm font-medium text-[#315A6E] mb-1">
                    {t('checkout.altPhone')}
                  </label>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleInputChange}
                    maxLength={15}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                    placeholder={t('checkout.altPhonePh')}
                  />
                </div>

                {usedLastAddress && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                    <span>✅ {t('checkout.lastAddress')}</span>
                    <button type="button" onClick={clearLastAddress} className="font-semibold text-[#008FB8] underline">
                      {t('checkout.newAddress')}
                    </button>
                  </div>
                )}

                <div className="relative">
                  <label className="block text-sm font-medium text-[#315A6E] mb-1">
                    {t('checkout.street')} <span className="text-xs text-gray-500">{t('checkout.streetHint')}</span>
                  </label>
                  <input
                    ref={streetInputRef}
                    type="text"
                    name="street"
                    required
                    autoComplete="off"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                    placeholder={t('checkout.streetPh')}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs sm:text-sm font-medium text-[#315A6E]">
                      📍 {t('checkout.pin')}
                    </label>
                    {pinLat !== null && pinLng !== null && (
                      <span className="text-[10px] text-green-600 font-mono">
                        {pinLat.toFixed(6)}, {pinLng.toFixed(6)}
                      </span>
                    )}
                  </div>

                  <div
                    ref={mapRef}
                    className="w-full rounded-md border border-[#B8DCE7] overflow-hidden"
                    style={{ height: '260px', background: '#f0f7fa' }}
                  />

                  {mapError && (
                    <p className="mt-1 text-xs text-red-600">{mapError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50"
                    style={{ border: '1px solid #008FB8', color: '#008FB8', backgroundColor: '#F0F9FC' }}
                  >
                    {locating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-[#008FB8] border-t-transparent rounded-full" />
                        {t('checkout.locating')}
                      </>
                    ) : (
                      <>📍 {t('checkout.useLocation')}</>
                    )}
                  </button>

                  <p className="mt-2 text-[11px] text-gray-500">
                    {t('checkout.pinHelp')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#315A6E] mb-1">
                    🚩 {t('checkout.landmark')}
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    maxLength={200}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                    placeholder=""
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#315A6E] mb-1">{t('checkout.city')}</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#315A6E] mb-1">{t('checkout.state')}</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#315A6E] mb-1">{t('checkout.postal')}</label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                      placeholder="Postal Code"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#315A6E] mb-1">{t('checkout.country')}</label>
                  <select
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#B8DCE7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 border border-[#B8DCE7]">
                <h2 className="text-lg sm:text-xl font-semibold text-[#063B5C] mb-4"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#063B5C] text-sm font-bold text-white align-middle" aria-hidden="true">2</span>{t('checkout.step2')}</h2>
                <DeliveryDatePicker
                  availability={availability}
                  loading={availabilityLoading}
                  error={availabilityError}
                  selectedDate={deliveryDate}
                  selectedSlotId={deliverySlotId}
                  onSelectDate={handleSelectDate}
                  onSelectSlot={setDeliverySlotId}
                  onUnavailable={handleUnavailableDate}
                  onRetry={loadAvailability}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 border border-[#B8DCE7]">
                <h2 className="text-lg sm:text-xl font-semibold text-[#063B5C] mb-4"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#063B5C] text-sm font-bold text-white align-middle" aria-hidden="true">3</span>{t('checkout.step3')}</h2>

                <div className="space-y-3 mb-4">
                  {displayItems.map((item: any) => (
                    <div key={item._id} className="flex justify-between items-center border-b border-[#B8DCE7] pb-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-[#063B5C]">{getProductName(item.product)}</p>
                        {item.selectedVariant && (
                          <p className="text-xs font-medium" style={{ color: '#008FB8' }}>
                            📦 Pack: {item.selectedVariant.variantName || item.selectedVariant.name}
                          </p>
                        )}
                        {(() => {
                          const w = itemWeight(item);
                          if (!w) return <p className="text-xs text-[#315A6E]">{t('checkout.qty', { n: item.quantity })}</p>;
                          const one = formatWeight(w.weight, w.unit);
                          return (
                            <p className="text-xs text-[#315A6E]">
                              ⚖️ <span className="font-semibold text-[#063B5C]">{one}</span>
                              {item.quantity > 1
                                ? <> × {item.quantity} = <span className="font-semibold text-[#063B5C]">{formatWeight(w.weight * item.quantity, w.unit)}</span></>
                                : <> · {t('checkout.qty', { n: item.quantity })}</>}
                            </p>
                          );
                        })()}
                      </div>
                      <p className="font-semibold text-sm sm:text-base text-[#063B5C]">
                        ₹{(getProductPrice(item) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {totalGrams(displayItems) > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-[#315A6E]">
                      <span>{t('checkout.totalWeight')}</span>
                      <span className="font-semibold text-[#063B5C]">{formatWeight(totalGrams(displayItems), 'gram')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base text-[#315A6E]">
                    <span>{t('cart.subtotalPlain')}</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base text-[#315A6E]">
                    <span>{t('cart.delivery')}</span>
                    <span className="font-medium" style={{ color: '#008FB8' }}>{t('common.free')}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base text-[#315A6E]">
                    <span>{t('cart.tax')}</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-semibold border-t border-[#B8DCE7] pt-2 text-[#063B5C]">
                    <span>{t('cart.total')}</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 border border-[#B8DCE7]">
                <h2 className="text-lg sm:text-xl font-semibold text-[#063B5C] mb-1"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#063B5C] text-sm font-bold text-white align-middle" aria-hidden="true">4</span>{t('checkout.step4')}</h2>
                <p className="mb-4 text-sm text-[#315A6E]">{t('checkout.payHint')}</p>

                {(() => {
                  const onlineOk = paymentSettings.razorpayEnabled && !!paymentSettings.razorpayKeyId;
                  const codOk = paymentSettings.cashOnDeliveryEnabled;
                  // Default: online when available, otherwise cash on delivery
                  const method = payMethod ?? (onlineOk ? 'online' : 'cod');
                  const amount = `₹${total.toFixed(2)}`;
                  const busy = loading || paymentLoading;
                  const options = [
                    onlineOk && { key: 'online' as const, title: t('pay.online'), sub: t('pay.onlineSub'), icon: '📱' },
                    codOk && { key: 'cod' as const, title: t('pay.cod'), sub: t('pay.codSub'), icon: '💵' },
                  ].filter(Boolean) as { key: 'online' | 'cod'; title: string; sub: string; icon: string }[];

                  return (
                    <div className="space-y-4">
                      <div role="radiogroup" aria-label={t('checkout.step4')} className="grid gap-3 sm:grid-cols-2">
                        {options.map(opt => {
                          const selected = method === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              disabled={busy}
                              onClick={() => setPayMethod(opt.key)}
                              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                                selected ? 'border-[#063B5C] bg-[#F0F9FC] shadow-sm' : 'border-[#D6ECF3] bg-white hover:border-[#008FB8]'
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                  selected ? 'border-[#063B5C]' : 'border-gray-300'
                                }`}
                                aria-hidden="true"
                              >
                                {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#063B5C]" />}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-bold text-[#063B5C]">
                                  <span aria-hidden="true">{opt.icon}</span> {opt.title}
                                </span>
                                <span className="mt-0.5 block text-xs text-[#315A6E] sm:text-sm">{opt.sub}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {options.length > 0 && (
                        <button
                          type="button"
                          onClick={method === 'online' ? handleRazorpayPayment : handleCashOnDelivery}
                          disabled={busy || !!authError}
                          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#063B5C] px-4 text-base font-bold text-white shadow-lg transition hover:bg-[#0B4F8A] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
                        >
                          {busy ? (
                            <span className="flex items-center">
                              <span className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                              {t('checkout.processing')}
                            </span>
                          ) : method === 'online' ? (
                            t('pay.btnOnline', { amount })
                          ) : (
                            t('pay.btnCod', { amount })
                          )}
                        </button>
                      )}

                      {method === 'online' && (
                        <p className="text-center text-xs text-[#315A6E]">🔒 {t('pay.secure')}</p>
                      )}
                    </div>
                  );
                })()}

                <HelpLine />

                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#008FB8/10', border: '1px solid #008FB8/20' }}>
                  {user ? (
                    <div className="flex items-center space-x-2" style={{ color: '#008FB8' }}>
                      <span className="text-xs sm:text-sm">{t('checkout.loggedInAs', { phone: user.phoneNumber })}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2" style={{ color: '#008FB8' }}>
                      <span className="text-xs sm:text-sm">{t('checkout.guest')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}