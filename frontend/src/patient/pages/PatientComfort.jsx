import { useEffect, useRef, useState } from "react";
import { Shuffle } from "lucide-react";

import { usePatient } from "../context/PatientContext";
import PatientTopBar from "../components/PatientTopBar";
import ComfortCard from "../components/ComfortCard";
import { translate } from "../../lib/i18n";

// The Comfort tile used to always show the single memory the caregiver
// specifically designated (patient.comfort_memory_id), even though
// PatientContext already builds a whole pool of comforting memories (any
// memory with a real photo or voice recording attached) for exactly this
// purpose -- Play's own Comfort Mode trigger already draws from that
// pool. This screen now does the same: it starts from a pool pick
// instead of the single designated one, and offers a "Show me another"
// button (only when there's a real second option) so a patient isn't
// stuck seeing the same one memory every time they open Comfort.
function PatientComfort({ onHome }) {
  const { patient, comfortMemory, comfortPool, pickComfortItem } = usePatient();

  const language = patient?.language || "English";
  const t = (key, vars) => translate(language, key, vars);

  const [shownItem, setShownItem] = useState(null);
  const lastShownIdRef = useRef(null);
  const hasPickedRef = useRef(false);

  useEffect(() => {
    // Wait until the pool (or the fallback single memory) has actually
    // loaded once, then make the first pick -- only once, so this
    // doesn't re-pick a new item out from under the patient on every
    // unrelated re-render.
    if (hasPickedRef.current) {
      return;
    }

    if (comfortPool.length > 0 || comfortMemory) {
      const item = pickComfortItem(null);
      lastShownIdRef.current = item?.id ?? null;
      setShownItem(item);
      hasPickedRef.current = true;
    }
  }, [comfortPool, comfortMemory, pickComfortItem]);

  const showAnother = () => {
    const item = pickComfortItem(lastShownIdRef.current);
    lastShownIdRef.current = item?.id ?? null;
    setShownItem(item);
  };

  return (
    <div className="min-h-screen bg-background">
      <PatientTopBar onHome={onHome} label={t("topbar_comfort")} />

      <div className="px-5 py-10 sm:px-8 sm:py-14">
        <ComfortCard
          patient={patient}
          comfortMemory={shownItem || comfortMemory}
          message={t("comfort_default_message")}
        />

        {comfortPool.length > 1 && (
          <div className="mx-auto mt-6 flex max-w-[560px] justify-center">
            <button
              type="button"
              onClick={showAnother}
              className="flex h-14 items-center gap-2.5 rounded-2xl border-2 border-border bg-card px-5 text-lg font-bold text-foreground active:scale-95"
            >
              <Shuffle className="h-5 w-5" aria-hidden="true" />
              {t("comfort_show_another")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientComfort;
