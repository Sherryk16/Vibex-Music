"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", icon: "home", label: "Home" },
    { href: "/for-you", icon: "recommend", label: "For You" },
    { href: "/search", icon: "search", label: "Search" },
    { href: "/playlists", icon: "queue_music", label: "Playlist" },
  ];

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container/95 backdrop-blur-xl border-t border-outline-variant/20 px-4 py-2">
        <div className="flex justify-around">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span className="text-[10px] font-label">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface-container/60 backdrop-blur-2xl border-r border-outline-variant/15 shadow-[10px_0_30px_rgba(0,0,0,0.5)] flex-col pt-24 pb-8 z-40 font-body font-medium tracking-wide">
        <div className="px-6 mb-12">
          <h2 className="text-xl font-black text-on-surface mb-1">VibeX</h2>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Music Streaming</p>
        </div>

        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-4 px-6 py-3 transition-all ease-in-out duration-300 ${
                  isActive
                    ? "text-primary border-r-2 border-primary bg-gradient-to-r from-primary/10 to-transparent"
                    : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
