
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Moon,
  Save,
  Smile,
  Sparkles,
  Wind,
} from "lucide-react";
import { useAppData } from "../context/AppContext";
import type { Mood } from "../types";

const moods: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: "😔", label: "Very low" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Very good" },
];

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CheckIn() {
  const { data, addCheckIn } = useAppData();
  const navigate = useNavigate();

  const today = getLocalDate();
  const existingToday = data.checkIns.find((item) => item.date === today);

  const [date, setDate] = useState(today);
  const [mood, setMood] = useState<Mood | null>(
    existingToday?.mood ?? null
  );
  const [stress, setStress] = useState(existingToday?.stress ?? 3);
  const [sleep, setSleep] = useState(existingToday?.sleep ?? 7);
  const [activity, setActivity] = useState<"Low" | "Moderate" | "High">(
    existingToday?.activity ?? "Moderate"
  );
  const [screenTime, setScreenTime] = useState(
    existingToday?.screenTime?.toString() ?? ""
  );
  const [notes, setNotes] = useState(existingToday?.notes ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleDateChange(value: string) {
    setDate(value);
    setSaved(false);
    setError("");

    const existing = data.checkIns.find((item) => item.date === value);

    setMood(existing?.mood ?? null);
    setStress(existing?.stress ?? 3);
    setSleep(existing?.sleep ?? 7);
    setActivity(existing?.activity ?? "Moderate");
    setScreenTime(existing?.screenTime?.toString() ?? "");
    setNotes(existing?.notes ?? "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!mood) {
      setError("Please select the mood that best describes your day.");
      return;
    }

    if (!date || date > today) {
      setError("Choose today or a date in the past.");
      return;
    }

    const hours = Number(sleep);
    const stressValue = Number(stress);
    const screenValue = screenTime === "" ? undefined : Number(screenTime);

    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      setError("Enter a valid number of sleep hours.");
      return;
    }

    if (!Number.isFinite(stressValue) || stressValue < 1 || stressValue > 5) {
      setError("Choose a stress rating from 1 to 5.");
      return;
    }

    if (
      screenValue !== undefined &&
      (!Number.isFinite(screenValue) || screenValue < 0 || screenValue > 24)
    ) {
      setError("Screen time must be between 0 and 24 hours.");
      return;
    }

    addCheckIn({
      date,
      mood,
      stress: stressValue,
      sleep: hours,
      activity,
      screenTime: screenValue,
      notes: notes.trim(),
    });

    setSaved(true);
  }

  return (
    <div className="checkin-page">
      <section className="checkin-intro">
        <div className="checkin-intro-icon">
          <Sparkles size={25} />
        </div>
        <div>
          <span className="section-eyebrow">YOUR DAILY REFLECTION</span>
          <h2>Make space for yourself.</h2>
          <p>
            There is no right or wrong answer. Take a moment to notice how
            you have been feeling.
          </p>
        </div>
      </section>

      <form className="checkin-form" onSubmit={handleSubmit}>
        <div className="checkin-form-heading">
          <div>
            <h2>Daily wellbeing check-in</h2>
            <p>Your reflections help you understand your personal patterns.</p>
          </div>

          <label className="checkin-date">
            <span>Entry date</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(event) => handleDateChange(event.target.value)}
              required
            />
          </label>
        </div>

        <div className="form-divider" />

        <section className="checkin-section">
          <div className="checkin-question">
            <span className="question-icon"><Smile size={21} /></span>
            <div>
              <h3>How are you feeling today?</h3>
              <p>Choose the feeling closest to your experience.</p>
            </div>
            <span className="optional-label">Required</span>
          </div>

          <div className="mood-options">
            {moods.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`mood-option ${
                  mood === item.value ? "selected" : ""
                }`}
                aria-pressed={mood === item.value}
                onClick={() => {
                  setMood(item.value);
                  setSaved(false);
                  setError("");
                }}
              >
                <span className="mood-emoji">{item.emoji}</span>
                <span className="mood-label">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="form-divider" />

        <section className="checkin-section">
          <div className="checkin-question">
            <span className="question-icon"><Wind size={21} /></span>
            <div>
              <h3>How stressed have you felt?</h3>
              <p>Rate your perceived stress today.</p>
            </div>
            <span className="range-value">{stress} / 5</span>
          </div>

          <input
            className="lavender-range"
            type="range"
            min="1"
            max="5"
            step="1"
            value={stress}
            onChange={(event) => {
              setStress(Number(event.target.value));
              setSaved(false);
            }}
            aria-label="Stress level from 1 to 5"
          />

          <div className="range-labels">
            <span>Very little</span>
            <span>Moderate</span>
            <span>Very high</span>
          </div>
        </section>

        <div className="form-divider" />

        <section className="checkin-section">
          <div className="checkin-question">
            <span className="question-icon"><Moon size={21} /></span>
            <div>
              <h3>How much did you sleep?</h3>
              <p>Estimate your total sleep in the last night.</p>
            </div>
            <span className="range-value">{sleep} hours</span>
          </div>

          <input
            className="lavender-range"
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={sleep}
            onChange={(event) => {
              setSleep(Number(event.target.value));
              setSaved(false);
            }}
            aria-label="Hours of sleep"
          />

          <div className="range-labels">
            <span>0 hours</span>
            <span>6 hours</span>
            <span>12 hours</span>
          </div>
        </section>

        <div className="form-divider" />

        <section className="checkin-section">
          <div className="checkin-question">
            <span className="question-icon"><Activity size={21} /></span>
            <div>
              <h3>How active were you?</h3>
              <p>Think about movement and physical activity today.</p>
            </div>
          </div>

          <div className="activity-options">
            {([
              ["Low", "A quieter day"],
              ["Moderate", "Some movement"],
              ["High", "Lots of movement"],
            ] as const).map(([value, description]) => (
              <button
                type="button"
                key={value}
                className={`activity-option ${
                  activity === value ? "selected" : ""
                }`}
                aria-pressed={activity === value}
                onClick={() => {
                  setActivity(value);
                  setSaved(false);
                }}
              >
                <span className="activity-radio">
                  {activity === value && <span />}
                </span>
                <span>
                  <strong>{value}</strong>
                  <small>{description}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="form-divider" />

        <section className="checkin-section">
          <div className="checkin-question">
            <span className="question-icon"><Clock3 size={21} /></span>
            <div>
              <h3>Time spent on screens</h3>
              <p>Optional: your approximate daily screen time in hours.</p>
            </div>
          </div>

          <div className="field-with-suffix">
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={screenTime}
              onChange={(event) => {
                setScreenTime(event.target.value);
                setSaved(false);
              }}
              placeholder="e.g. 5.5"
              aria-label="Screen time in hours"
            />
            <span>hours</span>
          </div>
        </section>

        <div className="form-divider" />

        <section className="checkin-section">
          <div className="checkin-question">
            <span className="question-icon"><Smile size={21} /></span>
            <div>
              <h3>Anything else on your mind?</h3>
              <p>Optional: add a short note about your day.</p>
            </div>
          </div>

          <textarea
            className="checkin-notes"
            rows={4}
            maxLength={1000}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved(false);
            }}
            placeholder="What stood out about today? What would you like to remember?"
          />
          <div className="character-count">{notes.length}/1000</div>
        </section>

        {error && (
          <div className="checkin-error" role="alert">
            {error}
          </div>
        )}

        {saved && (
          <div className="checkin-success" role="status">
            <CheckCircle2 size={20} />
            <div>
              <strong>Your check-in has been saved.</strong>
              <p>Your dashboard will reflect this entry.</p>
            </div>
          </div>
        )}

        <div className="checkin-submit-row">
          <p>Your feelings are yours. Take this one step at a time.</p>
          <button className="primary-action checkin-save" type="submit">
            <Save size={17} />
            {saved ? "Update check-in" : "Save check-in"}
            <ChevronRight size={16} />
          </button>
        </div>

        {saved && (
          <button
            type="button"
            className="checkin-dashboard-link"
            onClick={() => navigate("/dashboard")}
          >
            View your dashboard →
          </button>
        )}
      </form>

      <p className="checkin-footer-note">
        This check-in is a self-reflection tool, not a medical assessment.
      </p>
    </div>
  );
}
