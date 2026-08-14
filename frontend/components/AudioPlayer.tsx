"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface AudioPlayerProps {
  src?: string | null;
  duration: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
  onSeek: (time: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
}

function formatClock(seconds: number) {
  // Clamp and format playback seconds for the player's elapsed-time display.
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AudioPlayer({
  src,
  duration,
  currentTime,
  onTimeChange,
  onSeek,
  onPlayStateChange,
}: AudioPlayerProps) {
  // Control real audio when available, or simulate a timeline for demo meetings.
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTimeRef = useRef(currentTime);
  const onTimeChangeRef = useRef(onTimeChange);
  const onSeekRef = useRef(onSeek);
  const onPlayStateChangeRef = useRef(onPlayStateChange);

  useEffect(() => {
    // Keep the interval callback synchronized with externally controlled time.
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    // Keep the interval callback synchronized with the latest parent callback.
    onTimeChangeRef.current = onTimeChange;
  }, [onTimeChange]);

  useEffect(() => {
    // Keep seek behavior current without restarting the fallback interval.
    onSeekRef.current = onSeek;
  }, [onSeek]);

  useEffect(() => {
    // Keep the optional play-state callback current without restarting playback.
    onPlayStateChangeRef.current = onPlayStateChange;
  }, [onPlayStateChange]);

  useEffect(() => {
    // Mirror local play state to the native audio element when one exists.
    if (!src) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying, src]);

  useEffect(() => {
    // Advance the placeholder timeline only when no audio source is available.
    if (!isPlaying || src) return;
    const interval = setInterval(() => {
      const next = currentTimeRef.current + 1;
      if (next >= duration) {
        onTimeChangeRef.current(duration);
        setIsPlaying(false);
        onPlayStateChangeRef.current?.(false);
      } else {
        onTimeChangeRef.current(next);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, src, duration]);

  const handleToggle = () => {
    // Restart a completed placeholder timeline before playing it again.
    const wasPlaying = isPlaying;
    if (!wasPlaying && !src && currentTimeRef.current >= duration) {
      onSeekRef.current(0);
    }
    setIsPlaying(!wasPlaying);
    onPlayStateChangeRef.current?.(!wasPlaying);
  };

  const handleSeek = (time: number) => {
    // Update parent state and the native element, when present, in one place.
    onSeekRef.current(time);
    if (src && audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const shownTime = Math.min(currentTime, duration);
  const max = Math.max(duration, 1);
  const heights = Array.from({ length: 48 }, (_, i) => 8 + ((i * 17) % 24));

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-900 p-5 text-white">
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onTimeUpdate={() =>
            audioRef.current &&
            onTimeChangeRef.current(audioRef.current.currentTime)
          }
          onEnded={() => {
            setIsPlaying(false);
            onPlayStateChangeRef.current?.(false);
          }}
        />
      )}

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
          {formatClock(shownTime)} / {formatClock(duration)}
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={shownTime}
        onChange={(e) => handleSeek(Number(e.target.value))}
        className="mt-4 w-full accent-violet-500"
        aria-label="Seek bar"
      />

      <p className="mt-3 text-[11px] text-zinc-500">
        {src
          ? "Playing audio file — seek to sync with the transcript."
          : "No audio file available — interactive placeholder timeline."}
      </p>
    </div>
  );
}
