import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";

import prisma from "../../../lib/prisma";

function buildWhereClause(
  query: string | undefined
): Prisma.SongWishWhereInput {
  if (!query) {
    return {};
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return {};
  }

  return {
    OR: [
      { trackName: { contains: trimmed, mode: "insensitive" as const } },
      { trackArtists: { contains: trimmed, mode: "insensitive" as const } },
      { firstName: { contains: trimmed, mode: "insensitive" as const } },
      { lastName: { contains: trimmed, mode: "insensitive" as const } },
      { email: { contains: trimmed, mode: "insensitive" as const } },
    ],
  };
}

function toCsvLine(fields: (string | number | null | undefined)[]): string {
  return fields
    .map((field) => {
      if (field === null || field === undefined) {
        return "";
      }

      const value = String(field);
      if (value.includes(",") || value.includes("\n") || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    })
    .join(",");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const groupedValue = Array.isArray(req.query.grouped)
    ? req.query.grouped[0]
    : req.query.grouped;
  const groupedParam = (groupedValue ?? "true").toString().toLowerCase();
  const grouped = groupedParam !== "false";
  const searchValue = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const searchQuery = typeof searchValue === "string" ? searchValue : undefined;

  try {
    const where = buildWhereClause(searchQuery);

    const wishes = await prisma.songWish.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    let csv = "";

    if (grouped) {
      const map = new Map<
        string,
        {
          count: number;
          trackName: string;
          trackArtists: string;
          album?: string | null;
          spotifyUrl?: string | null;
          names: Set<string>;
        }
      >();

      for (const wish of wishes) {
        const existing = map.get(wish.trackId);
        const requester = `${wish.firstName} ${wish.lastName}`.trim();
        if (existing) {
          existing.count += 1;
          if (requester) existing.names.add(requester);
        } else {
          const names = new Set<string>();
          if (requester) names.add(requester);
          map.set(wish.trackId, {
            count: 1,
            trackName: wish.trackName,
            trackArtists: wish.trackArtists,
            album: wish.album,
            spotifyUrl: wish.spotifyUrl,
            names,
          });
        }
      }

      const ranked = Array.from(map.entries())
        .map(([trackId, info]) => ({ trackId, ...info }))
        .sort((a, b) => {
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
        "names",
      ]);
      csv += "\n";

      ranked.forEach((item, index) => {
        const namesList = item.names ? Array.from(item.names).join("; ") : "";
        csv += toCsvLine([
          index + 1,
          item.count,
          item.trackName,
          item.trackArtists,
          item.album ?? "",
          item.spotifyUrl ?? "",
          namesList,
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
        "channel",
      ]);
      csv += "\n";

      wishes.forEach((wish) => {
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
          wish.channel ?? "",
        ]);
        csv += "\n";
      });
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="songwishes_${grouped ? "grouped" : "raw"}.csv"`
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error("Error in /api/admin/export:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
