"use client";

import { Mic, Pause, Play, Square, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FlashcardAudioControlsProps = {
  flashcardId: string;
  hasAudio: boolean;
  disabled?: boolean;
  className?: string;
  onAudioChange: (hasAudio: boolean) => void;
};

export function FlashcardAudioControls({
  flashcardId,
  hasAudio,
  disabled = false,
  className,
  onAudioChange,
}: FlashcardAudioControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const uploadAudio = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("audio", file);
        const res = await fetch(`/api/flashcards/${flashcardId}/audio`, {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "Upload failed");
          return;
        }
        onAudioChange(true);
      } catch {
        setError("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [flashcardId, onAudioChange],
  );

  const handlePlay = useCallback(async () => {
    if (!hasAudio) return;

    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    const audio = new Audio(`/api/flashcards/${flashcardId}/audio`);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onpause = () => setPlaying(false);
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setError("Could not play audio");
    }
  }, [flashcardId, hasAudio, playing]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const file = new File([blob], "recording.webm", {
          type: blob.type,
        });
        void uploadAudio(file);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied");
    }
  }, [uploadAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {hasAudio ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => void handlePlay()}
          >
            {playing ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
            {playing ? "Pause" : "Play"}
          </Button>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading || recording}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-3.5" />
          Upload
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => {
            if (recording) stopRecording();
            else void startRecording();
          }}
          className={cn(recording && "border-destructive text-destructive")}
        >
          {recording ? (
            <Square className="size-3.5" />
          ) : (
            <Mic className="size-3.5" />
          )}
          {recording ? "Stop" : "Record"}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav,audio/x-wav"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadAudio(file);
            event.target.value = "";
          }}
        />
      </div>

      {uploading ? (
        <p className="mt-2 text-[12px] text-muted-foreground">Saving audio…</p>
      ) : null}
      {error ? <p className="mt-2 text-[12px] text-destructive">{error}</p> : null}
    </div>
  );
}
