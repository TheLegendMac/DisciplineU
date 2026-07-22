import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, Download, Moon, Sun, Trash2, Upload } from "lucide-react";
import type { Tone } from "../lib/types";
import { useStore } from "../lib/store";
import { TONE_LABELS } from "../lib/ai/engine";
import { Button, Card, Modal, SectionLabel } from "../components/ui";

export default function Settings() {
  const tone = useStore((s) => s.tone);
  const setTone = useStore((s) => s.setTone);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const resetAll = useStore((s) => s.resetAll);
  const importAll = useStore((s) => s.importAll);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "done" | "error">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      const ok = importAll(parsed);
      setImportStatus(ok ? "done" : "error");
      if (ok) {
        const t = useStore.getState().theme;
        document.documentElement.classList.toggle("dark", t === "dark");
      }
    } catch {
      setImportStatus("error");
    }
  }

  function exportData() {
    const raw = localStorage.getItem("disciplineu-v1") ?? "{}";
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disciplineu-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>

      <div className="mt-8 space-y-8">
        {/* Coach tone */}
        <section>
          <SectionLabel>Coach voice</SectionLabel>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            How your coach talks to you — in nudges, reviews, and recoveries.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                aria-pressed={tone === t}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  tone === t
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                }`}
              >
                <p className="font-semibold">{TONE_LABELS[t].name}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  “{TONE_LABELS[t].sample}”
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section>
          <SectionLabel>Appearance</SectionLabel>
          <div className="mt-4 flex gap-3">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  document.documentElement.classList.toggle("dark", t === "dark");
                }}
                aria-pressed={theme === t}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                }`}
              >
                {t === "dark" ? <Moon size={15} /> : <Sun size={15} />}
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Data */}
        <section>
          <SectionLabel>Your data</SectionLabel>
          <Card className="mt-4">
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Everything lives in this browser — goals, habits, completions, reviews. Nothing is
              sent anywhere. Export a JSON copy anytime, or erase it all.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="soft" onClick={exportData}>
                <Download size={14} /> Export JSON
              </Button>
              <Button size="sm" variant="soft" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Import backup
              </Button>
              <Button size="sm" variant="danger" onClick={() => setResetConfirm(true)}>
                <Trash2 size={14} /> Erase everything
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                aria-label="Import backup file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importData(file);
                  e.target.value = "";
                }}
              />
            </div>
            {importStatus === "done" && (
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                Backup imported — everything on this device was replaced with the file's data.
              </p>
            )}
            {importStatus === "error" && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                That file doesn't look like a DisciplineU export. Nothing was changed.
              </p>
            )}
          </Card>
        </section>

        {/* Reminders */}
        <section>
          <SectionLabel>Reminders</SectionLabel>
          <ReminderSettings />
        </section>

        {/* About */}
        <section>
          <SectionLabel>About</SectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            DisciplineU v0.1 — an AI coach that turns who you want to become into what you do
            today.{" "}
            <Link className="underline underline-offset-2" to="/privacy">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link className="underline underline-offset-2" to="/terms">
              Terms
            </Link>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
            DisciplineU is a planning tool, not a medical or mental-health service. If you're
            struggling, call or text 988 (US) — support is free and always open.
          </p>
        </section>
      </div>

      <ResetModal open={resetConfirm} onClose={() => setResetConfirm(false)} resetAll={resetAll} />
    </div>
  );
}

function ReminderSettings() {
  const reminders = useStore((s) => s.reminders);
  const setReminders = useStore((s) => s.setReminders);
  const supported = typeof Notification !== "undefined";
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    supported ? Notification.permission : "unsupported",
  );

  async function toggle() {
    if (reminders) {
      setReminders(false);
      return;
    }
    if (!supported) return;
    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }
    if (perm === "granted") setReminders(true);
  }

  return (
    <Card className="mt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Nudge me at habit times</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            A notification when a habit's set time arrives and it isn't done yet. Works while
            the app is open or installed; set times from the Today page.
          </p>
        </div>
        <Button
          size="sm"
          variant={reminders ? "primary" : "soft"}
          onClick={() => void toggle()}
          disabled={permission === "unsupported" || permission === "denied"}
          aria-pressed={reminders}
        >
          <BellRing size={14} /> {reminders ? "On" : "Off"}
        </Button>
      </div>
      {permission === "denied" && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          Notifications are blocked for this site in your browser settings — allow them there,
          then flip this on.
        </p>
      )}
      {permission === "unsupported" && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          This browser doesn't support notifications.
        </p>
      )}
    </Card>
  );
}

function ResetModal({
  open,
  onClose,
  resetAll,
}: {
  open: boolean;
  onClose: () => void;
  resetAll: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Erase everything?">
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        This permanently deletes all goals, habits, history, and reviews from this device.
        There's no undo — consider exporting first.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            resetAll();
            onClose();
          }}
        >
          Erase everything
        </Button>
      </div>
    </Modal>
  );
}
