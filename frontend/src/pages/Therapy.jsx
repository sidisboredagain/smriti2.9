import { useEffect, useRef, useState } from "react";

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
    <div className="memory-match-grid">
      {cards.map((card) => {
        const isRevealed = revealed.includes(card.card_id);
        const isFlipped = flipped.includes(card.card_id);
        const isWrong = wrongPair.includes(card.card_id);
        const faceUp = isRevealed || isFlipped;

        return (
          <button
            key={card.card_id}
            type="button"
            className="memory-match-card"
            onClick={() => handleCardClick(card)}
            disabled={disabled || isRevealed}
            style={{
              background: isRevealed ? "#e3f0e6" : isWrong ? "#f8dedc"
                : faceUp
                ? "#fffcf6"
                : "#bd5b34",
              color: faceUp ? "#2a2119" : "#faf5eb",
              border: isRevealed ? "2px solid #2f7a4d" : isWrong ? "2px solid #b3261e"
                : "1px solid #e6d9bf",
              cursor: disabled || isRevealed ? "not-allowed" : "pointer",
            }}
          >
            {faceUp ? card.label : "🌿"}
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
      <div className="sequence-slots">
        {steps.map((_, index) => (
          <div key={index} className="sequence-slot">
            <span className="sequence-slot-number">{index + 1}</span>
            <span className="sequence-slot-label">
              {order[index] ? labelFor(order[index]) : "Tap a step below"}
            </span>
          </div>
        ))}
      </div>

      {order.length > 0 && !disabled && (
        <button
          type="button"
          className="sequence-undo-button"
          onClick={handleUndoLast}
        >
          ↩ Undo last step
        </button>
      )}

      <div className="sequence-choices">
        {steps.map((step) => {
          const used = chosenIds.has(step.step_id);

          return (
            <div key={step.step_id} className="sequence-choice-row">
              <button
                type="button"
                className="sequence-choice-button"
                onClick={() => handleChoose(step)}
                disabled={disabled || used}
                style={{
                  opacity: used ? 0.4 : 1,
                  cursor: disabled || used ? "not-allowed" : "pointer",
                }}
              >
                {step.label}
              </button>

              {speakText && (
                <button
                  type="button"
                  className="therapy-audio-button"
                  onClick={() => speakText(step.label, step.step_id)}
                  disabled={speaking && speakingOption !== step.step_id}
                  aria-label={`Listen to ${step.label}`}
                >
                  {speakingOption === step.step_id ? "🔊" : "🔈"}
                </button>
              )}
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
    <div className="visual-recall-grid">
      {cards.map((card) => {
        const isSelected = selectedAnswer === card.label;

        return (
          <div key={card.id} className="visual-recall-card-row">
            <button
              type="button"
              className="visual-recall-card"
              onClick={() => handleChoose(card)}
              disabled={disabled}
              style={{
                border: isSelected ? answerResult?.correct ? "3px solid #2f7a4d" : "3px solid #b3261e" : "2px solid #e6d9bf",
                background: isSelected ? "#fbeee6" : "#fffcf6",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <span className="visual-recall-emoji">{card.emoji}</span>
              <span className="visual-recall-label">{card.label}</span>
            </button>

            {speakText && (
              <button
                type="button"
                className="therapy-audio-button"
                onClick={() => speakText(card.label, card.id)}
                disabled={speaking && speakingOption !== card.id}
                aria-label={`Listen to ${card.label}`}
              >
                {speakingOption === card.id ? "🔊" : "🔈"}
              </button>
            )}
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
      multiple_choice: "🧠",
      true_false: "🔎",
      fill_blank: "✍️",
      attention: "🎯",
      routine_recall: "🕰️",
      pattern_recognition: "🧩",
      object_recognition: "👀",
      emotional_engagement: "❤️",
      memory_match: "🃏",
      memory_sequence: "🔢",
      visual_recall: "🖼️",
    };

    return icons[gameType] || "🧠";
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
    <>
      <style>
        {`
          .therapy-page {
            min-height: 100vh;
            background: #faf5eb;
            padding: 96px 7% 60px;
            color: #2a2119;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          }

          .therapy-container {
            max-width: 900px;
            margin: 0 auto;
          }

          .therapy-label {
            color: #bd5b34;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 1px;
            margin: 0 0 12px;
          }

          .therapy-title {
            color: #2a2119;
            font-size: 46px;
            line-height: 1.1;
            margin: 0 0 16px;
          }

          .therapy-description {
            color: #6e6153;
            font-size: 18px;
            line-height: 1.7;
            max-width: 650px;
            margin: 0;
          }

          .therapy-language {
            margin-top: 18px;
            color: #bd5b34;
            font-size: 15px;
            font-weight: 700;
          }

          .therapy-start-button {
            margin-top: 35px;
            padding: 15px 24px;
            border: none;
            border-radius: 12px;
            background: #bd5b34;
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
          }

          .therapy-session-card {
            margin-top: 40px;
            background: #fffcf6;
            border: 1px solid #e6d9bf;
            border-radius: 24px;
            padding: 35px;
            box-shadow: 0 18px 50px rgba(48, 59, 52, 0.08);
          }

          .therapy-session-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 24px;
          }

          .therapy-progress-text {
            color: #bd5b34;
            font-weight: 700;
            white-space: nowrap;
          }

          .therapy-progress-bar {
            width: 100%;
            height: 10px;
            margin: 0 0 28px;
            border-radius: 999px;
            background: #efe6d3;
            overflow: hidden;
          }

          .therapy-progress-fill {
            height: 100%;
            border-radius: 999px;
            background: #bd5b34;
          }

          .therapy-game-label {
            color: #948572;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 10px;
          }

          .therapy-cognitive-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: #fbeee6;
            color: #9a4728;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 14px;
          }

          .therapy-cognitive-badge-icon {
            font-size: 17px;
          }

          .therapy-session-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }

          .therapy-meta-pill {
            display: inline-flex;
            align-items: center;
            padding: 7px 10px;
            border-radius: 999px;
            background: #f5eeda;
            color: #6e6153;
            font-size: 12px;
            font-weight: 700;
          }

          .therapy-memory-title {
            color: #bd5b34;
            font-size: 14px;
            font-weight: 700;
            margin: 0 0 18px;
          }

          .therapy-question {
            color: #2a2119;
            font-size: 30px;
            line-height: 1.45;
            margin: 0 0 18px;
            overflow-wrap: anywhere;
          }

          .therapy-listen-button {
            margin-bottom: 24px;
            padding: 12px 18px;
            border: 1px solid #bd5b34;
            border-radius: 10px;
            background: #fffcf6;
            color: #bd5b34;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
          }

          .therapy-options {
            display: grid;
            gap: 12px;
          }

          .therapy-option-row {
            display: flex;
            gap: 10px;
            align-items: stretch;
          }

          .therapy-option-button {
            flex: 1;
            min-width: 0;
            padding: 16px;
            border-radius: 12px;
            font-size: 17px;
            text-align: left;
            overflow-wrap: anywhere;
          }

          .therapy-audio-button {
            width: 58px;
            border-radius: 12px;
            border: 1px solid #bd5b34;
            background: #fffcf6;
            color: #bd5b34;
            font-size: 20px;
            cursor: pointer;
          }

          .memory-match-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }

          .memory-match-card {
            min-height: 100px;
            border-radius: 16px;
            font-size: 20px;
            font-weight: 700;
            text-align: center;
            padding: 14px;
            transition: background 0.2s ease, border 0.2s ease;
            overflow-wrap: anywhere;
          }

          .sequence-slots {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 18px;
          }

          .sequence-slot {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 90px;
            padding: 12px;
            border-radius: 14px;
            border: 2px dashed #d8c7a3;
            background: #fffcf6;
            text-align: center;
          }

          .sequence-slot-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 999px;
            background: #bd5b34;
            color: #ffffff;
            font-weight: 700;
            font-size: 14px;
          }

          .sequence-slot-label {
            font-size: 15px;
            font-weight: 700;
            color: #2a2119;
            overflow-wrap: anywhere;
          }

          .sequence-undo-button {
            margin-bottom: 16px;
            padding: 10px 16px;
            border: 1px solid #d8c7a3;
            border-radius: 10px;
            background: #fffcf6;
            color: #bd5b34;
            font-weight: 700;
            cursor: pointer;
          }

          .sequence-choices {
            display: grid;
            gap: 12px;
          }

          .sequence-choice-row {
            display: flex;
            gap: 10px;
            align-items: stretch;
          }

          .sequence-choice-button {
            flex: 1;
            min-width: 0;
            padding: 16px;
            border-radius: 12px;
            font-size: 17px;
            text-align: left;
            border: 1px solid #e6d9bf;
            background: #fffcf6;
            color: #2a2119;
            overflow-wrap: anywhere;
          }

          .visual-recall-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }

          .visual-recall-card-row {
            display: flex;
            gap: 10px;
            align-items: stretch;
          }

          .visual-recall-card {
            flex: 1;
            min-width: 0;
            min-height: 110px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 16px;
            padding: 14px;
          }

          .visual-recall-emoji {
            font-size: 40px;
            line-height: 1;
          }

          .visual-recall-label {
            font-size: 16px;
            font-weight: 700;
            color: #2a2119;
            overflow-wrap: anywhere;
          }

          .therapy-feedback {
            margin-top: 22px;
            padding: 15px;
            border-radius: 12px;
            background: #f5eeda;
            font-weight: 700;
            line-height: 1.5;
          }

          .therapy-next-button {
            margin-top: 18px;
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 12px;
            background: #bd5b34;
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
          }

          .therapy-complete {
            text-align: center;
            padding: 20px 5px;
          }

          .therapy-complete-icon {
            font-size: 48px;
            margin-bottom: 15px;
          }

          .therapy-complete h2 {
            margin: 0 0 12px;
            color: #2a2119;
            font-size: 32px;
          }

          .therapy-complete p {
            margin: 0;
            color: #6e6153;
            line-height: 1.6;
          }

          .therapy-message {
            margin-top: 22px;
            color: #b3261e;
            font-weight: 700;
            font-size: 16px;
            line-height: 1.5;
          }

          @media (max-width: 600px) {
            .therapy-page {
              padding: 70px 16px 35px;
            }

            .therapy-title {
              font-size: 34px;
            }

            .therapy-description {
              font-size: 16px;
            }

            .therapy-session-card {
              padding: 20px;
              border-radius: 18px;
            }

            .therapy-session-header {
              flex-direction: column;
              gap: 8px;
            }

            .therapy-question {
              font-size: 24px;
            }

            .therapy-session-meta {
              align-items: flex-start;
            }

            .therapy-cognitive-badge {
              font-size: 13px;
            }

            .therapy-option-button {
              font-size: 16px;
              padding: 14px;
            }

            .memory-match-grid,
            .visual-recall-grid {
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }

            .memory-match-card {
              min-height: 84px;
              font-size: 17px;
            }

            .sequence-slots {
              grid-template-columns: 1fr;
              gap: 8px;
            }

            .visual-recall-card {
              min-height: 90px;
              padding: 10px;
            }

            .visual-recall-emoji {
              font-size: 32px;
            }
          }

          @media (max-width: 390px) {
            .therapy-page {
              padding-left: 12px;
              padding-right: 12px;
            }

            .therapy-title {
              font-size: 32px;
            }

            .therapy-question {
              font-size: 22px;
            }

            .therapy-audio-button {
              width: 52px;
            }
          }
        `}
      </style>

      <div className="therapy-page">
        <div className="therapy-container">
          <p className="therapy-label">
            SMRITI AI
          </p>

          <h1 className="therapy-title">
            Today&apos;s Therapy Session
          </h1>

          <p className="therapy-description">
            A gentle cognitive activity created from familiar
            memories. Take your time and enjoy the memory.
          </p>

          <p className="therapy-language">
            {loadingLanguage
              ? "Loading patient language..."
              : `Patient language: ${language}`}
          </p>

          {!session && (
            <button
              className="therapy-start-button"
              onClick={startTherapySession}
              disabled={
                loadingSession || loadingLanguage
              }
              style={{
                cursor:
                  loadingSession || loadingLanguage
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loadingSession || loadingLanguage
                    ? 0.7
                    : 1,
              }}
            >
              {loadingSession
                ? "Creating 5-question session..."
                : loadingLanguage
                ? "Loading language..."
                : "Start 5-Question Session →"}
            </button>
          )}

          {session && !isSessionComplete && currentGame && (
            <div className="therapy-session-card">
              <div className="therapy-session-header">
                <div>
                  <p className="therapy-game-label">
                    Question {currentIndex + 1} of{" "}
                    {games.length}
                  </p>

                  <p className="therapy-memory-title">
                    Memory: {currentGame.memory_title}
                  </p>
                </div>

                <div className="therapy-progress-text">
                  {sessionCompletedGames} /{" "}
                  {session.total_games} completed
                </div>
              </div>

              <div className="therapy-progress-bar">
                <div
                  className="therapy-progress-fill"
                  style={{
                    width: `${sessionProgress}%`,
                  }}
                />
              </div>

              <div className="therapy-cognitive-badge">
                <span className="therapy-cognitive-badge-icon">
                  {getCognitiveIcon(currentGame.game_type)}
                </span>

                <span>
                  {getCognitiveTitle(currentGame.game_type)}
                </span>
              </div>

              <div className="therapy-session-meta">
                <span className="therapy-meta-pill">
                  🌐 {language}
                </span>

                <span className="therapy-meta-pill">
                  ⚡ {getDifficultyLabel(currentGame.difficulty)}
                </span>
              </div>

              <h2 className="therapy-question">
                {currentGame.question}
              </h2>

              <button
                className="therapy-listen-button"
                onClick={() =>
                  speakText(currentGame.question)
                }
                disabled={speaking}
                style={{
                  cursor: speaking
                    ? "not-allowed"
                    : "pointer",
                  opacity: speaking ? 0.7 : 1,
                }}
              >
                {speaking && !speakingOption
                  ? "🔊 Speaking..."
                  : "🔊 Listen to Question"}
              </button>

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
                <div className="therapy-options">
                  {currentGame.options?.map(
                    (option, index) => (
                      <div
                        className="therapy-option-row"
                        key={index}
                      >
                        <button
                          className="therapy-option-button"
                          onClick={() =>
                            checkAnswer(option)
                          }
                          disabled={
                            checkingAnswer ||
                            Boolean(answerResult)
                          }
                          style={{
                            border:
                              selectedAnswer === option
                                ? answerResult?.correct ? "2px solid #2f7a4d" : answerResult ? "2px solid #b3261e" : "2px solid #2f7a4d"
                                : "1px solid #e6d9bf",
                            background:
                              selectedAnswer === option ? "#fbeee6" : "#fffcf6",
                            color: "#2a2119",
                            cursor:
                              checkingAnswer ||
                              answerResult
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {option}
                        </button>

                        <button
                          className="therapy-audio-button"
                          onClick={() =>
                            speakText(option, option)
                          }
                          disabled={
                            speaking &&
                            speakingOption !== option
                          }
                          aria-label={`Listen to ${option}`}
                          style={{
                            cursor:
                              speaking &&
                              speakingOption !== option
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {speakingOption === option
                            ? "🔊"
                            : "🔈"}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              {answerResult && (
                <div
                  className="therapy-feedback"
                  style={{
                    color: answerResult.correct ? "#2f7a4d" : "#b3261e",
                  }}
                >
                  {answerResult.correct
                    ? "✓ Correct! Great job."
                    : "Take another look at the memory. You can continue when ready."}
                </div>
              )}

              {message && !answerResult && (
                <p className="therapy-message">
                  {message}
                </p>
              )}

              {answerResult && (
                <button
                  className="therapy-next-button"
                  onClick={moveToNextQuestion}
                  disabled={completingGame}
                  style={{
                    cursor: completingGame
                      ? "not-allowed"
                      : "pointer",
                    opacity: completingGame
                      ? 0.7
                      : 1,
                  }}
                >
                  {completingGame
                    ? "Saving progress..."
                    : currentIndex === games.length - 1
                    ? "Finish Session →"
                    : "Next Question →"}
                </button>
              )}
            </div>
          )}

          {session && isSessionComplete && (
            <div className="therapy-session-card">
              <div className="therapy-complete">
                <div className="therapy-complete-icon">
                  🎉
                </div>

                <h2>
                  Therapy Session Complete
                </h2>

                <p>
                  You completed all 5 personalized questions.
                  Great work!
                </p>

                <p
                  style={{
                    marginTop: "15px",
                    color: "#bd5b34",
                    fontWeight: "700",
                  }}
                >
                  {session.total_games} of{" "}
                  {session.total_games} questions completed
                </p>

                <button
                  className="therapy-start-button"
                  onClick={startTherapySession}
                  disabled={loadingSession}
                  style={{
                    marginTop: "25px",
                  }}
                >
                  {loadingSession
                    ? "Starting..."
                    : "Start Another Session →"}
                </button>
              </div>
            </div>
          )}

          {message && !answerResult && !session && (
            <p className="therapy-message">
              {message}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Therapy;
