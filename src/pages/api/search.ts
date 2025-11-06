import type { NextApiRequest, NextApiResponse } from "next";

type Track = {
  id: string;
  name: string;
  artists: string;
  album?: string;
  spotify_url?: string;
  image_url?: string | null;
  duration_ms?: number;
};

type ErrorResponse = { error: string };
type SuccessResponse = { tracks: Track[] };

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";

async function getSpotifyAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Spotify token request failed: ${response.status} ${detail}`
    );
  }

  const data: { access_token?: string } = await response.json();

  if (!data.access_token) {
    throw new Error("Spotify token response missing access_token");
  }

  return data.access_token;
}

async function searchTracks(
  accessToken: string,
  query: string
): Promise<Track[]> {
  const searchParams = new URLSearchParams({
    type: "track",
    limit: "10",
    q: query,
  });

  const response = await fetch(
    `${SPOTIFY_SEARCH_URL}?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Spotify search request failed: ${response.status} ${detail}`
    );
  }

  const data: {
    tracks?: {
      items?: Array<{
        id: string;
        name: string;
        artists?: Array<{ name?: string }>;
        album?: {
          name?: string;
          images?: Array<{ url?: string | null }>;
        };
        external_urls?: { spotify?: string };
        duration_ms?: number;
      }>;
    };
  } = await response.json();

  const items = data.tracks?.items ?? [];

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    artists:
      item.artists
        ?.map((artist) => artist.name)
        .filter(Boolean)
        .join(", ") ?? "",
    album: item.album?.name,
    spotify_url: item.external_urls?.spotify,
    image_url: item.album?.images?.[0]?.url ?? null,
    duration_ms: item.duration_ms,
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawQuery = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const query = rawQuery?.trim();

  if (!query) {
    res.status(400).json({ error: "Query parameter q is required." });
    return;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Spotify credentials are missing.");
    res.status(500).json({ error: "Server configuration error." });
    return;
  }

  try {
    const token = await getSpotifyAccessToken(clientId, clientSecret);
    const tracks = await searchTracks(token, query);

    res.status(200).json({ tracks });
  } catch (error) {
    console.error("Spotify search failed", error);
    res.status(500).json({ error: "Failed to fetch tracks from Spotify." });
  }
}
