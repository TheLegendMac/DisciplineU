import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, MessageSquareHeart, Settings, Sun, Moon, Sunrise, Target } from "lucide-react";
import { useStore } from "../lib/store";
import ReminderScheduler from "./ReminderScheduler";
import InstallPrompt from "./InstallPrompt";
import { Logo } from "./ui";

const NAV = [
  { to: "/app", label: "Today", icon: Sunrise, end: true },
  { to: "/app/goals", label: "Goals", icon: Target },
  { to: "/app/progress", label: "Progress", icon: BarChart3 },
  { to: "/app/review", label: "Review", icon: MessageSquareHeart },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      onClick={() => {
        setTheme(next);
        document.documentElement.classList.toggle("dark", next === "dark");
      }}
      aria-label={`Switch to ${next} mode`}
      className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function DemoBanner() {
  const demo = useStore((s) => s.demo);
  const resetAll = useStore((s) => s.resetAll);
  const navigate = useNavigate();
  if (!demo) return null;
  return (
    <div className="flex items-center justify-center gap-3 border-b border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-300">
      <span>Exploring with demo data</span>
      <button
        className="font-semibold underline underline-offset-2 hover:opacity-80"
        onClick={() => {
          resetAll();
          navigate("/onboarding");
        }}
      >
        Start fresh
      </button>
    </div>
  );
}

export default function AppShell() {
  return (
    <div className="min-h-dvh pt-[env(safe-area-inset-top)]">
      <ReminderScheduler />
      <InstallPrompt />
      <DemoBanner />
      <div className="mx-auto flex max-w-6xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-zinc-200 px-4 py-6 dark:border-zinc-800/80 md:flex">
          <div className="mb-8 px-2">
            <Logo />
          </div>
          <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-50"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/40 dark:hover:text-zinc-100"
                  }`
                }
              >
                <Icon size={17} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="px-2">
            <ThemeToggle />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-[#0b0b0e]/90 md:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                  isActive
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-500 dark:text-zinc-500"
                }`
              }
            >
              <Icon size={19} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
