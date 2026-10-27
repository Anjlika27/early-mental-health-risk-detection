
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: "blue" | "teal" | "violet" | "amber";
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "blue",
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-card-icon ${tone}`}>
        <Icon size={21} strokeWidth={1.8} />
      </div>

      <div className="stat-card-content">
        <p className="stat-card-title">{title}</p>
        <h3>{value}</h3>
        <p className="stat-card-description">{description}</p>
      </div>
    </article>
  );
}
