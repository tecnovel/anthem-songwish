import Head from "next/head";
import Script from "next/script";
import type { NextPage } from "next";
import React, { FormEvent, useState } from "react";

import SongSearchModal from "../components/SongSearchModal";
import type { Track } from "../components/SongSearch";

const igHandle = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE;

const HomePage: NextPage = () => {
  const [name, setName] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setSubmitError("Bitte gib deinen Namen ein.");
      return;
    }
    if (!selectedTrack) {
      setSubmitError("Bitte wähle einen Song aus.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          trackId: selectedTrack.id,
          trackName: selectedTrack.name,
          trackArtists: selectedTrack.artists,
          album: selectedTrack.album,
          imageUrl: selectedTrack.image_url,
          spotifyUrl: selectedTrack.spotify_url,
          durationMs: selectedTrack.duration_ms,
        }),
      });

      const data: { success?: boolean; error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.success) {
        setSubmitError(data.error ?? "Dein Request konnte nicht gesendet werden.");
        return;
      }

      setSubmitSuccess(true);
    } catch {
      setSubmitError("Ein Fehler ist aufgetreten. Bitte versuch es nochmal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Song Request</title>
        <meta name="description" content="Schick dem DJ deinen Wunsch-Song." />
      </Head>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
      <main
        className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5 py-12"
        style={{
          background: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(180,10,50,0.4) 0%, #0a0a0f 55%)",
        }}
      >
        {submitSuccess ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(220,20,60,0.15)", border: "1px solid rgba(220,20,60,0.3)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-rose-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Request gesendet!</p>
              <p className="mt-1 text-sm text-gray-500">Der DJ hat deinen Song erhalten.</p>
            </div>
            <button
              type="button"
              onClick={() => { setSubmitSuccess(false); setName(""); setSelectedTrack(null); }}
              className="mt-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10"
            >
              Noch einen senden
            </button>
            {igHandle && (
              <a
                href={`https://www.instagram.com/${igHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
                @{igHandle}
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Song Request
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Schick dem DJ deinen Wunsch-Song.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Dein Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Anna"
                  className="block w-full rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-white/20 focus:outline-none"
                  required
                />
              </div>

              {/* Song */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Song
                </label>
                {selectedTrack ? (
                  <div
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {selectedTrack.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedTrack.image_url}
                        alt={selectedTrack.name}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-white/5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-white">{selectedTrack.name}</div>
                      <div className="truncate text-xs text-gray-500 mt-0.5">{selectedTrack.artists}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(true)}
                      className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10"
                    >
                      Ändern
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-3.5 text-sm font-medium text-gray-400 transition hover:bg-white/8 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Song suchen
                  </button>
                )}
              </div>

              {submitError && (
                <p className="text-xs text-red-400">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedTrack || !name.trim()}
                className="mt-1 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #dc143c, #8b0050)",
                  boxShadow: "0 8px 24px rgba(220,20,60,0.3)",
                }}
              >
                {submitting ? "Sende..." : "Request abschicken"}
              </button>
            </form>

            {igHandle && (
              <div className="mt-8 flex justify-center">
                <a
                  href={`https://www.instagram.com/${igHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                  </svg>
                  @{igHandle}
                </a>
              </div>
            )}
          </>
        )}
      </main>

      <SongSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleSelectTrack}
        selectedTrackId={selectedTrack?.id ?? null}
      />
    </>
  );
};

export default HomePage;
