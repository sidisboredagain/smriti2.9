import { useEffect, useRef, useState } from "react";

import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input, Label, Textarea } from "../components/ui/input";
import { applyPatientTheme } from "../lib/theme";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

const selectClassName =
  "flex h-[52px] w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground transition-colors outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50";

const LANGUAGE_OPTIONS = ["English", "Hindi", "Bengali", "Assamese"];

function PatientProfile() {
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    age: "",
    language: "",
    caregiver_name: "",
    favorite_color: "",
    favorite_animal: "",
    favorite_activity: "",
    favorite_food: "",
    favorite_place: "",
    comfort_memory: "",
    comfort_memory_id: "",
  });

  const [memories, setMemories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Tracks the last-SAVED favorite color so the live color preview can be
  // reverted if the caregiver navigates away without saving.
  const savedFavoriteColorRef = useRef("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("smriti_token");

    if (!token) {
      throw new Error("Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const loadPatient = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

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

        setPatient(data);

        setForm({
          full_name: data.full_name || "",
          age: data.age ?? "",
          language: data.language || "",
          caregiver_name: data.caregiver_name || "",
          favorite_color: data.favorite_color || "",
          favorite_animal: data.favorite_animal || "",
          favorite_activity: data.favorite_activity || "",
          favorite_food: data.favorite_food || "",
          favorite_place: data.favorite_place || "",
          comfort_memory: data.comfort_memory || "",
          comfort_memory_id: data.comfort_memory_id ?? "",
        });

        savedFavoriteColorRef.current = data.favorite_color || "";
        applyPatientTheme(data.favorite_color);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const loadMemories = async () => {
      try {
        const response = await fetch(
          `${API_URL}/memories/?patient_id=${PATIENT_ID}&limit=100`,
          {
            headers: getAuthHeaders(),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMemories(Array.isArray(data) ? data : []);
        }
      } catch {
        // The comfort-memory picker just stays empty if this fails; it
        // isn't required to load or save the rest of the profile.
      }
    };

    loadPatient();
    loadMemories();
  }, []);

  // If the caregiver leaves this page with an unsaved favorite-color
  // preview still applied, revert the app back to the last-saved theme
  // rather than leaving the preview color leaked into the rest of the app.
  useEffect(() => {
    return () => {
      applyPatientTheme(savedFavoriteColorRef.current);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "favorite_color") {
      applyPatientTheme(value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/patients/${PATIENT_ID}`,
        {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            age: form.age ? Number(form.age) : null,
            language: form.language.trim(),
            caregiver_name: form.caregiver_name.trim(),
            favorite_color:
              form.favorite_color.trim() || null,
            favorite_animal:
              form.favorite_animal.trim() || null,
            favorite_activity:
              form.favorite_activity.trim() || null,
            favorite_food:
              form.favorite_food.trim() || null,
            favorite_place:
              form.favorite_place.trim() || null,
            comfort_memory:
              form.comfort_memory.trim() || null,
            comfort_memory_id: form.comfort_memory_id
              ? Number(form.comfort_memory_id)
              : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not save patient profile."
        );
      }

      setPatient(data);

      setForm({
        full_name: data.full_name || "",
        age: data.age ?? "",
        language: data.language || "",
        caregiver_name: data.caregiver_name || "",
        favorite_color: data.favorite_color || "",
        favorite_animal: data.favorite_animal || "",
        favorite_activity: data.favorite_activity || "",
        favorite_food: data.favorite_food || "",
        favorite_place: data.favorite_place || "",
        comfort_memory: data.comfort_memory || "",
        comfort_memory_id: data.comfort_memory_id ?? "",
      });

      savedFavoriteColorRef.current = data.favorite_color || "";
      applyPatientTheme(data.favorite_color);

      setMessage("✓ Patient preferences saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-24 text-lg font-bold text-primary">
        Loading patient profile...
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="min-h-screen bg-background px-4 pt-24 pb-12 sm:px-[5%] lg:px-[7%]">
        <Card className="mx-auto max-w-[700px] p-8 text-center">
          <h2 className="mb-2.5 text-2xl text-foreground">
            Unable to load profile
          </h2>

          <p className="leading-relaxed text-destructive">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-24 pb-12 sm:px-[5%] lg:px-[7%]">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-7 animate-fade-up">
          <p className="mb-2 text-sm font-bold tracking-wide text-primary">
            SMRITI AI · PATIENT PERSONALIZATION
          </p>

          <h1 className="mb-2.5 text-3xl leading-tight text-foreground sm:text-4xl lg:text-[42px]">
            Personalize the care experience.
          </h1>

          <p className="max-w-[720px] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Save the things that make this person feel familiar,
            comfortable, and understood. These preferences can
            later guide the app&apos;s visuals, activities, and comfort
            experience.
          </p>
        </div>

        <Card className="animate-fade-up p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            <section className="mb-7">
              <h2 className="mb-1.5 text-xl text-foreground">
                Patient Details
              </h2>

              <p className="mb-4 text-sm leading-relaxed text-faint">
                Basic information used throughout Smriti AI.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="full_name">Patient Name</Label>

                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>

                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="language">Preferred Language</Label>

                  <select
                    id="language"
                    name="language"
                    className={selectClassName}
                    value={form.language}
                    onChange={handleChange}
                  >
                    <option value="">Select a language</option>

                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="caregiver_name">Caregiver</Label>

                  <Input
                    id="caregiver_name"
                    name="caregiver_name"
                    type="text"
                    value={form.caregiver_name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section className="mb-7">
              <h2 className="mb-1.5 text-xl text-foreground">
                Personal Preferences
              </h2>

              <p className="mb-4 text-sm leading-relaxed text-faint">
                These details help Smriti AI make the experience
                feel more personal and familiar.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="favorite_color">Favorite Color</Label>

                  <Input
                    id="favorite_color"
                    name="favorite_color"
                    type="text"
                    placeholder="e.g. Blue"
                    value={form.favorite_color}
                    onChange={handleChange}
                  />

                  <p className="mt-2 text-xs leading-relaxed text-faint">
                    The app&apos;s colors update automatically as you
                    type — try Blue, Green, Purple, Pink, Orange,
                    Yellow, Red, Teal, or Brown.
                  </p>
                </div>

                <div>
                  <Label htmlFor="favorite_animal">Favorite Animal</Label>

                  <Input
                    id="favorite_animal"
                    name="favorite_animal"
                    type="text"
                    placeholder="e.g. Elephant"
                    value={form.favorite_animal}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="favorite_activity">
                    Favorite Activity
                  </Label>

                  <Input
                    id="favorite_activity"
                    name="favorite_activity"
                    type="text"
                    placeholder="e.g. Gardening"
                    value={form.favorite_activity}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="favorite_food">Favorite Food</Label>

                  <Input
                    id="favorite_food"
                    name="favorite_food"
                    type="text"
                    placeholder="e.g. Rice"
                    value={form.favorite_food}
                    onChange={handleChange}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="favorite_place">Favorite Place</Label>

                  <Input
                    id="favorite_place"
                    name="favorite_place"
                    type="text"
                    placeholder="e.g. Jaipur"
                    value={form.favorite_place}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-1.5 text-xl text-foreground">
                Comfort Memory
              </h2>

              <p className="mb-4 text-sm leading-relaxed text-faint">
                Save a short, familiar memory that can later be
                used to help calm and re-engage the patient after
                repeated difficulty.
              </p>

              <div className="mb-4">
                <Label htmlFor="comfort_memory">Familiar Memory</Label>

                <Textarea
                  id="comfort_memory"
                  name="comfort_memory"
                  placeholder="e.g. Family Wedding — a beautiful day with the whole family in Jaipur."
                  value={form.comfort_memory}
                  onChange={handleChange}
                />

                <p className="mt-2 text-xs leading-relaxed text-faint">
                  Keep this warm, familiar, and easy to recognize.
                </p>
              </div>

              <div>
                <Label htmlFor="comfort_memory_id">
                  Link to a saved memory (optional)
                </Label>

                <select
                  id="comfort_memory_id"
                  name="comfort_memory_id"
                  className={selectClassName}
                  value={form.comfort_memory_id}
                  onChange={handleChange}
                >
                  <option value="">No linked memory</option>

                  {memories.map((memory) => (
                    <option key={memory.id} value={memory.id}>
                      {memory.title}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-relaxed text-faint">
                  When a memory is linked, its photo and recording (if
                  any) can be shown too, not just this description.
                </p>
              </div>
            </section>

            {error && (
              <Alert variant="destructive" className="mt-5">
                {error}
              </Alert>
            )}

            <div className="mt-7 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {message && <Alert variant="success">{message}</Alert>}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={saving}
                className="min-w-[190px] sm:ml-auto"
              >
                {saving ? "Saving..." : "Save Patient Preferences"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default PatientProfile;
