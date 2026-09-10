import { Home } from "lucide-react";

import { usePatient } from "../context/PatientContext";
import { translate } from "../../lib/i18n";

// Every screen except Home shows one obvious, huge way back -- never a
// menu, never a breadcrumb trail. This is the "obvious back/home
// controls" accessibility requirement made literal.
function PatientTopBar({ onHome, label }) {
  const { patient } = usePatient();
  const language = patient?.language || "English";

  return (
    <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-card/95 px-5 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
      <button
        type="button"
        onClick={onHome}
        aria-label={translate(language, "go_home_aria")}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-brand-sm transition-transform active:scale-95"
      >
        <Home className="h-8 w-8" aria-hidden="true" />
      </button>

      {label && (
        <span className="text-2xl font-bold text-foreground sm:text-3xl">
          {label}
        </span>
      )}
    </div>
  );
}

export default PatientTopBar;
