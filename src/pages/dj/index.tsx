import Head from "next/head";
import React, { useCallback, useEffect, useRef, useState } from "react";

type SongRequest = {
  id: string;
  name: string;
  trackName: string;
  trackArtists: string;
  imageUrl: string | null;
  spotifyUrl: string | null;
  saved: boolean;
  createdAt: string;
};

type Tab = "queue" | "saved" | "played";

const SESSION_KEY = "dj_auth";
const POLL_INTERVAL_MS = 4000;

function timeAgo(isoString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  return `${Math.floor(diffMin / 60)}h`;
}

const DJPage: React.FC = () => {
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [tab, setTab] = useState<Tab>("queue");
  const [queueItems, setQueueItems] = useState<SongRequest[]>([]);
  const [savedItems, setSavedItems] = useState<SongRequest[]>([]);
  const [playedItems, setPlayedItems] = useState<SongRequest[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  const fetchTab = useCallback(async (t: Tab) => {
    try {
      const res = await fetch(`/api/dj/requests?tab=${t}`);
      const data: { items?: SongRequest[]; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) { setFetchError(data.error ?? "Fehler"); return; }
      setFetchError(null);
      if (t === "queue") setQueueItems(data.items ?? []);
      else if (t === "saved") setSavedItems(data.items ?? []);
      else setPlayedItems(data.items ?? []);
    } catch {
      setFetchError("Netzwerkfehler");
    }
  }, []);

  const fetchAll = useCallback(() => {
    void fetchTab("queue");
    void fetchTab("saved");
    void fetchTab("played");
  }, [fetchTab]);

  useEffect(() => {
    if (!authed) return;
    fetchAll();
    intervalRef.current = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [authed, fetchAll]);

  const patch = async (id: string, action: "played" | "save" | "unsave") => {
    setPending((p) => ({ ...p, [id]: action }));
    const body =
      action === "played" ? { played: true }
      : action === "save"   ? { saved: true }
      : { saved: false };
    try {
      await fetch(`/api/dj/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchAll();
    } finally {
      setPending((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await fetch("/api/dj/requests", { method: "DELETE" });
      setQueueItems([]);
      setSavedItems([]);
      setPlayedItems([]);
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const token = (window as Window & { __DJ_TOKEN?: string }).__DJ_TOKEN;
    if (passwordInput === token) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const tabCounts: Record<Tab, number> = {
    queue: queueItems.length,
    saved: savedItems.length,
    played: playedItems.length,
  };

  const items = tab === "queue" ? queueItems : tab === "saved" ? savedItems : playedItems;

  if (!authed) {
    return (
      <>
        <Head><title>DJ Login</title><meta name="robots" content="noindex" /></Head>
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
          <div className="w-full max-w-xs">
            <div className="mb-8 text-center">
              <div className="text-4xl font-black tracking-tight text-white">DJ</div>
              <div className="mt-1 text-sm text-gray-500">Queue Manager</div>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setAuthError(false); }}
                placeholder="Passwort"
                autoFocus
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-white/20 focus:outline-none focus:ring-0"
              />
              {authError && <p className="text-xs text-red-400">Falsches Passwort.</p>}
              <button
                type="submit"
                className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
              >
                Einloggen
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>DJ Queue</title><meta name="robots" content="noindex" /></Head>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/5 bg-gray-950/95 px-4 pt-4 pb-0 backdrop-blur-sm">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold text-white">DJ Queue</span>
              <div className="flex items-center gap-2">
                {fetchError && <span className="text-xs text-red-400">{fetchError}</span>}
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Reset
                </button>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1">
              {(["queue", "saved", "played"] as Tab[]).map((t) => {
                const active = tab === t;
                const badgeColor =
                  t === "queue"  ? "bg-rose-500 text-white" :
                  t === "saved"  ? "bg-amber-500 text-gray-950" :
                                   "bg-gray-600 text-gray-300";
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex items-center gap-2 rounded-t-lg px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {t === "queue" ? "Queue" : t === "saved" ? "Saved" : "Played"}
                    <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${active ? badgeColor : "bg-white/10 text-gray-400"}`}>
                      {tabCounts[t]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-md px-3 py-4">
          {items.length === 0 ? (
            <div className="py-24 text-center text-sm text-gray-600">
              {tab === "queue" ? "Keine neuen Requests" : tab === "saved" ? "Noch nichts gespeichert" : "Noch keine gespielten Songs"}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((req) => (
                <div
                  key={req.id}
                  className={`flex items-center gap-3 rounded-2xl p-3 ${tab === "played" ? "bg-gray-900/50" : "bg-gray-900"}`}
                >
                  {req.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={req.imageUrl}
                      alt={req.trackName}
                      className={`h-12 w-12 shrink-0 rounded-lg object-cover ${tab === "played" ? "opacity-40" : ""}`}
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-800" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className={`truncate text-sm font-semibold leading-tight ${tab === "played" ? "text-gray-500" : "text-white"}`}>
                      {req.trackName}
                    </div>
                    <div className="truncate text-xs text-gray-500 mt-0.5">{req.trackArtists}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-xs font-medium ${tab === "played" ? "text-gray-600" : "text-gray-300"}`}>{req.name}</span>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-xs text-gray-700">{timeAgo(req.createdAt)}</span>
                    </div>
                  </div>

                  {tab !== "played" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tab === "queue" ? (
                        <button
                          onClick={() => patch(req.id, "save")}
                          disabled={!!pending[req.id]}
                          title="Für später speichern"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 transition hover:bg-amber-500/30 disabled:opacity-40"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => patch(req.id, "unsave")}
                          disabled={!!pending[req.id]}
                          title="Aus Saved entfernen"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/25 text-amber-400 transition hover:bg-amber-500/40 disabled:opacity-40"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => patch(req.id, "played")}
                        disabled={!!pending[req.id]}
                        title="Als gespielt markieren"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-40"
                      >
                        {pending[req.id] ? (
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-white">Alle Requests löschen?</h2>
            <p className="mt-2 text-sm text-gray-400">
              Diese Aktion löscht alle Einträge aus Queue, Saved und Played. Sie kann nicht rückgängig gemacht werden.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
              >
                Abbrechen
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-40"
              >
                {resetting ? "Lösche..." : "Alles löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export async function getServerSideProps() {
  return { props: { djToken: process.env.ADMIN_PASSWORD ?? "" } };
}

const DJPageWithToken: React.FC<{ djToken: string }> = ({ djToken }) => {
  useEffect(() => {
    (window as Window & { __DJ_TOKEN?: string }).__DJ_TOKEN = djToken;
  }, [djToken]);
  return <DJPage />;
};

export default DJPageWithToken;
