
import { Bell, Menu, Search } from "lucide-react";
import { useAppData } from "../context/AppContext";

interface TopbarProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
}

export default function Topbar({
  onMenuClick,
  title = "Overview",
  subtitle = "Your personal wellbeing workspace",
}: TopbarProps) {
  const { data } = useAppData();
  const name = data.profile?.name?.trim() || "Guest";
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-heading">
        {onMenuClick && (
          <button
            className="icon-button mobile-menu"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
        )}

        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <label className="topbar-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search pages..."
            aria-label="Search pages"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.value = "";
              }
            }}
          />
        </label>

        <button
          className="icon-button notification-button"
          aria-label="Notifications"
          title="No new notifications"
          onClick={() => window.alert("You're all caught up!")}
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-avatar" title={name}>
          {initial}
        </div>
      </div>
    </header>
  );
}
