import { useState } from "react";
import { Heart, Loader2, Volume2 } from "lucide-react";

import { API_URL } from "../context/PatientContext";
import { speakText } from "../lib/speak";

// The heart of Comfort Mode: a warm, unhurried card showing whatever
// familiar memory the caregiver set up, with no mention of scores,
// mistakes, or "wrong answers" anywhere near it. Used both as its own
// screen (the Home screen's "Comfort" button) and inline inside Play
// when the 15-second inactivity timer fires.
function ComfortCard({ patient, comfortMemory, message }) {
  const [speaking, setSpeaking] = useState(false);

  const title = comfortMemory?.title || patient?.comfort_memory;
  const text = comfortMemory?.content || patient?.comfort_memory;

  const handleListen = async () => {
    if (speaking || !text) {
      return;
    }

    setSpeaking(true);

    try {
      await speakText(text, patient?.language);
    } catch {
      // Staying quiet on failure here is deliberate -- an error message
      // in the middle of a comforting moment would defeat the point.
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-5 rounded-[28px] border-2 border-accent-border bg-accent p-7 text-center sm:p-10">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-card">
        <Heart className="h-8 w-8 text-primary" aria-hidden="true" />
      </span>

      <p className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">
        {message || "That's okay. Let's take a little moment."}
      </p>

      {comfortMemory?.image_url && (
        <img
          src={`${API_URL}${comfortMemory.image_url}`}
          alt={title || "A familiar memory"}
          className="h-[220px] w-full rounded-2xl border border-border object-cover sm:h-[260px]"
        />
      )}

      {title && (
        <p className="text-xl font-bold text-primary sm:text-2xl">
          {title}
        </p>
      )}

      {text && (
        <p className="text-lg leading-relaxed text-foreground sm:text-xl">
          {text}
        </p>
      )}

      {!title && !text && (
        <p className="text-lg leading-relaxed text-foreground sm:text-xl">
          You are doing wonderfully. Take all the time you need.
        </p>
      )}

      {comfortMemory?.audio_url ? (
        <audio
          controls
          src={`${API_URL}${comfortMemory.audio_url}`}
          className="w-full max-w-[320px]"
        />
      ) : text ? (
        <button
          type="button"
          onClick={handleListen}
          disabled={speaking}
          className="flex h-16 min-w-[220px] items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-brand-sm transition-transform active:scale-95 disabled:opacity-60"
        >
          {speaking ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : (
            <Volume2 className="h-6 w-6" aria-hidden="true" />
          )}
          Listen
        </button>
      ) : null}
    </div>
  );
}

export default ComfortCard;
