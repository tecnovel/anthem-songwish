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
                        <tr key={item.trackId}>
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
                                rel="noreferrer"
                                className="text-indigo-600 hover:text-indigo-500"
                              >
                                Link
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
                      className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
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
                              rel="noreferrer"
                              className="text-indigo-600 text-sm block mt-1"
                            >
                              Link
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
