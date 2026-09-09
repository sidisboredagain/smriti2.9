import { usePatient } from "../context/PatientContext";
import PatientTopBar from "../components/PatientTopBar";
import ComfortCard from "../components/ComfortCard";

function PatientComfort({ onHome }) {
  const { patient, comfortMemory } = usePatient();

  return (
    <div className="min-h-screen bg-background">
      <PatientTopBar onHome={onHome} label="Comfort" />

      <div className="px-5 py-10 sm:px-8 sm:py-14">
        <ComfortCard
          patient={patient}
          comfortMemory={comfortMemory}
          message="A familiar memory for you."
        />
      </div>
    </div>
  );
}

export default PatientComfort;
