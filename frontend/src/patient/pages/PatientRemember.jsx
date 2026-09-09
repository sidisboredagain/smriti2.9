import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Mic, Square } from "lucide-react";

import { API_URL, PATIENT_ID, usePatient } from "../context/PatientContext";
import PatientTopBar from "../components/PatientTopBar";

function PatientRemember({ onHome }) {
  const { patient, getAuthHeaders } = usePatient();

  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedText, setSavedText] = useState("");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    setError("");
    setSavedText("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setError("Something went wrong. Let's try again.");
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        if (audioBlob.size === 0) {
          setSaving(false);
          setError("I didn't hear anything. Let's try again.");
          return;
        }

        await saveVoiceMemory(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
      setError(
        "I need permission to use the microphone to hear you."
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    setRecording(false);
    setSaving(true);
    mediaRecorderRef.current.stop();
  };

  const saveVoiceMemory = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "memory.webm");

      const language = patient?.language || "English";

      const response = await fetch(
        `${API_URL}/voice/transcribe-and-save/${PATIENT_ID}?language=${encodeURIComponent(
          language
        )}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "I couldn't save that. Let's try again."
        );
      }

      setSavedText(data.content || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PatientTopBar onHome={onHome} label="Remember" />

      <div className="mx-auto flex max-w-[560px] flex-col items-center px-5 py-10 text-center sm:px-8 sm:py-14">
        <p className="mb-8 text-xl leading-relaxed text-muted-foreground sm:text-2xl">
          Tell me about a memory. Speak whenever you are ready.
        </p>

        {recording && (
          <div className="mb-8 flex items-center gap-2.5 rounded-full bg-destructive-soft px-5 py-2.5 text-lg font-bold text-destructive">
            <span className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
            Listening
          </div>
        )}

        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={saving}
            className="flex h-48 w-48 flex-col items-center justify-center gap-3 rounded-full bg-primary text-primary-foreground shadow-brand-md transition-transform active:scale-95 disabled:opacity-60 sm:h-56 sm:w-56"
          >
            {saving ? (
              <Loader2 className="h-14 w-14 animate-spin" aria-hidden="true" />
            ) : (
              <Mic className="h-14 w-14" aria-hidden="true" />
            )}

            <span className="text-xl font-bold">
              {saving ? "One moment" : "Record"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex h-48 w-48 flex-col items-center justify-center gap-3 rounded-full bg-destructive text-white shadow-brand-md transition-transform active:scale-95 sm:h-56 sm:w-56"
          >
            <Square className="h-14 w-14" aria-hidden="true" />
            <span className="text-xl font-bold">Stop</span>
          </button>
        )}

        {savedText && (
          <div className="mt-10 flex w-full flex-col items-center gap-3 rounded-[24px] border-2 border-accent-border bg-accent p-6 sm:p-8">
            <CheckCircle2
              className="h-10 w-10 text-primary"
              aria-hidden="true"
            />

            <p className="text-xl font-bold text-foreground sm:text-2xl">
              Thank you for sharing that.
            </p>

            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              &ldquo;{savedText}&rdquo;
            </p>
          </div>
        )}

        {error && (
          <p className="mt-8 text-lg font-bold text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default PatientRemember;
