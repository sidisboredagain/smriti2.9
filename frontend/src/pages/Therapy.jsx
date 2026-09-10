import { useEffect, useState } from "react";
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
  ScanSearch,
  Search,
  Target,
  Volume2,
  Zap,
} from "lucide-react";

import { cn } from "../lib/utils";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  AttentionFocusGame,
  AudioButton,
  MemoryMatchGame,
  MemorySequenceGame,
  ObjectVisualRecallGame,
} from "../lib/gameWidgets";
import { translate } from "../lib/i18n";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function Therapy() {
  const [language, setLanguage] = useState("English");
  const [loadingLanguage, setLoadingLanguage] = useState(true);

  const t = (key, vars) => translate(language, key, vars);

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

      if (!data.games || data.games.length !== 6) {
        throw new Error(
          "The therapy session did not contain all 6 questions."
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
      multiple_choice: t("game_type_multiple_choice"),
      true_false: t("game_type_true_false"),
      fill_blank: t("game_type_fill_blank"),
      attention: t("game_type_attention"),
      routine_recall: t("game_type_routine_recall"),
      pattern_recognition: t("game_type_pattern_recognition"),
      object_recognition: t("game_type_object_recognition"),
      emotional_engagement: t("game_type_emotional_engagement"),
      memory_match: t("game_type_memory_match"),
      memory_sequence: t("game_type_memory_sequence"),
      visual_recall: t("game_type_visual_recall"),
      attention_focus: t("game_type_attention_focus"),
    };

    return titles[gameType] || t("game_type_default");
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
      attention_focus: ScanSearch,
    };

    return icons[gameType] || Brain;
  };

  const getDifficultyLabel = (difficulty) => {
    if (!difficulty) return t("therapy_adaptive");

    if (difficulty.toLowerCase() === "comfort") {
      return t("therapy_comfort_mode");
    }

    return (
      difficulty.charAt(0).toUpperCase() +
      difficulty.slice(1)
    );
  };

  const isSessionComplete =
    games.length > 0 &&
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
    "attention_focus",
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
          {t("therapy_title")}
        </h1>

        <p className="mt-4 max-w-[650px] text-lg leading-relaxed text-muted-foreground">
          {t("therapy_description")}
        </p>

        <p className="mt-[18px] text-[15px] font-bold text-primary">
          {loadingLanguage
            ? t("therapy_loading_patient_language")
            : t("therapy_patient_language_label", { language })}
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
                {t("therapy_creating_session")}
              </>
            ) : loadingLanguage ? (
              t("therapy_loading_language")
            ) : (
              <>
                {t("therapy_start_session")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        )}

        {session && !isSessionComplete && currentGame && (
          <Card className="mt-10 rounded-xl p-6 sm:p-9">
            <div className="mb-6 flex flex-col items-start justify-between gap-5 sm:flex-row">
              <p className="text-[13px] font-bold uppercase tracking-wider text-faint">
                {t("therapy_question_of", {
                  current: currentIndex + 1,
                  total: games.length,
                })}
              </p>

              <div className="whitespace-nowrap text-sm font-bold text-primary">
                {t("therapy_completed_count", {
                  completed: sessionCompletedGames,
                  total: session.total_games,
                })}
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
                  {t("therapy_memory_about")}
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
                  {t("therapy_speaking")}
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  {t("therapy_listen_to_question")}
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

            {hasVisualGameUi &&
              currentGame.game_type === "attention_focus" && (
                <AttentionFocusGame
                  key={currentGame.game_id}
                  game={currentGame}
                  disabled={
                    checkingAnswer || Boolean(answerResult)
                  }
                  onSubmit={checkAnswer}
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
                  ? t("therapy_correct")
                  : t("therapy_try_look_again")}
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
                    {t("therapy_saving_progress")}
                  </>
                ) : currentIndex === games.length - 1 ? (
                  <>
                    {t("therapy_finish_session")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    {t("therapy_next_question")}
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
              {t("therapy_session_complete")}
            </h2>

            <p className="leading-relaxed text-muted-foreground">
              {t("therapy_completed_all")}
            </p>

            <p className="mt-4 font-bold text-primary">
              {t("therapy_questions_completed", {
                completed: session.total_games,
                total: session.total_games,
              })}
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
                  {t("therapy_starting")}
                </>
              ) : (
                <>
                  {t("therapy_start_another")}
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
