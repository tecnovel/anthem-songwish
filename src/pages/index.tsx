import Head from "next/head";
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
      const response = await fetch("/api/wish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          tracks: tracksToSubmit,
          channel: channel ?? undefined,
        }),
      });

      const data: { success?: boolean; message?: string; error?: string } =
        await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ?? "Dein Songwunsch konnte nicht gespeichert werden."
        );
      }

      setSubmitSuccess(data.message ?? "Deine Songwünsche wurden gespeichert.");
    } catch (error) {
      console.error("Wish submission failed", error);
      setSubmitError(
        "Beim Speichern deiner Songwünsche ist ein Fehler aufgetreten."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Anthem Party – Songwunsch</title>
        <meta
          name="description"
          content="Such deine Lieblingssongs, wähle bis zu drei Favoriten aus und steigere die Chancen, dass sie zur Primetime gespielt werden."
        />
      </Head>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <section className="w-full overflow-hidden rounded-xl bg-white px-5 py-6 shadow-md sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Anthem Party – Songwunsch
          </h1>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            Wähle bis zu drei Songs aus, füge deinen Namen hinzu und sende
            deinen Wunsch ab.
          </p>
        </section>

        <section className="space-y-3">
          {Array.from({ length: MAX_SONGS }).map((_, idx) => {
            const track = selectedTracks[idx];

            return (
              <div
                key={idx}
                className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="flex flex-1 items-start gap-3 sm:items-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                    {idx + 1}
                  </span>
                  {track ? (
                    <div className="flex flex-1 items-start gap-3 sm:items-center">
                      {track.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.image_url}
                          alt={track.name}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-600">
                          Kein Bild
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 sm:text-base">
                          {track.name}
                        </div>
                        <div className="text-xs text-gray-600 sm:text-sm">
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
                    <div className="text-sm text-gray-500 sm:text-base">
                      Noch kein Song gewählt
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {track && (
                    <button
                      type="button"
                      className="text-xs text-gray-500 underline sm:text-sm"
                      onClick={() => handleRemoveTrack(idx)}
                    >
                      Entfernen
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900 sm:w-auto"
                    onClick={() => openSearchForSlot(idx)}
                  >
                    {track ? "Ändern" : "Song wählen"}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 sm:text-xl">
            Deine Angaben
          </h2>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Vorname
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Nachname
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {submitting ? "Sende..." : "Songwunsch abschicken"}
            </button>

            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-sm text-green-600">{submitSuccess}</p>
            )}
            {channelError && (
              <p className="text-sm text-yellow-600">{channelError}</p>
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
