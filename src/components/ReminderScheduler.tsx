import { useEffect, useRef } from "react";
import { useStore } from "../lib/store";
import { activeGoals, isDoneOn } from "../lib/selectors";
import { nowTimeKey, todayKey } from "../lib/dates";

// Renders nothing; while the app is open (tab or installed PWA) it fires a
// notification when a timed habit's moment arrives and it isn't done yet.
// True background push would need a server, which this app deliberately lacks.
export default function ReminderScheduler() {
  const reminders = useStore((s) => s.reminders);
  const goals = useStore((s) => s.goals);
  const completions = useStore((s) => s.completions);
  const fired = useRef(new Set<string>());

  useEffect(() => {
    if (!reminders || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const check = () => {
      const now = nowTimeKey();
      const today = todayKey();
      for (const goal of activeGoals(goals)) {
        for (const habit of goal.habits) {
          if (habit.status !== "active" || habit.time !== now) continue;
          if (isDoneOn(completions, habit.id, today)) continue;
          const key = `${habit.id}|${today}`;
          if (fired.current.has(key)) continue;
          fired.current.add(key);
          const title = "DisciplineU";
          const options = { body: habit.title, icon: "/icon-192.png", tag: key };
          // Android requires notifications to go through the service worker.
          if (navigator.serviceWorker) {
            void navigator.serviceWorker.getRegistration().then((reg) => {
              if (reg) void reg.showNotification(title, options);
              else new Notification(title, options);
            });
          } else {
            new Notification(title, options);
          }
        }
      }
    };

    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [reminders, goals, completions]);

  return null;
}
