import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, PartyPopper, Volume2 } from "lucide-react";

import {
  AttentionFocusGame,
  MemoryMatchGame,
  MemorySequenceGame,
  ObjectVisualRecallGame,
} from "../../lib/gameWidgets";
import { API_URL, PATIENT_ID, usePatient } from "../context/PatientContext";
import { speakText as speakOnce } from "../lib/speak";
import { translate } from "../../lib/i18n";
import PatientTopBar from "../components/PatientTopBar";
import ComfortCard from "../components/ComfortCard";

// If 15 seconds pass with no interaction on the current question, assume
// the patient may be confused or unsure and offer Comfort Mode instead of
// leaving them stuck looking at a question they can't answer.
const COMFORT_TIMEOUT_MS = 15000;

// If the patient gets this many questions wrong in a row, offer Comfort
// Mode immediately rather than waiting for the inactivity timeout -- a
// string of "not quite" answers can be its own source of distress.
const CONSECUTIVE_WRONG_THRESHOLD = 2;

const VISUAL_GAME_TYPES = [
  "memory_match",
  "memory_sequence",
  "visual_recall",
  "attention_focus",
];

function PatientPlay({ onHome }) {
  const { patient, comfortMemory, pickComfortItem, getAuthHeaders } = usePatient();

  const [session, setSession] = useState(null);
  const [games, setGames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState(null);

  const [loadingSession, setLoadingSession] = useState(true);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [completingGame, setCompletingGame] = useState(false);
  const [error, setError] = useState("");

  const [speaking, setSpeaking] = useState(false);

  const [showComfort, setShowComfort] = useState(false);
  const [activeComfortItem, setActiveComfortItem] = useState(null);
  const comfortTimerRef = useRef(null);
  const consecutiveWrongRef = useRef(0);
  const lastComfortItemIdRef = useRef(null);

  const currentGame = games[currentIndex] || null;

  const language = patient?.language || "English";
  const t = (key, vars) => translate(language, key, vars);

  // A patient should never feel like they got something "wrong". These
  // are the only two things Play ever says about an answer.
  const GENTLE_CORRECT = t("play_gentle_correct");
  const GENTLE_TRY_AGAIN = t("play_gentle_try_again");

  const clearComfortTimer = () => {
    if (comfortTimerRef.current) {
      window.clearTimeout(comfortTimerRef.current);
      comfortTimerRef.current = null;
    }
  };

  // Picks a comfort item (preferring one that wasn't just shown) and
  // surfaces Comfort Mode. Shared by the inactivity timeout and the
  // consecutive-wrong-answer trigger below.
  const triggerComfort = () => {
    const nextItem = pickComfortItem(lastComfortItemIdRef.current);
    if (nextItem?.id != null) {
      lastComfortItemIdRef.current = nextItem.id;
    }
    setActiveComfortItem(nextItem || comfortMemory);
    setShowComfort(true);
  };

  const armComfortTimer = () => {
    clearComfortTimer();
    comfortTimerRef.current = window.setTimeout(() => {
      triggerComfort();
    }, COMFORT_TIMEOUT_MS);
  };

  const startSession = async () => {
    setLoadingSession(true);
    setError("");
    setSession(null);
    setGames([]);
    setCurrentIndex(0);
    setSelectedAnswer("");
    setAnswerResult(null);
    setShowComfort(false);
    setActiveComfortItem(null);
    consecutiveWrongRef.current = 0;
    clearComfortTimer();

    try {
      const response = await fetch(
        `${API_URL}/therapy-sessions/daily/${PATIENT_ID}`,
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
          data.detail || "I couldn't start a game right now."
        );
      }

      setSession(data);
      setGames(data.games || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-arm the 15-second inactivity timer every time a fresh, unanswered
  // question is on screen, and clear it the moment the patient answers or
  // the session ends.
  useEffect(() => {
    if (currentGame && !answerResult && !showComfort) {
      armComfortTimer();
    } else {
      clearComfortTimer();
    }

    return clearComfortTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame?.game_id, answerResult, showComfort]);

  const completeCurrentGame = async (gameId) => {
    if (!session?.session_id || !gameId) {
      return;
    }

    setCompletingGame(true);

    try {
      await fetch(
        `${API_URL}/therapy-sessions/${session.session_id}/games/${gameId}/complete`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );
    } finally {
      setCompletingGame(false);
    }
  };

  const checkAnswer = async (answer, metrics = null) => {
    if (!currentGame || checkingAnswer || answerResult) {
      return;
    }

    clearComfortTimer();
    setSelectedAnswer(answer);
    setCheckingAnswer(true);

    try {
      const response = await fetch(`${API_URL}/games/check-answer`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_id: currentGame.game_id,
          answer,
          session_id: session?.session_id,
          ...(metrics ? { metrics } : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Let's try that again.");
      }

      setAnswerResult(result);

      if (result.correct) {
        consecutiveWrongRef.current = 0;
      } else {
        consecutiveWrongRef.current += 1;

        if (consecutiveWrongRef.current >= CONSECUTIVE_WRONG_THRESHOLD) {
          consecutiveWrongRef.current = 0;
          clearComfortTimer();
          triggerComfort();
        }
      }
    } catch (err) {
      setError(err.message);
      setSelectedAnswer("");
    } finally {
      setCheckingAnswer(false);
    }
  };

  const moveToNext = async () => {
    if (!currentGame || completingGame) {
      return;
    }

    await completeCurrentGame(currentGame.game_id);

    const nextIndex = currentIndex + 1;

    if (nextIndex >= games.length) {
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedAnswer("");
    setAnswerResult(null);
    setShowComfort(false);
  };

  const handleListenQuestion = async () => {
    if (speaking || !currentGame) {
      return;
    }

    setSpeaking(true);

    try {
      await speakOnce(currentGame.question, language);
    } catch {
      // Silent on purpose -- see ComfortCard for the same reasoning.
    } finally {
      setSpeaking(false);
    }
  };

  const isSessionComplete =
    games.length > 0 &&
    currentIndex >= games.length - 1 &&
    Boolean(answerResult);

  const hasVisualGameUi = Boolean(
    currentGame?.game_data && VISUAL_GAME_TYPES.includes(currentGame.game_type)
  );

  if (loadingSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xl font-bold text-primary">
          {t("play_getting_ready")}
        </p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-background">
        <PatientTopBar onHome={onHome} label={t("topbar_play")} />
        <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
          <p className="text-xl font-bold text-destructive">{error}</p>
          <button
            type="button"
            onClick={startSession}
            className="h-14 rounded-2xl bg-primary px-8 text-lg font-bold text-primary-foreground"
          >
            {t("play_try_again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientTopBar onHome={onHome} label={t("topbar_play")} />

      <div className="mx-auto max-w-[640px] px-5 py-8 sm:px-8">
        {showComfort && !isSessionComplete ? (
          <div className="flex flex-col items-center gap-8">
            <ComfortCard
              key={activeComfortItem?.id ?? comfortMemory?.id ?? "default"}
              patient={patient}
              comfortMemory={activeComfortItem || comfortMemory}
            />

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowComfort(false)}
                className="flex h-16 min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-brand-sm active:scale-95"
              >
                {t("play_ready_to_try_again")}
              </button>

              <button
                type="button"
                onClick={onHome}
                className="flex h-16 min-w-[160px] items-center justify-center rounded-2xl border-2 border-border bg-card px-6 text-xl font-bold text-foreground active:scale-95"
              >
                {t("play_later")}
              </button>
            </div>
          </div>
        ) : isSessionComplete ? (
          <div className="flex flex-col items-center gap-5 rounded-[28px] border-2 border-accent-border bg-accent p-8 text-center sm:p-12">
            <PartyPopper className="h-14 w-14 text-primary" aria-hidden="true" />

            <p className="text-3xl font-bold text-foreground sm:text-4xl">
              {t("play_wonderful_work")}
            </p>

            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("play_finished_all")}
            </p>

            <button
              type="button"
              onClick={startSession}
              className="mt-2 flex h-16 min-w-[240px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-brand-sm active:scale-95"
            >
              {t("play_play_again")}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : currentGame ? (
          <div>
            <button
              type="button"
              onClick={handleListenQuestion}
              disabled={speaking}
              className="mb-5 flex h-14 items-center gap-2.5 rounded-2xl border-2 border-primary bg-card px-5 text-lg font-bold text-primary disabled:opacity-60"
            >
              {speaking ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              )}
              {t("listen")}
            </button>

            <h1 className="mb-7 text-3xl font-bold leading-snug text-foreground [overflow-wrap:anywhere] sm:text-4xl">
              {currentGame.question}
            </h1>

            {hasVisualGameUi && currentGame.game_type === "memory_match" && (
              <MemoryMatchGame
                key={currentGame.game_id}
                game={currentGame}
                disabled={checkingAnswer || Boolean(answerResult)}
                onSubmit={checkAnswer}
              />
            )}

            {hasVisualGameUi && currentGame.game_type === "memory_sequence" && (
              <MemorySequenceGame
                key={currentGame.game_id}
                game={currentGame}
                disabled={checkingAnswer || Boolean(answerResult)}
                onSubmit={checkAnswer}
              />
            )}

            {hasVisualGameUi && currentGame.game_type === "visual_recall" && (
              <ObjectVisualRecallGame
                key={currentGame.game_id}
                game={currentGame}
                disabled={checkingAnswer || Boolean(answerResult)}
                onSubmit={checkAnswer}
                selectedAnswer={selectedAnswer}
                answerResult={answerResult}
              />
            )}

            {hasVisualGameUi && currentGame.game_type === "attention_focus" && (
              <AttentionFocusGame
                key={currentGame.game_id}
                game={currentGame}
                disabled={checkingAnswer || Boolean(answerResult)}
                onSubmit={checkAnswer}
              />
            )}

            {!hasVisualGameUi && (
              <div className="grid gap-4">
                {currentGame.options?.map((option, index) => {
                  const isSelected = selectedAnswer === option;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => checkAnswer(option)}
                      disabled={checkingAnswer || Boolean(answerResult)}
                      className={`min-h-[76px] rounded-2xl border-2 px-6 py-4 text-left text-xl font-bold text-foreground [overflow-wrap:anywhere] transition-colors disabled:cursor-not-allowed sm:text-2xl ${
                        isSelected
                          ? answerResult?.correct
                            ? "border-success bg-success-soft"
                            : answerResult
                            ? "border-destructive bg-destructive-soft"
                            : "border-primary bg-accent"
                          : "border-border bg-card"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {answerResult && (
              <div
                className={`mt-7 rounded-2xl border-2 p-5 text-center text-xl font-bold sm:text-2xl ${
                  answerResult.correct
                    ? "border-success bg-success-soft text-foreground"
                    : "border-accent-border bg-accent text-foreground"
                }`}
              >
                {answerResult.correct ? GENTLE_CORRECT : GENTLE_TRY_AGAIN}
              </div>
            )}

            {answerResult && (
              <button
                type="button"
                onClick={moveToNext}
                disabled={completingGame}
                className="mt-6 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-brand-sm active:scale-95 disabled:opacity-60"
              >
                {completingGame ? (
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                ) : currentIndex === games.length - 1 ? (
                  t("play_finish")
                ) : (
                  t("play_next")
                )}
                {!completingGame && (
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PatientPlay;
