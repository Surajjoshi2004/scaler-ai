import { BookOpen, Hash, Sparkles } from "lucide-react";

export interface Chapter {
  title: string;
  start: number;
}

interface SummaryProps {
  overview: string | null;
  topics?: string[];
  chapters?: Chapter[];
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600">
        {icon}
      </span>
      {title}
    </h2>
  );
}

export default function Summary({
  overview,
  topics = [],
  chapters = [],
}: SummaryProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <SectionHeading icon={<Sparkles className="h-3.5 w-3.5" />} title="AI Summary" />
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          {overview ?? "No summary available for this meeting."}
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <SectionHeading icon={<Hash className="h-3.5 w-3.5" />} title="Key Topics" />
        {topics.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <li
                key={topic}
                className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700"
              >
                {topic}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            No key topics extracted for this meeting.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <SectionHeading icon={<BookOpen className="h-3.5 w-3.5" />} title="Chapters" />
        {chapters.length > 0 ? (
          <ol className="mt-3 space-y-1">
            {chapters.map((chapter, i) => (
              <li
                key={`${chapter.title}-${i}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50"
              >
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-zinc-400">
                  {formatClock(chapter.start)}
                </span>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                <span className="text-sm text-zinc-800">{chapter.title}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            No chapters generated for this meeting.
          </p>
        )}
      </section>
    </div>
  );
}
