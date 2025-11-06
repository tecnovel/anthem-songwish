import Head from "next/head";
import Script from "next/script";
import type { NextPage } from "next";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import SongSearchModal from "../components/SongSearchModal";
import type { Track } from "../components/SongSearch";

const MAX_SONGS = 3;

const HomePage: NextPage = () => {
  const [selectedTracks, setSelectedTracks] = useState<Array<Track | null>>(
    () => Array(MAX_SONGS).fill(null)
  );
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [modalInitialQuery, setModalInitialQuery] = useState<
    string | undefined
  >(undefined);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    try {
      const raw = router.query.channel;
      const value = Array.isArray(raw) ? raw[0] : raw;
      if (typeof value === "string" && value.trim().length > 0) {
        setChannel(value.trim());
        setChannelError(null);
      } else {
        setChannel(null);
      }
    } catch (error) {
      console.error("Failed to parse channel from query", error);
      setChannel(null);
      setChannelError("Channel-Parameter konnte nicht gelesen werden.");
    }
  }, [router.isReady, router.query.channel]);

  const hasAnySelection = useMemo(
    () => selectedTracks.some((track) => track !== null),
    [selectedTracks]
  );

  const openSearchForSlot = (slotIndex: number) => {
    setActiveSlotIndex(slotIndex);
    const track = selectedTracks[slotIndex];
    if (track) {
      setModalInitialQuery(`${track.name} ${track.artists}`);
    } else {
      setModalInitialQuery(undefined);
    }
    setIsSearchOpen(true);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setActiveSlotIndex(null);
    setModalInitialQuery(undefined);
  };

  const handleSelectTrack = (track: Track) => {
    if (activeSlotIndex === null) {
      return;
    }

    const existsInOtherSlot = selectedTracks.some(
      (selected, index) =>
        selected?.id === track.id && index !== activeSlotIndex
    );

    if (existsInOtherSlot) {
      alert("Du hast diesen Song bereits ausgewählt.");
      return;
    }

    setSelectedTracks((prev) => {
      const copy = [...prev];
      copy[activeSlotIndex] = track;
      return copy;
    });
    setSubmitSuccess(null);
    // close the search modal after selecting a track so the change is applied immediately
    closeSearch();
  };

  const handleRemoveTrack = (index: number) => {
    setSelectedTracks((prev) => {
      const copy = [...prev];
      copy[index] = null;
      return copy;
    });
    setSubmitSuccess(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // client-side email validation: basic structure + TLD (e.g. .ch, .com, .de)
    const normalizedEmail = email.trim();
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!basicEmailRegex.test(normalizedEmail)) {
      setEmailError(
        "Bitte gib eine gültige E‑Mail-Adresse an (z.B. name@example.com)."
      );
      setSubmitError(null);
      return;
    }
    setEmailError(null);

    if (!hasAnySelection) {
      setSubmitError("Bitte wähle mindestens einen Song aus.");
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitting(true);

    const tracksToSubmit = selectedTracks.filter(
      (track): track is Track => track !== null
    );

    try {
      const emailToSend = normalizedEmail;
      const response = await fetch("/api/wish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: emailToSend,
          tracks: tracksToSubmit,
          channel: channel ?? undefined,
        }),
      });

      const data: { success?: boolean; message?: string; error?: string } =
        await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        // Prefer a server-provided error message when available so the user sees validation issues
        const apiError =
          data.error ?? "Dein Songwunsch konnte nicht gespeichert werden.";
        setSubmitError(apiError);
        return;
      }

      setSubmitSuccess(data.message ?? "Deine Songwünsche wurden gespeichert.");
    } catch (error) {
      console.error("Wish submission failed", error);
      // If we catch here, prefer the caught error message when available
      const message =
        error instanceof Error
          ? error.message
          : "Beim Speichern deiner Songwünsche ist ein Fehler aufgetreten.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Song Wish</title>
        <meta
          name="description"
          content="Wähle deine Nightlife-Favoriten – bis zu drei Tracks, die an der Greatest Party Anthems Primetime laufen sollen."
        />
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
        className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14"
        style={{
          background:
            "radial-gradient(120% 110% at 50% -10%, rgba(255,0,128,0.35), rgba(14,14,20,0.96) 65%)",
        }}
      >
        <section
          className="w-full overflow-hidden rounded-[28px] px-7 py-8 shadow-[0_24px_48px_rgba(0,0,0,0.55)] sm:px-9"
          style={{
            backdropFilter: "blur(24px)",
            background:
              "linear-gradient(140deg, rgba(24,24,32,0.92), rgba(20,20,28,0.65))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Greatest Party Anthems - Song Selection
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-gray-300 sm:text-base">
            Wähle bis zu drei Tracks, die auf die Primetime-Playlist gehören. Je
            öfter ein Song genannt wird, desto grösser die Chance, dass der
            Track gespielt wird.
          </p>
        </section>

        <section className="space-y-3">
          {Array.from({ length: MAX_SONGS }).map((_, idx) => {
            const track = selectedTracks[idx];

            return (
              <div
                key={idx}
                className="flex flex-col gap-4 rounded-3xl p-4 shadow-[0_18px_36px_rgba(0,0,0,0.5)] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                style={{
                  backdropFilter: "blur(18px)",
                  background:
                    "linear-gradient(150deg, rgba(28,28,36,0.88), rgba(22,22,32,0.62))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex flex-1 items-start gap-3 sm:items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-fuchsia-500 to-purple-600 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(244,63,94,0.35)]">
                    {idx + 1}
                  </span>
                  {track ? (
                    <div className="flex flex-1 items-start gap-3 sm:items-center">
                      {track.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.image_url}
                          alt={track.name}
                          className="h-16 w-16 rounded-2xl object-cover shadow-[0_16px_28px_rgba(0,0,0,0.55)]"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-700/60 text-xs text-gray-300">
                          Kein Bild
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-white sm:text-base">
                          {track.name}
                        </div>
                        <div className="text-xs text-gray-300 sm:text-sm">
                          {track.artists}
                        </div>
                        {track.album && (
                          <div className="text-xs text-gray-400 sm:text-sm">
                            Album: {track.album}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 sm:text-base">
                      Noch kein Song gewählt
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  {track && (
                    <button
                      type="button"
                      className="text-xs text-gray-400 underline transition hover:text-rose-300 sm:text-sm"
                      onClick={() => handleRemoveTrack(idx)}
                    >
                      Entfernen
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white transition sm:w-auto"
                    style={{
                      background:
                        "linear-gradient(125deg, rgba(252,70,100,0.85), rgba(110,15,255,0.85))",
                      boxShadow: "0 14px 28px rgba(250,70,120,0.32)",
                    }}
                    onClick={() => openSearchForSlot(idx)}
                  >
                    {track ? "Ändern" : "Song wählen"}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <section
          className="rounded-3xl p-5 shadow-[0_24px_42px_rgba(0,0,0,0.55)] sm:p-6"
          style={{
            background:
              "linear-gradient(140deg, rgba(22,22,32,0.92), rgba(28,24,48,0.7))",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(22px)",
          }}
        >
          <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">
            Deine Angaben
          </h2>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-200"
                  >
                    Vorname
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-200"
                  >
                    Nachname
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-200"
              >
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(null);
                }}
                className={`rounded-lg border px-3 py-2 text-sm placeholder-gray-400 focus:outline-none ${
                  emailError
                    ? "border-rose-400 bg-white/10 text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-white/10 bg-white/10 text-white focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-400/40"
                }`}
                required
              />
              {emailError && (
                <p className="mt-1 text-sm text-rose-400">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              style={{
                background:
                  "linear-gradient(115deg, rgba(255, 110, 50, 0.85), rgba(178, 55, 255, 0.85))",
                boxShadow: "0 14px 28px rgba(178, 55, 255, 0.3)",
              }}
            >
              {submitting ? "Sende..." : "Songwunsch abschicken"}
            </button>

            {submitError && (
              <p className="text-sm text-rose-400">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-sm text-emerald-400">{submitSuccess}</p>
            )}
            {channelError && (
              <p className="text-sm text-amber-400">{channelError}</p>
            )}
          </form>
        </section>
      </main>

      <SongSearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onSelect={handleSelectTrack}
        selectedTrackId={
          activeSlotIndex !== null
            ? selectedTracks[activeSlotIndex]?.id ?? null
            : null
        }
        initialQuery={modalInitialQuery}
      />
    </>
  );
};

export default HomePage;
