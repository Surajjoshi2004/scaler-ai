import { Video } from "lucide-react";

import { Meeting } from "../types/meeting";
import MeetingCard from "./MeetingCard";

export default function MeetingList({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
          <Video className="h-6 w-6 text-zinc-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-900">
          No meetings yet
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Recordings and transcripts will show up here once you create a meeting.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}
