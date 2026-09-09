import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Heart, Sparkles, Target, Users, WifiOff } from "lucide-react";

import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import GradientBackdrop from "./components/GradientBackdrop";
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
      <div className="fixed inset-x-0 top-0 z-[5000] flex items-center justify-center gap-2 border-b border-warning-soft-border bg-warning-soft px-4 py-2.5 text-center text-sm font-bold text-warning shadow-brand-sm">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        You are offline. Cached app content is available, but some caregiver
        features need an internet connection.
      </div>
    );
  };

  const renderPageWithBackButton = (
    component,
    backPage = "home",
    backLabel = "Back"
  ) => {
    return (
      <div className="relative min-h-screen">
        {renderOfflineBanner()}

        <Button
          variant="outline"
          onClick={() => goToPage(backPage)}
          className={`fixed left-5 z-[1000] bg-card shadow-brand-sm ${
            isOnline ? "top-5" : "top-[58px]"
          }`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Button>

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
    <div className="min-h-screen">
      {renderOfflineBanner()}

      <header
        className={`flex w-full items-center justify-between gap-5 border-b border-border bg-card px-[7%] py-5 ${
          isOnline ? "" : "pt-12"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-logo font-heading text-xl font-bold text-accent-foreground">
            स्मृति
          </div>

          <div>
            <h1 className="text-2xl tracking-tight text-foreground">
              Smriti AI
            </h1>
            <span className="mt-1 block text-[13px] text-faint">
              Memory-powered dementia care
            </span>
          </div>
        </div>

        <Button variant="outline" onClick={() => goToPage("login")}>
          Caregiver Login
        </Button>
      </header>

      <main className="relative mx-auto grid w-[86%] max-w-[1150px] grid-cols-1 items-center gap-10 overflow-hidden py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-[70px] lg:py-24">
        <div className="min-w-0 max-w-[650px] animate-fade-up">
          <Badge variant="accent" className="mb-6">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Personalized cognitive care
          </Badge>

          <h2 className="max-w-full text-[clamp(2.6rem,6vw,4.25rem)] leading-[1.05] tracking-tight text-foreground">
            Memories that matter.
            <br />
            <span className="text-secondary">Care that remembers.</span>
          </h2>

          <p className="mt-6 mb-8 max-w-[590px] text-lg leading-relaxed text-muted-foreground">
            Smriti AI transforms a person&apos;s own memories into
            personalized cognitive activities, helping caregivers support
            meaningful, familiar therapy.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => goToPage("therapy")}
            >
              Start a Therapy Session
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => goToPage("memory-vault")}
            >
              Open Memory Vault
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => goToPage("voice-memory")}
            >
              Record a Voice Memory
            </Button>
          </div>
        </div>

        <Card
          className="relative min-h-[390px] animate-fade-up overflow-hidden p-10 [animation-delay:120ms] hover:-translate-y-1 transition-transform duration-300"
        >
          <GradientBackdrop className="opacity-[0.16]" />
          <div className="relative flex h-full flex-col justify-center">
            <div className="mb-6 flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-[22px] bg-memory-icon">
              <Heart className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-faint">
              A precious memory
            </p>

            <h3 className="text-2xl text-foreground">Family Wedding</h3>

            <p className="my-4 text-[17px] leading-relaxed text-muted-foreground">
              &quot;A beautiful day with the whole family in Jaipur.&quot;
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="tag">Family</Badge>
              <Badge variant="tag">Jaipur</Badge>
              <Badge variant="tag">Wedding</Badge>
            </div>
          </div>
        </Card>
      </main>

      <section className="mx-auto grid w-[86%] max-w-[1150px] grid-cols-1 gap-6 pb-20 md:grid-cols-3">
        {[
          {
            icon: BookOpen,
            title: "Memory Vault",
            text: "Store meaningful stories, people, places, and moments.",
            delay: "50ms",
          },
          {
            icon: Target,
            title: "Personalized Games",
            text: "Turn familiar memories into gentle cognitive exercises.",
            delay: "150ms",
          },
          {
            icon: Users,
            title: "Caregiver Support",
            text: "Track progress and understand each therapy session.",
            delay: "250ms",
          },
        ].map(({ icon: Icon, title, text, delay }) => (
          <Card
            key={title}
            className="animate-fade-up p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent-border hover:shadow-brand-lg"
            style={{ animationDelay: delay }}
          >
            <Icon className="mb-4 h-7 w-7 text-primary" aria-hidden="true" />
            <h3 className="mb-2 text-xl text-foreground">{title}</h3>
            <p className="leading-relaxed text-faint">{text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}

export default App;
