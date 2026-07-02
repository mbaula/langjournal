"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { findBestVoice, toBcp47 } from "@/lib/speech/language-voice";

export type SpeechState = "idle" | "speaking" | "paused";

export type UseTextToSpeechOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
};

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const { rate = 1, pitch = 1, volume = 1 } = options;

  const [state, setState] = useState<SpeechState>("idle");
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentTextRef = useRef<string>("");
  const currentLangRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string, languageCode: string) => {
      const trimmed = text.trim();
      if (!trimmed || !supported) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      const bcp47 = toBcp47(languageCode);
      utterance.lang = bcp47;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const voiceInfo = findBestVoice(languageCode, voices);
      if (voiceInfo) {
        utterance.voice = voiceInfo.voice;
      }

      utterance.onstart = () => setState("speaking");
      utterance.onend = () => setState("idle");
      utterance.onerror = (event) => {
        const ignoredErrors = ["canceled", "interrupted"];
        if (!ignoredErrors.includes(event.error)) {
          console.error("Speech synthesis error:", event.error);
        }
        setState("idle");
      };
      utterance.onpause = () => setState("paused");
      utterance.onresume = () => setState("speaking");

      utteranceRef.current = utterance;
      currentTextRef.current = trimmed;
      currentLangRef.current = languageCode;

      window.speechSynthesis.speak(utterance);
    },
    [supported, voices, rate, pitch, volume],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setState("idle");
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported || state !== "speaking") return;
    window.speechSynthesis.pause();
  }, [supported, state]);

  const resume = useCallback(() => {
    if (!supported || state !== "paused") return;
    window.speechSynthesis.resume();
  }, [supported, state]);

  const toggle = useCallback(
    (text: string, languageCode: string) => {
      if (state === "speaking") {
        if (
          currentTextRef.current === text.trim() &&
          currentLangRef.current === languageCode
        ) {
          stop();
        } else {
          speak(text, languageCode);
        }
      } else {
        speak(text, languageCode);
      }
    },
    [state, speak, stop],
  );

  const getVoiceForLanguage = useCallback(
    (languageCode: string) => {
      return findBestVoice(languageCode, voices);
    },
    [voices],
  );

  return {
    speak,
    stop,
    pause,
    resume,
    toggle,
    state,
    supported,
    voices,
    getVoiceForLanguage,
  };
}
