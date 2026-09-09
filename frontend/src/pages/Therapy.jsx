import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Clock,
  Eye,
  Globe,
  Heart,
  ImageIcon,
  Layers,
  ListOrdered,
  Loader2,
  PartyPopper,
  PenLine,
  Puzzle,
  Search,
  Target,
  Undo2,
  Volume2,
  Zap,
} from "lucide-react";

import { cn } from "../lib/utils";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

// Plain (non-component) helper so the elapsed-time read lives outside
// any component/hook body.
function elapsedSecondsSince(startMs) {
  if (!startMs) {
    return 0;
  }

  return Math.round((Date.now() - startMs) / 100) / 10;
}

// Shared "listen to this" control used by the question options, the
// memory-sequence choices, and the visual-recall cards. Purely
// presentational - it only mirrors the speakText/speaking/speakingOption
// props each caller already manages.
function AudioButton({ label, optionId, speakText, speaking, speakingOption }) {
  if (!speakText) {
    return null;
  }

  const isSpeakingThis = speakingOption === optionId;

  return (
    <button
      type="button"
      onClick={() => speakText(label, optionId)}
      disabled={speaking && !isSpeakingThis}
      aria-label={`Listen to ${label}`}
      className="flex w-[58px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary bg-card text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSpeakingThis ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        <Volume2 className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}

function MemoryMatchGame({ game, disabled, onSubmit, speakText }) {
  const cards = game?.game_data?.cards || [];

  const [revealed, setRevealed] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [wrongPair, setWrongPair] = useState([]);
  const [busy, setBusy] = useState(false);

  // A fresh game is a fresh mount (the parent keys this component by
  // game_id), so plain refs started at null and filled in on mount are
  // enough - no reset-on-prop-change effect is needed.
  const startTimeRef = useRef(null);
  const submittedRef = useRef(false);
  const mistakesRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const handleCardClick = (card) => {
    if (disabled || busy || submittedRef.current) return;
    if (revealed.includes(card.card_id) || flipped.includes(card.card_id)) return;
    if (flipped.length >= 2) return;

    if (speakText) {
      speakText(card.label);
    }

    const nextFlipped = [...flipped, card.card_id];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const [firstId, secondId] = nextFlipped;
      const first = cards.find((item) => item.card_id === firstId);
      const second = cards.find((item) => item.card_id === secondId);

      if (first && second && first.pair_id === second.pair_id) {
        const nextRevealed = [...revealed, firstId, secondId];
        setRevealed(nextRevealed);
        setFlipped([]);

        if (nextRevealed.length === cards.length && !submittedRef.current) {
          submittedRef.current = true;
          const timeSeconds = elapsedSecondsSince(startTimeRef.current);
          onSubmit("completed", {
            mistakes: mistakesRef.current,
            time_seconds: timeSeconds,
          });
        }
      } else {
        mistakesRef.current += 1;
        setWrongPair(nextFlipped);
        setBusy(true);

        setTimeout(() => {
          setFlipped([]);
          setWrongPair([]);
          setBusy(false);
        }, 700);
      }
    }
  };

  if (!cards.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3.5">
      {cards.map((card) => {
        const isRevealed = revealed.includes(card.card_id);
        const isFlipped = flipped.includes(card.card_id);
        const isWrong = wrongPair.includes(card.card_id);
        const faceUp = isRevealed || isFlipped;

        return (
          <button
            key={card.card_id}
            type="button"
            onClick={() => handleCardClick(card)}
            disabled={disabled || isRevealed}
            className={cn(
              "min-h-[100px] cursor-pointer rounded-lg p-3.5 text-center text-xl font-bold [overflow-wrap:anywhere] transition-colors duration-200 disabled:cursor-not-allowed",
              isRevealed
                ? "border-2 border-success bg-success-soft text-foreground"
                : isWrong
                ? "border-2 border-destructive bg-destructive-soft text-foreground"
                : faceUp
                ? "border border-border bg-card text-foreground"
                : "border border-border bg-primary text-background"
            )}
          >
            {faceUp ? (
              card.label
            ) : (
              <Layers
                className="mx-auto h-6 w-6 text-background/70"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function MemorySequenceGame({
  game,
  disabled,
  onSubmit,
  speakText,
  speaking,
  speakingOption,
}) {
  const steps = game?.game_data?.steps || [];

  const [order, setOrder] = useState([]);
  const [undoCount, setUndoCount] = useState(0);

  // The parent keys this component by game_id, so each new sequence gets
  // a fresh mount instead of needing a reset-on-prop-change effect.
  const startTimeRef = useRef(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  if (!steps.length) {
    return null;
  }

  const chosenIds = new Set(order);

  const handleChoose = (step) => {
    if (disabled || submittedRef.current) return;
    if (order.length >= steps.length || chosenIds.has(step.step_id)) return;

    const nextOrder = [...order, step.step_id];
    setOrder(nextOrder);

    if (nextOrder.length === steps.length) {
      submittedRef.current = true;
      const timeSeconds = elapsedSecondsSince(startTimeRef.current);
      onSubmit(JSON.stringify(nextOrder), {
        mistakes: undoCount,
        time_seconds: timeSeconds,
      });
    }
  };

  const handleUndoLast = () => {
    if (disabled || order.length === 0 || submittedRef.current) return;
    setOrder((current) => current.slice(0, -1));
    setUndoCount((count) => count + 1);
  };

  const labelFor = (stepId) =>
    steps.find((step) => step.step_id === stepId)?.label || "";

  return (
    <div>
      <div className="mb-[18px] grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {steps.map((_, index) => (
          <div
            key={index}
            className="flex min-h-[90px] flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-border-strong bg-card p-3 text-center"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {index + 1}
            </span>
            <span className="text-[15px] font-bold text-foreground [overflow-wrap:anywhere]">
              {order[index] ? labelFor(order[index]) : "Tap a step below"}
            </span>
          </div>
        ))}
      </div>

      {order.length > 0 && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUndoLast}
          className="mb-4 border-border-strong text-primary"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          Undo last step
        </Button>
      )}

      <div className="grid gap-3">
        {steps.map((step) => {
          const used = chosenIds.has(step.step_id);

          return (
            <div key={step.step_id} className="flex items-stretch gap-2.5">
              <button
                type="button"
                onClick={() => handleChoose(step)}
                disabled={disabled || used}
                className={cn(
                  "min-w-0 flex-1 cursor-pointer rounded-xl border border-border bg-card p-4 text-left text-[17px] text-foreground [overflow-wrap:anywhere] transition-opacity disabled:cursor-not-allowed",
                  used && "opacity-40"
                )}
              >
                {step.label}
              </button>

              <AudioButton
                label={step.label}
                optionId={step.step_id}
                speakText={speakText}
                speaking={speaking}
                speakingOption={speakingOption}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ObjectVisualRecallGame({
  game,
  disabled,
  onSubmit,
  selectedAnswer,
  answerResult,
  speakText,
  speaking,
  speakingOption,
}) {
  const cards = game?.game_data?.cards || [];

  // The parent keys this component by game_id, so each new card set gets
  // a fresh mount instead of needing a reset-on-prop-change effect.
  const startTimeRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  if (!cards.length) {
    return null;
  }

  const handleChoose = (card) => {
    if (disabled) return;

    const timeSeconds = elapsedSecondsSince(startTimeRef.current);

    onSubmit(card.label, { time_seconds: timeSeconds });
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
      {cards.map((card) => {
        const isSelected = selectedAnswer === card.label;

        return (
          <div key={card.id} className="flex items-stretch gap-2.5">
            <button
              type="button"
              onClick={() => handleChoose(card)}
              disabled={disabled}
              className={cn(
                "flex min-h-[110px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg p-3.5 transition-colors disabled:cursor-not-allowed",
                isSelected
                  ? cn(
                      "border-[3px] bg-accent",
                      answerResult?.correct ? "border-success" : "border-destructive"
                    )
                  : "border-2 border-border bg-card"
              )}
            >
              <span className="text-[40px] leading-none" aria-hidden="true">
                {card.emoji}
              </span>
              <span className="text-base font-bold text-foreground [overflow-wrap:anywhere]">
                {card.label}
              </span>
            </button>

            <AudioButton
              label={card.label}
              optionId={card.id}
              speakText={speakText}
              speaking={speaking}
              speakingOption={speakingOption}
            />
          </div>
        );
      })}
    </div>
  );
}

function Therapy() {
  const [language, setLanguage] = useState("English");
  const [loadingLanguage, setLoadingLanguage] = useState(true);

  const [session, setSession] = useState(null);
  const [games, setGames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState(null);

  const [loadingSession, setLoadingSession] = useState(false);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [completingGame, setCompletingGame] = useState(false);

  const [message, setMessage] = useState("");

  const [speaking, setSpeaking] = useState(false);
  const [speakingOption, setSpeakingOption] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("smriti_token");

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
            data.detail || "Could not load patient language."
          );
        }

        const patientLanguage = data?.patient?.language;

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
  }, []);

  const startTherapySession = async () => {
    setLoadingSession(true);
    setMessage("");
    setSession(null);
    setGames([]);
    setCurrentIndex(0);
    setSelectedAnswer("");
    setAnswerResult(null);

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
          data.detail || "Could not start the therapy session."
        );
      }

      if (!data.games || data.games.length !== 5) {
        throw new Error(
          "The therapy session did not contain all 5 questions."
        );
      }

      setSession(data);
      setGames(data.games);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingSession(false);
    }
  };

  const completeCurrentGame = async (gameId) => {
    if (!session?.session_id || !gameId) {
      return;
    }

    setCompletingGame(true);

    try {
      const response = await fetch(
        `${API_URL}/therapy-sessions/${session.session_id}/games/${gameId}/complete`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not complete the therapy question."
        );
      }

      setSession((current) => ({
        ...(current || {}),
        completed_games: data.completed_games,
        total_games: data.total_games,
        status: data.status,
      }));

      return data;
    } finally {
      setCompletingGame(false);
    }
  };

  const checkAnswer = async (answer, metrics = null) => {
    const currentGame = games[currentIndex];

    if (!currentGame || checkingAnswer || answerResult) {
      return;
    }

    setSelectedAnswer(answer);
    setCheckingAnswer(true);
    setMessage("");

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
            game_id: currentGame.game_id,
            answer,
            session_id: session?.session_id,
            ...(metrics ? { metrics } : {}),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Could not check the answer."
        );
      }

      setAnswerResult(result);

      if (result.correct) {
        setMessage("✓ Correct! Great job.");
      } else {
        setMessage(
          "Take another look at the memory. You can continue when ready."
        );
      }
    } catch (error) {
      setMessage(error.message);
      setSelectedAnswer("");
    } finally {
      setCheckingAnswer(false);
    }
  };

  const moveToNextQuestion = async () => {
    const currentGame = games[currentIndex];

    if (!currentGame || completingGame) {
      return;
    }

    try {
      await completeCurrentGame(currentGame.game_id);

      const nextIndex = currentIndex + 1;

      if (nextIndex >= games.length) {
        return;
      }

      setCurrentIndex(nextIndex);
      setSelectedAnswer("");
      setAnswerResult(null);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const speakText = async (text, option = "") => {
    if (!text || speaking) {
      return;
    }

    setSpeaking(true);
    setSpeakingOption(option);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/tts/speak?text=${encodeURIComponent(
          text
        )}&language=${encodeURIComponent(language)}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.detail || "Could not generate audio."
        );
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeaking(false);
        setSpeakingOption("");
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeaking(false);
        setSpeakingOption("");
        setMessage("Could not play the audio.");
      };

      await audio.play();
    } catch (error) {
      setSpeaking(false);
      setSpeakingOption("");
      setMessage(error.message);
    }
  };

  const currentGame = games[currentIndex] || null;

  const getCognitiveTitle = (gameType) => {
    const titles = {
      multiple_choice: "Memory Recall",
      true_false: "Memory Check",
      fill_blank: "Recall Challenge",
      attention: "Attention Challenge",
      routine_recall: "Routine Recall",
      pattern_recognition: "Pattern Recognition",
      object_recognition: "Object Recognition",
      emotional_engagement: "Personal Memory",
      memory_match: "Memory Match",
      memory_sequence: "Memory Sequence",
      visual_recall: "Object & Visual Recall",
    };

    return titles[gameType] || "Cognitive Activity";
  };

  const getCognitiveIcon = (gameType) => {
    const icons = {
      multiple_choice: Brain,
      true_false: Search,
      fill_blank: PenLine,
      attention: Target,
      routine_recall: Clock,
      pattern_recognition: Puzzle,
      object_recognition: Eye,
      emotional_engagement: Heart,
      memory_match: Layers,
      memory_sequence: ListOrdered,
      visual_recall: ImageIcon,
    };

    return icons[gameType] || Brain;
  };

  const getDifficultyLabel = (difficulty) => {
    if (!difficulty) return "Adaptive";

    if (difficulty.toLowerCase() === "comfort") {
      return "Comfort Mode";
    }

    return (
      difficulty.charAt(0).toUpperCase() +
      difficulty.slice(1)
    );
  };

  const isSessionComplete =
    games.length === 5 &&
    currentIndex >= games.length - 1 &&
    Boolean(answerResult);

  const sessionCompletedGames =
    session?.completed_games || 0;

  const sessionProgress =
    session?.total_games > 0
      ? Math.round(
          (sessionCompletedGames / session.total_games) * 100
        )
      : 0;

  const visualGameTypes = [
    "memory_match",
    "memory_sequence",
    "visual_recall",
  ];

  const hasVisualGameUi = Boolean(
    currentGame?.game_data &&
      visualGameTypes.includes(currentGame.game_type)
  );

  return (
    <div className="min-h-screen bg-background px-[7%] pt-24 pb-16 font-body text-foreground">
      <div className="mx-auto max-w-[900px]">
        <p className="mb-3 text-sm font-bold tracking-[0.08em] text-primary">
          SMRITI AI
        </p>

        <h1 className="text-4xl leading-tight text-foreground sm:text-[2.875rem]">
          Today&apos;s Therapy Session
        </h1>

        <p className="mt-4 max-w-[650px] text-lg leading-relaxed text-muted-foreground">
          A gentle cognitive activity created from familiar
          memories. Take your time and enjoy the memory.
        </p>

        <p className="mt-[18px] text-[15px] font-bold text-primary">
          {loadingLanguage
            ? "Loading patient language..."
            : `Patient language: ${language}`}
        </p>

        {!session && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={startTherapySession}
            disabled={loadingSession || loadingLanguage}
            className="mt-9"
          >
            {loadingSession ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Creating 5-question session...
              </>
            ) : loadingLanguage ? (
              "Loading language..."
            ) : (
              <>
                Start 5-Question Session
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        )}

        {session && !isSessionComplete && currentGame && (
          <Card className="mt-10 rounded-xl p-6 sm:p-9">
            <div className="mb-6 flex flex-col items-start justify-between gap-5 sm:flex-row">
              <p className="text-[13px] font-bold uppercase tracking-wider text-faint">
                Question {currentIndex + 1} of{" "}
                {games.length}
              </p>

              <div className="whitespace-nowrap text-sm font-bold text-primary">
                {sessionCompletedGames} /{" "}
                {session.total_games} completed
              </div>
            </div>

            <Progress value={sessionProgress} trackClassName="mb-7" />

            <Badge variant="accent" className="mb-3.5">
              {(() => {
                const CognitiveIcon = getCognitiveIcon(
                  currentGame.game_type
                );
                return (
                  <CognitiveIcon
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                );
              })()}

              <span>
                {getCognitiveTitle(currentGame.game_type)}
              </span>
            </Badge>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="muted">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                {language}
              </Badge>

              <Badge variant="muted">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                {getDifficultyLabel(currentGame.difficulty)}
              </Badge>
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-xl border-2 border-accent-border bg-accent p-4 sm:p-5">
              <BookOpen
                className="mt-0.5 h-6 w-6 shrink-0 text-primary"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                  This question is about the memory:
                </p>

                <p className="text-lg font-bold leading-snug text-foreground [overflow-wrap:anywhere] sm:text-xl">
                  {currentGame.memory_title}
                </p>
              </div>
            </div>

            <h2 className="mb-4 text-2xl leading-snug text-foreground [overflow-wrap:anywhere] sm:text-[1.875rem]">
              {currentGame.question}
            </h2>

            <Button
              type="button"
              variant="outline"
              onClick={() => speakText(currentGame.question)}
              disabled={speaking}
              className="mb-6 border-primary text-primary hover:border-primary hover:bg-accent"
            >
              {speaking && !speakingOption ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Speaking...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  Listen to Question
                </>
              )}
            </Button>

            {hasVisualGameUi &&
              currentGame.game_type === "memory_match" && (
                <MemoryMatchGame
                  key={currentGame.game_id}
                  game={currentGame}
                  disabled={
                    checkingAnswer || Boolean(answerResult)
                  }
                  onSubmit={checkAnswer}
                  speakText={speakText}
                />
              )}

            {hasVisualGameUi &&
              currentGame.game_type === "memory_sequence" && (
                <MemorySequenceGame
                  key={currentGame.game_id}
                  game={currentGame}
                  disabled={
                    checkingAnswer || Boolean(answerResult)
                  }
                  onSubmit={checkAnswer}
                  speakText={speakText}
                  speaking={speaking}
                  speakingOption={speakingOption}
                />
              )}

            {hasVisualGameUi &&
              currentGame.game_type === "visual_recall" && (
                <ObjectVisualRecallGame
                  key={currentGame.game_id}
                  game={currentGame}
                  disabled={
                    checkingAnswer || Boolean(answerResult)
                  }
                  onSubmit={checkAnswer}
                  selectedAnswer={selectedAnswer}
                  answerResult={answerResult}
                  speakText={speakText}
                  speaking={speaking}
                  speakingOption={speakingOption}
                />
              )}

            {!hasVisualGameUi && (
              <div className="grid gap-3">
                {currentGame.options?.map(
                  (option, index) => {
                    const isSelected = selectedAnswer === option;

                    return (
                      <div
                        className="flex items-stretch gap-2.5"
                        key={index}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            checkAnswer(option)
                          }
                          disabled={
                            checkingAnswer ||
                            Boolean(answerResult)
                          }
                          className={cn(
                            "min-w-0 flex-1 cursor-pointer rounded-xl p-4 text-left text-[17px] text-foreground [overflow-wrap:anywhere] transition-colors disabled:cursor-not-allowed",
                            isSelected
                              ? cn(
                                  "border-2 bg-accent",
                                  answerResult?.correct
                                    ? "border-success"
                                    : answerResult
                                    ? "border-destructive"
                                    : "border-success"
                                )
                              : "border border-border bg-card"
                          )}
                        >
                          {option}
                        </button>

                        <AudioButton
                          label={option}
                          optionId={option}
                          speakText={speakText}
                          speaking={speaking}
                          speakingOption={speakingOption}
                        />
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {answerResult && (
              <Alert
                variant={answerResult.correct ? "success" : "destructive"}
                className="mt-6"
              >
                {answerResult.correct
                  ? "✓ Correct! Great job."
                  : "Take another look at the memory. You can continue when ready."}
              </Alert>
            )}

            {message && !answerResult && (
              <p className="mt-6 text-base leading-relaxed font-bold text-destructive">
                {message}
              </p>
            )}

            {answerResult && (
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={moveToNextQuestion}
                disabled={completingGame}
                className="mt-[18px] w-full"
              >
                {completingGame ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving progress...
                  </>
                ) : currentIndex === games.length - 1 ? (
                  <>
                    Finish Session
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            )}
          </Card>
        )}

        {session && isSessionComplete && (
          <Card className="mt-10 rounded-xl p-6 text-center sm:p-9">
            <PartyPopper
              className="mx-auto mb-4 h-12 w-12 text-primary"
              aria-hidden="true"
            />

            <h2 className="mb-3 text-[2rem] text-foreground">
              Therapy Session Complete
            </h2>

            <p className="leading-relaxed text-muted-foreground">
              You completed all 5 personalized questions.
              Great work!
            </p>

            <p className="mt-4 font-bold text-primary">
              {session.total_games} of{" "}
              {session.total_games} questions completed
            </p>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={startTherapySession}
              disabled={loadingSession}
              className="mt-6"
            >
              {loadingSession ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Starting...
                </>
              ) : (
                <>
                  Start Another Session
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </Card>
        )}

        {message && !answerResult && !session && (
          <p className="mt-6 text-base leading-relaxed font-bold text-destructive">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Therapy;
