import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "../components/ui";

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="DisciplineU home">
            <Logo size="sm" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft size={14} /> Home
          </Link>
        </div>
        <h1 className="mt-12 font-display text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="prose-sm mt-8 space-y-5 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <LegalShell title="Privacy">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">
        The short version: in this release, we can't see your data — at all.
      </p>
      <p>
        DisciplineU V1 runs entirely in your browser. Your goals, habits, completions, and
        reviews are stored in your device's local storage. There are no accounts, no servers,
        no analytics trackers, and no third-party data sharing, because there is no place your
        data goes.
      </p>
      <p>
        You can export a complete copy of your data as JSON, or permanently erase it, anytime
        from Settings. Clearing your browser storage also deletes it.
      </p>
      <p>
        When optional cloud sync ships (with Pro), it will be opt-in, clearly labeled, and
        covered by an updated policy before anything leaves your device. AI plan generation in
        a future release may send your goal text (never your history) to our servers to
        generate a plan; we will disclose exactly what is sent when that ships.
      </p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        This page describes the current preview build and will grow into a full policy before
        general availability.
      </p>
    </LegalShell>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms of use">
      <p>
        DisciplineU is a personal planning tool provided as-is during this preview period. Use
        it as a companion for building habits and pursuing goals you choose.
      </p>
      <p className="font-medium text-zinc-900 dark:text-zinc-100">
        DisciplineU is not a medical device, a therapy service, or a source of professional
        advice.
      </p>
      <p>
        It does not diagnose, treat, or advise on medical, psychological, financial, or legal
        matters. Suggestions are general-purpose habit structure, not prescriptions. For
        anything affecting your health or safety, consult a qualified professional. If you are
        in crisis, call or text 988 in the US, or find local support at findahelpline.com.
      </p>
      <p>
        Your data stays on your device in this release; you are responsible for exporting
        backups if you need them. We may update the product and these terms as DisciplineU
        evolves — material changes will be announced in the app.
      </p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        This page describes the current preview build and will grow into full terms before
        general availability.
      </p>
    </LegalShell>
  );
}
