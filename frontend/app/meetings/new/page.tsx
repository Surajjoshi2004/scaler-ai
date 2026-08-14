"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, FileText, Loader2, Plus, UploadCloud, X } from "lucide-react";

import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import { addTranscriptSegment, createMeeting } from "../../../lib/api";

interface ParsedSegment {
  speaker: string;
  text: string;
  offset: number;
}

function parseTimestamped(line: string): { speaker: string; text: string } | null {
  // Handle "MM:SS Speaker: text" and "MM:SS Speaker - text" style lines.
  const match = line.match(/^\s*(\d{1,3}):(\d{2})\s+(.+?)\s*[:-]\s*(.*)$/);
  if (!match) return null;
  return { speaker: match[3].trim(), text: match[4].trim() };
}

function parsePlain(line: string): { speaker: string; text: string } {
  // Fall back to "Speaker: text" with the speaker before the first colon.
  const colon = line.indexOf(":");
  if (colon > 0) {
    return { speaker: line.slice(0, colon).trim(), text: line.slice(colon + 1).trim() };
  }
  return { speaker: "Speaker", text: line.trim() };
}

function parseTranscript(raw: string, totalSeconds: number): ParsedSegment[] {
  // Turn pasted transcript lines into timed segments, distributing untimed
  // lines evenly across the total duration.
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const timed = lines.map((line) => {
    const timeMatch = line.match(/^\s*(\d{1,3}):(\d{2})\s+(.*)$/);
    if (timeMatch) {
      const offset = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
      const rest = parseTimestamped(line);
      if (rest) return { offset, ...rest };
      return { offset, speaker: "Speaker", text: timeMatch[3].trim() };
    }
    return null;
  });

  const allTimed = timed.every((t) => t !== null);
  if (allTimed) {
    return (timed as ParsedSegment[]).sort((a, b) => a.offset - b.offset);
  }

  const untimed = lines.map((line) => {
    const parsed = parseTimestamped(line);
    if (parsed) return parsed;
    return parsePlain(line);
  });
  const total = totalSeconds > 0 ? totalSeconds : untimed.length * 10;
  const step = total / untimed.length;
  return untimed.map((segment, i) => ({ ...segment, offset: Math.round(i * step) }));
}

function readTextFile(file: File): Promise<string> {
  // Read a dropped transcript file as plain text.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

function convertSubtitleFile(raw: string): string | null {
  // Convert SRT/VTT cue blocks into "MM:SS text" lines the parser understands.
  const blocks = raw.split(/\r?\n\s*\r?\n/);
  const out: string[] = [];
  for (const block of blocks) {
    const parts = block.trim().split(/\r?\n/);
    const cueIndex = parts.findIndex((line) => line.includes("-->"));
    if (cueIndex === -1) continue;
    const start = parts[cueIndex].split("-->")[0].trim();
    const match = start.match(/^(?:(\d{1,3}):)?(\d{1,2}):(\d{2})[.,]\d{1,3}$/);
    if (!match) continue;
    const totalSeconds =
      (match[1] ? Number(match[1]) * 3600 : 0) + Number(match[2]) * 60 + Number(match[3]);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const text = parts
      .slice(cueIndex + 1)
      .filter(
        (line) =>
          line.trim() &&
          !/^(NOTE|WEBVTT|Kind:|Language:|STYLE:|X-TIMESTAMP|Region:)/i.test(line.trim())
      )
      .join(" ")
      .trim();
    if (text) {
      out.push(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${text}`);
    }
  }
  return out.length ? out.join("\n") : null;
}

export default function NewMeetingPage() {
  // Collect meeting metadata plus an optional transcript file dropped into the
  // form, then create the record with the parsed transcript segments.
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranscriptDrop = async (candidate: File | undefined) => {
    if (!candidate) return;
    const name = candidate.name.toLowerCase();
    if (!name.endsWith(".txt") && !name.endsWith(".srt") && !name.endsWith(".vtt")) {
      setError("Unsupported file. Drop a .txt, .srt, or .vtt transcript file.");
      return;
    }

    setError(null);
    setTranscriptLoading(true);
    try {
      const content = await readTextFile(candidate);
      if (name.endsWith(".txt")) {
        setTranscript(content.trim());
      } else {
        const converted = convertSubtitleFile(content);
        if (!converted) {
          setError("Could not find any timestamped cues in that subtitle file.");
          setTranscriptLoading(false);
          return;
        }
        setTranscript(converted);
      }
      setTranscriptFile(candidate.name);
    } catch {
      setError("Could not read that file.");
    }
    setTranscriptLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Validate required fields before converting the local date to ISO for the API.
    e.preventDefault();
    if (!title.trim() || !date) {
      setError("Title and date are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const meetingDate = new Date(date);
      const meeting = await createMeeting({
        title: title.trim(),
        date: meetingDate.toISOString(),
        duration: duration ? Number(duration) : undefined,
      });

      if (transcript.trim()) {
        const durationSeconds = (duration ? Number(duration) : 0) * 60;
        const segments = parseTranscript(transcript, durationSeconds);
        for (const segment of segments) {
          const timestamp = new Date(
            meetingDate.getTime() + segment.offset * 1000
          ).toISOString();
          await addTranscriptSegment(meeting.id, {
            speaker: segment.speaker,
            timestamp,
            text: segment.text,
          });
        }
      }

      router.push(`/meetings/${meeting.id}`);
    } catch {
      setError("Could not create the meeting. Make sure the backend is running.");
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title="New Meeting" />

        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <div className="mx-auto w-full max-w-2xl p-6 lg:p-8">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Meetings
            </Link>

            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                New Meeting
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Add the meeting details and drag in a transcript file to import it.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  void handleTranscriptDrop(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                className={`mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                  dragging
                    ? "border-violet-500 bg-violet-50"
                    : "border-zinc-300 hover:border-violet-400 hover:bg-zinc-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.srt,.vtt"
                  className="hidden"
                  onChange={(e) => void handleTranscriptDrop(e.target.files?.[0] ?? undefined)}
                />
                {transcriptLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                ) : transcriptFile ? (
                  <>
                    <FileText className="h-8 w-8 text-violet-600" />
                    <p className="text-sm font-medium text-zinc-800">{transcriptFile}</p>
                    <p className="text-xs text-zinc-500">Loaded into the transcript box below</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-700">
                      Drag &amp; drop a transcript file
                    </p>
                    <p className="text-xs text-zinc-500">
                      or click to browse · txt, srt, vtt
                    </p>
                  </>
                )}
              </div>

              {transcriptFile && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <p className="text-xs text-zinc-600">
                    Imported from <span className="font-medium">{transcriptFile}</span>. You can
                    still edit the text below.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTranscriptFile(null);
                      setTranscript("");
                    }}
                    aria-label="Clear imported transcript"
                    className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

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
                    htmlFor="transcript"
                    className="mb-1.5 block text-sm font-medium text-zinc-700"
                  >
                    Transcript <span className="text-zinc-400">(optional)</span>
                  </label>
                  <textarea
                    id="transcript"
                    rows={6}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={"01:00 Suraj: Welcome everyone\n02:15 Rahul: Thanks for having me"}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    One line per segment as <span className="font-mono">MM:SS Speaker: text</span>.
                    Lines without a timestamp are spread evenly across the duration.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <Link
                    href="/"
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {saving ? "Creating..." : "Create Meeting"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
