import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { applyPatientTheme } from "../../lib/theme";

export const API_URL = "http://127.0.0.1:8000";
export const PATIENT_ID = 1;

const PatientContext = createContext(null);

function getAuthHeaders() {
  const token = localStorage.getItem("smriti_token");

  if (!token) {
    throw new Error("Please sign in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

// Everything the patient app's screens need about "who is this patient
// right now" lives here, fetched once and shared, so every screen agrees
// on the same name/language/theme/comfort memory without each page
// re-fetching it separately.
function PatientProvider({ children, onAuthError }) {
  const [patient, setPatient] = useState(null);
  const [comfortMemory, setComfortMemory] = useState(null);
  const [comfortPool, setComfortPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/patients/${PATIENT_ID}`,
        { headers: getAuthHeaders() }
      );

      if (response.status === 401) {
        onAuthError?.();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load your profile."
        );
      }

      setPatient(data);
      applyPatientTheme(data.favorite_color);

      let designatedComfortMemory = null;

      if (data.comfort_memory_id) {
        try {
          const memoryResponse = await fetch(
            `${API_URL}/memories/${data.comfort_memory_id}`,
            { headers: getAuthHeaders() }
          );

          if (memoryResponse.ok) {
            designatedComfortMemory = await memoryResponse.json();
            setComfortMemory(designatedComfortMemory);
          }
        } catch {
          // A missing linked memory just means Comfort Mode falls back
          // to the plain text description below -- not worth failing
          // the whole page load over.
        }
      }

      // Build a small pool of "comforting" memories -- the caregiver's
      // specifically designated one (if any) plus any other memory that
      // has a real photo or voice recording attached, since those are
      // exactly the personal, familiar items Comfort Mode is meant to
      // show. Having more than one candidate lets Comfort Mode avoid
      // showing the identical item every single time it's triggered
      // within a session.
      try {
        const memoriesResponse = await fetch(
          `${API_URL}/memories/?patient_id=${PATIENT_ID}&limit=100`,
          { headers: getAuthHeaders() }
        );

        if (memoriesResponse.ok) {
          const allMemories = await memoriesResponse.json();
          const withMedia = allMemories.filter(
            (memory) => memory.image_url || memory.audio_url
          );

          const pool = designatedComfortMemory
            ? [
                designatedComfortMemory,
                ...withMedia.filter(
                  (memory) => memory.id !== designatedComfortMemory.id
                ),
              ]
            : withMedia;

          setComfortPool(pool);
        }
      } catch {
        // Comfort Mode still works from the single designated memory
        // (or the plain text fallback) if this extra pool can't load.
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  // Picks a comfort item to show, preferring one that isn't the same as
  // whatever was shown last (when there's a real choice to make).
  const pickComfortItem = useCallback(
    (excludeId) => {
      if (comfortPool.length === 0) {
        return comfortMemory;
      }

      const choices = comfortPool.filter(
        (memory) => memory.id !== excludeId
      );

      const pickFrom = choices.length > 0 ? choices : comfortPool;

      return pickFrom[Math.floor(Math.random() * pickFrom.length)];
    },
    [comfortPool, comfortMemory]
  );

  const value = {
    patient,
    comfortMemory,
    comfortPool,
    pickComfortItem,
    loading,
    error,
    reload: load,
    getAuthHeaders,
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
}

function usePatient() {
  const context = useContext(PatientContext);

  if (!context) {
    throw new Error("usePatient must be used inside PatientProvider");
  }

  return context;
}

export { PatientProvider, usePatient };
