"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Pause,
  Pencil,
  Play,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import { deleteMeeting, getMeeting, mediaUrl } from "../../../lib/api";
import { Meeting, TranscriptSegment } from "../../../types/meeting";

function formatClock(seconds: number) {
  // Format a transcript-relative playback offset as mm:ss.
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function mediaKind(path: string | null): "video" | "audio" | null {
  // Detect whether a stored media URL points to a video or an audio file.
  if (!path) return null;
  const ext = path.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  if (["mp3", "m4a", "wav", "ogg"].includes(ext)) return "audio";
  return "video";
}

function formatDate(date: string) {
  // Render the meeting date using the viewer's locale.
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: string) {
  // Render the meeting start time using the viewer's locale.
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | null) {
  // Turn a duration in minutes into a concise human-readable label.
  if (!minutes) return "Duration TBD";
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

function extractTopics(overview: string | null): string[] {
  // Pull the comma-separated topic list from the seeded summary convention.
  if (!overview) return [];
  const marker = "Key discussion topics:";
  const idx = overview.indexOf(marker);
  if (idx === -1) return [];
  const rest = overview.slice(idx + marker.length).split(/[.;]/)[0];
  return rest
    .split(",")
    .map((t) => t.trim().replace(/^and\s+/i, ""))
    .filter(Boolean);
}

type SegmentWithOffset = TranscriptSegment & { offset: number };

function HighlightedText({ text, query }: { text: string; query: string }) {
  // Escape the search query before constructing the highlight regular expression.
  const q = query.trim();
  if (!q) return <>{text}</>;

  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded-sm bg-violet-200 px-0.5 text-zinc-900">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Player({
  src,
  mediaType,
  duration,
  currentTime,
  isPlaying,
  onTimeChange,
  onDurationChange,
  onSeek,
  onToggle,
}: {
  src: string | null;
  mediaType: "video" | "audio" | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
  onDurationChange: (time: number) => void;
  onSeek: (time: number) => void;
  onToggle: () => void;
}) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  // Mirror local play state onto the native media element when one exists.
  useEffect(() => {
    if (!src) return;
    const media = mediaRef.current;
    if (!media) return;
    if (isPlaying) void media.play();
    else media.pause();
  }, [isPlaying, src]);

  // Jump the media element when the current time changes from outside (transcript clicks).
  useEffect(() => {
    if (!src) return;
    const media = mediaRef.current;
    if (!media) return;
    if (Math.abs(media.currentTime - currentTime) > 0.2) {
      media.currentTime = currentTime;
    }
  }, [src, currentTime]);

  const handleToggle = () => {
    // Restart a completed placeholder timeline before playing it again.
    if (!isPlaying && !src && currentTime >= duration) onSeek(0);
    onToggle();
  };

  const handleSeek = (time: number) => {
    onSeek(time);
    if (src && mediaRef.current) {
      mediaRef.current.currentTime = time;
    }
  };

  if (src && mediaType) {
    const common = {
      ref: mediaRef as never,
      src,
      controls: true,
      preload: "metadata",
      onTimeUpdate: () => {
        if (mediaRef.current) onTimeChange(mediaRef.current.currentTime);
      },
      onLoadedMetadata: () => {
        if (mediaRef.current && mediaRef.current.duration) {
          onDurationChange(mediaRef.current.duration);
        }
      },
      onEnded: () => {
        if (mediaRef.current) onTimeChange(mediaRef.current.duration);
      },
    };

    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-900 p-5 text-white">
        {mediaType === "video" ? (
          <video {...common} className="aspect-video w-full rounded-lg bg-black" />
        ) : (
          <audio {...common} className="w-full" />
        )}
        <p className="mt-3 text-[11px] text-zinc-500">
          Playing meeting recording — seek to sync with the transcript.
        </p>
      </div>
    );
  }

  // Placeholder timeline used when the meeting has no uploaded recording.
  const heights = Array.from({ length: 48 }, (_, i) => 8 + ((i * 17) % 24));

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-900 p-5 text-white">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-700"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>

        <div className="flex flex-1 items-end gap-[2px] overflow-hidden">
          {heights.map((h, i) => (
            <span
              key={i}
              className="w-1 shrink-0 rounded-full bg-white/25"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        <div className="shrink-0 text-xs tabular-nums text-zinc-400">
          {formatClock(currentTime)} / {formatClock(duration)}
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(duration, 1)}
        step={1}
        value={currentTime}
        onChange={(e) => handleSeek(Number(e.target.value))}
        className="mt-4 w-full accent-violet-500"
        aria-label="Seek bar"
      />

      <p className="mt-3 text-[11px] text-zinc-500">
        No media file available — interactive placeholder player for syncing with the transcript.
      </p>
    </div>
  );
}

