import { useCallback, useState } from "react";

import Login from "../pages/Login";
import { PatientProvider, usePatient } from "./context/PatientContext";
import PatientHome from "./pages/PatientHome";
import PatientPlay from "./pages/PatientPlay";
import PatientRemember from "./pages/PatientRemember";
import PatientMemories from "./pages/PatientMemories";
import PatientComfort from "./pages/PatientComfort";

// The patient app's own tiny screen-switcher, matching the same simple
// useState pattern the caregiver app (App.jsx) already uses -- there's no
// need for nested URL routes inside a kiosk-style, one-screen-at-a-time
// experience like this one.
function PatientScreens() {
  const [screen, setScreen] = useState("home");
  const { loading, error } = usePatient();

  const goHome = () => setScreen("home");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-xl font-bold text-primary">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-xl font-bold text-destructive">{error}</p>
      </div>
    );
  }

  if (screen === "play") {
    return <PatientPlay onHome={goHome} />;
  }

  if (screen === "remember") {
    return <PatientRemember onHome={goHome} />;
  }

  if (screen === "memories") {
    return <PatientMemories onHome={goHome} />;
  }

  if (screen === "comfort") {
    return <PatientComfort onHome={goHome} />;
  }

  return <PatientHome onNavigate={setScreen} />;
}

// A patient with dementia should never be asked to sign in. In practice a
// caregiver signs in once on a shared tablet and this screen is never
// seen again until the token above is cleared (e.g. by an auth error).
function PatientApp() {
  const [authed, setAuthed] = useState(() =>
    Boolean(localStorage.getItem("smriti_token"))
  );

  const handleAuthError = useCallback(() => {
    localStorage.removeItem("smriti_token");
    setAuthed(false);
  }, []);

  if (!authed) {
    return <Login onLoginSuccess={() => setAuthed(true)} />;
  }

  return (
    <PatientProvider onAuthError={handleAuthError}>
      <PatientScreens />
    </PatientProvider>
  );
}

export default PatientApp;
