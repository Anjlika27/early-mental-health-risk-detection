
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  HeartHandshake,
  UserRound,
  LogOut,
  Activity,
  X,
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/check-in", label: "Daily check-in", icon: ClipboardCheck },
  { to: "/journal", label: "My journal", icon: BookOpen },
  { to: "/support", label: "Support resources", icon: HeartHandshake },
  { to: "/profile", label: "My profile", icon: UserRound },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();

  function logout() {
    sessionStorage.removeItem("mindful-demo-session");
    onClose?.();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">
          <Activity size={22} />
        </span>
        <span>
          Mindful<span className="brand-accent">Path</span>
        </span>
        {onClose && (
          <button
            className="icon-button mobile-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="sidebar-caption">WORKSPACE</div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <div className="help-icon">
            <HeartHandshake size={20} />
          </div>
          <strong>Need support?</strong>
          <p>You don't have to navigate things alone.</p>
          <button onClick={() => navigate("/support")}>
            Explore resources →
          </button>
        </div>

        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={18} />
          <span>Sign out</span>
        </button>

      </div>
    </aside>
  );
}
