"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/15 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-headline"
        >
          VibeX
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: "/", label: "Home" },
            { href: "/for-you", label: "For You" },
            { href: "/search", label: "Search" },
            { href: "/playlists", label: "Playlist" },
          ].map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-label text-sm transition-colors ${
                  isActive
                    ? "text-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
