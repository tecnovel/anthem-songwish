import React, {
  FormEvent,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

export type Track = {
  id: string;
  name: string;
  artists: string;
  album?: string;
  spotify_url?: string;
  image_url?: string | null;
  duration_ms?: number;
};

type SongSearchProps = {
  onSelect: (track: Track) => void;
  /** id of the currently selected track so the list can highlight it */
  selectedId?: string | null;
  /** if true, focus the search input when the component mounts */
  autoFocus?: boolean;
  /** optional initial query to prefill the search input */
  initialQuery?: string;
};

const SongSearch: React.FC<SongSearchProps> = ({
  onSelect,
  selectedId = null,
  autoFocus = false,
  initialQuery,
}) => {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus) {
      // small timeout to ensure element is mounted and visible when called from modal
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [autoFocus]);

  // Keep internal query in sync when parent provides a new initialQuery
  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  const runSearch = useCallback(
    async (trigger: "manual" | "debounced") => {
      const trimmedQuery = query.trim();

      if (trimmedQuery.length < 3) {
        if (trigger === "manual") {
          setError("Bitte gib mindestens drei Zeichen ein.");
        } else {
          setError(null);
        }
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`
        );
        const data: { tracks?: Track[]; error?: string } = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error ?? "Die Suche war nicht erfolgreich.");
        }

        setResults(data.tracks ?? []);
      } catch (err) {
        console.error("Song search failed", err);
        setError(
          "Beim Suchen ist ein Fehler aufgetreten. Bitte versuch es erneut."
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError("Bitte gib einen Suchbegriff ein.");
      setResults([]);
      return;
    }

    await runSearch("manual");
  };

  // Debounced auto-search when the user types
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const debounceTimer = window.setTimeout(() => {
      void runSearch("debounced");
    }, 450); // 450ms debounce keeps the UI responsive without flooding the API

    return () => {
      window.clearTimeout(debounceTimer);
    };
  }, [query, runSearch]);

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
      >
        <div className="relative w-full">
          <input
            type="text"
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Song oder Artist eingeben..."
            aria-label="Song oder Artist eingeben"
            className="w-full rounded border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-black placeholder-gray-500 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />

          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setError(null);
                // refocus the input for continued typing
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              aria-label="Suche löschen"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {loading ? "Suche..." : "Suchen"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <p className="text-sm text-gray-500">
          {query.trim().length < 3
            ? "Gib mindestens drei Zeichen ein, um Songs zu finden."
            : "Keine Ergebnisse gefunden. Versuch eine andere Suche."}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {results.map((track) => {
          const isSelected = selectedId === track.id;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelect(track)}
              aria-pressed={isSelected}
              className={`flex items-start gap-3 rounded border p-3 text-left transition sm:items-center ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-md"
                  : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              {track.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.image_url}
                  alt={track.name}
                  className="h-14 w-14 rounded object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded bg-gray-200 text-xs text-gray-600">
                  Kein Bild
                </div>
              )}
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-semibold text-gray-900 sm:text-base">
                  {track.name}
                </span>
                <span className="text-xs text-gray-600 sm:text-sm">
                  {track.artists}
                </span>
                {track.album && (
                  <span className="text-xs text-gray-400 sm:text-sm">
                    {track.album}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SongSearch;
