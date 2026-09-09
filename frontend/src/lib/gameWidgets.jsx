import { useEffect, useRef, useState } from "react";
import { Layers, Loader2, Undo2, Volume2 } from "lucide-react";

import { cn } from "./utils";
import { Button } from "../components/ui/button";

// Shared cognitive-game widgets for the three richer, visual game types
// (Memory Match, Memory Sequence, Object/Visual Recall). Originally lived
// only inside the caregiver's Therapy.jsx; extracted here so the patient
// app's own Play screen can reuse the exact same, already-tested
// interaction logic instead of re-implementing it, while each screen is
// free to wrap them in its own surrounding layout/copy.

// Plain (non-component) helper so the elapsed-time read lives outside
// any component/hook body.
export function elapsedSecondsSince(startMs) {
  if (!startMs) {
    return 0;
  }

  return Math.round((Date.now() - startMs) / 100) / 10;
}

// Shared "listen to this" control used by the question options, the
// memory-sequence choices, and the visual-recall cards. Purely
// presentational - it only mirrors the speakText/speaking/speakingOption
// props each caller already manages.
export function AudioButton({ label, optionId, speakText, speaking, speakingOption }) {
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

export function MemoryMatchGame({ game, disabled, onSubmit, speakText }) {
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

export function MemorySequenceGame({
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

export function ObjectVisualRecallGame({
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
