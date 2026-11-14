// context/LocationContext.tsx — the customer's delivery location.
// When location pricing is switched on (backend), customers must pick a location before
// seeing prices. Returning customers confirm the location saved on their account in one tap.
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import LocationPicker from '@/components/location/LocationPicker';
import {
  DeliveryLocation,
  LocationOption,
  clearStoredLocation,
  fetchLocations,
  fetchMyLocation,
  getStoredLocation,
  installLocationHeader,
  repriceGuestCart,
  saveMyLocation,
  storeLocation,
} from '@/lib/location';

// Add the location to API calls before any component fetches anything
installLocationHeader();

interface LocationContextType {
  /** true when the store uses location-wise prices */
  enabled: boolean;
  location: DeliveryLocation | null;
  locations: LocationOption[];
  openPicker: () => void;
  /** Save a location and reload so every price on the page is for it */
  chooseLocation: (loc: DeliveryLocation) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [suggested, setSuggested] = useState<DeliveryLocation | null>(null);
  const [ready, setReady] = useState(false);

  // 1) Is location pricing on, and is the stored location still served?
  useEffect(() => {
    let alive = true;
    fetchLocations()
      .then(({ enabled: on, locations: list }) => {
        if (!alive) return;
        setEnabled(on);
        setLocations(list);
        const stored = getStoredLocation();
        if (!on) {
          // Switched off: show normal prices everywhere
          if (stored) clearStoredLocation();
          setLocation(null);
        } else if (stored && list.some(l => l.slug === stored.slug)) {
          setLocation(stored);
        } else if (stored) {
          // That location was paused or removed by the shop
          clearStoredLocation();
          setLocation(null);
        }
        setReady(true);
      })
      .catch(() => setReady(true)); // API down: don't block the site
    return () => { alive = false; };
  }, []);

  // 2) No location yet → ask. Logged-in customers get their saved one suggested.
  useEffect(() => {
    if (!ready || !enabled || location || authLoading) return;
    let alive = true;
    (user ? fetchMyLocation() : Promise.resolve(null)).then(saved => {
      if (!alive) return;
      setSuggested(saved && locations.some(l => l.slug === saved.slug) ? saved : null);
      setPickerOpen(true);
    });
    return () => { alive = false; };
  }, [ready, enabled, location, authLoading, user, locations]);

  const chooseLocation = useCallback(async (loc: DeliveryLocation) => {
    const changed = getStoredLocation()?.slug !== loc.slug;
    storeLocation(loc);
    await Promise.all([saveMyLocation(loc.pincode, loc.place), changed ? repriceGuestCart(loc.slug) : null]);
    setPickerOpen(false);
    // Reload so products, cart and checkout all show this location's prices
    window.location.reload();
  }, []);

  return (
    <LocationContext.Provider value={{ enabled, location, locations, openPicker: () => setPickerOpen(true), chooseLocation }}>
      {children}
      {pickerOpen && enabled && (
        <LocationPicker
          locations={locations}
          suggested={suggested}
          current={location}
          // Without a location the customer must choose one; changing it can be cancelled
          onClose={location ? () => setPickerOpen(false) : undefined}
          onChoose={chooseLocation}
        />
      )}
    </LocationContext.Provider>
  );
}
