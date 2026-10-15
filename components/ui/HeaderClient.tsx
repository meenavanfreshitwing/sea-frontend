"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, useRef } from "react";
import { quickSearchProducts } from "@/lib/productService";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  ShoppingCart,
  Menu,
  X,
  User,
  Search,
  Phone,
  Mail,
  ChevronDown,
  Home,
  Info,
  MapPin,
} from "lucide-react";

import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";

import { Category } from "@/types/category";
import CartDrawer from "@/components/CartDrawer";
import { settingsAPI } from "@/lib/settings-api";
import BrandWordmark from '@/components/ui/BrandWordmark';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';

interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  image: string | null;
  category: string;
  featured: boolean;
}

interface HeaderClientProps {
  categories: Category[];
}

export default function HeaderClient({
  categories,
}: HeaderClientProps) {
  const { t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();

  /* ============================================================
     ACTIVE CATEGORY DETECTION
  ============================================================ */
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategorySlug = searchParams.get("category");

  const STATIC_URL = process.env.NEXT_PUBLIC_STATIC_URL;
  const IMG_URL = process.env.NEXT_PUBLIC_IMG_URL;

  /* ============================================================
     STATES
  ============================================================ */

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);

  const [siteName, setSiteName] = useState("Meenavan Fresh");
  // Filled from store settings; hidden while empty
  const [contactEmail, setContactEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [socialMedia, setSocialMedia] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    linkedin: "",
  });

  /* ============================================================
     REFS
  ============================================================ */

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     CATEGORY DATA
  ============================================================ */

  // Keep the desktop menu short and tidy: every category lives inside "Shop"
  // (names can be long and the list grows; the home page shows them as a grid too)
  const displayedCategories: Category[] = [];
  const dropdownCategories = categories;

  const cartCount = cart?.totalItems || 0;

  /* ============================================================
     FETCH SETTINGS
  ============================================================ */

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getPublicSettings();

      if (response.success && response.data) {
        const data = response.data;

        if (data.siteName) setSiteName(data.siteName);
        if (data.contactEmail) setContactEmail(data.contactEmail);
        if (data.contactNumber) setContactNumber(data.contactNumber);

        if (data.socialMedia) {
          setSocialMedia({
            facebook: data.socialMedia.facebook || "",
            instagram: data.socialMedia.instagram || "",
            twitter: data.socialMedia.twitter || "",
            youtube: data.socialMedia.youtube || "",
            linkedin: data.socialMedia.linkedin || "",
          });
        }

        if (data.facebookUrl)
          setSocialMedia((prev) => ({
            ...prev,
            facebook: data.facebookUrl || "",
          }));
        if (data.instagramUrl)
          setSocialMedia((prev) => ({
            ...prev,
            instagram: data.instagramUrl || "",
          }));
        if (data.twitterUrl)
          setSocialMedia((prev) => ({
            ...prev,
            twitter: data.twitterUrl || "",
          }));
        if (data.youtubeUrl)
          setSocialMedia((prev) => ({
            ...prev,
            youtube: data.youtubeUrl || "",
          }));
        if (data.linkedinUrl)
          setSocialMedia((prev) => ({
            ...prev,
            linkedin: data.linkedinUrl || "",
          }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  /* ============================================================
     USER HELPERS
  ============================================================ */

  const getUserInitial = () => {
    if (!user) return "U";
    const email =
      (user as any)?.email ||
      (user as any)?.phone ||
      (user as any)?.mobile;
    if (email && typeof email === "string")
      return email.charAt(0).toUpperCase();
    return "U";
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    return (
      (user as any)?.name ||
      (user as any)?.email ||
      (user as any)?.phone ||
      ""
    );
  };

  const getUserShortName = () => {
    const displayName = getUserDisplayName();
    if (!displayName) return "";
    if (displayName.includes("@")) return displayName.split("@")[0];
    return displayName;
  };

  /* ============================================================
     CATEGORY CLICK
  ============================================================ */

  const handleCategoryClick = (category: Category | string) => {
    const categorySlug =
      typeof category === "string"
        ? category
        : category.slug || category._id;

    router.push(
      `/products?category=${encodeURIComponent(categorySlug)}`
    );

    setIsMenuOpen(false);
    setIsShopDropdownOpen(false);
  };

  const isCategoryActive = (cat: Category) =>
    activeCategorySlug === (cat.slug || cat._id);

  /* ============================================================
     SEARCH
  ============================================================ */

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await quickSearchProducts(searchQuery, 5);
        if (response.success) setSearchResults(response.data);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(
      `/products?search=${encodeURIComponent(searchQuery.trim())}`
    );
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearchClick = () => setShowSearch(true);

  const handleProductClick = (product: SearchProduct) => {
    router.push(`/products/${product.slug}`);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleViewAllResults = () => {
    if (!searchQuery.trim()) return;
    router.push(
      `/products?search=${encodeURIComponent(searchQuery.trim())}`
    );
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  /* ============================================================
     CLICK-OUTSIDE HANDLERS
  ============================================================ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        window.innerWidth >= 1024 &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        shopDropdownRef.current &&
        !shopDropdownRef.current.contains(event.target as Node)
      ) {
        setIsShopDropdownOpen(false);
      }
    };
    if (isShopDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isShopDropdownOpen]);

  /* ============================================================
     SEARCH AUTO FOCUS
  ============================================================ */

  useEffect(() => {
    if (!showSearch) return;
    const timer = setTimeout(() => {
      const isMobile =
        typeof window !== "undefined" && window.innerWidth < 1024;
      const input = isMobile
        ? mobileSearchInputRef.current
        : searchInputRef.current;
      input?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [showSearch]);

  /* ============================================================
     IMAGE HELPERS
  ============================================================ */

  const resolveImagePath = (path: string) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://"))
      return path;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `${IMG_URL}/${clean}`;
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath || imagePath.trim() === "") return null;
    return resolveImagePath(imagePath);
  };

  /* ============================================================
     LOGO
  ============================================================ */


  const categoryLabel = (name: string) => name;

  return (
    <>
      {/* =========================================================
          TOP CONTACT BAR  (lg+)
      ========================================================= */}

      <div className="hidden lg:block w-full bg-[#064B6A]">
        <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-[40px] gap-4">

            <div className="flex items-center gap-4 xl:gap-7 text-[#EAF8FC] text-[11px] xl:text-[12px] font-semibold min-w-0">

              {contactNumber && (
                <a href={`tel:${contactNumber.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 shrink-0 hover:underline">
                  <Phone className="w-3.5 h-3.5 text-[#00A9E0]" aria-hidden="true" />
                  <span>{t('top.callUs', { phone: contactNumber })}</span>
                </a>
              )}

              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 min-w-0 hover:underline">
                  <Mail className="w-3.5 h-3.5 text-[#00A9E0] shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[180px] xl:max-w-[260px]">
                    {contactEmail}
                  </span>
                </a>
              )}

            </div>

            <div className="flex items-center gap-3 xl:gap-5 text-[#EAF8FC] text-[11px] xl:text-[12px] font-semibold shrink-0">

              <Link
                href="/contact"
                className="hover:text-[#00A9E0] transition-colors"
              >
                {t('nav.contact')}
              </Link>

              <div className="flex items-center gap-2 xl:gap-3">
                {socialMedia.facebook && (
                  <a
                    href={socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#00A9E0] transition-colors"
                  >
                    <FaFacebookF className="w-3 h-3" />
                  </a>
                )}
                {socialMedia.twitter && (
                  <a
                    href={socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#00A9E0] transition-colors"
                  >
                    <FaTwitter className="w-3 h-3" />
                  </a>
                )}
                {socialMedia.instagram && (
                  <a
                    href={socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#00A9E0] transition-colors"
                  >
                    <FaInstagram className="w-3 h-3" />
                  </a>
                )}
                {socialMedia.youtube && (
                  <a
                    href={socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#00A9E0] transition-colors"
                  >
                    <FaYoutube className="w-3 h-3" />
                  </a>
                )}
                {socialMedia.linkedin && (
                  <a
                    href={socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#00A9E0] transition-colors"
                  >
                    <FaLinkedinIn className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN HEADER
      ========================================================= */}

      <header className="sticky top-0 z-50 w-full bg-[#F8FCFD] border-b border-[#B8DCE7] shadow-sm">
        <div className="w-full max-w-[1440px] mx-auto">

          <div className="relative flex items-center min-h-[64px] lg:min-h-[72px] px-3 sm:px-4 lg:px-6 xl:px-8">

            {/* ================= LOGO ================= */}

            <div className="flex items-center shrink-0 min-w-0">

              <Link href="/" className="flex items-center gap-2 min-w-0">
                <div className="relative w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] lg:w-[58px] lg:h-[58px] xl:w-[68px] xl:h-[68px] shrink-0">
                  <Image
                    src={`${STATIC_URL}/logoo.webp`}
                    alt={siteName}
                    fill
                    priority
                    sizes="68px"
                    className="object-contain"
                  />
                </div>

                <BrandWordmark size="md" tagline />
              </Link>
            </div>

            {/* ==================================================
                DESKTOP NAVIGATION
            ================================================== */}

            <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 px-2">

              <nav className="flex items-center justify-center gap-2 lg:gap-3 xl:gap-5 2xl:gap-7 w-full min-w-0">

                {/* HOME */}
                <Link
                  href="/"
                  className={`
                    shrink-0
                    text-[15px] font-semibold
                    transition-colors
                    whitespace-nowrap
                    ${
                      pathname === "/"
                        ? "text-[#008FB8]"
                        : "text-[#063B5C] hover:text-[#008FB8]"
                    }
                  `}
                >
                  {t('nav.home')}
                </Link>

                {/* INLINE CATEGORIES */}
                {displayedCategories.map((cat) => {
                  const active = isCategoryActive(cat);
                  return (
                    <button
                      key={cat._id}
                      onClick={() => handleCategoryClick(cat)}
                      className="
                        group
                        shrink
                        min-w-0
                        max-w-[85px]
                        lg:max-w-[95px]
                        xl:max-w-[115px]
                        2xl:max-w-[145px]
                        min-h-[42px]
                        px-1
                        flex
                        items-center
                        justify-center
                        text-center
                        cursor-pointer
                        relative
                      "
                    >
                      <span
                        className={`
                          text-[15px] font-semibold
                          leading-[1.2] lg:leading-[1.25]
                          transition-colors
                          whitespace-normal
                          break-words
                          line-clamp-2
                          ${
                            active
                              ? "text-[#008FB8]"
                              : "text-[#063B5C] group-hover:text-[#008FB8]"
                          }
                        `}
                      >
                        {categoryLabel(cat.name)}
                      </span>

                      {active && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 lg:w-5 h-[2px] bg-[#008FB8] rounded-full" />
                      )}
                    </button>
                  );
                })}

                {/* SHOP DROPDOWN */}
                {dropdownCategories.length > 0 && (
                  <div
                    ref={shopDropdownRef}
                    className="relative shrink-0"
                    onMouseEnter={() => setIsShopDropdownOpen(true)}
                    onMouseLeave={() => setIsShopDropdownOpen(false)}
                  >
                    <button
                      onClick={() =>
                        setIsShopDropdownOpen(!isShopDropdownOpen)
                      }
                      aria-expanded={isShopDropdownOpen}
                      aria-haspopup="true"
                      className="
                        flex items-center justify-center gap-1
                        text-[15px] font-semibold
                        text-[#063B5C]
                        hover:text-[#008FB8]
                        transition-colors
                        whitespace-nowrap
                        cursor-pointer
                      "
                    >
                      {t('nav.shop')}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          isShopDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isShopDropdownOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[200px] xl:w-[220px] bg-white rounded-xl shadow-2xl border border-[#B8DCE7] overflow-hidden z-[60]">
                        <div className="px-4 py-3 border-b border-[#EAF8FC] bg-[#F8FCFD]">
                          <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#315A6E]">
                            {t('nav.shopByCategory')}
                          </p>
                        </div>

                        <div className="p-2 max-h-[60vh] overflow-y-auto">
                          {dropdownCategories.map((cat) => {
                            const active = isCategoryActive(cat);
                            return (
                              <button
                                key={cat._id}
                                onClick={() => handleCategoryClick(cat)}
                                className={`
                                  flex items-center w-full text-left
                                  px-3 py-2.5 rounded-lg
                                  text-[14px]
                                  font-medium
                                  transition-colors cursor-pointer
                                  ${
                                    active
                                      ? "text-[#008FB8] bg-[#EAF8FC]"
                                      : "text-[#315A6E] hover:text-[#008FB8] hover:bg-[#EAF8FC]"
                                  }
                                `}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#008FB8] mr-2.5 shrink-0" />
                                <span className="truncate">
                                  {cat.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ABOUT */}
                <Link
                  href="/about"
                  className={`
                    shrink-0
                    text-[15px] font-semibold
                    transition-colors
                    whitespace-nowrap
                    ${
                      pathname === "/about"
                        ? "text-[#008FB8]"
                        : "text-[#063B5C] hover:text-[#008FB8]"
                    }
                  `}
                >
                  {t('nav.about')}
                </Link>

                {/* CONTACT */}
                <Link
                  href="/contact"
                  className={`
                    shrink-0
                    text-[15px] font-semibold
                    transition-colors
                    whitespace-nowrap
                    ${
                      pathname === "/contact"
                        ? "text-[#008FB8]"
                        : "text-[#063B5C] hover:text-[#008FB8]"
                    }
                  `}
                >
                  {t('nav.contact')}
                </Link>

              </nav>
            </div>

            {/* ==================================================
                RIGHT ACTIONS
            ================================================== */}

<div className="flex items-center justify-end gap-2 sm:gap-4 xl:gap-5 shrink-0 ml-auto w-auto pr-1 sm:pr-2">
              {!showSearch ? (
                <>
                  {/* LANGUAGE */}
                  <div className="hidden xl:block">
                    <LanguageSwitcher />
                  </div>
                  <div className="xl:hidden">
                    <LanguageSwitcher compact />
                  </div>

                  {/* SEARCH (on phones the bottom bar has Search) */}
                  <button
                    onClick={handleSearchClick}
                    aria-label={t('nav.search')}
                    className="hidden lg:block text-[#063B5C] hover:text-[#008FB8] transition-colors p-1"
                  >
                    <Search className="w-[18px] h-[18px]" />
                  </button>

                  {/* CART */}
                  <button
                    onClick={() => setIsCartDrawerOpen(true)}
                    aria-label={t('nav.cart')}
                    className="relative text-[#063B5C] hover:text-[#008FB8] transition-colors p-1"
                  >
                    <ShoppingCart className="w-[19px] h-[19px]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#008FB8] text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </button>

                  {/* LOGIN / ACCOUNT */}
                  {!isAuthenticated ? (
                    <Link href="/login" className="hidden lg:block">
                      <span
                        className="
                          inline-flex items-center justify-center
                          h-[36px] xl:h-[38px]
                          px-3 xl:px-5
                          rounded-full
                          border border-[#008FB8]
                          bg-[#EAF8FC]
                          text-[#063B5C]
                          text-[14px]
                          font-semibold
                          hover:bg-[#008FB8] hover:text-white
                          transition-colors whitespace-nowrap
                        "
                      >
                        {t('nav.login')}
                      </span>
                    </Link>
                  ) : (
                    <div
                      ref={profileDropdownRef}
                      className="relative hidden lg:block"
                    >
                      <button
                        onClick={() =>
                          setIsDropdownOpen(!isDropdownOpen)
                        }
                        className="
                          inline-flex items-center gap-2
                          h-[36px] xl:h-[38px]
                          px-3 xl:px-4
                          rounded-full
                          border border-[#008FB8]
                          bg-[#EAF8FC]
                          text-[#063B5C]
                          text-[14px]
                          font-semibold
                          hover:bg-[#008FB8] hover:text-white
                          transition-colors
                          max-w-[110px] xl:max-w-[130px]
                        "
                      >
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {getUserShortName()}
                        </span>
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-xl shadow-xl border border-[#B8DCE7] py-2 overflow-hidden z-[70]">
                          <Link
                            href="/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="block px-4 py-2.5 text-sm text-[#315A6E] hover:bg-[#EAF8FC] hover:text-[#008FB8]"
                          >
                            {t('nav.myOrders')}
                          </Link>
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              logout();
                              router.push("/");
                            }}
                            className="block w-full text-left px-4 py-2.5 text-sm text-[#315A6E] hover:bg-[#EAF8FC] hover:text-[#008FB8]"
                          >
                            {t('nav.logout')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* DESKTOP SEARCH */
                <div
                  ref={searchContainerRef}
                  className="hidden lg:block relative w-[200px] xl:w-[260px]"
                >
                  <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center gap-1"
                  >
                    <div className="flex-1 flex items-center h-9 bg-white border border-[#B8DCE7] rounded-lg px-2.5">
                      <Search className="w-3.5 h-3.5 text-[#008FB8] shrink-0 mr-1.5" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('search.placeholder')}
                        className="flex-1 min-w-0 bg-transparent outline-none text-xs text-[#063B5C]"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="ml-1"
                        >
                          <X className="w-3 h-3 text-[#315A6E]" />
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="h-9 px-2.5 bg-[#008FB8] hover:bg-[#00A9E0] text-white rounded-lg text-[10px] font-bold"
                    >
                      {t('search.go')}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[#EAF8FC]"
                    >
                      <X className="w-4 h-4 text-[#315A6E]" />
                    </button>
                  </form>

                  {(searchResults.length > 0 || isSearching) && (
                    <div className="absolute top-full right-0 mt-2 w-[300px] xl:w-[340px] bg-white rounded-xl shadow-2xl border border-[#B8DCE7] overflow-hidden z-[80]">
                      {isSearching ? (
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#008FB8] mx-auto" />
                          <p className="mt-2 text-xs text-[#315A6E]">
                            {t('search.searching')}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="p-2">
                            {searchResults.map((product) => (
                              <div
                                key={product._id}
                                onClick={() => handleProductClick(product)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EAF8FC] cursor-pointer"
                              >
                                <div className="relative w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-[#EAF8FC]">
                                  {getImageUrl(product.image) ? (
                                    <Image
                                      src={getImageUrl(product.image)!}
                                      alt={product.name}
                                      fill
                                      sizes="44px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ShoppingCart className="w-4 h-4 text-[#008FB8]" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[#063B5C] truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-[#315A6E] truncate">
                                    {product.category}
                                  </p>
                                </div>

                                <span className="text-sm font-bold text-[#008FB8] shrink-0">
                                  ₹{product.basePrice}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={handleViewAllResults}
                            className="w-full border-t border-[#B8DCE7] bg-[#F8FCFD] hover:bg-[#EAF8FC] py-3 text-xs font-semibold text-[#008FB8]"
                          >
                            View all results for "{searchQuery}"
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* MOBILE MENU TOGGLE */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden text-[#063B5C] hover:text-[#008FB8] p-1"
                aria-label={t('nav.menu')}
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          MOBILE MENU
      ========================================================= */}

      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="absolute top-0 left-0 h-full w-[290px] max-w-[85vw] bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 h-[72px] border-b border-[#B8DCE7]">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 min-w-0"
              >
                <div className="relative w-11 h-11 shrink-0">
                  <Image
                    src={`${STATIC_URL}/logoo.webp`}
                    alt={siteName}
                    fill
                    className="object-contain"
                  />
                </div>
                <BrandWordmark size="sm" />
              </Link>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-[#315A6E] shrink-0"
                aria-label={t('nav.closeMenu')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="h-[calc(100%-72px)] overflow-y-auto p-4">
              <div className="mb-3 flex justify-center border-b border-[#B8DCE7] pb-4">
                <LanguageSwitcher />
              </div>
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-base font-semibold text-[#063B5C]"
              >
                <Home className="w-4 h-4 text-[#008FB8]" />
                {t('nav.home')}
              </Link>

              <div className="mt-4 mb-2 px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#315A6E]">
                  {t('nav.shopByCategory')}
                </p>
              </div>

              <div className="space-y-1">
                {categories.map((cat) => {
                  const active = isCategoryActive(cat);
                  return (
                    <button
                      key={cat._id}
                      onClick={() => handleCategoryClick(cat)}
                      className={`
                        flex items-center gap-3 w-full text-left
                        py-2.5 px-3 rounded-lg
                        text-[15px] font-medium
                        transition-colors
                        ${
                          active
                            ? "text-[#008FB8] bg-[#EAF8FC]"
                            : "text-[#315A6E] hover:text-[#008FB8] hover:bg-[#EAF8FC]"
                        }
                      `}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#008FB8] shrink-0" />
                      <span className="truncate">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Link
                href="/about"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 py-3 mt-4 border-t border-[#B8DCE7] text-base font-semibold text-[#063B5C]"
              >
                <Info className="w-4 h-4 text-[#008FB8]" />
                {t('nav.about')}
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-base font-semibold text-[#063B5C]"
              >
                <MapPin className="w-4 h-4 text-[#008FB8]" />
                {t('nav.contact')}
              </Link>

              {!isAuthenticated ? (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-3 border-t border-[#B8DCE7] mt-2 text-base font-semibold text-[#063B5C]"
                >
                  <User className="w-4 h-4 text-[#008FB8]" />
                  {t('nav.login')}
                </Link>
              ) : (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 py-3 border-t border-[#B8DCE7] mt-2 text-base font-semibold text-[#063B5C]"
                  >
                    <User className="w-4 h-4 text-[#008FB8]" />
                    {t('nav.myAccount')}
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                      router.push("/");
                    }}
                    className="flex items-center gap-3 w-full text-left py-3 text-base font-semibold text-[#063B5C]"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* =========================================================
          MOBILE SEARCH
      ========================================================= */}

      {showSearch && (
        <div className="lg:hidden fixed inset-0 z-[110] bg-[#F8FCFD]">
          <div className="pt-4 px-3 sm:px-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center h-12 bg-white border border-[#B8DCE7] rounded-xl px-3 shadow-sm min-w-0">
                <Search className="w-5 h-5 text-[#008FB8] mr-2 shrink-0" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#063B5C]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X className="w-5 h-5 text-[#315A6E]" />
                  </button>
                )}
              </div>

              <button
                onClick={handleSearchSubmit}
                className="w-12 h-12 rounded-xl bg-[#008FB8] text-white flex items-center justify-center shrink-0"
                aria-label="Submit search"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="w-12 h-12 rounded-xl border border-[#B8DCE7] text-[#315A6E] flex items-center justify-center shrink-0"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(searchResults.length > 0 || isSearching) && (
              <div className="mt-4 bg-white border border-[#B8DCE7] rounded-xl shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto">
                {isSearching ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#008FB8] mx-auto" />
                    <p className="mt-2 text-sm text-[#315A6E]">
                      {t('search.searching')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-2">
                      {searchResults.map((product) => (
                        <div
                          key={product._id}
                          onClick={() => handleProductClick(product)}
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#EAF8FC] cursor-pointer"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#EAF8FC] shrink-0">
                            {getImageUrl(product.image) ? (
                              <Image
                                src={getImageUrl(product.image)!}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-[#008FB8]" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#063B5C] truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-[#315A6E] truncate">
                              {product.category}
                            </p>
                          </div>

                          <span className="text-sm font-bold text-[#008FB8] shrink-0">
                            ₹{product.basePrice}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleViewAllResults}
                      className="w-full border-t border-[#B8DCE7] py-3 text-sm font-semibold text-[#008FB8] bg-[#F8FCFD]"
                    >
                      {t('search.viewAll')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MOBILE BOTTOM NAVIGATION
      ========================================================= */}

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#B8DCE7] shadow-lg">
        <div className="h-14 flex items-center">
          <Link
            href="/"
            className={`flex-1 h-full flex flex-col items-center justify-center min-w-0 ${
              pathname === "/" ? "text-[#008FB8]" : "text-[#063B5C]"
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span className="text-[11px] font-medium truncate w-full text-center px-1">
              {t('nav.home')}
            </span>
          </Link>

          <button
            onClick={handleSearchClick}
            className="flex-1 h-full flex flex-col items-center justify-center text-[#063B5C] min-w-0"
          >
            <Search className="w-4 h-4 mb-0.5" />
            <span className="text-[11px] font-medium truncate w-full text-center px-1">
              {t('nav.search')}
            </span>
          </button>

          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative flex-1 h-full flex flex-col items-center justify-center text-[#063B5C] min-w-0"
          >
            <ShoppingCart className="w-4 h-4 mb-0.5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-[calc(50%-18px)] w-4 h-4 rounded-full bg-[#008FB8] text-white text-[9px] flex items-center justify-center font-bold">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
            <span className="text-[11px] font-medium truncate w-full text-center px-1">
              {t('nav.cart')}
            </span>
          </button>

          <Link
            href="/about"
            className={`flex-1 h-full flex flex-col items-center justify-center min-w-0 ${
              pathname === "/about"
                ? "text-[#008FB8]"
                : "text-[#063B5C]"
            }`}
          >
            <Info className="w-4 h-4 mb-0.5" />
            <span className="text-[11px] font-medium truncate w-full text-center px-1">
              {t('nav.aboutShort')}
            </span>
          </Link>

          {isAuthenticated ? (
            <Link
              href="/profile"
              className={`flex-1 h-full flex flex-col items-center justify-center min-w-0 ${
                pathname === "/profile"
                  ? "text-[#008FB8]"
                  : "text-[#063B5C]"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-[#008FB8] text-white flex items-center justify-center text-[9px] font-bold mb-0.5">
                {getUserInitial()}
              </div>
              <span className="text-[11px] font-medium truncate w-full text-center px-1">
                {t('nav.account')}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={`flex-1 h-full flex flex-col items-center justify-center min-w-0 ${
                pathname === "/login"
                  ? "text-[#008FB8]"
                  : "text-[#063B5C]"
              }`}
            >
              <User className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-medium truncate w-full text-center px-1">
                {t('nav.loginShort')}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* =========================================================
          CART DRAWER
      ========================================================= */}

      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />
    </>
  );
}