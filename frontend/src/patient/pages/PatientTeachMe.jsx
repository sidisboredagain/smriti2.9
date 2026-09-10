import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  Loader2,
  Mic,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";

import { API_URL, PATIENT_ID, usePatient } from "../context/PatientContext";
import { speakText } from "../lib/speak";
import { translate } from "../../lib/i18n";
import PatientTopBar from "../components/PatientTopBar";

// "Teach Me" flips the usual therapy-game direction: instead of Smriti
// quizzing the patient, the patient teaches Smriti about one of their own
// memories, and Smriti (via Gemini, grounded only in that memory's
// caregiver-provided description) asks short, gentle follow-up questions --
// never a test, never a correction, always an invitation to share more.
function PatientTeachMe({ onHome }) {
  const { patient, getAuthHeaders } = usePatient();

  const [mode, setMode] = useState("picking");

  const [memories, setMemories] = useState([]);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [memoriesError, setMemoriesError] = useState("");

  const [selectedMemory, setSelectedMemory] = useState(null);
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);

  const [thinking, setThinking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const language = patient?.language || "English";
  const t = (key, vars) => translate(language, key, vars);

  useEffect(() => {
    const loadMemories = async () => {
      try {
        setLoadingMemories(true);
        setMemoriesError("");

        const response = await fetch(
          `${API_URL}/memories/?patient_id=${PATIENT_ID}&limit=50`,
          { headers: getAuthHeaders() }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || t("teach_me_err_load_memories")
          );
        }

        setMemories(Array.isArray(data) ? data : []);
      } catch (err) {
        setMemoriesError(err.message);
      } finally {
        setLoadingMemories(false);
      }
    };

    loadMemories();
  }, [getAuthHeaders]);

  const postTurn = async (payload) => {
    const response = await fetch(`${API_URL}/teach-me/turn`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patient_id: PATIENT_ID,
        language,
        ...payload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || t("teach_me_err_trouble")
      );
    }

    return data;
  };

  const selectMemory = async (memory) => {
    setSelectedMemory(memory);
    setMode("chatting");
    setHistory([]);
    setDone(false);
    setError("");
    setThinking(true);

    try {
      const result = await postTurn({
        memory_id: memory.id,
        history: [],
        patient_message: null,
        stop_requested: false,
      });

      setHistory([{ role: "smriti", text: result.message }]);
      setDone(result.done);
    } catch (err) {
      setError(err.message);
    } finally {
      setThinking(false);
    }
  };

  const respondWithTranscript = async (transcript) => {
    setThinking(true);
    setError("");

    try {
      const result = await postTurn({
        memory_id: selectedMemory.id,
        history,
        patient_message: transcript,
        stop_requested: false,
      });

      setHistory((current) => [
        ...current,
        { role: "patient", text: transcript },
        { role: "smriti", text: result.message },
      ]);
      setDone(result.done);
    } catch (err) {
      setError(err.message);
    } finally {
      setThinking(false);
    }
  };

  const finishConversation = async () => {
    setThinking(true);
    setError("");

    try {
      const result = await postTurn({
        memory_id: selectedMemory.id,
        history,
        patient_message: null,
        stop_requested: true,
      });

      setHistory((current) => [
        ...current,
        { role: "smriti", text: result.message },
      ]);
      setDone(true);
    } catch (err) {
      setError(err.message);
      // Even if the closing call somehow fails, let the patient leave
      // the conversation right away rather than getting stuck.
      setDone(true);
    } finally {
      setThinking(false);
    }
  };

  const startRecording = async () => {
    setError("");

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
          setTranscribing(false);
          setError(t("remember_err_no_audio"));
          return;
        }

        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "teach-me.webm");

          const response = await fetch(
            `${API_URL}/voice/transcribe?language=${encodeURIComponent(
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
              data.detail || t("teach_me_err_hear")
            );
          }

          setTranscribing(false);
          await respondWithTranscript(data.text);
        } catch (err) {
          setTranscribing(false);
          setError(err.message);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
      setError(t("remember_err_mic_permission"));
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    setRecording(false);
    setTranscribing(true);
    mediaRecorderRef.current.stop();
  };

  const handleListen = async (text) => {
    if (speaking || !text) {
      return;
    }

    setSpeaking(true);

    try {
      await speakText(text, language, getAuthHeaders);
    } catch {
      // Quiet on purpose -- see ComfortCard for the same reasoning.
    } finally {
      setSpeaking(false);
    }
  };

  const latestSmritiMessage = [...history]
    .reverse()
    .find((turn) => turn.role === "smriti");

  const busy = thinking || transcribing || recording;

  if (mode === "picking") {
    return (
      <div className="min-h-screen bg-background">
        <PatientTopBar onHome={onHome} label={t("topbar_teach_me")} />

        <div className="mx-auto max-w-[640px] px-5 py-8 sm:px-8">
          <p className="mb-6 text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            {t("teach_me_pick_prompt")}
          </p>

          {loadingMemories && (
            <p className="text-center text-xl font-bold text-primary">
              {t("memories_loading")}
            </p>
          )}

          {!loadingMemories && memoriesError && (
            <p className="text-center text-lg font-bold text-destructive">
              {memoriesError}
            </p>
          )}

          {!loadingMemories && !memoriesError && memories.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-border bg-card p-10 text-center">
              <BookOpen className="h-10 w-10 text-primary" aria-hidden="true" />
              <p className="text-xl font-bold text-foreground">
                {t("teach_me_no_memories_title")}
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t("teach_me_no_memories_body")}
              </p>
            </div>
          )}

          {!loadingMemories && !memoriesError && memories.length > 0 && (
            <div className="grid gap-4">
              {memories.map((memory) => (
                <button
                  key={memory.id}
                  type="button"
                  onClick={() => selectMemory(memory)}
                  className="rounded-[24px] border-2 border-border bg-card p-5 text-left shadow-brand-sm transition-transform active:scale-[0.98] sm:p-7"
                >
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                    {memory.title}
                  </h2>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientTopBar onHome={onHome} label={t("topbar_teach_me")} />

      <div className="mx-auto flex max-w-[640px] flex-col items-center px-5 py-8 text-center sm:px-8">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
        </span>

        {thinking && !latestSmritiMessage ? (
          <p className="mb-8 text-xl font-bold text-primary">
            {t("teach_me_one_moment_ellipsis")}
          </p>
        ) : (
          latestSmritiMessage && (
            <div className="mb-8 w-full rounded-[24px] border-2 border-accent-border bg-accent p-6 sm:p-8">
              <p className="mb-4 text-xl leading-relaxed text-foreground sm:text-2xl">
                {latestSmritiMessage.text}
              </p>

              <button
                type="button"
                onClick={() => handleListen(latestSmritiMessage.text)}
                disabled={speaking}
                className="mx-auto flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 text-lg font-bold text-primary-foreground shadow-brand-sm disabled:opacity-60"
              >
                {speaking ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-5 w-5" aria-hidden="true" />
                )}
                {t("listen")}
              </button>
            </div>
          )
        )}

        {!done && (
          <>
            {recording && (
              <div className="mb-6 flex items-center gap-2.5 rounded-full bg-destructive-soft px-5 py-2.5 text-lg font-bold text-destructive">
                <span className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
                {t("remember_listening")}
              </div>
            )}

            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={busy}
                className="flex h-44 w-44 flex-col items-center justify-center gap-3 rounded-full bg-primary text-primary-foreground shadow-brand-md transition-transform active:scale-95 disabled:opacity-60 sm:h-52 sm:w-52"
              >
                {transcribing || (thinking && history.length > 0) ? (
                  <Loader2 className="h-12 w-12 animate-spin" aria-hidden="true" />
                ) : (
                  <Mic className="h-12 w-12" aria-hidden="true" />
                )}

                <span className="text-xl font-bold">
                  {transcribing
                    ? t("remember_one_moment")
                    : thinking
                    ? t("teach_me_smriti_listening")
                    : t("teach_me_tell_me_more")}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex h-44 w-44 flex-col items-center justify-center gap-3 rounded-full bg-destructive text-white shadow-brand-md transition-transform active:scale-95 sm:h-52 sm:w-52"
              >
                <Square className="h-12 w-12" aria-hidden="true" />
                <span className="text-xl font-bold">{t("remember_stop")}</span>
              </button>
            )}

            <button
              type="button"
              onClick={finishConversation}
              disabled={busy}
              className="mt-8 flex h-16 min-w-[220px] items-center justify-center gap-2.5 rounded-2xl border-2 border-border bg-card px-6 text-lg font-bold text-foreground active:scale-95 disabled:opacity-60"
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              {t("teach_me_done_for_now")}
            </button>
          </>
        )}

        {done && (
          <button
            type="button"
            onClick={onHome}
            className="mt-4 flex h-16 min-w-[220px] items-center justify-center rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-brand-sm active:scale-95"
          >
            {t("teach_me_back_home")}
          </button>
        )}

        {error && (
          <p className="mt-8 flex items-center gap-2 text-lg font-bold text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default PatientTeachMe;
