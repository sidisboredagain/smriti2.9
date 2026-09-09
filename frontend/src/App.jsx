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
            primary: "#3f6f93",
            primaryDark: "#325a78",
            secondary: "#2f4a3d",
            soft: "#e9f0f6",
            softBorder: "#cfe0ea",
            softText: "#325a78",
            logoBg: "#dbe8f0",
            shadow: "rgba(63, 111, 147, 0.24)",
          },

          green: {
            primary: "#bd5b34",
            primaryDark: "#9a4728",
            secondary: "#2f4a3d",
            soft: "#fbeee6",
            softBorder: "#f0dbc8",
            softText: "#9a4728",
            logoBg: "#f3ddce",
            shadow: "rgba(189, 91, 52, 0.28)",
          },

          purple: {
            primary: "#7a5a8f",
            primaryDark: "#63477a",
            secondary: "#2f4a3d",
            soft: "#f1ebf5",
            softBorder: "#ddccea",
            softText: "#63477a",
            logoBg: "#e6dced",
            shadow: "rgba(122, 90, 143, 0.24)",
          },

          pink: {
            primary: "#b5605f",
            primaryDark: "#954b4a",
            secondary: "#2f4a3d",
            soft: "#f8e9e8",
            softBorder: "#ecd2d1",
            softText: "#954b4a",
            logoBg: "#f0dad9",
            shadow: "rgba(181, 96, 95, 0.24)",
          },

          orange: {
            primary: "#c17a2e",
            primaryDark: "#9c6224",
            secondary: "#2f4a3d",
            soft: "#faeedd",
            softBorder: "#eeddbc",
            softText: "#9c6224",
            logoBg: "#f4e2c4",
            shadow: "rgba(193, 122, 46, 0.26)",
          },

          yellow: {
            primary: "#a8873c",
            primaryDark: "#8d712f",
            secondary: "#2f4a3d",
            soft: "#f8f2df",
            softBorder: "#eadfbd",
            softText: "#8d712f",
            logoBg: "#f1e8c9",
            shadow: "rgba(168, 135, 60, 0.24)",
          },

          red: {
            primary: "#af4a34",
            primaryDark: "#8e3a28",
            secondary: "#2f4a3d",
            soft: "#f8e6e1",
            softBorder: "#eccec5",
            softText: "#8e3a28",
            logoBg: "#f1d8cf",
            shadow: "rgba(175, 74, 52, 0.26)",
          },

          teal: {
            primary: "#3f7a70",
            primaryDark: "#33625a",
            secondary: "#2f4a3d",
            soft: "#e7f2ef",
            softBorder: "#cde3dd",
            softText: "#33625a",
            logoBg: "#d9ece7",
            shadow: "rgba(63, 122, 112, 0.24)",
          },

          brown: {
            primary: "#826b58",
            primaryDark: "#6c5747",
            secondary: "#2f4a3d",
            soft: "#f4efe9",
            softBorder: "#e4dacf",
            softText: "#6c5747",
            logoBg: "#e9dfd3",
            shadow: "rgba(130, 107, 88, 0.24)",
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
            background: "var(--surface, #fffcf6)",
            color: "var(--brand-soft-text)",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow:
              "0 6px 16px rgba(42, 33, 25, 0.08)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 10px 22px rgba(42, 33, 25, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 6px 16px rgba(42, 33, 25, 0.08)";
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
        <div className="hero-content fade-up">
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

        <div
          className="memory-card fade-up"
          style={{ animationDelay: "0.12s" }}
        >
          <div className="memory-icon">
            🌸
          </div>

          <p className="memory-label">
            A precious memory
          </p>

          <h3>Family Wedding</h3>

          <p className="memory-text">
            "A beautiful day with the whole family in Jaipur."
          </p>

          <div className="memory-tags">
            <span>Family</span>
            <span>Jaipur</span>
            <span>Wedding</span>
          </div>
        </div>
      </main>

      <section className="features">
        <div className="feature fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="feature-icon">📖</div>

          <h3>Memory Vault</h3>

          <p>
            Store meaningful stories, people, places, and
            moments.
          </p>
        </div>

        <div className="feature fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="feature-icon">🎯</div>

          <h3>Personalized Games</h3>

          <p>
            Turn familiar memories into gentle cognitive
            exercises.
          </p>
        </div>

        <div className="feature fade-up" style={{ animationDelay: "0.25s" }}>
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
