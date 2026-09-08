import React, { useEffect, useState } from "react";
import "./App.css";
import Therapy from "./pages/Therapy";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemoryVault from "./pages/MemoryVault";
import VoiceMemory from "./pages/VoiceMemory";
import PatientProfile from "./pages/PatientProfile";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function App() {
  const [page, setPage] = useState("home");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("smriti_token");

    if (!token) {
      return;
    }

    const loadPatientPreferences = async () => {
      try {
        const response = await fetch(
          `${API_URL}/patients/${PATIENT_ID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const patient = await response.json();
        const favoriteColor = String(
          patient.favorite_color || ""
        )
          .trim()
          .toLowerCase();

        const themes = {
          blue: {
            primary: "#5579a8",
            primaryDark: "#45678f",
            secondary: "#6d8fb8",
            soft: "#edf3fb",
            softBorder: "#d7e3f2",
            softText: "#45678f",
            logoBg: "#e1ebf7",
            shadow: "rgba(85, 121, 168, 0.22)",
          },

          green: {
            primary: "#57765f",
            primaryDark: "#48664f",
            secondary: "#6c8b73",
            soft: "#edf3ed",
            softBorder: "#d5e2d6",
            softText: "#46634f",
            logoBg: "#dfe9df",
            shadow: "rgba(87, 118, 95, 0.2)",
          },

          purple: {
            primary: "#78648f",
            primaryDark: "#654f7a",
            secondary: "#927ca8",
            soft: "#f2eef6",
            softBorder: "#e2d9ea",
            softText: "#654f7a",
            logoBg: "#e9e1ef",
            shadow: "rgba(120, 100, 143, 0.2)",
          },

          pink: {
            primary: "#b46d83",
            primaryDark: "#99566b",
            secondary: "#c78499",
            soft: "#faeef2",
            softBorder: "#ecd7df",
            softText: "#99566b",
            logoBg: "#f3e1e7",
            shadow: "rgba(180, 109, 131, 0.2)",
          },

          orange: {
            primary: "#b9784f",
            primaryDark: "#9d603d",
            secondary: "#c58b65",
            soft: "#faf0e9",
            softBorder: "#ecdacd",
            softText: "#9d603d",
            logoBg: "#f3e2d6",
            shadow: "rgba(185, 120, 79, 0.2)",
          },

          yellow: {
            primary: "#a8873c",
            primaryDark: "#8d712f",
            secondary: "#b99b51",
            soft: "#f8f2df",
            softBorder: "#eadfbd",
            softText: "#8d712f",
            logoBg: "#f1e8c9",
            shadow: "rgba(168, 135, 60, 0.2)",
          },

          red: {
            primary: "#a85d5d",
            primaryDark: "#8e4949",
            secondary: "#bb7474",
            soft: "#faeeee",
            softBorder: "#edd7d7",
            softText: "#8e4949",
            logoBg: "#f1dddd",
            shadow: "rgba(168, 93, 93, 0.2)",
          },

          teal: {
            primary: "#4f7d7a",
            primaryDark: "#416764",
            secondary: "#679491",
            soft: "#ebf4f3",
            softBorder: "#d3e4e2",
            softText: "#416764",
            logoBg: "#dceae8",
            shadow: "rgba(79, 125, 122, 0.2)",
          },

          brown: {
            primary: "#826b58",
            primaryDark: "#6c5747",
            secondary: "#9a816b",
            soft: "#f4efe9",
            softBorder: "#e4dacf",
            softText: "#6c5747",
            logoBg: "#e9dfd3",
            shadow: "rgba(130, 107, 88, 0.2)",
          },
        };

        const theme = themes[favoriteColor] || themes.green;

        const root = document.documentElement;

        root.style.setProperty(
          "--brand-primary",
          theme.primary
        );

        root.style.setProperty(
          "--brand-primary-dark",
          theme.primaryDark
        );

        root.style.setProperty(
          "--brand-secondary",
          theme.secondary
        );

        root.style.setProperty(
          "--brand-soft",
          theme.soft
        );

        root.style.setProperty(
          "--brand-soft-border",
          theme.softBorder
        );

        root.style.setProperty(
          "--brand-soft-text",
          theme.softText
        );

        root.style.setProperty(
          "--logo-bg",
          theme.logoBg
        );

        root.style.setProperty(
          "--shadow-button",
          theme.shadow
        );
      } catch {
        // Keep the default Smriti AI theme if preferences cannot be loaded.
      }
    };

    loadPatientPreferences();
  }, []);

  const isAuthenticated = () => {
    return Boolean(localStorage.getItem("smriti_token"));
  };

  const goToPage = (nextPage) => {
    const protectedPages = [
      "therapy",
      "dashboard",
      "memory-vault",
      "voice-memory",
      "patient-profile",
    ];

    if (protectedPages.includes(nextPage) && !isAuthenticated()) {
      setPage("login");
      return;
    }

    setPage(nextPage);
  };

  const handleLogout = () => {
    localStorage.removeItem("smriti_token");
    setPage("login");
  };

  const handleLoginSuccess = () => {
    setPage("dashboard");
  };

  const renderOfflineBanner = () => {
    if (isOnline) {
      return null;
    }

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5000,
          padding: "10px 16px",
          background: "#fff1d8",
          borderBottom: "1px solid #e4c98c",
          color: "#6d5420",
          textAlign: "center",
          fontSize: "14px",
          fontWeight: "700",
          boxShadow:
            "0 4px 12px rgba(48, 59, 52, 0.08)",
        }}
      >
        📴 You are offline. Cached app content is available, but
        some caregiver features need an internet connection.
      </div>
    );
  };

  const renderPageWithBackButton = (
    component,
    backPage = "home",
    backLabel = "Back"
  ) => {
    return (
      <div
        style={{
          minHeight: "100vh",
          position: "relative",
        }}
      >
        {renderOfflineBanner()}

        <button
          onClick={() => goToPage(backPage)}
          style={{
            position: "fixed",
            top: isOnline ? "20px" : "58px",
            left: "20px",
            zIndex: 1000,
            padding: "11px 16px",
            border: "1px solid var(--brand-primary)",
            borderRadius: "10px",
            background: "#fffdf9",
            color: "var(--brand-soft-text)",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow:
              "0 6px 16px rgba(48, 59, 52, 0.08)",
          }}
        >
          ← {backLabel}
        </button>

        {component}
      </div>
    );
  };

  const protectedPages = [
    "therapy",
    "dashboard",
    "memory-vault",
    "voice-memory",
    "patient-profile",
  ];

  if (
    protectedPages.includes(page) &&
    !isAuthenticated()
  ) {
    return (
      <>
        {renderOfflineBanner()}
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  if (page === "therapy") {
    return renderPageWithBackButton(
      <Therapy />,
      "home",
      "Home"
    );
  }

  if (page === "login") {
    return (
      <>
        {renderOfflineBanner()}
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  if (page === "dashboard") {
    return renderPageWithBackButton(
      <Dashboard
        onOpenMemoryVault={() =>
          goToPage("memory-vault")
        }
        onOpenVoiceMemory={() =>
          goToPage("voice-memory")
        }
        onOpenPatientProfile={() =>
          goToPage("patient-profile")
        }
        onLogout={handleLogout}
      />,
      "home",
      "Home"
    );
  }

  if (page === "memory-vault") {
    return renderPageWithBackButton(
      <MemoryVault />,
      "dashboard",
      "Dashboard"
    );
  }

  if (page === "voice-memory") {
    return renderPageWithBackButton(
      <VoiceMemory />,
      "dashboard",
      "Dashboard"
    );
  }

  if (page === "patient-profile") {
    return renderPageWithBackButton(
      <PatientProfile />,
      "dashboard",
      "Dashboard"
    );
  }

  return (
    <div className="app">
      {renderOfflineBanner()}

      <header
        className="navbar"
        style={{
          paddingTop: isOnline ? undefined : "48px",
        }}
      >
        <div className="brand">
          <div className="brand-logo">
            स्मृति
          </div>

          <div>
            <h1>Smriti AI</h1>
            <span>
              Memory-powered dementia care
            </span>
          </div>
        </div>

        <button
          className="login-button"
          onClick={() => goToPage("login")}
        >
          Caregiver Login
        </button>
      </header>

      <main className="hero-section">
        <div className="hero-content">
          <div className="badge">
            🧠 Personalized cognitive care
          </div>

          <h2>
            Memories that matter.
            <br />
            <span>Care that remembers.</span>
          </h2>

          <p>
            Smriti AI transforms a person's own memories into
            personalized cognitive activities, helping
            caregivers support meaningful, familiar therapy.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="primary-button"
              onClick={() => goToPage("therapy")}
            >
              Start a Therapy Session →
            </button>

            <button
              className="login-button"
              onClick={() => goToPage("memory-vault")}
            >
              Open Memory Vault
            </button>

            <button
              className="login-button"
              onClick={() => goToPage("voice-memory")}
            >
              Record a Voice Memory
            </button>
          </div>
        </div>

        <div className="memory-card">
          <div className="memory-icon">
            🌸
          </div>

          <p className="memory-label">
            A precious memory
          </p>

          <h3>Family Wedding</h3>

          <p className="memory-text">
            “A beautiful day with the whole family in Jaipur.”
          </p>

          <div className="memory-tags">
            <span>Family</span>
            <span>Jaipur</span>
            <span>Wedding</span>
          </div>
        </div>
      </main>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">📖</div>

          <h3>Memory Vault</h3>

          <p>
            Store meaningful stories, people, places, and
            moments.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">🎯</div>

          <h3>Personalized Games</h3>

          <p>
            Turn familiar memories into gentle cognitive
            exercises.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">👨‍👩‍👧</div>

          <h3>Caregiver Support</h3>

          <p>
            Track progress and understand each therapy
            session.
          </p>
        </div>
      </section>
    </div>
  );
}

export default App;