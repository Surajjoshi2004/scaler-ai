import { Bell, Search, Settings } from "lucide-react";

export default function Navbar({ title = "Meetings" }: { title?: string }) {
  // Render the shared top bar, with an optional page-specific title.
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6">
      <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>

      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Search meetings..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        <button
          type="button"
          aria-label="Settings"
          className="rounded-lg p-2.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Settings className="h-5 w-5" />
        </button>

        <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          JD
        </div>
      </div>
    </header>
  );
}
