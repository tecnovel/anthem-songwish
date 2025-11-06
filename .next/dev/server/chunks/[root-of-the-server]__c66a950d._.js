module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/pages/api/wish.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
(()=>{
    const e = new Error("Cannot find module '../../lib/prisma'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function normalizeString(value) {
    return value.trim();
}
function normalizeOptionalString(value) {
    if (!isNonEmptyString(value)) {
        return undefined;
    }
    return value.trim();
}
function validateBody(payload) {
    if (!payload || typeof payload !== "object") {
        return {
            error: "Invalid input: body must be an object."
        };
    }
    const candidate = payload;
    if (!isNonEmptyString(candidate.firstName)) {
        return {
            error: "Invalid input: firstName is required."
        };
    }
    if (!isNonEmptyString(candidate.lastName)) {
        return {
            error: "Invalid input: lastName is required."
        };
    }
    if (!isNonEmptyString(candidate.email) || !candidate.email.includes("@")) {
        return {
            error: "Invalid input: email must be a valid address."
        };
    }
    if (!Array.isArray(candidate.tracks) || candidate.tracks.length < 1 || candidate.tracks.length > 3) {
        return {
            error: "Invalid input: tracks must contain between 1 and 3 items."
        };
    }
    const normalizedTracks = [];
    const trackIds = new Set();
    for(let index = 0; index < candidate.tracks.length; index += 1){
        const trackCandidate = candidate.tracks[index];
        if (!trackCandidate || typeof trackCandidate !== "object") {
            return {
                error: `Invalid input: track at position ${index + 1} is malformed.`
            };
        }
        const track = trackCandidate;
        if (!isNonEmptyString(track.id)) {
            return {
                error: `Invalid input: track id missing at position ${index + 1}.`
            };
        }
        if (!isNonEmptyString(track.name)) {
            return {
                error: `Invalid input: track name missing at position ${index + 1}.`
            };
        }
        if (!isNonEmptyString(track.artists)) {
            return {
                error: `Invalid input: track artists missing at position ${index + 1}.`
            };
        }
        const normalizedTrack = {
            id: normalizeString(track.id),
            name: normalizeString(track.name),
            artists: normalizeString(track.artists),
            album: track.album ? track.album.trim() : undefined,
            spotify_url: track.spotify_url ? track.spotify_url.trim() : undefined,
            image_url: track.image_url ? track.image_url.trim() : undefined,
            duration_ms: typeof track.duration_ms === "number" ? track.duration_ms : undefined
        };
        if (trackIds.has(normalizedTrack.id)) {
            return {
                error: "Invalid input: duplicate track ids are not allowed."
            };
        }
        trackIds.add(normalizedTrack.id);
        normalizedTracks.push(normalizedTrack);
    }
    return {
        body: {
            firstName: normalizeString(candidate.firstName),
            lastName: normalizeString(candidate.lastName),
            email: normalizeString(candidate.email),
            tracks: normalizedTracks,
            channel: normalizeOptionalString(candidate.channel)
        }
    };
}
async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        res.status(405).json({
            error: "Method not allowed"
        });
        return;
    }
    try {
        const rawPayload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const validationResult = validateBody(rawPayload);
        if ("error" in validationResult) {
            res.status(400).json({
                error: validationResult.error
            });
            return;
        }
        const { body } = validationResult;
        const data = body.tracks.map((track, index)=>({
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                trackId: track.id,
                trackName: track.name,
                trackArtists: track.artists,
                album: track.album ?? null,
                imageUrl: track.image_url ?? null,
                spotifyUrl: track.spotify_url ?? null,
                durationMs: track.duration_ms ?? null,
                slotIndex: index,
                channel: body.channel ?? null
            }));
        await prisma.songWish.createMany({
            data
        });
        res.status(200).json({
            success: true
        });
    } catch (error) {
        console.error("Error in /api/wish:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c66a950d._.js.map