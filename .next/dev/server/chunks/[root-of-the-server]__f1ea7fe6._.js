module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/src/lib/prisma.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
const prisma = global.__prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
if ("TURBOPACK compile-time truthy", 1) global.__prisma = prisma;
const __TURBOPACK__default__export__ = prisma;
}),
"[project]/src/pages/api/admin/export.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [api] (ecmascript)");
;
function buildWhereClause(query) {
    if (!query) {
        return {};
    }
    const trimmed = query.trim();
    if (!trimmed) {
        return {};
    }
    return {
        OR: [
            {
                trackName: {
                    contains: trimmed,
                    mode: "insensitive"
                }
            },
            {
                trackArtists: {
                    contains: trimmed,
                    mode: "insensitive"
                }
            },
            {
                firstName: {
                    contains: trimmed,
                    mode: "insensitive"
                }
            },
            {
                lastName: {
                    contains: trimmed,
                    mode: "insensitive"
                }
            },
            {
                email: {
                    contains: trimmed,
                    mode: "insensitive"
                }
            }
        ]
    };
}
function toCsvLine(fields) {
    return fields.map((field)=>{
        if (field === null || field === undefined) {
            return "";
        }
        const value = String(field);
        if (value.includes(",") || value.includes("\n") || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }).join(",");
}
async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        res.status(405).json({
            error: "Method not allowed"
        });
        return;
    }
    const groupedValue = Array.isArray(req.query.grouped) ? req.query.grouped[0] : req.query.grouped;
    const groupedParam = (groupedValue ?? "true").toString().toLowerCase();
    const grouped = groupedParam !== "false";
    const searchValue = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
    const searchQuery = typeof searchValue === "string" ? searchValue : undefined;
    try {
        const where = buildWhereClause(searchQuery);
        const wishes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].songWish.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            }
        });
        let csv = "";
        if (grouped) {
            const map = new Map();
            for (const wish of wishes){
                const existing = map.get(wish.trackId);
                const requester = `${wish.firstName} ${wish.lastName}`.trim();
                if (existing) {
                    existing.count += 1;
                    if (requester) existing.names.add(requester);
                } else {
                    const names = new Set();
                    if (requester) names.add(requester);
                    map.set(wish.trackId, {
                        count: 1,
                        trackName: wish.trackName,
                        trackArtists: wish.trackArtists,
                        album: wish.album,
                        spotifyUrl: wish.spotifyUrl,
                        names
                    });
                }
            }
            const ranked = Array.from(map.entries()).map(([trackId, info])=>({
                    trackId,
                    ...info
                })).sort((a, b)=>{
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                return a.trackName.localeCompare(b.trackName);
            });
            csv += toCsvLine([
                "rank",
                "votes",
                "trackName",
                "trackArtists",
                "album",
                "spotifyUrl",
                "names"
            ]);
            csv += "\n";
            ranked.forEach((item, index)=>{
                const namesList = item.names ? Array.from(item.names).join("; ") : "";
                csv += toCsvLine([
                    index + 1,
                    item.count,
                    item.trackName,
                    item.trackArtists,
                    item.album ?? "",
                    item.spotifyUrl ?? "",
                    namesList
                ]);
                csv += "\n";
            });
        } else {
            csv += toCsvLine([
                "createdAt",
                "firstName",
                "lastName",
                "email",
                "trackName",
                "trackArtists",
                "album",
                "spotifyUrl",
                "slotIndex",
                "channel"
            ]);
            csv += "\n";
            wishes.forEach((wish)=>{
                csv += toCsvLine([
                    wish.createdAt.toISOString(),
                    wish.firstName,
                    wish.lastName,
                    wish.email,
                    wish.trackName,
                    wish.trackArtists,
                    wish.album ?? "",
                    wish.spotifyUrl ?? "",
                    wish.slotIndex,
                    wish.channel ?? ""
                ]);
                csv += "\n";
            });
        }
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="songwishes_${grouped ? "grouped" : "raw"}.csv"`);
        res.status(200).send(csv);
    } catch (error) {
        console.error("Error in /api/admin/export:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f1ea7fe6._.js.map