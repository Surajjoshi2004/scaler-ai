"use client";

import { useEffect, useMemo, useRef } from "react";

import { TranscriptSegment } from "../types/meeting";

interface TranscriptProps {
  segments: TranscriptSegment[];
  currentTime: number;
  searchQuery: string;
  meetingStart?: string;
  onSegmentClick: (timestamp: string) => void;
}

function formatTime(timestamp: string) {
  // Display an absolute transcript timestamp in the viewer's locale.
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  // Escape the search query before using it in a case-insensitive highlight regex.
  const q = query.trim();
  if (!q) return <>{text}</>;

  const parts = text.split(
    new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  );

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

export default function Transcript({
  segments,
  currentTime,
  searchQuery,
  meetingStart,
  onSegmentClick,
}: TranscriptProps) {
  // Derive playback offsets, filter results, and keep the active segment in view.
  const activeRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(() => {
    // Measure each timestamp from the meeting start so it can follow playback time.
    const base = new Date(meetingStart ?? segments[0]?.timestamp ?? "").getTime();
    return segments
      .map((segment) => ({
        ...segment,
        offset: Math.max(
          0,
          (new Date(segment.timestamp ?? meetingStart ?? "").getTime() - base) /
            1000
        ),
      }))
      .sort((a, b) => a.offset - b.offset);
  }, [segments, meetingStart]);

  const activeIndex = useMemo(() => {
    // The latest segment at or before playback time is the active one.
    let idx = -1;
    items.forEach((segment, i) => {
      if (segment.offset <= currentTime) idx = i;
    });
    return idx;
  }, [items, currentTime]);

  const filtered = useMemo(() => {
    // Match both speaker and spoken text for transcript search.
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (segment) =>
        segment.text?.toLowerCase().includes(q) ||
        segment.speaker.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  useEffect(() => {
    // Gently reveal the active segment as playback advances.
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  if (items.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-zinc-500">
        No transcript available.
      </p>
    );
  }

  return (
    <div className="max-h-[28rem] divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200 bg-white">
      {filtered.length === 0 && (
        <p className="p-6 text-center text-sm text-zinc-500">
          No transcript segments match your search.
        </p>
      )}

      {filtered.map((segment, i) => {
        const active = i === activeIndex;
        return (
          <div
            key={segment.id}
            ref={(el) => {
              if (active) activeRef.current = el;
            }}
            onClick={() => onSegmentClick(segment.timestamp ?? "")}
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
                <HighlightedText text={segment.text ?? ""} query={searchQuery} />
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
