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

      if (data.comfort_memory_id) {
        try {
          const memoryResponse = await fetch(
            `${API_URL}/memories/${data.comfort_memory_id}`,
            { headers: getAuthHeaders() }
          );

          if (memoryResponse.ok) {
            setComfortMemory(await memoryResponse.json());
          }
        } catch {
          // A missing linked memory just means Comfort Mode falls back
          // to the plain text description below -- not worth failing
          // the whole page load over.
        }
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

  const value = {
    patient,
    comfortMemory,
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
