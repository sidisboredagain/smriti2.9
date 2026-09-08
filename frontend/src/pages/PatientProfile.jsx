import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
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
      });

      setMessage("✓ Patient preferences saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="patient-profile-page">
        <div className="patient-profile-message">
          Loading patient profile...
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="patient-profile-page">
        <div className="patient-profile-error">
          <h2>Unable to load profile</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .patient-profile-page {
          min-height: 100vh;
          background: #f8f5ef;
          padding: 50px 7%;
          box-sizing: border-box;
          color: #28352f;
          font-family: Arial, Helvetica, sans-serif;
        }

        .patient-profile-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .patient-profile-header {
          margin-bottom: 28px;
        }

        .patient-profile-label {
          margin: 0 0 8px;
          color: #57765f;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .patient-profile-title {
          margin: 0 0 10px;
          color: #28352f;
          font-size: 42px;
          line-height: 1.15;
        }

        .patient-profile-subtitle {
          margin: 0;
          max-width: 720px;
          color: #66736b;
          font-size: 17px;
          line-height: 1.6;
        }

        .patient-profile-card {
          background: #fffdf9;
          border: 1px solid #e8e1d5;
          border-radius: 22px;
          padding: 30px;
          box-sizing: border-box;
          box-shadow: 0 10px 30px rgba(48, 59, 52, 0.05);
        }

        .patient-profile-section {
          margin-bottom: 28px;
        }

        .patient-profile-section:last-of-type {
          margin-bottom: 0;
        }

        .patient-profile-section-title {
          margin: 0 0 6px;
          color: #28352f;
          font-size: 20px;
        }

        .patient-profile-section-description {
          margin: 0 0 18px;
          color: #738078;
          font-size: 14px;
          line-height: 1.5;
        }

        .patient-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .patient-profile-field {
          display: grid;
          gap: 7px;
        }

        .patient-profile-field.full {
          grid-column: 1 / -1;
        }

        .patient-profile-field label {
          color: #66736b;
          font-size: 13px;
          font-weight: 700;
        }

        .patient-profile-field input,
        .patient-profile-field textarea,
        .patient-profile-field select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d9dfd7;
          border-radius: 12px;
          background: #ffffff;
          color: #28352f;
          padding: 12px 13px;
          font: inherit;
          outline: none;
        }

        .patient-profile-field input:focus,
        .patient-profile-field textarea:focus,
        .patient-profile-field select:focus {
          border-color: #57765f;
          box-shadow: 0 0 0 3px rgba(87, 118, 95, 0.1);
        }

        .patient-profile-field textarea {
          min-height: 100px;
          resize: vertical;
        }

        .patient-profile-help {
          margin: 7px 0 0;
          color: #8a968e;
          font-size: 12px;
          line-height: 1.5;
        }

        .patient-profile-save-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid #eee8de;
        }

        .patient-profile-message {
          color: #57765f;
          font-weight: 700;
        }

        .patient-profile-error {
          max-width: 700px;
          margin: 80px auto;
          padding: 30px;
          background: #fffdf9;
          border: 1px solid #e8e1d5;
          border-radius: 20px;
          text-align: center;
        }

        .patient-profile-error h2 {
          margin: 0 0 10px;
        }

        .patient-profile-error p {
          margin: 0;
          color: #a05a45;
          line-height: 1.6;
        }

        .patient-profile-submit {
          min-width: 190px;
          border: none;
          border-radius: 12px;
          background: #57765f;
          color: #ffffff;
          padding: 13px 18px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
        }

        .patient-profile-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 700px) {
          .patient-profile-page {
            padding: 75px 16px 30px;
          }

          .patient-profile-title {
            font-size: 34px;
          }

          .patient-profile-subtitle {
            font-size: 16px;
          }

          .patient-profile-card {
            padding: 20px;
            border-radius: 18px;
          }

          .patient-profile-grid {
            grid-template-columns: 1fr;
          }

          .patient-profile-field.full {
            grid-column: auto;
          }

          .patient-profile-save-row {
            align-items: stretch;
            flex-direction: column;
          }

          .patient-profile-submit {
            width: 100%;
          }
        }
      `}</style>

      <div className="patient-profile-page">
        <div className="patient-profile-container">
          <div className="patient-profile-header">
            <p className="patient-profile-label">
              SMRITI AI · PATIENT PERSONALIZATION
            </p>

            <h1 className="patient-profile-title">
              Personalize the care experience.
            </h1>

            <p className="patient-profile-subtitle">
              Save the things that make this person feel familiar,
              comfortable, and understood. These preferences can
              later guide the app's visuals, activities, and comfort
              experience.
            </p>
          </div>

          <form
            className="patient-profile-card"
            onSubmit={handleSubmit}
          >
            <section className="patient-profile-section">
              <h2 className="patient-profile-section-title">
                Patient Details
              </h2>

              <p className="patient-profile-section-description">
                Basic information used throughout Smriti AI.
              </p>

              <div className="patient-profile-grid">
                <div className="patient-profile-field">
                  <label htmlFor="full_name">
                    Patient Name
                  </label>

                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="patient-profile-field">
                  <label htmlFor="age">
                    Age
                  </label>

                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={handleChange}
                  />
                </div>

                <div className="patient-profile-field">
                  <label htmlFor="language">
                    Preferred Language
                  </label>

                  <input
                    id="language"
                    name="language"
                    type="text"
                    placeholder="e.g. Hindi"
                    value={form.language}
                    onChange={handleChange}
                  />
                </div>

                <div className="patient-profile-field">
                  <label htmlFor="caregiver_name">
                    Caregiver
                  </label>

                  <input
                    id="caregiver_name"
                    name="caregiver_name"
                    type="text"
                    value={form.caregiver_name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section className="patient-profile-section">
              <h2 className="patient-profile-section-title">
                Personal Preferences
              </h2>

              <p className="patient-profile-section-description">
                These details help Smriti AI make the experience
                feel more personal and familiar.
              </p>

              <div className="patient-profile-grid">
                <div className="patient-profile-field">
                  <label htmlFor="favorite_color">
                    Favorite Color
                  </label>

                  <input
                    id="favorite_color"
                    name="favorite_color"
                    type="text"
                    placeholder="e.g. Blue"
                    value={form.favorite_color}
                    onChange={handleChange}
                  />
                </div>

                <div className="patient-profile-field">
                  <label htmlFor="favorite_animal">
                    Favorite Animal
                  </label>

                  <input
                    id="favorite_animal"
                    name="favorite_animal"
                    type="text"
                    placeholder="e.g. Elephant"
                    value={form.favorite_animal}
                    onChange={handleChange}
                  />
                </div>

                <div className="patient-profile-field">
                  <label htmlFor="favorite_activity">
                    Favorite Activity
                  </label>

                  <input
                    id="favorite_activity"
                    name="favorite_activity"
                    type="text"
                    placeholder="e.g. Gardening"
                    value={form.favorite_activity}
                    onChange={handleChange}
                  />
                </div>

                <div className="patient-profile-field">
                  <label htmlFor="favorite_food">
                    Favorite Food
                  </label>

                  <input
                    id="favorite_food"
                    name="favorite_food"
                    type="text"
                    placeholder="e.g. Rice"
                    value={form.favorite_food}
                    onChange={handleChange}
                  />
                </div>

                <div className="patient-profile-field full">
                  <label htmlFor="favorite_place">
                    Favorite Place
                  </label>

                  <input
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

            <section className="patient-profile-section">
              <h2 className="patient-profile-section-title">
                Comfort Memory
              </h2>

              <p className="patient-profile-section-description">
                Save a short, familiar memory that can later be
                used to help calm and re-engage the patient after
                repeated difficulty.
              </p>

              <div className="patient-profile-field">
                <label htmlFor="comfort_memory">
                  Familiar Memory
                </label>

                <textarea
                  id="comfort_memory"
                  name="comfort_memory"
                  placeholder="e.g. Family Wedding — a beautiful day with the whole family in Jaipur."
                  value={form.comfort_memory}
                  onChange={handleChange}
                />

                <p className="patient-profile-help">
                  Keep this warm, familiar, and easy to recognize.
                </p>
              </div>
            </section>

            {error && (
              <p
                style={{
                  margin: "20px 0 0",
                  color: "#a05a45",
                  fontWeight: "700",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
            )}

            <div className="patient-profile-save-row">
              <div className="patient-profile-message">
                {message}
              </div>

              <button
                className="patient-profile-submit"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Patient Preferences"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default PatientProfile;