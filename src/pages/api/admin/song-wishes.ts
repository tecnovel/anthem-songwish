import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";

import prisma from "../../../lib/prisma";

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

type GroupedResponse = {
  grouped: true;
  items: GroupedItem[];
};

type RawResponse = {
  grouped: false;
  items: RawItem[];
};

type ErrorResponse = {
  error: string;
};

function buildWhereClause(query: string | undefined): Prisma.SongWishWhereInput {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GroupedResponse | RawResponse | ErrorResponse>,
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const groupedValue = Array.isArray(req.query.grouped) ? req.query.grouped[0] : req.query.grouped;
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

    if (grouped) {
      const map = new Map<string, GroupedItem>();

      for (const wish of wishes) {
        const existing = map.get(wish.trackId);
        if (existing) {
          existing.voteCount += 1;
        } else {
          map.set(wish.trackId, {
            trackId: wish.trackId,
            trackName: wish.trackName,
            trackArtists: wish.trackArtists,
            album: wish.album,
            imageUrl: wish.imageUrl,
            spotifyUrl: wish.spotifyUrl,
            durationMs: wish.durationMs,
            voteCount: 1,
          });
        }
      }

      const items = Array.from(map.values()).sort((a, b) => {
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount;
        }
        return a.trackName.localeCompare(b.trackName);
      });

      res.status(200).json({ grouped: true, items });
      return;
    }

    const items: RawItem[] = wishes.map((wish) => ({
      id: wish.id,
      createdAt: wish.createdAt.toISOString(),
      firstName: wish.firstName,
      lastName: wish.lastName,
      email: wish.email,
      trackId: wish.trackId,
      trackName: wish.trackName,
      trackArtists: wish.trackArtists,
      album: wish.album,
      imageUrl: wish.imageUrl,
      spotifyUrl: wish.spotifyUrl,
      durationMs: wish.durationMs,
      slotIndex: wish.slotIndex,
      channel: wish.channel,
    }));

    res.status(200).json({ grouped: false, items });
  } catch (error) {
    console.error("Error in /api/admin/song-wishes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
