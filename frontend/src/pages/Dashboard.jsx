import { useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

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
      memory: "🧠",
      person: "👤",
      family_role: "👨‍👩‍👧",
      place: "📍",
      event: "🎉",
      activity: "☕",
    };

    return icons[type] || "•";
  };

  const getReminderIcon = (type) => {
    const icons = {
      medicine: "💊",
      hydration: "💧",
      activity: "🚶",
      appointment: "🩺",
    };

    return icons[type] || "🔔";
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
        icon: "✅",
      };
    }

    if (!reminder.scheduled_at) {
      return {
        key: "scheduled",
        label: "Scheduled",
        icon: "🕐",
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
        icon: "🔴",
      };
    }

    const minutesUntilDue =
      (scheduledTime - currentTime) / 60000;

    if (minutesUntilDue <= 60) {
      return {
        key: "due-soon",
        label: "Due soon",
        icon: "🟠",
      };
    }

    return {
      key: "scheduled",
      label: "Scheduled",
      icon: "🟢",
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
      <div className="dashboard-page dashboard-centered-message">
        Loading caregiver dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error-card">
          <h2>Something went wrong</h2>

          <p>{error}</p>

          <div className="dashboard-error-actions">
            <button
              onClick={loadDashboard}
            >
              Try Again
            </button>

            <button
              className="secondary"
              onClick={onLogout}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .dashboard-page {
          min-height: 100vh;
          background: #f8f5ef;
          padding: 45px 7%;
          box-sizing: border-box;
          color: #28352f;
          font-family: Arial, Helvetica, sans-serif;
        }

        .dashboard-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 32px;
        }

        .dashboard-header-content {
          min-width: 0;
        }

        .dashboard-label {
          margin: 0 0 8px;
          color: #57765f;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .dashboard-title {
          margin: 0 0 10px;
          color: #28352f;
          font-size: 44px;
          line-height: 1.1;
        }

        .dashboard-subtitle {
          margin: 0;
          max-width: 680px;
          color: #66736b;
          font-size: 18px;
          line-height: 1.6;
        }

        .dashboard-logout {
          border: 1px solid #bfccbf;
          background: transparent;
          color: #46634f;
          padding: 11px 18px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          white-space: nowrap;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );
          gap: 16px;
          margin-bottom: 25px;
        }

        .dashboard-stat,
        .dashboard-panel {
          background: #fffdf9;
          border: 1px solid #e8e1d5;
          border-radius: 20px;
        }

        .dashboard-stat {
          padding: 22px;
          min-width: 0;
        }

        .dashboard-stat-label,
        .dashboard-session-label,
        .dashboard-info-label,
        .dashboard-reminder-summary-label {
          margin: 0 0 7px;
          color: #8a968e;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .8px;
        }

        .dashboard-stat-value {
          margin: 0;
          color: #28352f;
          font-size: 26px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .dashboard-main-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.05fr)
            minmax(0, .95fr);
          gap: 25px;
          align-items: start;
        }

        .dashboard-panel {
          padding: 28px;
          min-width: 0;
        }

        .dashboard-panel + .dashboard-panel {
          margin-top: 25px;
        }

        .dashboard-panel-title {
          margin: 0 0 20px;
          color: #28352f;
          font-size: 22px;
        }

        .dashboard-patient-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .dashboard-info-box,
        .dashboard-session,
        .dashboard-reminder-summary-box {
          background: #f4f6f1;
          border-radius: 14px;
        }

        .dashboard-info-box {
          padding: 16px;
          min-width: 0;
        }

        .dashboard-info-value,
        .dashboard-session-value {
          margin: 0;
          color: #28352f;
          font-size: 17px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .dashboard-activity {
          margin-top: 25px;
        }

        .dashboard-subheading {
          margin: 0 0 14px;
          color: #28352f;
          font-size: 18px;
        }

        .dashboard-activity-list,
        .dashboard-reminder-list {
          display: grid;
          gap: 11px;
        }

        .dashboard-activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #f8f6f1;
          border-radius: 12px;
          padding: 14px;
        }

        .dashboard-activity-icon,
        .dashboard-reminder-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border-radius: 10px;
          background: #edf3ed;
        }

        .dashboard-activity-icon {
          width: 34px;
          height: 34px;
        }

        .dashboard-reminder-icon {
          width: 38px;
          height: 38px;
          font-size: 20px;
        }

        .dashboard-activity-content,
        .dashboard-reminder-content {
          min-width: 0;
        }

        .dashboard-activity-title,
        .dashboard-reminder-title {
          margin: 0 0 4px;
          color: #28352f;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .dashboard-activity-text,
        .dashboard-reminder-meta,
        .dashboard-empty {
          margin: 0;
          color: #738078;
          font-size: 14px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .dashboard-session {
          padding: 18px;
        }

        .dashboard-session-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .dashboard-session-progress-value {
          color: #57765f;
          font-size: 24px;
          font-weight: 700;
        }

        .dashboard-progress-bar {
          width: 100%;
          height: 10px;
          margin-top: 15px;
          border-radius: 999px;
          background: #e4e9e3;
          overflow: hidden;
        }

        .dashboard-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: #57765f;
        }

        /*
         * Memory graph
         */

        .memory-graph-intro {
          margin: -8px 0 20px;
          color: #66736b;
          line-height: 1.6;
        }

        .memory-graph-stats {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .memory-graph-stat {
          padding: 14px;
          background: #f4f6f1;
          border-radius: 12px;
        }

        .memory-graph-stat-label {
          margin: 0 0 5px;
          color: #8a968e;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .memory-graph-stat-value {
          margin: 0;
          color: #28352f;
          font-size: 20px;
          font-weight: 700;
        }

        .memory-graph-visual {
          padding: 18px;
          border: 1px solid #e8e1d5;
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              #fbfaf7,
              #f4f6f1
            );
        }

        .memory-graph-visual-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .memory-graph-visual-title {
          margin: 0;
          color: #28352f;
          font-size: 16px;
          font-weight: 700;
        }

        .memory-graph-visual-subtitle {
          margin: 4px 0 0;
          color: #738078;
          font-size: 13px;
          line-height: 1.5;
        }

        .memory-graph-legend {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .memory-graph-legend-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border: 1px solid #e1e7df;
          border-radius: 999px;
          background: #ffffff;
          color: #66736b;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .memory-graph-board {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .memory-graph-cluster {
          min-width: 0;
          padding: 14px;
          border: 1px solid #e4e9e2;
          border-radius: 14px;
          background: rgba(
            255,
            253,
            249,
            .88
          );
        }

        .memory-graph-memory-node {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding: 11px 12px;
          border-radius: 12px;
          background: #57765f;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          box-shadow:
            0 7px 18px
            rgba(
              87,
              118,
              95,
              .14
            );
        }

        .memory-graph-memory-node
          span:last-child {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .memory-graph-links {
          display: grid;
          gap: 8px;
          margin-top: 11px;
        }

        .memory-graph-link {
          display: grid;
          grid-template-columns:
            auto
            minmax(72px, .55fr)
            minmax(0, 1fr);
          align-items: center;
          gap: 8px;
        }

        .memory-graph-branch {
          color: #b4c1b5;
          font-size: 18px;
          line-height: 1;
        }

        .memory-graph-connector {
          color: #738078;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }

        .memory-graph-fact-node {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          padding: 7px 9px;
          border-radius: 10px;
          background: #f1eee6;
          color: #6e664f;
          font-size: 12px;
          font-weight: 700;
        }

        .memory-graph-fact-node
          span:last-child {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .memory-graph-connections {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .memory-graph-connections-title {
          margin: 0;
          color: #28352f;
          font-size: 14px;
          font-weight: 700;
        }

        .memory-graph-connection {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 12px;
          border-radius: 12px;
          background: #f8f6f1;
        }

        .memory-graph-node {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: #edf3ed;
          color: #46634f;
          font-size: 13px;
          font-weight: 700;
          max-width: 100%;
        }

        .memory-graph-node
          span:last-child {
          overflow-wrap: anywhere;
        }

        .memory-graph-arrow {
          color: #8a968e;
          font-size: 13px;
          font-weight: 700;
        }

        /*
         * Reminders
         */

        .dashboard-reminder-summary {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .dashboard-reminder-summary-box {
          padding: 13px;
        }

        .dashboard-reminder-summary-value {
          margin: 0;
          color: #28352f;
          font-size: 20px;
          font-weight: 700;
        }

        .dashboard-reminder-alert {
          display: flex;
          gap: 10px;
          padding: 13px 14px;
          margin-bottom: 14px;
          border-radius: 12px;
          font-weight: 700;
          line-height: 1.5;
        }

        .dashboard-reminder-alert.overdue {
          background: #fbeceb;
          color: #a05a45;
          border: 1px solid #efcbc3;
        }

        .dashboard-reminder-alert.due-soon {
          background: #fbf2df;
          color: #946c2d;
          border: 1px solid #ead7ae;
        }

        .dashboard-reminder-form {
          display: grid;
          gap: 12px;
          margin-bottom: 22px;
        }

        .dashboard-reminder-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .dashboard-reminder-field {
          display: grid;
          gap: 6px;
        }

        .dashboard-reminder-field label {
          color: #66736b;
          font-size: 12px;
          font-weight: 700;
        }

        .dashboard-reminder-field input,
        .dashboard-reminder-field select,
        .dashboard-reminder-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d9dfd7;
          border-radius: 10px;
          background: #ffffff;
          color: #28352f;
          padding: 11px 12px;
          font: inherit;
        }

        .dashboard-reminder-field textarea {
          min-height: 74px;
          resize: vertical;
        }

        .dashboard-reminder-submit,
        .dashboard-error-actions button {
          border: none;
          border-radius: 10px;
          background: #57765f;
          color: #ffffff;
          padding: 12px 16px;
          cursor: pointer;
          font-weight: 700;
        }

        .dashboard-reminder-item {
          display: grid;
          grid-template-columns:
            auto
            minmax(0, 1fr)
            auto;
          gap: 12px;
          align-items: start;
          padding: 14px;
          border-radius: 12px;
          background: #f8f6f1;
        }

        .dashboard-reminder-actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .dashboard-reminder-action {
          border: 1px solid #bfccbf;
          border-radius: 9px;
          background: transparent;
          color: #46634f;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .dashboard-reminder-action.complete {
          border-color: #57765f;
          background: #57765f;
          color: #ffffff;
        }

        .dashboard-reminder-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          font-size: 12px;
          font-weight: 700;
        }

        .dashboard-reminder-status.overdue {
          color: #a05a45;
        }

        .dashboard-reminder-status.due-soon {
          color: #946c2d;
        }

        .dashboard-reminder-status.scheduled,
        .dashboard-reminder-status.completed {
          color: #57765f;
        }

        .dashboard-reminder-completed {
          opacity: .65;
        }

        .dashboard-reminder-error {
          margin: 0 0 15px;
          color: #a05a45;
          font-weight: 700;
          line-height: 1.5;
        }

        /*
         * Quick actions
         */

        .dashboard-actions {
          display: grid;
          gap: 12px;
        }

        .dashboard-action-button {
          width: 100%;
          min-height: 52px;
          border-radius: 12px;
          padding: 14px 18px;
          cursor: pointer;
          font-weight: 700;
          text-align: left;
        }

        .dashboard-primary-action {
          border: none;
          background: #57765f;
          color: #ffffff;
        }

        .dashboard-secondary-action {
          border: 1px solid #bfccbf;
          background: transparent;
          color: #46634f;
        }

        /*
         * Loading and error
         */

        .memory-graph-loading {
          color: #57765f;
          font-weight: 700;
        }

        .memory-graph-error {
          margin: 0;
          color: #a05a45;
          font-weight: 700;
          line-height: 1.5;
        }

        .dashboard-centered-message {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #57765f;
          font-size: 18px;
          font-weight: 700;
        }

        .dashboard-error-card {
          max-width: 700px;
          margin: 100px auto;
          padding: 30px;
          border: 1px solid #e8e1d5;
          border-radius: 20px;
          background: #fffdf9;
          text-align: center;
        }

        .dashboard-error-card p {
          color: #a05a45;
          line-height: 1.6;
        }

        .dashboard-error-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .dashboard-error-actions .secondary {
          border: 1px solid #bfccbf;
          background: transparent;
          color: #46634f;
        }

        /*
         * Responsive
         */

        @media (max-width: 900px) {
          .dashboard-page {
            padding: 40px 5%;
          }

          .dashboard-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .dashboard-main-grid {
            grid-template-columns: 1fr;
          }

          .memory-graph-board {
            grid-template-columns: 1fr;
          }

          .memory-graph-visual-header {
            flex-direction: column;
          }

          .memory-graph-legend {
            justify-content: flex-start;
          }
        }

        @media (max-width: 600px) {
          .dashboard-page {
            padding: 70px 16px 35px;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 18px;
          }

          .dashboard-title {
            font-size: 34px;
          }

          .dashboard-subtitle {
            font-size: 16px;
          }

          .dashboard-logout {
            width: 100%;
          }

          .dashboard-grid {
            grid-template-columns:
              1fr 1fr;
            gap: 12px;
          }

          .dashboard-stat {
            padding: 18px;
          }

          .dashboard-stat-value {
            font-size: 22px;
          }

          .dashboard-patient-row {
            grid-template-columns: 1fr;
          }

          .dashboard-panel {
            padding: 20px;
            border-radius: 18px;
          }

          .dashboard-session-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .dashboard-reminder-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-reminder-item {
            grid-template-columns:
              auto
              minmax(0, 1fr);
          }

          .dashboard-reminder-actions {
            grid-column: 1 / -1;
            justify-content: flex-start;
          }

          .dashboard-reminder-summary {
            grid-template-columns: 1fr 1fr;
          }

          .memory-graph-stats {
            grid-template-columns: 1fr 1fr;
          }

          .memory-graph-link {
            grid-template-columns:
              auto
              minmax(0, 1fr);
          }

          .memory-graph-connector {
            grid-column: 2;
            text-align: left;
          }

          .memory-graph-fact-node {
            grid-column: 2;
            width: 100%;
            box-sizing: border-box;
          }

          .memory-graph-branch {
            grid-row: span 2;
          }

          .dashboard-error-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 390px) {
          .dashboard-page {
            padding-left: 12px;
            padding-right: 12px;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-stat {
            padding: 17px;
          }

          .dashboard-title {
            font-size: 32px;
          }

          .memory-graph-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              <p className="dashboard-label">
                SMRITI AI · CAREGIVER DASHBOARD
              </p>

              <h1 className="dashboard-title">
                Care that remembers, {patient.full_name || "your loved one"}.
              </h1>

              <p className="dashboard-subtitle">
                A care experience shaped around {patient.full_name || "this patient"}'s memories,
                preferences, and everyday routines.
              </p>
            </div>

            <button
              className="dashboard-logout"
              onClick={onLogout}
            >
              Log Out
            </button>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-stat">
              <p className="dashboard-stat-label">
                Patient
              </p>

              <p className="dashboard-stat-value">
                {patient.full_name ||
                  "Test Patient"}
              </p>
            </div>

            <div className="dashboard-stat">
              <p className="dashboard-stat-label">
                Language
              </p>

              <p className="dashboard-stat-value">
                {patient.language ||
                  "English"}
              </p>
            </div>

            <div className="dashboard-stat">
              <p className="dashboard-stat-label">
                Accuracy
              </p>

              <p className="dashboard-stat-value">
                {accuracy.toFixed(
                  accuracy % 1 ? 1 : 0
                )}
                %
              </p>
            </div>

            <div className="dashboard-stat">
              <p className="dashboard-stat-label">
                Attempts
              </p>

              <p className="dashboard-stat-value">
                {totalAttempts}
              </p>
            </div>
          </div>

          <div className="dashboard-main-grid">
            <div>
              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Patient Overview
                </h2>

                <div className="dashboard-patient-row">
                  <div className="dashboard-info-box">
                    <p className="dashboard-info-label">
                      Patient Name
                    </p>

                    <p className="dashboard-info-value">
                      {patient.full_name ||
                        "Test Patient"}
                    </p>
                  </div>

                  <div className="dashboard-info-box">
                    <p className="dashboard-info-label">
                      Age
                    </p>

                    <p className="dashboard-info-value">
                      {patient.age
                        ? `${patient.age} years`
                        : "Not available"}
                    </p>
                  </div>

                  <div className="dashboard-info-box">
                    <p className="dashboard-info-label">
                      Language
                    </p>

                    <p className="dashboard-info-value">
                      {patient.language ||
                        "English"}
                    </p>
                  </div>

                  <div className="dashboard-info-box">
                    <p className="dashboard-info-label">
                      Caregiver
                    </p>

                    <p className="dashboard-info-value">
                      {patient.caregiver_name ||
                        "Test Caregiver"}
                    </p>
                  </div>
                </div>

                <div className="dashboard-activity">
                  <h3 className="dashboard-subheading">
                    Recent Activity
                  </h3>

                  {recentActivity.length === 0 ? (
                    <p className="dashboard-empty">
                      No recent activity yet.
                    </p>
                  ) : (
                    <div className="dashboard-activity-list">
                      {recentActivity
                        .slice(0, 5)
                        .map(
                          (
                            activity,
                            index
                          ) => (
                            <div
                              className="dashboard-activity-item"
                              key={
                                activity.id ??
                                activity.attempt_id ??
                                index
                              }
                            >
                              <div className="dashboard-activity-icon">
                                {activity.correct
                                  ? "✓"
                                  : "🧠"}
                              </div>

                              <div className="dashboard-activity-content">
                                <p className="dashboard-activity-title">
                                  {activity.game_type ||
                                    activity.type ||
                                    "Therapy activity"}
                                </p>

                                <p className="dashboard-activity-text">
                                  {activity.correct
                                    ? "Correct answer"
                                    : activity.score !==
                                      undefined
                                    ? `Score: ${activity.score}`
                                    : "Activity completed"}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </div>
              </div>

              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Memory Connections
                </h2>

                {favoriteAnimal && (
                  <p className="memory-graph-intro">
                    🐘 A familiar favorite: {favoriteAnimal}
                  </p>
                )}

                <p className="memory-graph-intro">
                  Smriti AI connects memories with
                  the people, places, events, family
                  roles, and activities that make them
                  meaningful.
                </p>

                {graphLoading ? (
                  <p className="memory-graph-loading">
                    Building memory connections...
                  </p>
                ) : graphError ? (
                  <p className="memory-graph-error">
                    {graphError}
                  </p>
                ) : (
                  <>
                    <div className="memory-graph-stats">
                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Memories
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.memory_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Places
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.place_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Events
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.event_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Activities
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.activity_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Family Roles
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.family_role_count ??
                            graphStats.relationship_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Connections
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.connection_count ??
                            0}
                        </p>
                      </div>
                    </div>

                    {graphConnections.length ===
                    0 ? (
                      <p className="dashboard-empty">
                        Add more detailed memories
                        to build stronger
                        connections.
                      </p>
                    ) : (
                      <>
                        <div className="memory-graph-visual">
                          <div className="memory-graph-visual-header">
                            <div>
                              <p className="memory-graph-visual-title">
                                Living memory map
                              </p>

                              <p className="memory-graph-visual-subtitle">
                                See how every memory
                                branches into meaningful
                                facts.
                              </p>
                            </div>

                            <div className="memory-graph-legend">
                              <span className="memory-graph-legend-pill">
                                🧠 Memory
                              </span>

                              <span className="memory-graph-legend-pill">
                                📍 Place
                              </span>

                              <span className="memory-graph-legend-pill">
                                👨‍👩‍👧 Family
                              </span>

                              <span className="memory-graph-legend-pill">
                                🎉 Event
                              </span>
                            </div>
                          </div>

                          <div className="memory-graph-board">
                            {memoryMapData.map(
                              ({
                                memory,
                                links,
                              }) => (
                                <div
                                  className="memory-graph-cluster"
                                  key={memory.id}
                                >
                                  <div className="memory-graph-memory-node">
                                    <span>
                                      🧠
                                    </span>

                                    <span>
                                      {memory.value}
                                    </span>
                                  </div>

                                  {links.length ===
                                  0 ? (
                                    <p
                                      className="dashboard-empty"
                                      style={{
                                        marginTop:
                                          "10px",
                                      }}
                                    >
                                      No linked facts
                                      yet.
                                    </p>
                                  ) : (
                                    <div className="memory-graph-links">
                                      {links.map(
                                        (
                                          connection,
                                          index
                                        ) => (
                                          <div
                                            className="memory-graph-link"
                                            key={`${connection.target.id}-${index}`}
                                          >
                                            <span className="memory-graph-branch">
                                              ↳
                                            </span>

                                            <span className="memory-graph-connector">
                                              {formatRelationship(
                                                connection.type
                                              )}
                                            </span>

                                            <span className="memory-graph-fact-node">
                                              <span>
                                                {getNodeIcon(
                                                  connection
                                                    .target
                                                    .type
                                                )}
                                              </span>

                                              <span>
                                                {
                                                  connection
                                                    .target
                                                    .value
                                                }
                                              </span>
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <div className="memory-graph-connections">
                          <p className="memory-graph-connections-title">
                            Connection details
                          </p>

                          {graphConnections
                            .slice(0, 8)
                            .map(
                              (
                                connection,
                                index
                              ) => (
                                <div
                                  className="memory-graph-connection"
                                  key={`${connection.source.id}-${connection.target.id}-${index}`}
                                >
                                  <div className="memory-graph-node">
                                    <span>
                                      {getNodeIcon(
                                        connection
                                          .source
                                          .type
                                      )}
                                    </span>

                                    <span>
                                      {
                                        connection
                                          .source
                                          .value
                                      }
                                    </span>
                                  </div>

                                  <span className="memory-graph-arrow">
                                    {formatRelationship(
                                      connection.type
                                    )}
                                    {" →"}
                                  </span>

                                  <div className="memory-graph-node">
                                    <span>
                                      {getNodeIcon(
                                        connection
                                          .target
                                          .type
                                      )}
                                    </span>

                                    <span>
                                      {
                                        connection
                                          .target
                                          .value
                                      }
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Progress
                </h2>

                <div className="dashboard-session">
                  <div className="dashboard-session-row">
                    <div>
                      <p className="dashboard-session-label">
                        Correct Attempts
                      </p>

                      <p className="dashboard-session-value">
                        {correctAttempts} /{" "}
                        {totalAttempts}
                      </p>
                    </div>

                    <div className="dashboard-session-progress-value">
                      {accuracy.toFixed(
                        accuracy % 1 ? 1 : 0
                      )}
                      %
                    </div>
                  </div>

                  <div className="dashboard-progress-bar">
                    <div
                      className="dashboard-progress-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            accuracy,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <p
                    className="dashboard-activity-text"
                    style={{
                      marginTop: "12px",
                    }}
                  >
                    {totalGamesCompleted} therapy
                    games completed overall.
                  </p>
                </div>
              </div>

              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Latest Therapy Session
                </h2>

                {session ? (
                  <div className="dashboard-session">
                    <p className="dashboard-session-label">
                      Session
                    </p>

                    <p className="dashboard-session-value">
                      {sessionId
                        ? `Therapy Session #${sessionId}`
                        : "Recent Therapy Session"}
                    </p>

                    <p
                      className="dashboard-activity-text"
                      style={{
                        marginTop: "10px",
                      }}
                    >
                      {session.completed_games ??
                        0}{" "}
                      of{" "}
                      {session.total_games ??
                        0}{" "}
                      games completed
                    </p>

                    <div className="dashboard-progress-bar">
                      <div
                        className="dashboard-progress-fill"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              sessionProgress,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <p
                      className="dashboard-activity-text"
                      style={{
                        marginTop: "10px",
                        color: "#57765f",
                        fontWeight: "700",
                        textTransform:
                          "capitalize",
                      }}
                    >
                      {session.status ||
                        "active"}
                    </p>
                  </div>
                ) : (
                  <p className="dashboard-empty">
                    No therapy session recorded yet.
                  </p>
                )}
              </div>

              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Care Reminders
                </h2>

                <div className="dashboard-reminder-summary">
                  <div className="dashboard-reminder-summary-box">
                    <p className="dashboard-reminder-summary-label">
                      Pending
                    </p>

                    <p className="dashboard-reminder-summary-value">
                      {pendingReminders.length}
                    </p>
                  </div>

                  <div className="dashboard-reminder-summary-box">
                    <p className="dashboard-reminder-summary-label">
                      Completed
                    </p>

                    <p className="dashboard-reminder-summary-value">
                      {completedReminders.length}
                    </p>
                  </div>

                  <div className="dashboard-reminder-summary-box">
                    <p className="dashboard-reminder-summary-label">
                      Total
                    </p>

                    <p className="dashboard-reminder-summary-value">
                      {reminders.length}
                    </p>
                  </div>
                </div>

                {!remindersLoading &&
                  overdueReminders.length >
                    0 && (
                    <div className="dashboard-reminder-alert overdue">
                      <span>
                        🔴
                      </span>

                      <span>
                        {overdueReminders.length ===
                        1
                          ? "1 reminder is overdue."
                          : `${overdueReminders.length} reminders are overdue.`}{" "}
                        Please review the
                        caregiver schedule.
                      </span>
                    </div>
                  )}

                {!remindersLoading &&
                  overdueReminders.length ===
                    0 &&
                  dueSoonReminders.length >
                    0 && (
                    <div className="dashboard-reminder-alert due-soon">
                      <span>
                        🟠
                      </span>

                      <span>
                        {dueSoonReminders.length ===
                        1
                          ? "1 reminder is due within the next hour."
                          : `${dueSoonReminders.length} reminders are due within the next hour.`}
                      </span>
                    </div>
                  )}

                {remindersLoading ? (
                  <p className="memory-graph-loading">
                    Loading care reminders...
                  </p>
                ) : (
                  <>
                    {reminderError && (
                      <p className="dashboard-reminder-error">
                        {reminderError}
                      </p>
                    )}

                    <form
                      className="dashboard-reminder-form"
                      onSubmit={createReminder}
                    >
                      <div className="dashboard-reminder-grid">
                        <div className="dashboard-reminder-field">
                          <label htmlFor="reminder-title">
                            Reminder
                          </label>

                          <input
                            id="reminder-title"
                            type="text"
                            placeholder="e.g. Morning medicine"
                            value={
                              newReminder.title
                            }
                            onChange={(
                              event
                            ) =>
                              setNewReminder(
                                (current) => ({
                                  ...current,
                                  title:
                                    event.target
                                      .value,
                                })
                              )
                            }
                          />
                        </div>

                        <div className="dashboard-reminder-field">
                          <label htmlFor="reminder-type">
                            Type
                          </label>

                          <select
                            id="reminder-type"
                            value={
                              newReminder.reminder_type
                            }
                            onChange={(
                              event
                            ) =>
                              setNewReminder(
                                (current) => ({
                                  ...current,
                                  reminder_type:
                                    event.target
                                      .value,
                                })
                              )
                            }
                          >
                            <option value="medicine">
                              💊 Medicine
                            </option>

                            <option value="hydration">
                              💧 Hydration
                            </option>

                            <option value="activity">
                              🚶 Daily Activity
                            </option>

                            <option value="appointment">
                              🩺 Appointment
                            </option>
                          </select>
                        </div>

                        <div className="dashboard-reminder-field">
                          <label htmlFor="reminder-time">
                            Date &amp; Time
                          </label>

                          <input
                            id="reminder-time"
                            type="datetime-local"
                            value={
                              newReminder.scheduled_at
                            }
                            onChange={(
                              event
                            ) =>
                              setNewReminder(
                                (current) => ({
                                  ...current,
                                  scheduled_at:
                                    event.target
                                      .value,
                                })
                              )
                            }
                          />
                        </div>

                        <div className="dashboard-reminder-field">
                          <label htmlFor="reminder-repeat">
                            Repeat
                          </label>

                          <select
                            id="reminder-repeat"
                            value={
                              newReminder.repeat
                            }
                            onChange={(
                              event
                            ) =>
                              setNewReminder(
                                (current) => ({
                                  ...current,
                                  repeat:
                                    event.target
                                      .value,
                                })
                              )
                            }
                          >
                            <option value="once">
                              Once
                            </option>

                            <option value="daily">
                              Daily
                            </option>

                            <option value="weekly">
                              Weekly
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="dashboard-reminder-field">
                        <label htmlFor="reminder-description">
                          Notes
                        </label>

                        <textarea
                          id="reminder-description"
                          placeholder="Optional note for the caregiver"
                          value={
                            newReminder.description
                          }
                          onChange={(
                            event
                          ) =>
                            setNewReminder(
                              (current) => ({
                                ...current,
                                description:
                                  event.target
                                    .value,
                              })
                            )
                          }
                        />
                      </div>

                      <button
                        className="dashboard-reminder-submit"
                        type="submit"
                      >
                        + Add Reminder
                      </button>
                    </form>

                    {reminders.length ===
                    0 ? (
                      <p className="dashboard-empty">
                        No reminders yet. Add
                        medicine, hydration,
                        activity, or appointment
                        reminders above.
                      </p>
                    ) : (
                      <div className="dashboard-reminder-list">
                        {reminders.map(
                          (reminder) => {
                            const status =
                              getReminderStatus(
                                reminder
                              );

                            return (
                              <div
                                className={`dashboard-reminder-item ${
                                  reminder.completed
                                    ? "dashboard-reminder-completed"
                                    : ""
                                }`}
                                key={reminder.id}
                              >
                                <div className="dashboard-reminder-icon">
                                  {
                                    getReminderIcon(
                                      reminder.reminder_type
                                    )
                                  }
                                </div>

                                <div className="dashboard-reminder-content">
                                  <p className="dashboard-reminder-title">
                                    {
                                      reminder.title
                                    }
                                  </p>

                                  <p className="dashboard-reminder-meta">
                                    {
                                      getReminderLabel(
                                        reminder.reminder_type
                                      )
                                    }{" "}
                                    ·{" "}
                                    {formatReminderTime(
                                      reminder.scheduled_at
                                    )}{" "}
                                    ·{" "}
                                    {
                                      reminder.repeat
                                    }
                                  </p>

                                  {reminder.description && (
                                    <p
                                      className="dashboard-reminder-meta"
                                      style={{
                                        marginTop:
                                          "4px",
                                      }}
                                    >
                                      {
                                        reminder.description
                                      }
                                    </p>
                                  )}

                                  <div
                                    className={`dashboard-reminder-status ${status.key}`}
                                  >
                                    <span>
                                      {
                                        status.icon
                                      }
                                    </span>

                                    <span>
                                      {
                                        status.label
                                      }
                                    </span>
                                  </div>
                                </div>

                                <div className="dashboard-reminder-actions">
                                  {reminder.completed ? (
                                    <button
                                      className="dashboard-reminder-action"
                                      type="button"
                                      onClick={() =>
                                        reopenReminder(
                                          reminder.id
                                        )
                                      }
                                    >
                                      Reopen
                                    </button>
                                  ) : (
                                    <button
                                      className="dashboard-reminder-action complete"
                                      type="button"
                                      onClick={() =>
                                        completeReminder(
                                          reminder.id
                                        )
                                      }
                                    >
                                      Complete
                                    </button>
                                  )}

                                  <button
                                    className="dashboard-reminder-action"
                                    type="button"
                                    onClick={() =>
                                      deleteReminder(
                                        reminder.id
                                      )
                                    }
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Quick Actions
                </h2>

                <div className="dashboard-actions">
                  <button
                    className="dashboard-action-button dashboard-primary-action"
                    onClick={
                      onOpenMemoryVault
                    }
                  >
                    📖 Open Memory Vault
                  </button>

                  <button
                    className="dashboard-action-button dashboard-secondary-action"
                    onClick={
                      onOpenVoiceMemory
                    }
                  >
                    🎙 Record a Voice Memory
                  </button>

                  <button
                    className="dashboard-action-button dashboard-secondary-action"
                    onClick={
                      onOpenPatientProfile
                    }
                  >
                    ✨ Personalize Patient
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;