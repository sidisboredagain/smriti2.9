import { useEffect, useState } from "react";
import { BookOpen, Loader2, Volume2 } from "lucide-react";

import { API_URL, PATIENT_ID, usePatient } from "../context/PatientContext";
import { speakText } from "../lib/speak";
import PatientTopBar from "../components/PatientTopBar";

function MemoryCard({ memory, language }) {
  const [speaking, setSpeaking] = useState(false);

  const handleListen = async () => {
    if (speaking) {
      return;
    }

    setSpeaking(true);

    try {
      if (memory.audio_url) {
        const audio = new Audio(`${API_URL}${memory.audio_url}`);
        await audio.play();
      } else {
        await speakText(memory.content, language);
      }
    } catch {
      // Quietly do nothing -- a broken "listen" button shouldn't throw a
      // technical error message at someone looking through their memories.
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="rounded-[24px] border-2 border-border bg-card p-5 sm:p-7">
      {memory.image_url && (
        <img
          src={`${API_URL}${memory.image_url}`}
          alt={memory.title}
          className="mb-4 h-[220px] w-full rounded-2xl border border-border object-cover sm:h-[260px]"
        />
      )}

      <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
        {memory.title}
      </h2>

      <p className="mb-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
        {memory.content}
      </p>

      <button
        type="button"
        onClick={handleListen}
        disabled={speaking}
        className="flex h-14 min-w-[160px] items-center justify-center gap-2.5 rounded-2xl bg-primary px-5 text-lg font-bold text-primary-foreground shadow-brand-sm transition-transform active:scale-95 disabled:opacity-60"
      >
        {speaking ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        )}
        Listen
      </button>
    </div>
  );
}

function PatientMemories({ onHome }) {
  const { patient, getAuthHeaders } = usePatient();

  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMemories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/memories/?patient_id=${PATIENT_ID}&limit=50`,
          { headers: getAuthHeaders() }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not load your memories."
          );
        }

        setMemories(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMemories();
  }, [getAuthHeaders]);

  return (
    <div className="min-h-screen bg-background">
      <PatientTopBar onHome={onHome} label="Your Memories" />

      <div className="mx-auto max-w-[640px] px-5 py-8 sm:px-8">
        {loading && (
          <p className="text-center text-xl font-bold text-primary">
            Loading your memories...
          </p>
        )}

        {!loading && error && (
          <p className="text-center text-lg font-bold text-destructive">
            {error}
          </p>
        )}

        {!loading && !error && memories.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-border bg-card p-10 text-center">
            <BookOpen className="h-10 w-10 text-primary" aria-hidden="true" />
            <p className="text-xl font-bold text-foreground">
              No memories yet.
            </p>
          </div>
        )}

        {!loading && !error && memories.length > 0 && (
          <div className="grid gap-5">
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                language={patient?.language}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientMemories;
