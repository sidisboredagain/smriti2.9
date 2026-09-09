import { useEffect, useRef, useState } from "react";

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
    <>
      <style>{`
        .voice-memory-page {
          min-height: 100vh;
          background: #faf5eb;
          padding: 96px 7% 45px;
          box-sizing: border-box;
          color: #2a2119;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        .voice-memory-container {
          max-width: 820px;
          margin: 0 auto;
          text-align: center;
        }

        .voice-memory-brand {
          margin: 0 0 8px;
          color: #bd5b34;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .voice-memory-title {
          margin: 0 0 12px;
          color: #2a2119;
          font-size: 44px;
          line-height: 1.1;
        }

        .voice-memory-description {
          max-width: 650px;
          margin: 0 auto 20px;
          color: #6e6153;
          font-size: 18px;
          line-height: 1.7;
        }

        .voice-memory-language {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 0 auto 28px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #fbeee6;
          color: #9a4728;
          font-size: 14px;
          font-weight: 700;
        }

        .voice-memory-card {
          padding: 46px 36px;
          border: 1px solid #e6d9bf;
          border-radius: 24px;
          background: #fffcf6;
          box-shadow:
            0 18px 50px
            rgba(48, 59, 52, .08);
        }

        .voice-memory-icon-wrap {
          position: relative;
          width: 110px;
          height: 110px;
          margin: 0 auto 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f2e9d8;
        }

        .voice-memory-icon {
          font-size: 60px;
          line-height: 1;
        }

        .voice-memory-card-title {
          margin: 0 0 10px;
          color: #2a2119;
          font-size: 28px;
          line-height: 1.25;
        }

        .voice-memory-card-description {
          max-width: 560px;
          margin: 0 auto 26px;
          color: #6e6153;
          font-size: 16px;
          line-height: 1.65;
        }

        .voice-memory-example {
          margin: 0 auto 27px;
          padding: 14px 18px;
          max-width: 570px;
          border-radius: 13px;
          background: #f5eeda;
          color: #bd5b34;
          font-size: 15px;
          line-height: 1.6;
        }

        .voice-memory-example-label {
          display: block;
          margin-bottom: 5px;
          color: #948572;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .8px;
        }

        .voice-memory-primary-button {
          min-width: 210px;
          min-height: 52px;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          background: #bd5b34;
          color: #ffffff;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          transition:
            transform .15s ease,
            filter .15s ease;
        }

        .voice-memory-primary-button:hover {
          filter: brightness(.96);
          transform: translateY(-1px);
        }

        .voice-memory-primary-button:disabled {
          cursor: not-allowed;
          opacity: .65;
          transform: none;
        }

        .voice-memory-stop-button {
          background: #b3261e;
        }

        .voice-memory-stop-button:hover {
          filter: brightness(.96);
        }

        .voice-memory-recording-area {
          margin-top: 4px;
        }

        .voice-memory-recording-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px 13px;
          border-radius: 999px;
          background: #f8dedc;
          color: #b3261e;
          font-size: 13px;
          font-weight: 700;
        }

        .voice-memory-recording-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #b3261e;
          animation:
            voice-memory-pulse
            1.2s ease-in-out infinite;
        }

        @keyframes voice-memory-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: .45;
            transform: scale(.78);
          }
        }

        .voice-memory-timer {
          margin: 0 0 18px;
          color: #2a2119;
          font-size: 30px;
          font-weight: 700;
          letter-spacing: 1px;
          font-variant-numeric: tabular-nums;
        }

        .voice-memory-processing {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          color: #bd5b34;
          font-weight: 700;
        }

        .voice-memory-processing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #bd5b34;
          animation:
            voice-memory-processing
            1s infinite;
        }

        @keyframes voice-memory-processing {
          0%,
          100% {
            opacity: .3;
          }

          50% {
            opacity: 1;
          }
        }

        .voice-memory-message {
          max-width: 620px;
          margin: 23px auto 0;
          padding: 12px 15px;
          border-radius: 11px;
          color: #6e6153;
          background: #f5eeda;
          line-height: 1.5;
          font-size: 14px;
          font-weight: 700;
        }

        .voice-memory-message.success {
          color: #2f7a4d;
          background: #e3f0e6;
        }

        .voice-memory-transcript {
          max-width: 640px;
          margin: 24px auto 0;
          padding: 20px;
          border: 1px solid #efe6d3;
          border-radius: 15px;
          background: #f5eeda;
          text-align: left;
        }

        .voice-memory-transcript-label {
          margin: 0 0 8px;
          color: #948572;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .8px;
        }

        .voice-memory-transcript-text {
          margin: 0;
          color: #2a2119;
          font-size: 17px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .voice-memory-help {
          margin: 25px 0 0;
          color: #948572;
          font-size: 12px;
          line-height: 1.5;
        }

        @media (max-width: 600px) {
          .voice-memory-page {
            padding: 70px 16px 35px;
          }

          .voice-memory-title {
            font-size: 34px;
          }

          .voice-memory-description {
            font-size: 16px;
          }

          .voice-memory-card {
            padding: 35px 20px;
            border-radius: 20px;
          }

          .voice-memory-card-title {
            font-size: 25px;
          }

          .voice-memory-primary-button {
            width: 100%;
          }

          .voice-memory-icon-wrap {
            width: 92px;
            height: 92px;
          }

          .voice-memory-icon {
            font-size: 50px;
          }
        }

        @media (max-width: 390px) {
          .voice-memory-page {
            padding-left: 12px;
            padding-right: 12px;
          }

          .voice-memory-title {
            font-size: 32px;
          }

          .voice-memory-card {
            padding: 30px 18px;
          }
        }
      `}</style>

      <div className="voice-memory-page">
        <div className="voice-memory-container">
          <p className="voice-memory-brand">
            SMRITI AI · VOICE MEMORY
          </p>

          <h1 className="voice-memory-title">
            Voice Memory
          </h1>

          <p className="voice-memory-description">
            Speak naturally about a meaningful memory.
            Smriti AI turns your voice into a saved
            memory that can later support personalized
            cognitive activities.
          </p>

          <p className="voice-memory-language">
            🌐{" "}
            {loadingLanguage
              ? "Loading patient language..."
              : `Patient language: ${language}`}
          </p>

          <div className="voice-memory-card">
            <div
              className="voice-memory-icon-wrap"
              aria-hidden="true"
            >
              <span className="voice-memory-icon">
                🎙️
              </span>
            </div>

            <h2 className="voice-memory-card-title">
              {recording
                ? "Listening to your memory"
                : saving
                ? "Saving your memory"
                : "Record a memory"}
            </h2>

            <p className="voice-memory-card-description">
              {recording
                ? "Take your time. Speak naturally about a familiar person, place, event, or meaningful moment."
                : saving
                ? "Your recording is being transcribed and saved for personalized cognitive care."
                : "A simple voice recording can become a meaningful memory in the patient's Memory Vault."}
            </p>

            {!recording &&
              !saving && (
                <div className="voice-memory-example">
                  <span className="voice-memory-example-label">
                    Try saying
                  </span>

                  <strong>
                    “My daughter&apos;s wedding was in Jaipur.”
                  </strong>
                </div>
              )}

            {recording && (
              <div className="voice-memory-recording-area">
                <div className="voice-memory-recording-status">
                  <span className="voice-memory-recording-dot" />
                  Recording
                </div>

                <p className="voice-memory-timer">
                  {formatRecordingTime(
                    recordingSeconds
                  )}
                </p>
              </div>
            )}

            {!recording ? (
              <button
                type="button"
                className="voice-memory-primary-button"
                onClick={startRecording}
                disabled={
                  saving ||
                  loadingLanguage
                }
              >
                {saving
                  ? "Processing..."
                  : loadingLanguage
                  ? "Loading..."
                  : "🎙 Start Recording"}
              </button>
            ) : (
              <button
                type="button"
                className="voice-memory-primary-button voice-memory-stop-button"
                onClick={stopRecording}
              >
                ■ Stop Recording
              </button>
            )}

            {saving && (
              <div className="voice-memory-processing">
                <span className="voice-memory-processing-dot" />
                Processing your voice memory...
                <span className="voice-memory-processing-dot" />
              </div>
            )}

            {message && (
              <p
                className={`voice-memory-message ${
                  isSuccess
                    ? "success"
                    : ""
                }`}
              >
                {message}
              </p>
            )}

            {transcript && (
              <div className="voice-memory-transcript">
                <p className="voice-memory-transcript-label">
                  Transcribed memory
                </p>

                <p className="voice-memory-transcript-text">
                  {transcript}
                </p>
              </div>
            )}

            <p className="voice-memory-help">
              Speak in the patient&apos;s preferred
              language. Your recording is converted
              into text and saved as a memory.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default VoiceMemory; 
