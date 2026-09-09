import { API_URL } from "../context/PatientContext";

// Shared "read this out loud" helper for the patient app, reusing the
// same public GET /tts/speak endpoint the caregiver's Therapy screen
// already calls. Kept as a plain async function (not a hook) so it can
// be used from anywhere -- a button's onClick, an effect, etc.
export async function speakText(text, language, getAuthHeaders) {
  if (!text) {
    return;
  }

  const response = await fetch(
    `${API_URL}/tts/speak?text=${encodeURIComponent(
      text
    )}&language=${encodeURIComponent(language || "English")}`,
    getAuthHeaders ? { headers: getAuthHeaders() } : undefined
  );

  if (!response.ok) {
    throw new Error("Could not play the audio right now.");
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  audio.onended = () => URL.revokeObjectURL(audioUrl);
  audio.onerror = () => URL.revokeObjectURL(audioUrl);

  await audio.play();
}
