import { useEffect, useState } from "react";

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

  const getCategoryIcon = (value) => {
    const icons = {
      family: "👨‍👩‍👧",
      friends: "🤝",
      places: "📍",
      events: "🎉",
      food: "🍲",
      travel: "🧳",
      other: "💭",
      voice: "🎙️",
    };

    return (
      icons[
        String(value || "").toLowerCase()
      ] || "🧠"
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

  return (
    <>
      <style>{`
        .memory-vault-page {
          min-height: 100vh;
          background: #faf5eb;
          padding: 96px 7% 45px;
          box-sizing: border-box;
          color: #2a2119;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        .memory-vault-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .memory-vault-brand {
          margin: 0 0 8px;
          color: #bd5b34;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .memory-vault-title {
          margin: 0 0 10px;
          color: #2a2119;
          font-size: 44px;
          line-height: 1.1;
        }

        .memory-vault-description {
          max-width: 720px;
          margin: 0 0 14px;
          color: #6e6153;
          font-size: 18px;
          line-height: 1.6;
        }

        .memory-vault-language {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 0 0 34px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #fbeee6;
          color: #9a4728;
          font-size: 14px;
          font-weight: 700;
        }

        .memory-vault-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 0.88fr)
            minmax(0, 1.12fr);
          gap: 25px;
          align-items: start;
        }

        .memory-vault-panel {
          background: #fffcf6;
          border: 1px solid #e6d9bf;
          border-radius: 20px;
          padding: 28px;
          min-width: 0;
        }

        .memory-vault-panel-title {
          margin: 0 0 7px;
          color: #2a2119;
          font-size: 22px;
        }

        .memory-vault-panel-description {
          margin: 0 0 22px;
          color: #948572;
          font-size: 14px;
          line-height: 1.5;
        }

        .memory-vault-field {
          display: grid;
          gap: 7px;
          margin-bottom: 19px;
        }

        .memory-vault-label {
          color: #9a4728;
          font-size: 13px;
          font-weight: 700;
        }

        .memory-vault-input {
          width: 100%;
          box-sizing: border-box;
          padding: 14px;
          border: 1px solid #e6d9bf;
          border-radius: 11px;
          background: #fffcf6;
          color: #2a2119;
          font: inherit;
          font-size: 16px;
        }

        .memory-vault-input::placeholder {
          color: #a89985;
        }

        .memory-vault-input:focus {
          outline: none;
          border-color: #bd5b34;
          box-shadow:
            0 0 0 3px
            rgba(87, 118, 95, .1);
        }

        .memory-vault-textarea {
          min-height: 150px;
          resize: vertical;
          line-height: 1.6;
        }

        .memory-vault-hint {
          margin: 6px 0 0;
          color: #948572;
          font-size: 12px;
          line-height: 1.5;
        }

        .memory-vault-save-button {
          width: 100%;
          min-height: 50px;
          padding: 14px 18px;
          border: none;
          border-radius: 12px;
          background: #bd5b34;
          color: #ffffff;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
        }

        .memory-vault-save-button:hover {
          filter: brightness(.96);
        }

        .memory-vault-save-button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        .memory-vault-message {
          margin: 15px 0 0;
          line-height: 1.5;
          font-weight: 700;
        }

        .memory-vault-message.success {
          color: #2f7a4d;
        }

        .memory-vault-message.error {
          color: #b3261e;
        }

        .memory-vault-saved-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .memory-vault-count {
          flex: 0 0 auto;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f2e9d8;
          color: #6e6153;
          font-size: 12px;
          font-weight: 700;
        }

        .memory-vault-memory-list {
          display: grid;
          gap: 14px;
        }

        .memory-vault-memory-card {
          padding: 20px;
          border: 1px solid #e6d9bf;
          border-radius: 18px;
          background: #fffcf6;
          transition:
            transform .18s ease,
            box-shadow .18s ease,
            border-color .18s ease;
        }

        .memory-vault-memory-card:hover {
          transform: translateY(-2px);
          border-color: #e6d9bf;
          box-shadow:
            0 10px 25px
            rgba(40, 53, 47, .06);
        }

        .memory-vault-memory-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 13px;
        }

        .memory-vault-memory-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          padding: 7px 10px;
          border-radius: 999px;
          background: #fbeee6;
          color: #9a4728;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .6px;
          text-transform: uppercase;
        }

        .memory-vault-memory-date {
          flex: 0 0 auto;
          color: #a89985;
          font-size: 11px;
          font-weight: 600;
        }

        .memory-vault-memory-title {
          margin: 0 0 9px;
          color: #2a2119;
          font-size: 23px;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        .memory-vault-memory-content {
          margin: 0 0 17px;
          color: #6e6153;
          font-size: 15px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .memory-vault-memory-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .memory-vault-memory-hint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #948572;
          font-size: 12px;
          font-weight: 600;
        }

        .memory-vault-game-button {
          min-height: 44px;
          padding: 11px 15px;
          border: none;
          border-radius: 10px;
          background: #bd5b34;
          color: #ffffff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
        }

        .memory-vault-game-button:hover {
          filter: brightness(.96);
        }

        .memory-vault-game-button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        .memory-vault-game {
          margin-top: 18px;
          padding: 18px;
          border: 1px solid #efe6d3;
          border-radius: 15px;
          background: #f5eeda;
        }

        .memory-vault-game-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .memory-vault-game-label {
          margin: 0 0 5px;
          color: #948572;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .8px;
        }

        .memory-vault-game-language {
          padding: 5px 8px;
          border-radius: 999px;
          background: #ffffff;
          color: #bd5b34;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .memory-vault-game-question {
          margin: 0 0 15px;
          color: #2a2119;
          font-size: 18px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .memory-vault-options {
          display: grid;
          gap: 9px;
        }

        .memory-vault-option {
          width: 100%;
          min-height: 48px;
          padding: 12px 13px;
          border-radius: 10px;
          color: #2a2119;
          font-size: 15px;
          cursor: pointer;
          text-align: left;
          font: inherit;
          transition:
            background .15s ease,
            border-color .15s ease;
        }

        .memory-vault-option:hover {
          border-color: #b8a888 !important;
          background: #f5eeda !important;
        }

        .memory-vault-game-message {
          margin: 14px 0 0;
          font-weight: 700;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .memory-vault-empty {
          padding: 28px 22px;
          border: 1px dashed #e6d9bf;
          border-radius: 16px;
          background: #f5eeda;
          color: #948572;
          line-height: 1.6;
          text-align: center;
        }

        .memory-vault-empty-icon {
          margin-bottom: 8px;
          font-size: 28px;
        }

        .memory-vault-loading {
          color: #bd5b34;
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .memory-vault-page {
            padding: 90px 5% 40px;
          }

          .memory-vault-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .memory-vault-page {
            padding: 70px 16px 35px;
          }

          .memory-vault-title {
            font-size: 34px;
          }

          .memory-vault-description {
            font-size: 16px;
          }

          .memory-vault-language {
            margin-bottom: 25px;
          }

          .memory-vault-panel {
            padding: 20px;
            border-radius: 18px;
          }

          .memory-vault-saved-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .memory-vault-memory-card {
            padding: 18px;
          }

          .memory-vault-memory-top {
            flex-direction: column;
            gap: 9px;
          }

          .memory-vault-memory-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .memory-vault-game-button {
            width: 100%;
          }

          .memory-vault-game-header {
            flex-direction: column;
          }

          .memory-vault-game-language {
            align-self: flex-start;
          }
        }

        @media (max-width: 390px) {
          .memory-vault-page {
            padding-left: 12px;
            padding-right: 12px;
          }

          .memory-vault-title {
            font-size: 32px;
          }

          .memory-vault-panel {
            padding: 18px;
          }
        }
      `}</style>

      <div className="memory-vault-page">
        <div className="memory-vault-container">
          <p className="memory-vault-brand">
            SMRITI AI · MEMORY VAULT
          </p>

          <h1 className="memory-vault-title">
            Memory Vault
          </h1>

          <p className="memory-vault-description">
            Preserve meaningful moments that can
            become personalized cognitive activities
            for your loved one.
          </p>

          <p className="memory-vault-language">
            🌐{" "}
            {loadingLanguage
              ? "Loading patient language..."
              : `Patient language: ${language}`}
          </p>

          <div className="memory-vault-layout">
            <div className="memory-vault-panel">
              <h2 className="memory-vault-panel-title">
                Add a Memory
              </h2>

              <p className="memory-vault-panel-description">
                Capture a familiar person, place,
                event, routine, or family moment.
              </p>

              <form onSubmit={saveMemory}>
                <div className="memory-vault-field">
                  <label
                    className="memory-vault-label"
                    htmlFor="memory-title"
                  >
                    Memory title
                  </label>

                  <input
                    id="memory-title"
                    className="memory-vault-input"
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value
                      )
                    }
                    placeholder="Family Wedding"
                    required
                  />
                </div>

                <div className="memory-vault-field">
                  <label
                    className="memory-vault-label"
                    htmlFor="memory-content"
                  >
                    Memory
                  </label>

                  <textarea
                    id="memory-content"
                    className="memory-vault-input memory-vault-textarea"
                    value={content}
                    onChange={(event) =>
                      setContent(
                        event.target.value
                      )
                    }
                    placeholder="Tell us about this memory..."
                    required
                  />
                </div>

                <div className="memory-vault-field">
                  <label
                    className="memory-vault-label"
                    htmlFor="memory-category"
                  >
                    Category
                  </label>

                  <select
                    id="memory-category"
                    className="memory-vault-input"
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target.value
                      )
                    }
                  >
                    <option value="family">
                      👨‍👩‍👧 Family
                    </option>

                    <option value="friends">
                      🤝 Friends
                    </option>

                    <option value="places">
                      📍 Places
                    </option>

                    <option value="events">
                      🎉 Events
                    </option>

                    <option value="food">
                      🍲 Food
                    </option>

                    <option value="travel">
                      🧳 Travel
                    </option>

                    <option value="other">
                      💭 Other
                    </option>
                  </select>
                </div>

                <div className="memory-vault-field">
                  <label
                    className="memory-vault-label"
                    htmlFor="memory-sequence-steps"
                  >
                    Order of events (optional, for Memory Sequence)
                  </label>

                  <textarea
                    id="memory-sequence-steps"
                    className="memory-vault-input memory-vault-textarea"
                    value={sequenceStepsText}
                    onChange={(event) =>
                      setSequenceStepsText(
                        event.target.value
                      )
                    }
                    placeholder={
                      "One step per line, in order, e.g.:\nInvitation arrives\nTravel to Jaipur\nWedding celebration"
                    }
                    rows={3}
                    style={{ minHeight: "90px" }}
                  />

                  <p className="memory-vault-hint">
                    Add 3 familiar steps in the order they happened.
                    This powers the Memory Sequence game for this
                    memory. Leave blank to skip.
                  </p>
                </div>

                <button
                  type="submit"
                  className="memory-vault-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving memory..."
                    : "Save Memory"}
                </button>
              </form>

              {message && (
                <p
                  className={`memory-vault-message ${
                    message.startsWith("✓")
                      ? "success"
                      : "error"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>

            <div>
              <div className="memory-vault-saved-header">
                <div>
                  <h2 className="memory-vault-panel-title">
                    Saved Memories
                  </h2>

                  <p
                    className="memory-vault-panel-description"
                    style={{
                      marginBottom: 0,
                    }}
                  >
                    Each memory can become a
                    personalized therapy activity.
                  </p>
                </div>

                {!loading &&
                  memories.length > 0 && (
                    <span className="memory-vault-count">
                      {memories.length}{" "}
                      {memories.length === 1
                        ? "memory"
                        : "memories"}
                    </span>
                  )}
              </div>

              {loading ? (
                <p className="memory-vault-loading">
                  Loading memories...
                </p>
              ) : memories.length === 0 ? (
                <div className="memory-vault-empty">
                  <div className="memory-vault-empty-icon">
                    🧠
                  </div>

                  <strong>
                    No memories added yet.
                  </strong>

                  <div>
                    Add the first meaningful
                    memory using the form.
                  </div>
                </div>
              ) : (
                <div className="memory-vault-memory-list">
                  {memories.map((memory) => {
                    const game =
                      games[memory.id];

                    const gameMessage =
                      gameMessages[memory.id];

                    const categoryLabel =
                      getCategoryLabel(
                        memory.category
                      );

                    const categoryIcon =
                      getCategoryIcon(
                        memory.category
                      );

                    const memoryDate =
                      getMemoryDate(memory);

                    return (
                      <div
                        className="memory-vault-memory-card"
                        key={memory.id}
                      >
                        <div className="memory-vault-memory-top">
                          <span className="memory-vault-memory-category">
                            <span>
                              {categoryIcon}
                            </span>

                            <span>
                              {categoryLabel}
                            </span>
                          </span>

                          {memoryDate && (
                            <span className="memory-vault-memory-date">
                              {memoryDate}
                            </span>
                          )}
                        </div>

                        <h3 className="memory-vault-memory-title">
                          {memory.title}
                        </h3>

                        <p className="memory-vault-memory-content">
                          {getMemoryPreview(
                            memory.content
                          )}
                        </p>

                        {!game && (
                          <div className="memory-vault-memory-footer">
                            <span className="memory-vault-memory-hint">
                              🧠 Turn this memory
                              into a therapy
                              activity
                            </span>

                            <button
                              type="button"
                              className="memory-vault-game-button"
                              onClick={() =>
                                generateGame(
                                  memory.id
                                )
                              }
                              disabled={
                                gameLoading ===
                                  memory.id ||
                                loadingLanguage
                              }
                            >
                              {gameLoading ===
                              memory.id
                                ? "Creating game..."
                                : loadingLanguage
                                ? "Loading language..."
                                : "Create Therapy Game →"}
                            </button>
                          </div>
                        )}

                        {!game && gameMessage && (
                          <p
                            className="memory-vault-message error"
                            style={{
                              marginTop: "14px",
                            }}
                          >
                            {gameMessage}
                          </p>
                        )}

                        {game && (
                          <div className="memory-vault-game">
                            <div className="memory-vault-game-header">
                              <div>
                                <p className="memory-vault-game-label">
                                  Personalized Game
                                </p>

                                <p
                                  style={{
                                    margin: 0,
                                    color: "#bd5b34",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                  }}
                                >
                                  Created from this
                                  memory
                                </p>
                              </div>

                              <span className="memory-vault-game-language">
                                🌐 {language}
                              </span>
                            </div>

                            <h4 className="memory-vault-game-question">
                              {game.question}
                            </h4>

                            <div className="memory-vault-options">
                              {Array.isArray(
                                game.options
                              ) &&
                                game.options.map(
                                  (
                                    option,
                                    index
                                  ) => (
                                    <button
                                      type="button"
                                      className="memory-vault-option"
                                      key={`${memory.id}-${index}`}
                                      onClick={() =>
                                        checkAnswer(
                                          memory.id,
                                          option
                                        )
                                      }
                                      style={{
                                        border:
                                          game.selectedAnswer ===
                                          option
                                            ? "2px solid #bd5b34"
                                            : "1px solid #e6d9bf",
                                        background:
                                          game.selectedAnswer ===
                                          option
                                            ? "#fbeee6"
                                            : "#fffcf6",
                                      }}
                                    >
                                      {option}
                                    </button>
                                  )
                                )}
                            </div>

                            {gameMessage && (
                              <p
                                className="memory-vault-game-message"
                                style={{
                                  color:
                                    gameMessage.startsWith("✓") ? "#2f7a4d" : "#b3261e",
                                }}
                              >
                                {gameMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MemoryVault;
