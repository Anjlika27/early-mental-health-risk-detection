import { useState, type FormEvent } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import { AppProvider, useAppData } from "./context/AppContext";
import logo from "./assets/mindfulpath-logo.png";
import "./App.css";

type RouteState = {
  from?: {
    pathname?: string;
  };
  message?: string;
};

/* ---------------- Logo ---------------- */

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="health-brand"
      aria-label="MindfulPath home"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 8 : 11,
        textDecoration: "none",
      }}
    >
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        style={{
          display: "block",
          width: compact ? 36 : 46,
          height: compact ? 36 : 46,
          objectFit: "contain",
          flexShrink: 0,
          background: "transparent",
          border: "none",
          borderRadius: 0,
          boxShadow: "none",
        }}
      />
      <span className="brand-wordmark">
        Mindful<span className="brand-light">Path</span>
      </span>
    </Link>
  );
}

/* ---------------- Background decoration ---------------- */

function WellnessBackdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        background:
          "radial-gradient(ellipse at 12% 18%, rgba(202, 174, 246, 0.20), transparent 34%), radial-gradient(ellipse at 88% 72%, rgba(224, 202, 250, 0.24), transparent 32%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 330,
          height: 330,
          top: "12%",
          left: "-190px",
          border: "1px solid rgba(145, 112, 204, 0.13)",
          borderRadius: "58% 42% 63% 37%",
          transform: "rotate(35deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 250,
          height: 250,
          right: "-130px",
          top: "38%",
          border: "1px solid rgba(145, 112, 204, 0.12)",
          borderRadius: "42% 58% 38% 62%",
          transform: "rotate(-28deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 190,
          height: 190,
          right: "8%",
          bottom: "-115px",
          border: "1px solid rgba(145, 112, 204, 0.10)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 85,
          height: 85,
          top: "22%",
          right: "18%",
          border: "1px solid rgba(145, 112, 204, 0.10)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

/* ---------------- Protected workspace ---------------- */

function ProtectedLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isLoggedIn =
    sessionStorage.getItem("mindful-demo-session") === "true";

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: "Please enter your details to open your workspace.",
        }}
      />
    );
  }

  const pageDetails: Record<
    string,
    { title: string; subtitle: string }
  > = {
    "/dashboard": {
      title: "Overview",
      subtitle: "Your personal wellbeing workspace",
    },
    "/check-in": {
      title: "Daily check-in",
      subtitle: "Take a moment to reflect on how you feel",
    },
    "/journal": {
      title: "My journal",
      subtitle: "A private space for personal reflection",
    },
    "/support": {
      title: "Support resources",
      subtitle: "Explore resources and ways to find support",
    },
    "/profile": {
      title: "My profile",
      subtitle: "Manage your demo profile and preferences",
    },
  };

  const details =
    pageDetails[location.pathname] ?? pageDetails["/dashboard"];

  return (
    <div
      className="app-shell"
      style={{ position: "relative", isolation: "isolate" }}
    >
      <WellnessBackdrop />

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`sidebar-container ${
          mobileOpen ? "mobile-open" : ""
        }`}
        style={{ position: "relative", zIndex: 1 }}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      <div
        className="main-area"
        style={{ position: "relative", zIndex: 1 }}
      >
        <Topbar
          title={details.title}
          subtitle={details.subtitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ---------------- Demo login ---------------- */

function Login() {
  const { updateProfile } = useAppData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const routeState = location.state as RouteState | null;
  const redirectTo = routeState?.from?.pathname;

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      setError("Enter your name and a valid email address.");
      return;
    }

    try {
      updateProfile({
        name: cleanName,
        email: cleanEmail,
        joinedAt: new Date().toISOString(),
      });

      sessionStorage.setItem("mindful-demo-session", "true");

      navigate(
        redirectTo &&
          typeof redirectTo === "string" &&
          redirectTo.startsWith("/") &&
          !redirectTo.startsWith("//")
          ? redirectTo
          : "/dashboard",
        { replace: true }
      );
    } catch {
      setError("We couldn't open your workspace. Please try again.");
    }
  }

  return (
    <div
      className="auth-page"
      style={{
        position: "relative",
        isolation: "isolate",
        minHeight: "100vh",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #fbf8ff 0%, #f4edff 48%, #fcfaff 100%)",
      }}
    >
      <WellnessBackdrop />

      <div style={{ position: "relative", zIndex: 1 }}>
        <header
          style={{
            padding: "26px clamp(20px, 6vw, 88px)",
          }}
        >
          <Logo />
        </header>

        <form
          className="auth-card"
          onSubmit={handleLogin}
          style={{
            position: "relative",
            zIndex: 1,
            border: "1px solid rgba(145, 112, 204, 0.16)",
            boxShadow: "0 24px 70px rgba(73, 48, 112, 0.09)",
            backdropFilter: "blur(10px)",
          }}
        >
          <span className="section-eyebrow">
            PERSONAL WELLBEING WORKSPACE
          </span>

          <h1>Welcome back</h1>

          <p>Enter your details to open your local demo workspace.</p>

          {routeState?.message && (
            <div className="auth-notice" role="status">
              {routeState.message}
            </div>
          )}

          <label>
            Your name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              maxLength={100}
              required
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="primary-action auth-submit"
            type="submit"
          >
            Open demo workspace →
          </button>

          <p className="auth-disclaimer">
            This is a frontend demo, not secure account authentication.
            Use synthetic data rather than sensitive personal information.
          </p>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Landing page ---------------- */

function Landing() {
  return (
    <div
      className="public-page"
      style={{
        position: "relative",
        isolation: "isolate",
        minHeight: "100vh",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #fbf8ff 0%, #f4edff 48%, #fcfaff 100%)",
      }}
    >
      <WellnessBackdrop />

      <header
        className="public-header"
        style={{
          position: "relative",
          zIndex: 1,
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(145, 112, 204, 0.10)",
        }}
      >
        <Logo />

        <Link className="primary-action" to="/login">
          Open demo workspace →
        </Link>
      </header>

      <section
        className="public-hero"
        style={{
          position: "relative",
          zIndex: 1,
          background: "transparent",
        }}
      >
        {/* The logo is displayed directly, without a surrounding white card. */}
        <img
          src={logo}
          alt="MindfulPath heart-and-leaf logo"
          style={{
            display: "block",
            width: 88,
            height: 88,
            margin: "0 auto 22px",
            padding: 0,
            objectFit: "contain",
            background: "transparent",
            border: "none",
            borderRadius: 0,
            boxShadow: "none",
          }}
        />

        <span className="section-eyebrow">
          PERSONAL WELLBEING PLATFORM
        </span>

        <h1>Understand your wellbeing, one day at a time.</h1>

        <p>
          Record daily mood, sleep, stress and activity. Review your own
          patterns and explore supportive resources at your own pace.
        </p>

        <Link className="primary-action" to="/login">
          Explore the dashboard →
        </Link>

        <div className="public-disclaimer">
          Student research prototype · Not a diagnostic tool
        </div>
      </section>
    </div>
  );
}

/* ---------------- Placeholder pages ---------------- */

function Placeholder({ title }: { title: string }) {
  return (
    <section className="panel placeholder-page">
      <h2>{title}</h2>
      <p>
        This page is being developed. Your existing workspace is available
        while this section is completed.
      </p>
    </section>
  );
}

/* ---------------- Routes ---------------- */

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route
          path="/journal"
          element={<Placeholder title="My journal" />}
        />
        <Route
          path="/support"
          element={<Placeholder title="Support resources" />}
        />
        <Route
          path="/profile"
          element={<Placeholder title="My profile" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}