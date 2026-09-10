import { useState } from "react";
import { AlertCircle, Heart, Loader2, Volume2 } from "lucide-react";

import { API_URL } from "../context/PatientContext";
import { speakText } from "../lib/speak";
import { translate } from "../../lib/i18n";

// The heart of Comfort Mode: a warm, unhurried card showing whatever
// familiar memory the caregiver set up, with no mention of scores,
// mistakes, or "wrong answers" anywhere near it. Used both as its own
// screen (the Home screen's "Comfort" button) and inline inside Play
// when the 15-second inactivity timer fires.
function ComfortCard({ patient, comfortMemory, message }) {
  const [speaking, setSpeaking] = useState(false);
  const [imageLoading, setImageLoading] = useState(
    Boolean(comfortMemory?.image_url)
  );
  const [imageFailed, setImageFailed] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);

  const language = patient?.language || "English";
  const t = (key, vars) => translate(language, key, vars);

  const title = comfortMemory?.title || patient?.comfort_memory;
  const text = comfortMemory?.content || patient?.comfort_memory;
  const showImage = Boolean(comfortMemory?.image_url) && !imageFailed;
  const showAudio = Boolean(comfortMemory?.audio_url) && !audioFailed;

  const handleListen = async () => {
    if (speaking || !text) {
      return;
    }

    setSpeaking(true);

    try {
      await speakText(text, patient?.language);
    } catch (err) {
      // Staying quiet on screen is still deliberate -- an error message
      // in the middle of a comforting moment would defeat the point --
      // but this is logged so the failure isn't a complete mystery to
      // whoever is debugging it later.
      console.error("Listen (comfort) failed:", err);
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
        {message || t("comfort_default_text")}
      </p>

      {showImage && (
        <div className="relative h-[220px] w-full overflow-hidden rounded-2xl border border-border bg-card sm:h-[260px]">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2
                className="h-8 w-8 animate-spin text-primary"
                aria-hidden="true"
              />
            </div>
          )}

          <img
            src={`${API_URL}${comfortMemory.image_url}`}
            alt={title || "A familiar memory"}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageFailed(true);
            }}
            className="h-full w-full object-cover"
            style={{ opacity: imageLoading ? 0 : 1 }}
          />
        </div>
      )}

      {imageFailed && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {t("comfort_photo_failed")}
        </p>
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
          {t("comfort_fallback_text")}
        </p>
      )}

      {showAudio ? (
        <audio
          controls
          src={`${API_URL}${comfortMemory.audio_url}`}
          onError={() => setAudioFailed(true)}
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
          {t("listen")}
        </button>
      ) : null}
    </div>
  );
}

export default ComfortCard;
