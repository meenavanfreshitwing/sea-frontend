"use client";

import {
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { settingsAPI } from "@/lib/settings-api";
import BrandWordmark from '@/components/ui/BrandWordmark';
import { useLanguage } from '@/context/LanguageContext';
import { FaWhatsapp } from 'react-icons/fa';
import { BadgeCheck } from 'lucide-react';
import { whatsappLink } from '@/components/HelpButton';

export default function Footer() {
  const { t, lang } = useLanguage();
  // 🎯 Static images base URL (R2)
  const STATIC_URL = process.env.NEXT_PUBLIC_STATIC_URL;

  const [siteDescription, setSiteDescription] = useState("");
  // Filled from store settings; empty lines are hidden
  const [contactEmail, setContactEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [footerText, setFooterText] = useState("");

  const [socialMedia, setSocialMedia] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    linkedin: "",
  });



  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getPublicSettings();

      if (response.success && response.data) {
        const data = response.data;

        if (data.siteDescription) {
          setSiteDescription(data.siteDescription);
        }

        if (data.contactEmail) {
          setContactEmail(data.contactEmail);
        }

        if (data.contactNumber) {
          setContactNumber(data.contactNumber);
        }

        if (data.companyAddress) {
          setCompanyAddress(data.companyAddress);
        }

        setWhatsappNumber(data.whatsappNumber || "");
        setFssaiNumber(data.fssaiNumber || "");

        if (data.footerText) {
          setFooterText(data.footerText);
        }

        if (data.socialMedia) {
          setSocialMedia({
            facebook: data.socialMedia.facebook || "",
            instagram: data.socialMedia.instagram || "",
            twitter: data.socialMedia.twitter || "",
            youtube: data.socialMedia.youtube || "",
            linkedin: data.socialMedia.linkedin || "",
          });
        }

        if (data.facebookUrl && !data.socialMedia?.facebook) {
          setSocialMedia((prev) => ({
            ...prev,
            facebook: data.facebookUrl || "",
          }));
        }

        if (data.instagramUrl && !data.socialMedia?.instagram) {
          setSocialMedia((prev) => ({
            ...prev,
            instagram: data.instagramUrl || "",
          }));
        }

        if (data.twitterUrl && !data.socialMedia?.twitter) {
          setSocialMedia((prev) => ({
            ...prev,
            twitter: data.twitterUrl || "",
          }));
        }

        if (data.youtubeUrl && !data.socialMedia?.youtube) {
          setSocialMedia((prev) => ({
            ...prev,
            youtube: data.youtubeUrl || "",
          }));
        }

        if (data.linkedinUrl && !data.socialMedia?.linkedin) {
          setSocialMedia((prev) => ({
            ...prev,
            linkedin: data.linkedinUrl || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching footer settings:", error);
    }
  };

  const socialConfigs = [
    {
      key: "facebook",
      icon: FaFacebookF,
      url: socialMedia.facebook,
      label: "Facebook",
    },
    {
      key: "twitter",
      icon: FaTwitter,
      url: socialMedia.twitter,
      label: "Twitter",
    },
    {
      key: "instagram",
      icon: FaInstagram,
      url: socialMedia.instagram,
      label: "Instagram",
    },
    {
      key: "youtube",
      icon: FaYoutube,
      url: socialMedia.youtube,
      label: "YouTube",
    },
    {
      key: "linkedin",
      icon: FaLinkedinIn,
      url: socialMedia.linkedin,
      label: "LinkedIn",
    },
  ];

  const activeSocialLinks = socialConfigs.filter(
    (social) => social.url && social.url.trim() !== ""
  );

  const navLinks = [
    { key: "nav.home", href: "/" },
    { key: "home.categories", href: "/categories" },
    { key: "offers.title", href: "/offers" },
    { key: "nav.about", href: "/about" },
    { key: "nav.contact", href: "/contact" },
    { key: "nav.myOrders", href: "/profile" },
  ] as const;

  const legalLinks = [
    { key: "footer.shipping", href: "/shipping" },
    { key: "footer.returns", href: "/returns" },
    { key: "footer.terms", href: "/terms" },
    { key: "footer.privacy", href: "/privacy" },
  ] as const;

  const headingClass = "mb-4 text-sm font-bold uppercase tracking-wider text-[#063B5C]";
  const linkClass = "text-[15px] text-[#315A6E] transition-colors hover:text-[#008FB8]";

  return (
    <footer id="site-footer" className="mt-auto border-t border-[#D6ECF3] bg-[#F4FAFC] text-[#315A6E]">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="relative h-16 w-16 shrink-0">
                <Image src={`${STATIC_URL}/logoo.webp`} alt="Meenavan Fresh" fill className="object-contain" sizes="64px" />
              </span>
              <BrandWordmark size="lg" />
            </Link>
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed">
              {siteDescription && lang === "en" ? siteDescription : t("footer.about")}
            </p>
            {activeSocialLinks.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-[#063B5C]">{t("footer.followUs")}</p>
                <div className="flex gap-2">
                  {activeSocialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.key}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#063B5C] shadow-sm ring-1 ring-[#D6ECF3] transition hover:bg-[#008FB8] hover:text-white"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick links */}
          <nav aria-label={t("footer.quickLinks")}>
            <h2 className={headingClass}>{t("footer.quickLinks")}</h2>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>{t(link.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Help & policies */}
          <nav aria-label={t("footer.help")}>
            <h2 className={headingClass}>{t("footer.help")}</h2>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>{t(link.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className={headingClass}>{t("footer.contact")}</h2>
            <ul className="space-y-3">
              {contactNumber && (
                <li>
                  <a href={`tel:${contactNumber.replace(/[^\d+]/g, "")}`} className={`flex items-start gap-2.5 font-semibold ${linkClass}`}>
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#008FB8]" aria-hidden="true" />
                    {contactNumber}
                  </a>
                </li>
              )}
              {contactEmail && (
                <li>
                  <a href={`mailto:${contactEmail}`} className={`flex items-start gap-2.5 break-all ${linkClass}`}>
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#008FB8]" aria-hidden="true" />
                    {contactEmail}
                  </a>
                </li>
              )}
              {whatsappNumber && (
                <li>
                  <a
                    href={whatsappLink(whatsappNumber, t("help.whatsappText"))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-start gap-2.5 font-semibold ${linkClass}`}
                  >
                    <FaWhatsapp className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" aria-hidden="true" />
                    {t("help.whatsapp")}
                  </a>
                </li>
              )}
              {companyAddress && (
                <li className="flex items-start gap-2.5 text-[15px]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#008FB8]" aria-hidden="true" />
                  <span>{companyAddress}</span>
                </li>
              )}
            </ul>
            <p className="mt-5 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-[#D6ECF3]">{t("footer.payments")}</p>
            {fssaiNumber && (
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#063B5C]">
                <BadgeCheck className="h-4 w-4 text-green-700" aria-hidden="true" />
                {t("footer.fssai", { n: fssaiNumber })}
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 border-t border-[#D6ECF3] pt-6 text-center text-sm">
          {footerText && lang === "en" ? footerText : t("footer.rights", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
