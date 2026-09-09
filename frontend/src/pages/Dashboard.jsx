import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BookOpen,
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  Coffee,
  Droplet,
  Footprints,
  LogOut,
  Mic,
  MapPin,
  PartyPopper,
  PawPrint,
  Pill,
  Settings2,
  Stethoscope,
  User,
  Users,
} from "lucide-react";

import { cn } from "../lib/utils";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import GlassSurface from "../components/GlassSurface";
import { Input, Label, Textarea } from "../components/ui/input";
import { Progress } from "../components/ui/progress";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

const REMINDER_STATUS_BADGE_VARIANT = {
  overdue: "destructive",
  "due-soon": "warning",
  scheduled: "muted",
  completed: "success",
};

const selectClassName =
  "flex h-[52px] w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50";

function Dashboard({
  onOpenMemoryVault,
  onOpenVoiceMemory,
  onOpenPatientProfile,
  onLogout,
}) {
  const [dashboard, setDashboard] = useState(null);
  const [memoryGraph, setMemoryGraph] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [reminderNow, setReminderNow] = useState(new Date());

  const [newReminder, setNewReminder] = useState({
    title: "",
    reminder_type: "medicine",
    description: "",
    scheduled_at: "",
    repeat: "once",
  });

  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [remindersLoading, setRemindersLoading] = useState(true);

  const [error, setError] = useState("");
  const [graphError, setGraphError] = useState("");
  const [reminderError, setReminderError] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("smriti_token");

    if (!token) {
      throw new Error("Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const handleAuthError = (message) => {
    const text = String(message || "").toLowerCase();

    if (
      text === "please log in again." ||
      text.includes("not authenticated") ||
      text.includes("unauthorized") ||
      text.includes("could not validate credentials")
    ) {
      onLogout();
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/caregiver/dashboard/${PATIENT_ID}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load dashboard."
        );
      }

      setDashboard(data);
    } catch (err) {
      setError(err.message);
      handleAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientProfile = async () => {
    try {
      const response = await fetch(
        `${API_URL}/patients/${PATIENT_ID}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load patient profile."
        );
      }

      setPatientProfile(data);
    } catch (err) {
      handleAuthError(err.message);
    }
  };

  const loadMemoryGraph = async () => {
    try {
      setGraphLoading(true);
      setGraphError("");

      const response = await fetch(
        `${API_URL}/memories/graph/${PATIENT_ID}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load memory graph."
        );
      }

      setMemoryGraph(data);
    } catch (err) {
      setGraphError(err.message);
      handleAuthError(err.message);
    } finally {
      setGraphLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      setRemindersLoading(true);
      setReminderError("");

      const response = await fetch(
        `${API_URL}/reminders/patient/${PATIENT_ID}?include_completed=true`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load reminders."
        );
      }

      setReminders(Array.isArray(data) ? data : []);
    } catch (err) {
      setReminderError(err.message);
      handleAuthError(err.message);
    } finally {
      setRemindersLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadPatientProfile();
    loadMemoryGraph();
    loadReminders();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setReminderNow(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const createReminder = async (event) => {
    event.preventDefault();

    if (
      !newReminder.title.trim() ||
      !newReminder.scheduled_at
    ) {
      setReminderError("Please add a title and time.");
      return;
    }

    try {
      setReminderError("");

      const response = await fetch(
        `${API_URL}/reminders/`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patient_id: PATIENT_ID,
            title: newReminder.title.trim(),
            reminder_type: newReminder.reminder_type,
            description:
              newReminder.description.trim() || null,
            scheduled_at: new Date(
              newReminder.scheduled_at
            ).toISOString(),
            repeat: newReminder.repeat,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not create reminder."
        );
      }

      setReminders((current) =>
        [...current, data].sort(
          (a, b) =>
            new Date(a.scheduled_at) -
            new Date(b.scheduled_at)
        )
      );

      setNewReminder({
        title: "",
        reminder_type: "medicine",
        description: "",
        scheduled_at: "",
        repeat: "once",
      });
    } catch (err) {
      setReminderError(err.message);
      handleAuthError(err.message);
    }
  };

  const completeReminder = async (reminderId) => {
    try {
      const response = await fetch(
        `${API_URL}/reminders/${reminderId}/complete`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not complete reminder."
        );
      }

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === reminderId
            ? {
                ...reminder,
                completed: true,
                completed_at: data.completed_at,
              }
            : reminder
        )
      );
    } catch (err) {
      setReminderError(err.message);
      handleAuthError(err.message);
    }
  };

  const reopenReminder = async (reminderId) => {
    try {
      const response = await fetch(
        `${API_URL}/reminders/${reminderId}/reopen`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not reopen reminder."
        );
      }

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === reminderId
            ? {
                ...reminder,
                completed: false,
                completed_at: null,
              }
            : reminder
        )
      );
    } catch (err) {
      setReminderError(err.message);
      handleAuthError(err.message);
    }
  };

  const deleteReminder = async (reminderId) => {
    try {
      const response = await fetch(
        `${API_URL}/reminders/${reminderId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not remove reminder."
        );
      }

      setReminders((current) =>
        current.filter(
          (reminder) => reminder.id !== reminderId
        )
      );
    } catch (err) {
      setReminderError(err.message);
      handleAuthError(err.message);
    }
  };

  const patient = dashboard?.patient || {};
  const favoriteAnimal = patientProfile?.favorite_animal || "";
  const overallProgress =
    dashboard?.overall_progress || {};
  const recentActivity =
    dashboard?.recent_activity || [];
  const session =
    dashboard?.latest_session || null;

  const totalAttempts = Number(
    overallProgress.total_attempts || 0
  );

  const correctAttempts = Number(
    overallProgress.correct_attempts || 0
  );

  const accuracy = Number(
    overallProgress.accuracy_percent || 0
  );

  const totalGamesCompleted = Number(
    overallProgress.total_games_completed || 0
  );

  const sessionId =
    session?.session_id ??
    session?.id ??
    null;

  const sessionProgress = Number(
    session?.progress_percent || 0
  );

  const graphNodes = memoryGraph?.nodes || [];
  const graphStats = memoryGraph?.stats || {};

  const nodeMap = useMemo(
    () =>
      graphNodes.reduce((map, node) => {
        map[node.id] = node;
        return map;
      }, {}),
    [graphNodes]
  );

  const graphConnections = useMemo(() => {
    return (memoryGraph?.relationships || [])
      .filter(
        (relationship) =>
          relationship.type !== "shares_fact"
      )
      .map((relationship) => {
        const source =
          nodeMap[relationship.source];

        const target =
          nodeMap[relationship.target];

        if (!source || !target) {
          return null;
        }

        return {
          source,
          target,
          type: relationship.type,
        };
      })
      .filter(Boolean);
  }, [memoryGraph, nodeMap]);

  const memoryNodes = graphNodes.filter(
    (node) => node.type === "memory"
  );

  const formatRelationship = (type) => {
    const labels = {
      mentions_person: "mentions",
      has_family_role: "has family role",
      happened_at: "happened at",
      describes_event: "describes",
      includes_activity: "includes",
      shares_fact: "shares a fact with",
    };

    return (
      labels[type] ||
      String(
        type || "connection"
      ).replaceAll("_", " ")
    );
  };

  const getNodeIcon = (type) => {
    const icons = {
      memory: Brain,
      person: User,
      family_role: Users,
      place: MapPin,
      event: PartyPopper,
      activity: Coffee,
    };

    return icons[type] || Circle;
  };

  const getReminderIcon = (type) => {
    const icons = {
      medicine: Pill,
      hydration: Droplet,
      activity: Footprints,
      appointment: Stethoscope,
    };

    return icons[type] || Bell;
  };

  const getReminderLabel = (type) => {
    const labels = {
      medicine: "Medicine",
      hydration: "Hydration",
      activity: "Daily Activity",
      appointment: "Appointment",
    };

    return labels[type] || type;
  };

  const formatReminderTime = (value) => {
    if (!value) {
      return "Time not set";
    }

    return new Date(value).toLocaleString(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const getReminderStatus = (reminder) => {
    if (reminder.completed) {
      return {
        key: "completed",
        label: "Completed",
        icon: CheckCircle2,
      };
    }

    if (!reminder.scheduled_at) {
      return {
        key: "scheduled",
        label: "Scheduled",
        icon: Clock,
      };
    }

    const scheduledTime =
      new Date(reminder.scheduled_at).getTime();

    const currentTime =
      reminderNow.getTime();

    if (scheduledTime < currentTime) {
      return {
        key: "overdue",
        label: "Overdue",
        icon: Circle,
      };
    }

    const minutesUntilDue =
      (scheduledTime - currentTime) / 60000;

    if (minutesUntilDue <= 60) {
      return {
        key: "due-soon",
        label: "Due soon",
        icon: Circle,
      };
    }

    return {
      key: "scheduled",
      label: "Scheduled",
      icon: Circle,
    };
  };

  const pendingReminders =
    reminders.filter(
      (reminder) => !reminder.completed
    );

  const overdueReminders =
    pendingReminders.filter(
      (reminder) =>
        getReminderStatus(reminder).key ===
        "overdue"
    );

  const dueSoonReminders =
    pendingReminders.filter(
      (reminder) =>
        getReminderStatus(reminder).key ===
        "due-soon"
    );

  const completedReminders =
    reminders.filter(
      (reminder) => reminder.completed
    );

  const memoryMapData =
    memoryNodes.slice(0, 6).map(
      (memory) => ({
        memory,
        links: graphConnections
          .filter(
            (connection) =>
              connection.source.id ===
              memory.id
          )
          .slice(0, 4),
      })
    );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-24 text-lg font-bold text-primary">
        Loading caregiver dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background px-4 py-24 sm:px-[7%]">
        <Card className="mx-auto max-w-[700px] p-8 text-center">
          <h2 className="mb-3 text-2xl text-foreground">
            Something went wrong
          </h2>

          <p className="mb-6 leading-relaxed font-medium text-destructive">
            {error}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" onClick={loadDashboard}>
              Try Again
            </Button>

            <Button variant="outline" onClick={onLogout}>
              Log Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-24 pb-12 sm:px-[5%] lg:px-[7%]">
      <div className="mx-auto max-w-[1100px]">
        <GlassSurface
          as="header"
          type="rounded"
          radius={28}
          tintOpacity={0.16}
          className="mb-8 flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8"
          fallbackClassName="bg-card/60"
        >
          <div className="min-w-0">
            <p className="mb-2 text-sm font-bold tracking-wide text-primary">
              SMRITI AI · CAREGIVER DASHBOARD
            </p>

            <h1 className="mb-2 text-3xl leading-tight text-foreground sm:text-4xl lg:text-[44px]">
              Care that remembers, {patient.full_name || "your loved one"}.
            </h1>

            <p className="max-w-[680px] text-base leading-relaxed text-muted-foreground sm:text-lg">
              A care experience shaped around {patient.full_name || "this patient"}'s memories,
              preferences, and everyday routines.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full shrink-0 sm:w-auto"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log Out
          </Button>
        </GlassSurface>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="min-w-0 p-5">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
              Patient
            </p>

            <p className="break-words text-2xl font-bold text-foreground">
              {patient.full_name || "Test Patient"}
            </p>
          </Card>

          <Card className="min-w-0 p-5">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
              Language
            </p>

            <p className="break-words text-2xl font-bold text-foreground">
              {patient.language || "English"}
            </p>
          </Card>

          <Card className="min-w-0 p-5">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
              Accuracy
            </p>

            <p className="break-words text-2xl font-bold text-foreground">
              {accuracy.toFixed(accuracy % 1 ? 1 : 0)}%
            </p>
          </Card>

          <Card className="min-w-0 p-5">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
              Attempts
            </p>

            <p className="break-words text-2xl font-bold text-foreground">
              {totalAttempts}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-w-0 flex-col gap-6">
            <Card className="min-w-0 p-6 sm:p-7">
              <h2 className="mb-5 text-xl text-foreground sm:text-2xl">
                Patient Overview
              </h2>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="min-w-0 rounded-lg bg-muted p-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
                    Patient Name
                  </p>

                  <p className="break-words text-lg font-bold text-foreground">
                    {patient.full_name || "Test Patient"}
                  </p>
                </div>

                <div className="min-w-0 rounded-lg bg-muted p-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
                    Age
                  </p>

                  <p className="break-words text-lg font-bold text-foreground">
                    {patient.age ? `${patient.age} years` : "Not available"}
                  </p>
                </div>

                <div className="min-w-0 rounded-lg bg-muted p-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
                    Language
                  </p>

                  <p className="break-words text-lg font-bold text-foreground">
                    {patient.language || "English"}
                  </p>
                </div>

                <div className="min-w-0 rounded-lg bg-muted p-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
                    Caregiver
                  </p>

                  <p className="break-words text-lg font-bold text-foreground">
                    {patient.caregiver_name || "Test Caregiver"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3.5 text-lg text-foreground">
                  Recent Activity
                </h3>

                {recentActivity.length === 0 ? (
                  <p className="text-sm leading-relaxed text-faint">
                    No recent activity yet.
                  </p>
                ) : (
                  <div className="grid gap-2.5">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div
                        className="flex min-w-0 items-start gap-3 rounded-xl bg-muted p-3.5"
                        key={activity.id ?? activity.attempt_id ?? index}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          {activity.correct ? (
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Brain className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="mb-1 break-words font-bold text-foreground">
                            {activity.game_type || activity.type || "Therapy activity"}
                          </p>

                          <p className="break-words text-sm leading-relaxed text-faint">
                            {activity.correct
                              ? "Correct answer"
                              : activity.score !== undefined
                              ? `Score: ${activity.score}`
                              : "Activity completed"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="min-w-0 p-6 sm:p-7">
              <h2 className="mb-5 text-xl text-foreground sm:text-2xl">
                Memory Connections
              </h2>

              <div className="mb-5 space-y-2 leading-relaxed text-muted-foreground">
                {favoriteAnimal && (
                  <p className="flex items-center gap-2">
                    <PawPrint className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>A familiar favorite: {favoriteAnimal}</span>
                  </p>
                )}

                <p>
                  Smriti AI connects memories with the people, places, events, family
                  roles, and activities that make them meaningful.
                </p>
              </div>

              {graphLoading ? (
                <p className="font-bold text-primary">
                  Building memory connections...
                </p>
              ) : graphError ? (
                <p className="font-bold leading-relaxed text-destructive">
                  {graphError}
                </p>
              ) : (
                <>
                  <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    <div className="min-w-0 rounded-lg bg-muted p-3.5">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-faint">
                        Memories
                      </p>

                      <p className="text-xl font-bold text-foreground">
                        {graphStats.memory_count ?? 0}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-lg bg-muted p-3.5">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-faint">
                        Places
                      </p>

                      <p className="text-xl font-bold text-foreground">
                        {graphStats.place_count ?? 0}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-lg bg-muted p-3.5">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-faint">
                        Events
                      </p>

                      <p className="text-xl font-bold text-foreground">
                        {graphStats.event_count ?? 0}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-lg bg-muted p-3.5">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-faint">
                        Activities
                      </p>

                      <p className="text-xl font-bold text-foreground">
                        {graphStats.activity_count ?? 0}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-lg bg-muted p-3.5">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-faint">
                        Family Roles
                      </p>

                      <p className="text-xl font-bold text-foreground">
                        {graphStats.family_role_count ?? graphStats.relationship_count ?? 0}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-lg bg-muted p-3.5">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-faint">
                        Connections
                      </p>

                      <p className="text-xl font-bold text-foreground">
                        {graphStats.connection_count ?? 0}
                      </p>
                    </div>
                  </div>

                  {graphConnections.length === 0 ? (
                    <p className="text-sm leading-relaxed text-faint">
                      Add more detailed memories to build stronger connections.
                    </p>
                  ) : (
                    <>
                      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted p-4 sm:p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-bold text-foreground">
                              Living memory map
                            </p>

                            <p className="mt-1 text-sm leading-relaxed text-faint">
                              See how every memory branches into meaningful facts.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5 sm:justify-end">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground">
                              <Brain className="h-3 w-3" aria-hidden="true" /> Memory
                            </span>

                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground">
                              <MapPin className="h-3 w-3" aria-hidden="true" /> Place
                            </span>

                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground">
                              <Users className="h-3 w-3" aria-hidden="true" /> Family
                            </span>

                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground">
                              <PartyPopper className="h-3 w-3" aria-hidden="true" /> Event
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {memoryMapData.map(({ memory, links }) => (
                            <div
                              className="min-w-0 rounded-xl border border-border bg-card/90 p-3.5"
                              key={memory.id}
                            >
                              <div className="flex min-w-0 items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground shadow-brand-sm">
                                <Brain className="h-4 w-4 shrink-0" aria-hidden="true" />

                                <span className="min-w-0 break-words">
                                  {memory.value}
                                </span>
                              </div>

                              {links.length === 0 ? (
                                <p className="mt-2.5 text-sm leading-relaxed text-faint">
                                  No linked facts yet.
                                </p>
                              ) : (
                                <div className="mt-2.5 grid gap-2">
                                  {links.map((connection, index) => (
                                    <div
                                      className="grid grid-cols-[auto_minmax(72px,0.55fr)_minmax(0,1fr)] items-center gap-2"
                                      key={`${connection.target.id}-${index}`}
                                    >
                                      <span className="text-lg leading-none text-border-strong">
                                        ↳
                                      </span>

                                      <span className="text-center text-[10px] font-bold text-faint">
                                        {formatRelationship(connection.type)}
                                      </span>

                                      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-bold text-muted-foreground">
                                        {(() => {
                                          const LinkIcon = getNodeIcon(connection.target.type);
                                          return <LinkIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
                                        })()}

                                        <span className="min-w-0 break-words">
                                          {connection.target.value}
                                        </span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2.5">
                        <p className="font-bold text-foreground">
                          Connection details
                        </p>

                        {graphConnections.slice(0, 8).map((connection, index) => (
                          <div
                            className="flex flex-wrap items-center gap-2.5 rounded-xl bg-muted p-3"
                            key={`${connection.source.id}-${connection.target.id}-${index}`}
                          >
                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent px-2.5 py-1.5 text-sm font-bold text-accent-foreground">
                              {(() => {
                                const SourceIcon = getNodeIcon(connection.source.type);
                                return <SourceIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
                              })()}

                              <span className="break-words">
                                {connection.source.value}
                              </span>
                            </span>

                            <span className="text-sm font-bold text-faint">
                              {formatRelationship(connection.type)}
                              {" →"}
                            </span>

                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent px-2.5 py-1.5 text-sm font-bold text-accent-foreground">
                              {(() => {
                                const TargetIcon = getNodeIcon(connection.target.type);
                                return <TargetIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
                              })()}

                              <span className="break-words">
                                {connection.target.value}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </Card>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <Card className="min-w-0 p-6 sm:p-7">
              <h2 className="mb-5 text-xl text-foreground sm:text-2xl">
                Progress
              </h2>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
                      Correct Attempts
                    </p>

                    <p className="text-lg font-bold text-foreground">
                      {correctAttempts} / {totalAttempts}
                    </p>
                  </div>

                  <div className="text-2xl font-bold text-primary">
                    {accuracy.toFixed(accuracy % 1 ? 1 : 0)}%
                  </div>
                </div>

                <Progress
                  value={accuracy}
                  trackClassName="mt-4"
                />

                <p className="mt-3 text-sm leading-relaxed text-faint">
                  {totalGamesCompleted} therapy games completed overall.
                </p>
              </div>
            </Card>

            <Card className="min-w-0 p-6 sm:p-7">
              <h2 className="mb-5 text-xl text-foreground sm:text-2xl">
                Latest Therapy Session
              </h2>

              {session ? (
                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-faint">
                    Session
                  </p>

                  <p className="text-lg font-bold text-foreground">
                    {sessionId ? `Therapy Session #${sessionId}` : "Recent Therapy Session"}
                  </p>

                  <p className="mt-2.5 text-sm leading-relaxed text-faint">
                    {session.completed_games ?? 0} of {session.total_games ?? 0} games completed
                  </p>

                  <Progress
                    value={sessionProgress}
                    trackClassName="mt-2.5"
                  />

                  <p className="mt-2.5 text-sm font-bold capitalize text-primary">
                    {session.status || "active"}
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-faint">
                  No therapy session recorded yet.
                </p>
              )}
            </Card>

            <Card className="min-w-0 p-6 sm:p-7">
              <h2 className="mb-5 text-xl text-foreground sm:text-2xl">
                Care Reminders
              </h2>

              <div className="mb-5 grid grid-cols-3 gap-2.5">
                <div className="min-w-0 rounded-lg bg-muted p-3.5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-faint">
                    Pending
                  </p>

                  <p className="text-xl font-bold text-foreground">
                    {pendingReminders.length}
                  </p>
                </div>

                <div className="min-w-0 rounded-lg bg-muted p-3.5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-faint">
                    Completed
                  </p>

                  <p className="text-xl font-bold text-foreground">
                    {completedReminders.length}
                  </p>
                </div>

                <div className="min-w-0 rounded-lg bg-muted p-3.5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-faint">
                    Total
                  </p>

                  <p className="text-xl font-bold text-foreground">
                    {reminders.length}
                  </p>
                </div>
              </div>

              {!remindersLoading && overdueReminders.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />

                  <span>
                    {overdueReminders.length === 1
                      ? "1 reminder is overdue."
                      : `${overdueReminders.length} reminders are overdue.`}{" "}
                    Please review the caregiver schedule.
                  </span>
                </Alert>
              )}

              {!remindersLoading &&
                overdueReminders.length === 0 &&
                dueSoonReminders.length > 0 && (
                  <Alert variant="warning" className="mb-4">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />

                    <span>
                      {dueSoonReminders.length === 1
                        ? "1 reminder is due within the next hour."
                        : `${dueSoonReminders.length} reminders are due within the next hour.`}
                    </span>
                  </Alert>
                )}

              {remindersLoading ? (
                <p className="font-bold text-primary">
                  Loading care reminders...
                </p>
              ) : (
                <>
                  {reminderError && (
                    <Alert variant="destructive" className="mb-4">
                      <span>{reminderError}</span>
                    </Alert>
                  )}

                  <form className="mb-6 grid gap-3" onSubmit={createReminder}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="reminder-title">Reminder</Label>

                        <Input
                          id="reminder-title"
                          type="text"
                          placeholder="e.g. Morning medicine"
                          value={newReminder.title}
                          onChange={(event) =>
                            setNewReminder((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="reminder-type">Type</Label>

                        <select
                          id="reminder-type"
                          className={selectClassName}
                          value={newReminder.reminder_type}
                          onChange={(event) =>
                            setNewReminder((current) => ({
                              ...current,
                              reminder_type: event.target.value,
                            }))
                          }
                        >
                          <option value="medicine">Medicine</option>
                          <option value="hydration">Hydration</option>
                          <option value="activity">Daily Activity</option>
                          <option value="appointment">Appointment</option>
                        </select>
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="reminder-time">Date &amp; Time</Label>

                        <Input
                          id="reminder-time"
                          type="datetime-local"
                          value={newReminder.scheduled_at}
                          onChange={(event) =>
                            setNewReminder((current) => ({
                              ...current,
                              scheduled_at: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="reminder-repeat">Repeat</Label>

                        <select
                          id="reminder-repeat"
                          className={selectClassName}
                          value={newReminder.repeat}
                          onChange={(event) =>
                            setNewReminder((current) => ({
                              ...current,
                              repeat: event.target.value,
                            }))
                          }
                        >
                          <option value="once">Once</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="reminder-description">Notes</Label>

                      <Textarea
                        id="reminder-description"
                        placeholder="Optional note for the caregiver"
                        value={newReminder.description}
                        onChange={(event) =>
                          setNewReminder((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <Button type="submit" variant="primary" className="justify-self-start">
                      + Add Reminder
                    </Button>
                  </form>

                  {reminders.length === 0 ? (
                    <p className="text-sm leading-relaxed text-faint">
                      No reminders yet. Add medicine, hydration, activity, or appointment
                      reminders above.
                    </p>
                  ) : (
                    <div className="grid gap-2.5">
                      {reminders.map((reminder) => {
                        const status = getReminderStatus(reminder);
                        const statusBadgeVariant =
                          REMINDER_STATUS_BADGE_VARIANT[status.key] || "muted";

                        return (
                          <div
                            className={cn(
                              "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl bg-muted p-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto]",
                              reminder.completed && "opacity-[0.65]"
                            )}
                            key={reminder.id}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                              {(() => {
                                const ReminderIcon = getReminderIcon(reminder.reminder_type);
                                return <ReminderIcon className="h-5 w-5" aria-hidden="true" />;
                              })()}
                            </div>

                            <div className="min-w-0">
                              <p className="mb-1 break-words font-bold text-foreground">
                                {reminder.title}
                              </p>

                              <p className="break-words text-sm leading-relaxed text-faint">
                                {getReminderLabel(reminder.reminder_type)} ·{" "}
                                {formatReminderTime(reminder.scheduled_at)} ·{" "}
                                {reminder.repeat}
                              </p>

                              {reminder.description && (
                                <p className="mt-1 break-words text-sm leading-relaxed text-faint">
                                  {reminder.description}
                                </p>
                              )}

                              <Badge
                                variant={statusBadgeVariant}
                                className="mt-1.5 px-2.5 py-1 text-xs"
                              >
                                <status.icon className="h-3 w-3" aria-hidden="true" />
                                <span>{status.label}</span>
                              </Badge>
                            </div>

                            <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:col-start-3 sm:justify-end">
                              {reminder.completed ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => reopenReminder(reminder.id)}
                                >
                                  Reopen
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => completeReminder(reminder.id)}
                                >
                                  Complete
                                </Button>
                              )}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => deleteReminder(reminder.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </Card>

            <Card className="min-w-0 p-6 sm:p-7">
              <h2 className="mb-5 text-xl text-foreground sm:text-2xl">
                Quick Actions
              </h2>

              <div className="grid gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-start text-left"
                  onClick={onOpenMemoryVault}
                >
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                  Open Memory Vault
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start text-left"
                  onClick={onOpenVoiceMemory}
                >
                  <Mic className="h-5 w-5" aria-hidden="true" />
                  Record a Voice Memory
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start text-left"
                  onClick={onOpenPatientProfile}
                >
                  <Settings2 className="h-5 w-5" aria-hidden="true" />
                  Personalize Patient
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
