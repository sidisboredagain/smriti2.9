import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Camera,
  CheckCircle2,
  Globe,
  Handshake,
  MapPin,
  Mic,
  PartyPopper,
  Sparkles,
  Trash2,
  Users,
  UtensilsCrossed,
  Luggage,
  Volume2,
} from "lucide-react";

import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input, Label, Textarea } from "../components/ui/input";
import { cn } from "../lib/utils";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function MemoryVault() {
  const [memories, setMemories] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("family");
  const [sequenceStepsText, setSequenceStepsText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [games, setGames] = useState({});
  const [gameLoading, setGameLoading] = useState(null);
  const [gameMessages, setGameMessages] = useState({});

  const [photoUploading, setPhotoUploading] = useState(null);
  const [photoMessages, setPhotoMessages] = useState({});
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const photoInputRefs = useRef({});

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteMessages, setDeleteMessages] = useState({});

  // 8 MB matches the backend's own limit (see MAX_PHOTO_SIZE_BYTES in
  // api/memories.py) -- checked here too so the caregiver finds out
  // immediately instead of waiting on a round trip that will be rejected.
  const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;

  const [language, setLanguage] = useState("English");
  const [loadingLanguage, setLoadingLanguage] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("smriti_token");

    if (!token) {
      throw new Error("Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const handleAuthError = (error) => {
    const text = String(error?.message || "").toLowerCase();

    if (
      text === "please log in again." ||
      text.includes("not authenticated") ||
      text.includes("unauthorized") ||
      text.includes("could not validate credentials")
    ) {
      window.location.reload();
    }
  };

  const loadMemories = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/memories/?patient_id=${PATIENT_ID}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load memories."
        );
      }

      setMemories(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMemory = async (memoryId) => {
    setDeletingId(memoryId);
    setDeleteMessages((current) => ({ ...current, [memoryId]: "" }));

    try {
      const response = await fetch(
        `${API_URL}/memories/${memoryId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not delete this memory.");
      }

      setMemories((current) =>
        current.filter((memory) => memory.id !== memoryId)
      );
      setConfirmDeleteId(null);
    } catch (error) {
      setDeleteMessages((current) => ({
        ...current,
        [memoryId]: error.message,
      }));
      handleAuthError(error);
    } finally {
      setDeletingId(null);
    }
  };

  const loadPatientLanguage = async () => {
    try {
      setLoadingLanguage(true);

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
      setLanguage("English");
      handleAuthError(error);
    } finally {
      setLoadingLanguage(false);
    }
  };

  useEffect(() => {
    loadMemories();
    loadPatientLanguage();
  }, []);

  const saveMemory = async (event) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setMessage(
        "Please add both a title and memory."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const sequenceSteps = sequenceStepsText
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean);

    try {
      const response = await fetch(
        `${API_URL}/memories/`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patient_id: PATIENT_ID,
            title: title.trim(),
            content: content.trim(),
            category,
            sequence_steps:
              sequenceSteps.length >= 2
                ? sequenceSteps
                : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not save memory."
        );
      }

      setMemories((current) => [
        data,
        ...current,
      ]);

      setTitle("");
      setContent("");
      setCategory("family");
      setSequenceStepsText("");

      setMessage(
        "✓ Memory saved successfully."
      );
    } catch (error) {
      setMessage(error.message);
      handleAuthError(error);
    } finally {
      setSaving(false);
    }
  };

  const generateGame = async (memoryId) => {
    setGameLoading(memoryId);

    setGameMessages((current) => ({
      ...current,
      [memoryId]: "",
    }));

    try {
      const response = await fetch(
        `${API_URL}/games/generate/${memoryId}?difficulty=easy&language=${encodeURIComponent(
          language
        )}`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not create the therapy game."
        );
      }

      setGames((current) => ({
        ...current,
        [memoryId]: {
          ...data,
          selectedAnswer: "",
        },
      }));
    } catch (error) {
      setGameMessages((current) => ({
        ...current,
        [memoryId]: error.message,
      }));

      handleAuthError(error);
    } finally {
      setGameLoading(null);
    }
  };

  const checkAnswer = async (
    memoryId,
    answer
  ) => {
    const game = games[memoryId];

    if (!game) {
      return;
    }

    setGames((current) => ({
      ...current,
      [memoryId]: {
        ...current[memoryId],
        selectedAnswer: answer,
      },
    }));

    try {
      const response = await fetch(
        `${API_URL}/games/check-answer`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            game_id: game.game_id,
            answer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not check the answer."
        );
      }

      setGameMessages((current) => ({
        ...current,
        [memoryId]: data.correct
          ? "✓ Correct! Great job."
          : "Take another look at the memory and try again.",
      }));
    } catch (error) {
      setGameMessages((current) => ({
        ...current,
        [memoryId]: error.message,
      }));

      handleAuthError(error);
    }
  };

  const uploadMemoryPhoto = async (memoryId, file) => {
    if (!file) {
      return;
    }

    setPhotoUploading(memoryId);

    setPhotoMessages((current) => ({
      ...current,
      [memoryId]: "",
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/memories/${memoryId}/photo`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not save the photo."
        );
      }

      setMemories((current) =>
        current.map((memory) =>
          memory.id === memoryId ? data : memory
        )
      );
    } catch (error) {
      setPhotoMessages((current) => ({
        ...current,
        [memoryId]: error.message,
      }));

      handleAuthError(error);
    } finally {
      setPhotoUploading(null);
    }
  };

  const selectPendingPhoto = (memoryId, file) => {
    if (!file) {
      return;
    }

    setPhotoMessages((current) => ({
      ...current,
      [memoryId]: "",
    }));

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoMessages((current) => ({
        ...current,
        [memoryId]: "Photo is too large. Please use a file under 8 MB.",
      }));
      return;
    }

    setPendingPhoto((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return {
        memoryId,
        file,
        previewUrl: URL.createObjectURL(file),
      };
    });
  };

  const confirmPendingPhoto = async () => {
    if (!pendingPhoto) {
      return;
    }

    const { memoryId, file, previewUrl } = pendingPhoto;

    await uploadMemoryPhoto(memoryId, file);

    URL.revokeObjectURL(previewUrl);
    setPendingPhoto(null);
  };

  const cancelPendingPhoto = () => {
    if (pendingPhoto?.previewUrl) {
      URL.revokeObjectURL(pendingPhoto.previewUrl);
    }

    setPendingPhoto(null);
  };

  const getCategoryIcon = (value) => {
    const icons = {
      family: Users,
      friends: Handshake,
      places: MapPin,
      events: PartyPopper,
      food: UtensilsCrossed,
      travel: Luggage,
      other: Sparkles,
      voice: Mic,
    };

    return (
      icons[
        String(value || "").toLowerCase()
      ] || Brain
    );
  };

  const getCategoryLabel = (value) => {
    if (!value) {
      return "Memory";
    }

    const labels = {
      family: "Family",
      friends: "Friends",
      places: "Places",
      events: "Events",
      food: "Food",
      travel: "Travel",
      other: "Other",
      voice: "Voice Memory",
    };

    const normalized = String(
      value
    ).toLowerCase();

    return labels[normalized] || value;
  };

  const getMemoryDate = (memory) => {
    const value =
      memory?.created_at ||
      memory?.updated_at;

    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getMemoryPreview = (value) => {
    if (!value) {
      return "";
    }

    const cleaned = String(value).trim();

    if (cleaned.length <= 180) {
      return cleaned;
    }

    return `${cleaned.slice(0, 180)}...`;
  };

  const selectClassName =
    "flex h-[52px] w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground transition-colors outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="min-h-screen bg-background px-4 pt-20 pb-10 font-body text-foreground sm:px-[7%] sm:pt-24 sm:pb-[45px]">
      <div className="mx-auto max-w-[1100px]">
        <p className="mb-2 text-sm font-bold tracking-[1px] text-primary">
          SMRITI AI · MEMORY VAULT
        </p>

        <h1 className="mb-2.5 font-heading text-[32px] leading-[1.1] text-foreground sm:text-[44px]">
          Memory Vault
        </h1>

        <p className="mb-3.5 max-w-[720px] text-base leading-relaxed text-muted-foreground sm:text-lg">
          Preserve meaningful moments that can become personalized
          cognitive activities for your loved one.
        </p>

        <Badge variant="accent" className="mb-6 gap-[7px] py-2 sm:mb-[34px]">
          <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {loadingLanguage
            ? "Loading patient language..."
            : `Patient language: ${language}`}
        </Badge>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-[25px]">
          <Card className="min-w-0 rounded-2xl p-[18px] sm:p-5 lg:p-7">
            <h2 className="mb-[7px] font-heading text-[22px] text-foreground">
              Add a Memory
            </h2>

            <p className="mb-[22px] text-sm leading-relaxed text-faint">
              Capture a familiar person, place, event, routine, or
              family moment.
            </p>

            <form onSubmit={saveMemory}>
              <div className="mb-[19px] grid gap-[7px]">
                <Label
                  htmlFor="memory-title"
                  className="mb-0 text-[13px] font-bold text-primary"
                >
                  Memory title
                </Label>

                <Input
                  id="memory-title"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Family Wedding"
                  required
                />
              </div>

              <div className="mb-[19px] grid gap-[7px]">
                <Label
                  htmlFor="memory-content"
                  className="mb-0 text-[13px] font-bold text-primary"
                >
                  Memory
                </Label>

                <Textarea
                  id="memory-content"
                  className="min-h-[150px] leading-relaxed"
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  placeholder="Tell us about this memory..."
                  required
                />
              </div>

              <div className="mb-[19px] grid gap-[7px]">
                <Label
                  htmlFor="memory-category"
                  className="mb-0 text-[13px] font-bold text-primary"
                >
                  Category
                </Label>

                <select
                  id="memory-category"
                  className={selectClassName}
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  <option value="family">Family</option>

                  <option value="friends">Friends</option>

                  <option value="places">Places</option>

                  <option value="events">Events</option>

                  <option value="food">Food</option>

                  <option value="travel">Travel</option>

                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-[19px] grid gap-[7px]">
                <Label
                  htmlFor="memory-sequence-steps"
                  className="mb-0 text-[13px] font-bold text-primary"
                >
                  Order of events (optional, for Memory Sequence)
                </Label>

                <Textarea
                  id="memory-sequence-steps"
                  className="min-h-[90px] leading-relaxed"
                  value={sequenceStepsText}
                  onChange={(event) =>
                    setSequenceStepsText(event.target.value)
                  }
                  placeholder={
                    "One step per line, in order, e.g.:\nInvitation arrives\nTravel to Jaipur\nWedding celebration"
                  }
                  rows={3}
                />

                <p className="mt-1.5 text-xs leading-relaxed text-faint">
                  Add 3 familiar steps in the order they happened.
                  This powers the Memory Sequence game for this
                  memory. Leave blank to skip.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving memory..." : "Save Memory"}
              </Button>
            </form>

            {message && (
              <Alert
                variant={
                  message.startsWith("✓")
                    ? "success"
                    : "destructive"
                }
                className="mt-4"
              >
                {message.startsWith("✓") ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span>{message}</span>
              </Alert>
            )}
          </Card>

          <div className="min-w-0">
            <div className="mb-[18px] flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="mb-[7px] font-heading text-[22px] text-foreground">
                  Saved Memories
                </h2>

                <p className="text-sm leading-relaxed text-faint">
                  Each memory can become a personalized therapy
                  activity.
                </p>
              </div>

              {!loading && memories.length > 0 && (
                <Badge variant="muted" className="shrink-0">
                  {memories.length}{" "}
                  {memories.length === 1 ? "memory" : "memories"}
                </Badge>
              )}
            </div>

            {loading ? (
              <p className="font-bold text-primary">
                Loading memories...
              </p>
            ) : memories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted py-7 px-[22px] text-center leading-relaxed text-faint">
                <Brain
                  className="mx-auto mb-2 h-7 w-7 text-primary"
                  aria-hidden="true"
                />

                <strong className="text-foreground">
                  No memories added yet.
                </strong>

                <div>
                  Add the first meaningful memory using the form.
                </div>
              </div>
            ) : (
              <div className="grid gap-3.5">
                {memories.map((memory) => {
                  const game = games[memory.id];

                  const gameMessage =
                    gameMessages[memory.id];

                  const categoryLabel = getCategoryLabel(
                    memory.category
                  );

                  const CategoryIcon = getCategoryIcon(
                    memory.category
                  );

                  const memoryDate = getMemoryDate(memory);

                  return (
                    <Card
                      key={memory.id}
                      className="rounded-xl p-[18px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand-md sm:p-5"
                    >
                      <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3.5">
                        <Badge
                          variant="accent"
                          className="gap-1.5 px-2.5 py-[7px] text-[11px] tracking-[0.6px] uppercase"
                        >
                          <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{categoryLabel}</span>
                        </Badge>

                        {memoryDate && (
                          <span className="shrink-0 text-[11px] font-semibold text-faint">
                            {memoryDate}
                          </span>
                        )}
                      </div>

                      <h3 className="mb-2 text-[23px] leading-[1.25] break-words font-heading text-foreground">
                        {memory.title}
                      </h3>

                      {memory.image_url && (
                        <img
                          src={`${API_URL}${memory.image_url}`}
                          alt={memory.title}
                          className="mb-3 h-[160px] w-full rounded-lg border border-border object-cover"
                        />
                      )}

                      <p className="mb-3 text-[15px] leading-[1.65] break-words text-muted-foreground">
                        {getMemoryPreview(memory.content)}
                      </p>

                      <div className="mb-4 flex flex-wrap items-center gap-2.5">
                        <input
                          ref={(element) => {
                            photoInputRefs.current[memory.id] = element;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            selectPendingPhoto(memory.id, file);
                            event.target.value = "";
                          }}
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={photoUploading === memory.id}
                          onClick={() =>
                            photoInputRefs.current[memory.id]?.click()
                          }
                        >
                          <Camera className="h-4 w-4" aria-hidden="true" />
                          {photoUploading === memory.id
                            ? "Uploading photo..."
                            : memory.image_url
                            ? "Change photo"
                            : "Add a photo"}
                        </Button>

                        {memory.audio_url && (
                          <audio
                            controls
                            src={`${API_URL}${memory.audio_url}`}
                            className="h-9 max-w-[220px]"
                          >
                            <Volume2
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </audio>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="ml-auto text-destructive hover:bg-destructive-soft"
                          disabled={deletingId === memory.id}
                          onClick={() => setConfirmDeleteId(memory.id)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </Button>
                      </div>

                      {confirmDeleteId === memory.id && (
                        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive bg-destructive-soft p-3">
                          <p className="text-[13px] font-bold text-destructive">
                            Delete this memory{memory.audio_url ? " and its voice recording" : ""}? This can&apos;t be undone.
                          </p>

                          <div className="ml-auto flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="bg-destructive text-white hover:bg-destructive/90"
                              disabled={deletingId === memory.id}
                              onClick={() => deleteMemory(memory.id)}
                            >
                              {deletingId === memory.id
                                ? "Deleting..."
                                : "Yes, delete it"}
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={deletingId === memory.id}
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {deleteMessages[memory.id] && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                          <span>{deleteMessages[memory.id]}</span>
                        </Alert>
                      )}

                      {pendingPhoto?.memoryId === memory.id && (
                        <div className="mb-4 rounded-xl border border-dashed border-border bg-muted p-3">
                          <p className="mb-2 text-[11px] font-bold tracking-[0.6px] text-faint uppercase">
                            Preview -- not saved yet
                          </p>

                          <img
                            src={pendingPhoto.previewUrl}
                            alt="Selected photo preview"
                            className="mb-3 h-[160px] w-full rounded-lg border border-border object-cover"
                          />

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={confirmPendingPhoto}
                              disabled={photoUploading === memory.id}
                            >
                              {photoUploading === memory.id
                                ? "Uploading photo..."
                                : "Save photo"}
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={cancelPendingPhoto}
                              disabled={photoUploading === memory.id}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {photoMessages[memory.id] && (
                        <Alert
                          variant="destructive"
                          className="mb-4"
                        >
                          <AlertCircle
                            className="h-5 w-5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{photoMessages[memory.id]}</span>
                        </Alert>
                      )}

                      {!game && (
                        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-faint">
                            <Brain
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            Turn this memory into a therapy activity
                          </span>

                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => generateGame(memory.id)}
                            disabled={
                              gameLoading === memory.id ||
                              loadingLanguage
                            }
                            className="w-full sm:w-auto"
                          >
                            {gameLoading === memory.id ? (
                              "Creating game..."
                            ) : loadingLanguage ? (
                              "Loading language..."
                            ) : (
                              <>
                                Create Therapy Game
                                <ArrowRight
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {!game && gameMessage && (
                        <Alert
                          variant="destructive"
                          className="mt-3.5"
                        >
                          <AlertCircle
                            className="h-5 w-5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{gameMessage}</span>
                        </Alert>
                      )}

                      {game && (
                        <div className="mt-[18px] rounded-xl border border-border bg-muted p-[18px]">
                          <div className="mb-3.5 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="mb-[5px] text-[11px] font-bold tracking-[0.8px] text-faint uppercase">
                                Personalized Game
                              </p>

                              <p className="text-[13px] font-bold text-primary">
                                Created from this memory
                              </p>
                            </div>

                            <span className="self-start rounded-full bg-card px-2 py-[5px] text-[11px] font-bold whitespace-nowrap text-primary sm:self-auto">
                              <Globe
                                className="mr-1 inline h-3 w-3"
                                aria-hidden="true"
                              />
                              {language}
                            </span>
                          </div>

                          <h4 className="mb-[15px] text-lg leading-[1.45] break-words font-heading text-foreground">
                            {game.question}
                          </h4>

                          <div className="grid gap-[9px]">
                            {Array.isArray(game.options) &&
                              game.options.map((option, index) => {
                                const isSelected =
                                  game.selectedAnswer === option;

                                return (
                                  <button
                                    type="button"
                                    key={`${memory.id}-${index}`}
                                    onClick={() =>
                                      checkAnswer(memory.id, option)
                                    }
                                    className={cn(
                                      "min-h-[48px] w-full rounded-[10px] border px-[13px] py-3 text-left text-[15px] text-foreground transition-colors hover:border-border-strong hover:bg-muted",
                                      isSelected
                                        ? "border-2 border-primary bg-accent"
                                        : "border-border bg-card"
                                    )}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                          </div>

                          {gameMessage && (
                            <Alert
                              variant={
                                gameMessage.startsWith("✓")
                                  ? "success"
                                  : "destructive"
                              }
                              className="mt-3.5"
                            >
                              {gameMessage.startsWith("✓") ? (
                                <CheckCircle2
                                  className="h-5 w-5 shrink-0"
                                  aria-hidden="true"
                                />
                              ) : (
                                <AlertCircle
                                  className="h-5 w-5 shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                              <span>{gameMessage}</span>
                            </Alert>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryVault;
