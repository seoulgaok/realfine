"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type NavKey = "home" | "dongVault" | "bridge" | "swap" | "portfolio" | "kyc";

const NAV_ITEMS: { href: string; labelKey: NavKey }[] = [
  { href: "/realfi", labelKey: "home" },
  { href: "/realfi/invest", labelKey: "dongVault" },
  { href: "/realfi/bridge", labelKey: "bridge" },
  { href: "/realfi/swap", labelKey: "swap" },
  { href: "/realfi/portfolio", labelKey: "portfolio" },
  { href: "/realfi/kyc", labelKey: "kyc" },
];

export function RealFiNavbar() {
  const pathname = usePathname();
  const t = useTranslations("realfi.nav");

  // Remove locale prefix for comparison
  const currentPath = pathname.replace(/^\/[a-z]{2}/, "") || "/";

  return (
    <div className="flex items-center gap-2 py-4 bg-gray-50 border-b border-gray-200">
      <div className="container flex items-center gap-2 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.href ||
            (item.href !== "/realfi" && currentPath.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}