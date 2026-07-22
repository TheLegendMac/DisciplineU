import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Logo } from "./ui";

// Chrome/Android fire this before offering install; we defer it so we can show
// our own prompt at a friendlier moment. Not in the DOM lib's types yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "disciplineu-install-dismissed";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag when launched from home screen.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ masquerades as desktop Safari.
    (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  // Add-to-home-screen only works in real Safari, not Chrome/Firefox on iOS.
  const inAppBrowser = /crios|fxios|edgios/i.test(ua);
  return iOS && !inAppBrowser;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      localStorage.setItem(DISMISS_KEY, "1");
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — show manual instructions instead.
    if (isIosSafari()) {
      setIosHint(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 z-50 px-4 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] md:bottom-4">
      <div className="animate-rise mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="shrink-0">
          <Logo size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          {iosHint ? (
            <p className="text-[13px] leading-snug text-zinc-600 dark:text-zinc-300">
              Install: tap{" "}
              <Share size={13} className="mx-0.5 inline align-[-2px] text-amber-500 dark:text-amber-400" />
              then <span className="font-medium text-zinc-900 dark:text-zinc-100">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="text-[13px] leading-snug text-zinc-600 dark:text-zinc-300">
              Add DisciplineU to your home screen for a full-screen, offline app.
            </p>
          )}
        </div>
        {!iosHint && (
          <button
            onClick={install}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 active:bg-amber-500"
          >
            <Download size={15} /> Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
