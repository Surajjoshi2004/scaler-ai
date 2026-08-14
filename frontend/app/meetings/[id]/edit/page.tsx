"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

import Navbar from "../../../../components/Navbar";
import Sidebar from "../../../../components/Sidebar";
import { getMeeting, updateMeeting } from "../../../../lib/api";

function toLocalInputValue(iso: string) {
  // Convert an ISO timestamp into the local format required by datetime-local inputs.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function EditMeetingForm() {
  // Load a meeting into editable fields and submit the resulting partial update.
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");
  const [participants, setParticipants] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Populate the form once the dynamic meeting ID has been resolved.
    getMeeting(id)
      .then((meeting) => {
        setTitle(meeting.title);
        setDate(toLocalInputValue(meeting.date));
        setDuration(meeting.duration?.toString() ?? "");
        setParticipants(meeting.participants.map((p) => p.name).join(", "));
        setLoading(false);
      })
      .catch(() => {
        setLoadError("Could not load this meeting. Make sure the backend is running.");
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    // Validate inputs, normalize participants, and persist the complete edit payload.
    e.preventDefault();
    if (!title.trim() || !date) {
      setError("Title and date are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateMeeting(id, {
        title: title.trim(),
        date: new Date(date).toISOString(),
        duration: duration ? Number(duration) : undefined,
        participants: participants
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ name })),
      });
      router.push(`/meetings/${id}`);
    } catch {
      setError("Could not save the meeting. Make sure the backend is running.");
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title="Edit Meeting" />

        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <div className="mx-auto w-full max-w-2xl p-6 lg:p-8">
            <Link
              href={`/meetings/${id}`}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Meeting
            </Link>

            {loading && (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
                Loading meeting...
              </div>
            )}

            {loadError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-sm font-medium text-red-700">{loadError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !loadError && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                  Edit Meeting
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Update the meeting details below.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="title"
                      className="mb-1.5 block text-sm font-medium text-zinc-700"
                    >
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Weekly Product Sync"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="date"
                        className="mb-1.5 block text-sm font-medium text-zinc-700"
                      >
                        Date
                      </label>
                      <input
                        id="date"
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="duration"
                        className="mb-1.5 block text-sm font-medium text-zinc-700"
                      >
                        Duration (minutes)
                      </label>
                      <input
                        id="duration"
                        type="number"
                        min={1}
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="participants"
                      className="mb-1.5 block text-sm font-medium text-zinc-700"
                    >
                      Participants
                    </label>
                    <input
                      id="participants"
                      type="text"
                      value={participants}
                      onChange={(e) => setParticipants(e.target.value)}
                      placeholder="Comma-separated names, e.g. Suraj, Rahul"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Replaces the current participant list.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/meetings/${id}`}
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function EditMeetingPage() {
  // Wrap navigation-dependent form content in a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <EditMeetingForm />
    </Suspense>
  );
}
