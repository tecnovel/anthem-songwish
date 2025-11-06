import Head from "next/head";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type GroupedItem = {
  trackId: string;
  trackName: string;
  trackArtists: string;
  album?: string | null;
  imageUrl?: string | null;
  spotifyUrl?: string | null;
  durationMs?: number | null;
  voteCount: number;
};

type RawItem = {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  trackId: string;
  trackName: string;
  trackArtists: string;
  album?: string | null;
  imageUrl?: string | null;
  spotifyUrl?: string | null;
  durationMs?: number | null;
  slotIndex: number;
  channel?: string | null;
};

type ApiResponse =
  | { grouped: true; items: GroupedItem[] }
  | { grouped: false; items: RawItem[] };

type ApiError = { error: string };

const AdminPage: React.FC = () => {
  const [grouped, setGrouped] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupedItems, setGroupedItems] = useState<GroupedItem[]>([]);
  const [rawItems, setRawItems] = useState<RawItem[]>([]);

  const searchRef = useRef<string>("");

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("grouped", grouped ? "true" : "false");
    if (search.trim()) {
      params.set("q", search.trim());
    }
    return `/api/admin/export?${params.toString()}`;
  }, [grouped, search]);

  const fetchData = useCallback(
    async (effectiveGrouped: boolean, effectiveSearch: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("grouped", effectiveGrouped ? "true" : "false");
        if (effectiveSearch) {
          params.set("q", effectiveSearch);
        }

        const response = await fetch(
          `/api/admin/song-wishes?${params.toString()}`
        );
        const data: ApiResponse | ApiError = await response.json();

        if (!response.ok || "error" in data) {
          throw new Error((data as ApiError).error ?? "Failed to load data");
        }

        if (data.grouped) {
          setGroupedItems(data.items);
          setRawItems([]);
        } else {
          setRawItems(data.items);
          setGroupedItems([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchData(grouped, searchRef.current.trim());
  }, [grouped, fetchData]);

  const handleSearch = useCallback(() => {
    void fetchData(grouped, search.trim());
  }, [fetchData, grouped, search]);

  const handleToggleGrouped = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setGrouped(event.target.checked);
    },
    []
  );

  // modal for showing detailed voters for a grouped track
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<GroupedItem | null>(null);
  const [detailsRows, setDetailsRows] = useState<RawItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const openDetails = useCallback(async (item: GroupedItem) => {
    setDetailsItem(item);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      // try to request raw entries for this trackId; backend may ignore trackId, so filter client-side as fallback
      const params = new URLSearchParams();
      params.set("grouped", "false");
      params.set("trackId", item.trackId);

      const res = await fetch(`/api/admin/song-wishes?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && data.error) || `Fehler beim Laden (${res.status})`
        );
      }

      // if API returned raw items, filter by trackId; otherwise empty
      const rows: RawItem[] = Array.isArray(data?.items)
        ? (data.items as RawItem[])
        : [];

      // Some backends might ignore trackId param; ensure filtering client-side
      const filtered = rows.filter((r) => r.trackId === item.trackId);
      setDetailsRows(filtered);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : String(err));
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    setDetailsItem(null);
    setDetailsRows([]);
    setDetailsError(null);
  }, []);

  return (
    <>
      <Head>
        <title>Admin – Songwünsche</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="flex flex-col gap-2 text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              Admin – Songwünsche
            </h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Übersicht der eingegangenen Songwünsche. Nutze die Optionen, um
              nach Songs oder Gästen zu filtern und die Daten zu exportieren.
            </p>
          </header>

          <section className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Suche nach Song, Artist oder Gast..."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 sm:w-auto"
                >
                  Suchen
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={grouped}
                    onChange={handleToggleGrouped}
                    className="h-4 w-4"
                  />
                  <span>Songs gruppieren (Ranking)</span>
                </label>

                <a
                  href={exportHref}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                >
                  Export als CSV
                </a>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            {loading && <p className="text-sm text-gray-500">Lade...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && grouped && (
              <>
                <div className="hidden md:block -mx-4 overflow-x-auto sm:-mx-6 lg:mx-0">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2 whitespace-nowrap">#</th>
                        <th className="px-3 py-2 whitespace-nowrap">Votes</th>
                        <th className="px-3 py-2 whitespace-nowrap">Track</th>
                        <th className="px-3 py-2 whitespace-nowrap">Artists</th>
                        <th className="px-3 py-2 whitespace-nowrap">Album</th>
                        <th className="px-3 py-2 whitespace-nowrap">Spotify</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupedItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-4 text-center text-sm text-gray-500"
                          >
                            Keine Einträge gefunden.
                          </td>
                        </tr>
                      )}
                      {groupedItems.map((item, index) => (
                        <tr
                          key={item.trackId}
                          onClick={() => openDetails(item)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                            {item.voteCount}
                          </td>
                          <td className="px-3 py-2 text-gray-900 whitespace-nowrap truncate max-w-56">
                            {item.trackName}
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap truncate max-w-44">
                            {item.trackArtists}
                          </td>
                          <td className="px-3 py-2 text-gray-500 whitespace-nowrap truncate max-w-40">
                            {item.album ?? ""}
                          </td>
                          <td className="px-4 py-3">
                            {item.spotifyUrl ? (
                              <a
                                href={item.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  className="h-4 w-4"
                                  aria-hidden
                                >
                                  <path
                                    d="M15 3v4a2 2 0 0 1-2 2H7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M10 14L21 3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Spotify
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* mobile stacked cards */}
                <div className="md:hidden flex flex-col gap-3">
                  {groupedItems.length === 0 && (
                    <div className="px-4 py-4 text-center text-sm text-gray-500">
                      Keine Einträge gefunden.
                    </div>
                  )}
                  {groupedItems.map((item, index) => (
                    <div
                      key={item.trackId}
                      onClick={() => openDetails(item)}
                      className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold">
                              {index + 1}
                            </span>
                            <div className="font-semibold text-gray-900 truncate">
                              {item.trackName}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {item.trackArtists}
                          </div>
                          {item.album ? (
                            <div className="text-sm text-gray-500 truncate">
                              {item.album}
                            </div>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm text-gray-700 font-semibold whitespace-nowrap">
                            {item.voteCount}×
                          </div>
                          {item.spotifyUrl ? (
                            <a
                              href={item.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="h-4 w-4"
                                aria-hidden
                              >
                                <path
                                  d="M15 3v4a2 2 0 0 1-2 2H7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M10 14L21 3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Spotify
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Details modal */}
            {detailsOpen && detailsItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={closeDetails}
                />
                <div className="relative z-10 max-w-2xl w-full rounded-lg bg-white shadow-lg">
                  <div className="flex items-start justify-between border-b px-4 py-3">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {detailsItem.trackName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {detailsItem.trackArtists}
                      </div>
                    </div>
                    <button
                      onClick={closeDetails}
                      className="ml-4 rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                    >
                      Schliessen
                    </button>
                  </div>

                  <div className="px-4 py-4">
                    <div className="flex gap-4">
                      {detailsItem.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={detailsItem.imageUrl}
                          alt={detailsItem.trackName}
                          className="h-28 w-28 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-28 w-28 rounded-md bg-gray-100" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-700 mb-2">
                            Album: {detailsItem.album ?? "—"}
                          </div>
                          {detailsItem.spotifyUrl && (
                            <a
                              href={detailsItem.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="h-4 w-4"
                                aria-hidden
                              >
                                <path
                                  d="M3 12h18"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M14 5l7 7-7 7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Auf Spotify öffnen
                            </a>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          Votes: {detailsItem.voteCount}
                        </div>
                        <div className="text-sm text-gray-700">
                          Dauer:{" "}
                          {detailsItem.durationMs
                            ? Math.round((detailsItem.durationMs || 0) / 1000) +
                              "s"
                            : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Gewählt von
                      </h3>
                      {detailsLoading && (
                        <p className="text-sm text-gray-600">Lade…</p>
                      )}
                      {detailsError && (
                        <p className="text-sm text-red-600">{detailsError}</p>
                      )}
                      {!detailsLoading &&
                        !detailsError &&
                        detailsRows.length === 0 && (
                          <p className="text-sm text-gray-600">
                            Keine Wähler gefunden.
                          </p>
                        )}
                      {!detailsLoading && detailsRows.length > 0 && (
                        <ul className="max-h-64 overflow-auto divide-y divide-gray-100">
                          {detailsRows.map((r) => (
                            <li
                              key={r.id}
                              className="flex items-center justify-between gap-3 py-2"
                            >
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {r.firstName} {r.lastName}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {r.email} • Slot {r.slotIndex + 1}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(r.createdAt).toLocaleString()}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && !grouped && (
              <div className="-mx-4 overflow-x-auto sm:-mx-6 lg:mx-0">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2 whitespace-nowrap">Datum</th>
                      <th className="px-3 py-2 whitespace-nowrap">Name</th>
                      <th className="px-3 py-2 whitespace-nowrap">E-Mail</th>
                      <th className="px-3 py-2 whitespace-nowrap">Track</th>
                      <th className="px-3 py-2 whitespace-nowrap">Artists</th>
                      <th className="px-3 py-2 whitespace-nowrap">Slot</th>
                      <th className="px-3 py-2 whitespace-nowrap">Channel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rawItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-4 text-center text-sm text-gray-500"
                        >
                          Keine Einträge gefunden.
                        </td>
                      </tr>
                    )}
                    {rawItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                          {item.firstName} {item.lastName}
                        </td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {item.email}
                        </td>
                        <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                          {item.trackName}
                        </td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {item.trackArtists}
                        </td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                          {item.slotIndex + 1}
                        </td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                          {item.channel ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
