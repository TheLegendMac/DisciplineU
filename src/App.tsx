import { Component, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import { Button } from "./components/ui";
import { useStore } from "./lib/store";
import Goals from "./pages/Goals";
import Landing from "./pages/Landing";
import { Privacy, Terms } from "./pages/Legal";
import NewGoal from "./pages/NewGoal";
import Onboarding from "./pages/Onboarding";
import Progress from "./pages/Progress";
import Review from "./pages/Review";
import Settings from "./pages/Settings";
import Today from "./pages/Today";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-2xl font-semibold">Something went sideways</h1>
          <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Your data is safe on this device. Reloading usually fixes this.
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RequirePlanOrOnboarding({ children }: { children: ReactNode }) {
  const onboarded = useStore((s) => s.onboarded);
  if (!onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/app"
            element={
              <RequirePlanOrOnboarding>
                <AppShell />
              </RequirePlanOrOnboarding>
            }
          >
            <Route index element={<Today />} />
            <Route path="goals" element={<Goals />} />
            <Route path="new" element={<NewGoal />} />
            <Route path="progress" element={<Progress />} />
            <Route path="review" element={<Review />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
