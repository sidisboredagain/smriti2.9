import { useEffect, useRef, useState } from "react";
import { Globe, Mic, Square } from "lucide-react";

import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function VoiceMemory() {
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("English");
  const [loadingLanguage, setLoadingLanguage] =
    useState(true);
  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(
      "smriti_token"
    );

    if (!token) {
      throw new Error("Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const loadPatientLanguage = async () => {
      try {
        const response = await fetch(
          `${API_URL}/caregiver/dashboard/${PATIENT_ID}`,
          {
            headers: getAuthHeaders(),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Could not load patient language."
          );
        }

        const patientLanguage =
          data?.patient?.language;

        if (patientLanguage) {
          setLanguage(patientLanguage);
        }
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoadingLanguage(false);
      }
    };

    loadPatientLanguage();

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }

      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stream
            ?.getTracks()
            .forEach((track) => track.stop());
        } catch {
          // Ignore cleanup errors.
        }
      }
    };
  }, []);

  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  };

  const startRecording = async () => {
    setMessage("");
    setTranscript("");
    setRecordingSeconds(0);

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Microphone recording is not supported in this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mediaRecorder = new MediaRecorder(
        stream
      );

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        setRecording(false);
        setSaving(false);
        setMessage(
          "Something went wrong while recording."
        );
      };

      mediaRecorder.onstop = async () => {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        if (timerRef.current) {
          window.clearInterval(
            timerRef.current
          );
          timerRef.current = null;
        }

        const audioBlob = new Blob(
          chunksRef.current,
          {
            type: "audio/webm",
          }
        );

        if (audioBlob.size === 0) {
          setSaving(false);
          setMessage(
            "No audio was recorded. Please try again."
          );
          return;
        }

        await saveVoiceMemory(audioBlob);
      };

      mediaRecorderRef.current =
        mediaRecorder;

      mediaRecorder.start();

      setRecording(true);
      setMessage(
        `Recording in ${language}. Speak naturally about a memory.`
      );

      timerRef.current =
        window.setInterval(() => {
          setRecordingSeconds(
            (current) => current + 1
          );
        }, 1000);
    } catch (error) {
      setRecording(false);
      setSaving(false);

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setMessage(
          "Microphone access was denied. Please allow microphone access and try again."
        );
      } else {
        setMessage(
          error.message ||
            "Microphone access is unavailable."
        );
      }
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    setRecording(false);
    setSaving(true);

    if (timerRef.current) {
      window.clearInterval(
        timerRef.current
      );
      timerRef.current = null;
    }

    setMessage(
      "Processing your voice memory..."
    );

    mediaRecorderRef.current.stop();
  };

  const saveVoiceMemory = async (audioBlob) => {
    try {
      const formData = new FormData();

      formData.append(
        "file",
        audioBlob,
        "memory.webm"
      );

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
          data.detail ||
            "Could not save the voice memory."
        );
      }

      setTranscript(
        data.transcript || ""
      );

      setMessage(
        `✓ Voice memory saved successfully in ${language}.`
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const isSuccess =
    message.startsWith("✓");

  return (
    <div className="min-h-screen bg-background px-[7%] pb-[45px] pt-24 font-body text-foreground">
      <div className="mx-auto max-w-[820px] text-center">
        <p className="mb-2 text-sm font-bold tracking-[1px] text-primary">
          SMRITI AI · VOICE MEMORY
        </p>

        <h1 className="mb-3 font-heading text-[clamp(2rem,6vw,2.75rem)] leading-[1.1] text-foreground">
          Voice Memory
        </h1>

        <p className="mx-auto mb-5 max-w-[650px] text-lg leading-relaxed text-muted-foreground">
          Speak naturally about a meaningful memory.
          Smriti AI turns your voice into a saved
          memory that can later support personalized
          cognitive activities.
        </p>

        <Badge variant="accent" className="mb-7">
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          {loadingLanguage
            ? "Loading patient language..."
            : `Patient language: ${language}`}
        </Badge>

        <Card className="rounded-xl p-9 sm:p-11">
          <div
            className="mx-auto mb-5 flex h-[110px] w-[110px] items-center justify-center rounded-full bg-memory-icon"
            aria-hidden="true"
          >
            <Mic
              className="h-14 w-14 text-primary"
              strokeWidth={1.6}
            />
          </div>

          <h2 className="mb-2.5 font-heading text-[28px] leading-[1.25] text-foreground">
            {recording
              ? "Listening to your memory"
              : saving
              ? "Saving your memory"
              : "Record a memory"}
          </h2>

          <p className="mx-auto mb-6 max-w-[560px] text-base leading-relaxed text-muted-foreground">
            {recording
              ? "Take your time. Speak naturally about a familiar person, place, event, or meaningful moment."
              : saving
              ? "Your recording is being transcribed and saved for personalized cognitive care."
              : "A simple voice recording can become a meaningful memory in the patient's Memory Vault."}
          </p>

          {!recording &&
            !saving && (
              <div className="mx-auto mb-7 max-w-[570px] rounded-[13px] bg-muted px-[18px] py-3.5 text-[15px] leading-relaxed text-primary">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.8px] text-faint">
                  Try saying
                </span>

                <strong>
                  “My daughter&apos;s wedding was in Jaipur.”
                </strong>
              </div>
            )}

          {recording && (
            <div className="mt-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-destructive-soft px-3.5 py-2 text-[13px] font-bold text-destructive">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
                Recording
              </div>

              <p className="mb-[18px] text-[30px] font-bold tracking-[1px] text-foreground [font-variant-numeric:tabular-nums]">
                {formatRecordingTime(
                  recordingSeconds
                )}
              </p>
            </div>
          )}

          {!recording ? (
            <Button
              variant="primary"
              size="lg"
              onClick={startRecording}
              disabled={
                saving ||
                loadingLanguage
              }
              className="min-w-[210px]"
            >
              <Mic className="h-4 w-4" aria-hidden="true" />
              {saving
                ? "Processing..."
                : loadingLanguage
                ? "Loading..."
                : "Start Recording"}
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="lg"
              onClick={stopRecording}
              className="min-w-[210px]"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
              Stop Recording
            </Button>
          )}

          {saving && (
            <div className="mt-5 flex items-center justify-center gap-2 font-bold text-primary">
              <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-primary" />
              Processing your voice memory...
              <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-primary" />
            </div>
          )}

          {message && (
            <Alert
              variant={isSuccess ? "success" : "info"}
              className="mx-auto mt-6 max-w-[620px] items-center justify-center text-center text-sm"
            >
              {message}
            </Alert>
          )}

          {transcript && (
            <div className="mx-auto mt-6 max-w-[640px] rounded-2xl border border-border bg-muted p-5 text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-faint">
                Transcribed memory
              </p>

              <p className="text-[17px] leading-relaxed text-foreground [overflow-wrap:anywhere]">
                {transcript}
              </p>
            </div>
          )}

          <p className="mt-6 text-xs leading-relaxed text-faint">
            Speak in the patient&apos;s preferred
            language. Your recording is converted
            into text and saved as a memory.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default VoiceMemory;
