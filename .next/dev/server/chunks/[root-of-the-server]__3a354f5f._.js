module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/pages/api/search.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";
async function getSpotifyAccessToken(clientId, clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`
        },
        body: "grant_type=client_credentials"
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Spotify token request failed: ${response.status} ${detail}`);
    }
    const data = await response.json();
    if (!data.access_token) {
        throw new Error("Spotify token response missing access_token");
    }
    return data.access_token;
}
async function searchTracks(accessToken, query) {
    const searchParams = new URLSearchParams({
        type: "track",
        limit: "10",
        q: query
    });
    const response = await fetch(`${SPOTIFY_SEARCH_URL}?${searchParams.toString()}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Spotify search request failed: ${response.status} ${detail}`);
    }
    const data = await response.json();
    const items = data.tracks?.items ?? [];
    return items.map((item)=>({
            id: item.id,
            name: item.name,
            artists: item.artists?.map((artist)=>artist.name).filter(Boolean).join(", ") ?? "",
            album: item.album?.name,
            spotify_url: item.external_urls?.spotify,
            image_url: item.album?.images?.[0]?.url ?? null,
            duration_ms: item.duration_ms
        }));
}
async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        res.status(405).json({
            error: "Method not allowed"
        });
        return;
    }
    const rawQuery = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
    const query = rawQuery?.trim();
    if (!query) {
        res.status(400).json({
            error: "Query parameter q is required."
        });
        return;
    }
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        console.error("Spotify credentials are missing.");
        res.status(500).json({
            error: "Server configuration error."
        });
        return;
    }
    try {
        const token = await getSpotifyAccessToken(clientId, clientSecret);
        const tracks = await searchTracks(token, query);
        res.status(200).json({
            tracks
        });
    } catch (error) {
        console.error("Spotify search failed", error);
        res.status(500).json({
            error: "Failed to fetch tracks from Spotify."
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3a354f5f._.js.map