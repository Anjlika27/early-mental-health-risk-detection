import {
  Activity,
  ClipboardCheck,
  Clock3,
  Moon,
  Plus,
  Smile,
  TrendingUp,
  HeartPulse,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import { useAppData } from "../context/AppContext";

const moodLabels: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Very good",
};

function formatDate(date: string, includeYear = false) {
  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" as const } : {}),
  });
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
}

export default function Dashboard() {
  const { data } = useAppData();
  const navigate = useNavigate();

  const checkIns = [...data.checkIns].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const recent = [...checkIns].reverse().slice(0, 5);
  const latestCheckIn = checkIns[checkIns.length - 1];

  const chartData = checkIns.slice(-7).map((entry) => ({
    date: formatDate(entry.date),
    mood: entry.mood,
    sleep: entry.sleep,
    stress: entry.stress,
  }));

  const average = (values: number[]) =>
    values.length
      ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
      : "—";

  const averageMood = average(checkIns.map((entry) => entry.mood));
  const averageSleep = average(checkIns.map((entry) => entry.sleep));
  const averageStress = average(checkIns.map((entry) => entry.stress));

  const firstName = data.profile?.name?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <div>
          <span className="section-eyebrow">YOUR WELLBEING OVERVIEW</span>

          <h2>
            {greeting()}, {firstName}.
          </h2>

          <p>
            Take a moment for yourself. Every check-in helps you understand
            your own patterns over time.
          </p>

          <button
            type="button"
            className="primary-action"
            onClick={() => navigate("/check-in")}
          >
            <Plus size={17} aria-hidden="true" />
            Complete today's check-in
          </button>
        </div>

        <div className="welcome-illustration" aria-hidden="true">
          <Activity size={66} strokeWidth={1.2} />
        </div>
      </section>

      <div className="dashboard-section-heading">
        <div>
          <h2>Your personal overview</h2>
          <p>Summaries calculated from your saved check-ins.</p>
        </div>

        <span className="data-badge">
          <span />
          {checkIns.length} {checkIns.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <section className="stats-grid">
        <StatCard
          title="Check-ins recorded"
          value={String(checkIns.length)}
          description="All saved check-ins"
          icon={ClipboardCheck}
          tone="blue"
        />

        <StatCard
          title="Average mood"
          value={averageMood}
          description="On a scale of 1–5"
          icon={Smile}
          tone="teal"
        />

        <StatCard
          title="Average sleep"
          value={averageSleep === "—" ? "—" : `${averageSleep} h`}
          description="Hours per recorded night"
          icon={Moon}
          tone="violet"
        />

        <StatCard
          title="Journal entries"
          value={String(data.journalEntries.length)}
          description="Entries saved in your journal"
          icon={Clock3}
          tone="amber"
        />
      </section>

      <section className="dashboard-content-grid">
        <article className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <h3>Wellbeing trends</h3>
              <p>Your most recent recorded days</p>
            </div>

            <TrendingUp size={20} aria-hidden="true" />
          </div>

          {chartData.length >= 2 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid
                    stroke="#e9eef3"
                    strokeDasharray="4 4"
                  />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#7c8c9c" }}
                  />

                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11, fill: "#7c8c9c" }}
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "mood" ? "Mood (1–5)" : String(name),
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e9e4f5",
                      fontSize: 12,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="mood"
                    name="mood"
                    stroke="#2677a8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#2677a8" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <p className="chart-footnote">
                Mood ratings reflect your own reports and are not a clinical
                assessment.
              </p>
            </div>
          ) : (
            <div className="empty-chart">
              <div className="empty-icon">
                <TrendingUp size={27} aria-hidden="true" />
              </div>

              <h4>Your trends will appear here</h4>

              <p>
                Save at least two check-ins to see how your recorded mood
                changes over time.
              </p>

              <button
                type="button"
                className="secondary-action"
                onClick={() => navigate("/check-in")}
              >
                Add a check-in
              </button>
            </div>
          )}
        </article>

        <article className="panel sleep-panel">
          <div className="panel-heading">
            <div>
              <h3>Sleep history</h3>
              <p>Hours recorded per night</p>
            </div>

            <Moon size={20} aria-hidden="true" />
          </div>

          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 12, left: -18, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid
                  stroke="#e9eef3"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#7c8c9c" }}
                />

                <YAxis
                  domain={[0, "auto"]}
                  tick={{ fontSize: 11, fill: "#7c8c9c" }}
                />

                <Tooltip
                  formatter={(value) => [`${value} hours`, "Sleep"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e9e4f5",
                    fontSize: 12,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="sleep"
                  name="Sleep"
                  stroke="#159b91"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#159b91" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart compact">
              <Moon size={28} aria-hidden="true" />
              <p>Record your sleep for at least two days to see a trend.</p>
            </div>
          )}

          <div className="sleep-summary">
            <span>Recorded nights</span>
            <strong>{checkIns.length}</strong>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Stress overview</h3>
            <p>Your average self-reported stress rating</p>
          </div>

          <HeartPulse size={20} aria-hidden="true" />
        </div>

        <div className="stress-summary">
          <div>
            <span className="section-eyebrow">AVERAGE STRESS</span>
            <h2>{averageStress}{averageStress !== "—" ? " / 5" : ""}</h2>
            <p>
              {checkIns.length
                ? "Calculated from your recorded check-ins."
                : "Complete a check-in to start tracking your own ratings."}
            </p>
          </div>

          {chartData.length >= 2 && (
            <div className="stress-chart">
              <ResponsiveContainer width="100%" height={150}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid
                    stroke="#e9eef3"
                    strokeDasharray="4 4"
                  />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#7c8c9c" }}
                  />

                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 10, fill: "#7c8c9c" }}
                  />

                  <Tooltip
                    formatter={(value) => [`${value} / 5`, "Stress"]}
                  />

                  <Line
                    type="monotone"
                    dataKey="stress"
                    name="Stress"
                    stroke="#a078c8"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#a078c8" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent check-ins</h3>
            <p>Your latest saved wellbeing records</p>
          </div>

          <button
            type="button"
            className="text-action"
            onClick={() => navigate("/check-in")}
          >
            + New check-in
          </button>
        </div>

        {recent.length > 0 ? (
          <div className="table-scroll">
            <table className="checkin-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Mood</th>
                  <th scope="col">Stress</th>
                  <th scope="col">Sleep</th>
                  <th scope="col">Activity</th>
                </tr>
              </thead>

              <tbody>
                {recent.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date, true)}</td>
                    <td>
                      <span className="mood-pill">
                        {moodLabels[entry.mood] ?? "Not recorded"}
                      </span>
                    </td>
                    <td>{entry.stress}/5</td>
                    <td>{entry.sleep} h</td>
                    <td>{entry.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="recent-empty">
            <ClipboardCheck size={30} aria-hidden="true" />

            <h4>No check-ins yet</h4>

            <p>
              Your saved entries will appear here. Start with a quick daily
              reflection.
            </p>

            <button
              type="button"
              className="primary-action"
              onClick={() => navigate("/check-in")}
            >
              <Plus size={17} aria-hidden="true" />
              Record first check-in
            </button>
          </div>
        )}
      </section>

      {latestCheckIn && (
        <p className="chart-footnote">
          Latest recorded check-in: {formatDate(latestCheckIn.date, true)}.
          Your ratings are for personal reflection and do not establish a
          mental health diagnosis.
        </p>
      )}

      <p className="dashboard-disclaimer">
        <Activity size={15} aria-hidden="true" />
        This prototype supports personal reflection only. It does not
        diagnose or predict a mental health condition.
      </p>
    </div>
  );
}