"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

const NAV_LINKS = [
  { href: "/lottery", label: "Лотерея" },
  { href: "/ingredients", label: "Ингредиенты" },
  { href: "/recipes", label: "Рецепты" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/lottery" className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <span className="hidden text-lg font-bold text-gray-900 sm:inline">
            Food Lottery
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <LogoutButton />
      </div>
    </header>
  );
}
