import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";

export type TopTabKey =
  | "dashboard"
  | "planner"
  | "tasks"
  | "schedule"
  | "courses"
  | "scholarships"
  | "textbooks"
  | "settings";

export default function TopTabsInline({ active }: { active?: TopTabKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    { key: "dashboard" as const, label: "Dashboard", path: "/" },
    { key: "planner" as const, label: "Academic Planner", path: "/planner" },
    { key: "tasks" as const, label: "Task Tracker", path: "/tasks" },
    { key: "schedule" as const, label: "Schedule Planner", path: "/schedule" },
    { key: "courses" as const, label: "Course Planner", path: "/courses" },
    { key: "scholarships" as const, label: "Scholarships", path: "/scholarships" },
    { key: "textbooks" as const, label: "Textbooks", path: "/textbooks" },
    { key: "settings" as const, label: "Settings", path: "/settings" },
  ];

  // Infer active tab from URL if not provided
  const path = location.pathname;
  const inferred: TopTabKey | undefined = (() => {
    if (path === "/") return "dashboard";
    if (path.startsWith("/planner")) return "planner";
    if (path.startsWith("/tasks")) return "tasks";
    if (path.startsWith("/schedule")) return "schedule";
    if (path.startsWith("/course-planner") || path.startsWith("/courses")) return "courses";
    if (path.startsWith("/scholarships")) return "scholarships";
    if (path.startsWith("/textbooks")) return "textbooks";
    if (path.startsWith("/settings")) return "settings";
    return undefined;
  })();
  const activeKey = active ?? inferred;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((t) => (
        <Button
          key={t.key}
          variant={activeKey === t.key ? "default" : "outline"}
          className={`h-9 rounded-full transition-all duration-200 font-medium tracking-wide text-xs
            ${activeKey === t.key 
              ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90 text-white shadow-lg ring-2 ring-blue-200/50 dark:ring-blue-400/30 backdrop-blur-sm hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95" 
              : "bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30"
            }
            hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0`}
          onClick={() => navigate(t.path)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}
