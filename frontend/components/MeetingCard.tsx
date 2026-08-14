import Link from "next/link";
import { Calendar, Clock, Users } from "lucide-react";

import { Meeting } from "../types/meeting";

function formatDate(date: string) {
  // Use the viewer's locale for a concise meeting-card date.
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(minutes: number | null) {
  // Present minutes in the most readable short form, including a missing-state label.
  if (!minutes) return "Duration TBD";
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

function initials(name: string) {
  // Build a two-character avatar label from the participant's name.
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MeetingCard({ meeting }: { meeting: Meeting }) {
  // Render one navigable summary card, limiting visible avatars to three.
  const participants = meeting.participants ?? [];
  const shown = participants.slice(0, 3);
  const remaining = participants.length - shown.length;

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group block rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
    >
      <h3 className="text-base font-semibold tracking-tight text-zinc-900 group-hover:text-zinc-600">
        {meeting.title}
      </h3>

      <div className="mt-3 space-y-1.5 text-sm text-zinc-500">
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-400" />
          {formatDate(meeting.date)}
        </p>
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-400" />
          {formatDuration(meeting.duration)}
        </p>
      </div>

      {participants.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex -space-x-2">
            {shown.map((participant) => (
              <div
                key={participant.id}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-800 text-[10px] font-semibold text-white"
              >
                {initials(participant.name)}
              </div>
            ))}
          </div>
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <Users className="h-3.5 w-3.5" />
            {participants.length} participant{participants.length !== 1 ? "s" : ""}
            {remaining > 0 ? ` +${remaining}` : ""}
          </p>
        </div>
      )}
    </Link>
  );
}
