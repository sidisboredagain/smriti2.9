import { BookOpen, Brain, Heart, Mic } from "lucide-react";

import { usePatient } from "../context/PatientContext";
import BigActionCard from "../components/BigActionCard";

function greetingForNow() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function PatientHome({ onNavigate }) {
  const { patient } = usePatient();

  const firstName = (patient?.full_name || "").split(" ")[0] || "there";

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-10 text-center sm:mb-14">
        <p className="mb-2 text-lg font-bold text-primary sm:text-xl">
          {greetingForNow()}
        </p>

        <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          Hello, {firstName}
        </h1>
      </div>

      <div className="grid w-full max-w-[640px] grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <BigActionCard
          icon={Brain}
          title="Play"
          subtitle="A gentle memory game"
          onClick={() => onNavigate("play")}
        />

        <BigActionCard
          icon={Mic}
          title="Remember"
          subtitle="Tell me a memory"
          onClick={() => onNavigate("remember")}
        />

        <BigActionCard
          icon={BookOpen}
          title="Memories"
          subtitle="Look at your memories"
          onClick={() => onNavigate("memories")}
        />

        <BigActionCard
          icon={Heart}
          title="Comfort"
          subtitle="A familiar memory"
          onClick={() => onNavigate("comfort")}
        />
      </div>
    </div>
  );
}

export default PatientHome;