function LoadingState() {
  // Reuse the same loading placeholder for both the page and Suspense boundary.
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
      Loading meeting...
    </div>
  );
}

function MeetingDetail() {
  // Load the selected meeting and coordinate transcript playback, search, and deletion.
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const currentTimeRef = useRef(currentTime);

  useEffect(() => {
    // Make the interval callback read the latest playback position.
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    // Fetch fresh detail data whenever the dynamic route ID changes.
    getMeeting(id)
      .then((data) => {
        setMeeting(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load this meeting. Make sure the backend is running.");
        setLoading(false);
      });
  }, [id]);

  const segments = useMemo<SegmentWithOffset[]>(() => {
    // Convert absolute segment timestamps into sorted offsets from the meeting start.
    if (!meeting) return [];
    const start = new Date(meeting.date).getTime();
    return meeting.transcript_segments
      .map((segment) => ({
        ...segment,
        offset: Math.max(
          0,
          (new Date(segment.timestamp ?? meeting.date).getTime() - start) / 1000
        ),
      }))
      .sort((a, b) => a.offset - b.offset);
  }, [meeting]);

  const duration = useMemo(() => {
    // Prefer the actual recording length once it is known, otherwise estimate
    // from the stated duration or the last transcript segment.
    if (mediaDuration && mediaDuration > 0) return mediaDuration;
    if (!meeting) return 0;
    const fromDuration = (meeting.duration ?? 0) * 60;
    const lastSegment = segments[segments.length - 1]?.offset ?? 0;
    return Math.max(fromDuration, lastSegment + 60);
  }, [meeting, segments, mediaDuration]);

  const activeIndex = useMemo(() => {
    // Identify the latest transcript segment reached by playback.
    let idx = -1;
    segments.forEach((segment, i) => {
      if (segment.offset <= currentTime) idx = i;
    });
    return idx;
  }, [segments, currentTime]);

  const filteredSegments = useMemo(() => {
    // Match the user's query against both speaker names and transcript text.
    const q = search.trim().toLowerCase();
    if (!q) return segments;
    return segments.filter(
      (segment) =>
        segment.text?.toLowerCase().includes(q) ||
        segment.speaker.toLowerCase().includes(q)
    );
  }, [segments, search]);

  useEffect(() => {
    // Keep the active transcript segment visible as playback advances.
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  useEffect(() => {
    // Advance the placeholder player once per second and stop at the end.
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const next = currentTimeRef.current + 1;
      if (next >= duration) {
        setCurrentTime(duration);
        setIsPlaying(false);
      } else {
        setCurrentTime(next);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const handleTogglePlay = () => {
    // Resume or pause playback, restarting from zero if it has completed.
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentTime >= duration) setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const handleDelete = async () => {
    // Confirm destructive deletion before returning to the meeting list.
    if (!meeting) return;
    if (!window.confirm(`Delete "${meeting.title}" and all of its data?`)) return;
    try {
      await deleteMeeting(meeting.id);
      router.push("/");
    } catch {
      setError("Failed to delete the meeting.");
    }
  };

  const topics = extractTopics(meeting?.summary?.overview ?? null);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <div className="mx-auto w-full max-w-7xl p-6 lg:p-8">
            {loading && <LoadingState />}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-sm font-medium text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && meeting && (
              <>
                <Link
                  href="/"
                  className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Meetings
                </Link>

                <section className="rounded-xl border border-zinc-200 bg-white p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                        {meeting.title}
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-zinc-400" />
                          {formatDate(meeting.date)} · {formatTime(meeting.date)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-zinc-400" />
                          {formatDuration(meeting.duration)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-zinc-400" />
                          {meeting.participants.length} participant
                          {meeting.participants.length !== 1 ? "s" : ""}
                          {meeting.participants.length > 0 &&
                            ` · ${meeting.participants.map((p) => p.name).join(", ")}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <Link
                        href={`/meetings/${meeting.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </section>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <section className="lg:col-span-2">
                    <Player
                      src={mediaUrl(meeting.media_url)}
                      mediaType={mediaKind(meeting.media_url)}
                      duration={duration}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                      onTimeChange={setCurrentTime}
                      onDurationChange={setMediaDuration}
                      onSeek={setCurrentTime}
                      onToggle={handleTogglePlay}
                    />

                    <div className="mt-6 rounded-xl border border-zinc-200 bg-white">
                      <div className="border-b border-zinc-200 p-4">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="search"
                            placeholder="Search transcript..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                          />
                        </div>
                      </div>

                      <div className="max-h-[28rem] divide-y divide-zinc-100 overflow-y-auto">
                        {filteredSegments.length === 0 && (
                          <p className="p-6 text-center text-sm text-zinc-500">
                            No transcript segments match your search.
                          </p>
                        )}

                        {filteredSegments.map((segment, i) => {
                          const active = i === activeIndex;
                          return (
                            <div
                              key={segment.id}
                              ref={(el) => {
                                if (active) activeRef.current = el;
                              }}
                              onClick={() => setCurrentTime(segment.offset)}
                              className={`flex cursor-pointer gap-3 px-4 py-3 transition-colors ${
                                active
                                  ? "border-l-4 border-violet-600 bg-violet-50"
                                  : "border-l-4 border-transparent hover:bg-zinc-50"
                              }`}
                            >
                              <div className="w-14 shrink-0 pt-0.5 text-right text-xs tabular-nums text-zinc-400">
                                {segment.timestamp ? formatTime(segment.timestamp) : ""}
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-semibold ${
                                    active ? "text-violet-700" : "text-zinc-900"
                                  }`}
                                >
                                  {segment.speaker}
                                </p>
                                <p className="mt-0.5 text-sm text-zinc-600">
                                  <HighlightedText text={segment.text ?? ""} query={search} />
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  <aside className="space-y-6">
                    <section className="rounded-xl border border-zinc-200 bg-white p-5">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                        <FileText className="h-4 w-4 text-violet-600" />
                        Meeting Summary
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                        {meeting.summary?.overview ?? "No summary available for this meeting."}
                      </p>
                    </section>

                    <section className="rounded-xl border border-zinc-200 bg-white p-5">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                        <BookOpen className="h-4 w-4 text-violet-600" />
                        Key Topics / Chapters
                      </h2>
                      {topics.length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {topics.map((topic) => (
                            <li
                              key={topic}
                              className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm text-zinc-700"
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-zinc-500">
                          No chapters available for this meeting.
                        </p>
                      )}
                    </section>

                    <section className="rounded-xl border border-zinc-200 bg-white p-5">
                      <h2 className="text-sm font-semibold text-zinc-900">
                        Action Items
                      </h2>
                      {meeting.action_items.length > 0 ? (
                        <ul className="mt-3 space-y-3">
                          {meeting.action_items.map((item) => (
                            <li key={item.id} className="flex items-start gap-3">
                              {item.completed ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                              ) : (
                                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
                              )}
                              <div>
                                <p
                                  className={`text-sm ${
                                    item.completed
                                      ? "text-zinc-400 line-through"
                                      : "text-zinc-800"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                {item.assignee && (
                                  <p className="text-xs text-zinc-500">{item.assignee}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-zinc-500">
                          No action items for this meeting.
                        </p>
                      )}
                    </section>
                  </aside>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function MeetingPage() {
  // Delay route-dependent content until its navigation data is available.
  return (
    <Suspense fallback={<LoadingState />}>
      <MeetingDetail />
    </Suspense>
  );
}
