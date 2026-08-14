"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import MeetingList from "../components/MeetingList";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getMeetings } from "../lib/api";
import { Meeting } from "../types/meeting";

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    getMeetings()
      .then((data) => {
        setMeetings(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not reach the backend. Make sure the server is running.");
        setLoading(false);
      });
  }, []);

  const filteredMeetings = useMemo(() => {
    const filtered = meetings.filter((meeting) =>
      meeting.title.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sort === "oldest" ? diff : -diff;
    });
  }, [meetings, search, sort]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  placeholder="Search meetings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>

                <Link
                  href="/meetings/new"
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                >
                  <Plus className="h-4 w-4" />
                  New Meeting
                </Link>
              </div>
            </div>

            {loading && (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
                Loading meetings...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-sm font-medium text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    getMeetings()
                      .then((data) => {
                        setMeetings(data);
                        setLoading(false);
                      })
                      .catch(() => {
                        setError(
                          "Could not reach the backend. Make sure the server is running."
                        );
                        setLoading(false);
                      });
                  }}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && (
              <MeetingList meetings={filteredMeetings} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
