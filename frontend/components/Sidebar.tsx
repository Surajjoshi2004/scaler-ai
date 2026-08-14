"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Settings, Video } from "lucide-react";

const navItems = [
  { label: "Meetings", href: "/", icon: Video },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  // Highlight the navigation entry that matches the current route.
  const pathname = usePathname();

  const isActive = (href: string) =>
    // The root path needs an exact match so it is not active for every route.
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-zinc-950">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600">
          <Mic className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">
            Fireflies
          </p>
          <p className="text-[11px] text-zinc-500">Meeting Assistant</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-white">
            JD
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Jane Doe</p>
            <p className="truncate text-xs text-zinc-500">jane@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
