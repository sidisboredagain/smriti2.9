import { BookOpen, Brain, Heart, Mic, Sparkles } from "lucide-react";

import { usePatient } from "../context/PatientContext";
import BigActionCard from "../components/BigActionCard";
import { translate } from "../../lib/i18n";

function greetingKeyForNow() {
  const hour = new Date().getHours();

  if (hour < 12) return "greeting_morning";
  if (hour < 17) return "greeting_afternoon";
  return "greeting_evening";
}

function PatientHome({ onNavigate }) {
  const { patient } = usePatient();

  const language = patient?.language || "English";
  const t = (key, vars) => translate(language, key, vars);

  const firstName = (patient?.full_name || "").split(" ")[0] || "there";

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-10 text-center sm:mb-14">
        <p className="mb-2 text-lg font-bold text-primary sm:text-xl">
          {t(greetingKeyForNow())}
        </p>

        <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          {t("hello_name", { name: firstName })}
        </h1>
      </div>

      <div className="grid w-full max-w-[640px] grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <BigActionCard
          icon={Brain}
          title={t("home_play_title")}
          subtitle={t("home_play_subtitle")}
          onClick={() => onNavigate("play")}
        />

        <BigActionCard
          icon={Mic}
          title={t("home_remember_title")}
          subtitle={t("home_remember_subtitle")}
          onClick={() => onNavigate("remember")}
        />

        <BigActionCard
          icon={BookOpen}
          title={t("home_memories_title")}
          subtitle={t("home_memories_subtitle")}
          onClick={() => onNavigate("memories")}
        />

        <BigActionCard
          icon={Heart}
          title={t("home_comfort_title")}
          subtitle={t("home_comfort_subtitle")}
          onClick={() => onNavigate("comfort")}
        />

        <BigActionCard
          icon={Sparkles}
          title={t("home_teach_me_title")}
          subtitle={t("home_teach_me_subtitle")}
          onClick={() => onNavigate("teach_me")}
        />
      </div>
    </div>
  );
}

export default PatientHome;
