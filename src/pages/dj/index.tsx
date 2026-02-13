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

type Tab = "queue" | "saved";

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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});

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
      else setSavedItems(data.items ?? []);
    } catch {
      setFetchError("Netzwerkfehler");
    }
  }, []);

  const fetchBoth = useCallback(() => {
    void fetchTab("queue");
    void fetchTab("saved");
  }, [fetchTab]);

  useEffect(() => {
    if (!authed) return;
    fetchBoth();
    intervalRef.current = setInterval(fetchBoth, POLL_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [authed, fetchBoth]);

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
      fetchBoth();
    } finally {
      setPending((p) => { const n = { ...p }; delete n[id]; return n; });
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

  const items = tab === "queue" ? queueItems : savedItems;

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
              {fetchError && <span className="text-xs text-red-400">{fetchError}</span>}
            </div>
            {/* Tabs */}
            <div className="flex gap-1">
              {(["queue", "saved"] as Tab[]).map((t) => {
                const count = t === "queue" ? queueItems.length : savedItems.length;
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {t === "queue" ? "Queue" : "Saved"}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
                        active
                          ? t === "queue"
                            ? "bg-rose-500 text-white"
                            : "bg-amber-500 text-gray-950"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {count}
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
              {tab === "queue" ? "Keine neuen Requests" : "Noch nichts gespeichert"}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 rounded-2xl bg-gray-900 p-3"
                >
                  {req.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={req.imageUrl}
                      alt={req.trackName}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-800" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold text-white leading-tight">
                      {req.trackName}
                    </div>
                    <div className="truncate text-xs text-gray-400 mt-0.5">
                      {req.trackArtists}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-medium text-gray-300">{req.name}</span>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-xs text-gray-600">{timeAgo(req.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Save / Unsave */}
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

                    {/* Dismiss / Played */}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
