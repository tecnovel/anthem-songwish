import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../../lib/prisma";

type SongRequestItem = {
  id: string;
  name: string;
  trackId: string;
  trackName: string;
  trackArtists: string;
  album: string | null;
  imageUrl: string | null;
  spotifyUrl: string | null;
  durationMs: number | null;
  played: boolean;
  saved: boolean;
  createdAt: string;
};

type SuccessResponse = { items: SongRequestItem[] };
type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const tab = req.query.tab === "saved" ? "saved" : "queue";

    const where =
      tab === "saved"
        ? { played: false, saved: true }
        : { played: false, saved: false };

    const requests = await prisma.songRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const items: SongRequestItem[] = requests.map((r) => ({
      id: r.id,
      name: r.name,
      trackId: r.trackId,
      trackName: r.trackName,
      trackArtists: r.trackArtists,
      album: r.album,
      imageUrl: r.imageUrl,
      spotifyUrl: r.spotifyUrl,
      durationMs: r.durationMs,
      played: r.played,
      saved: r.saved,
      createdAt: r.createdAt.toISOString(),
    }));

    res.status(200).json({ items });
  } catch (error) {
    console.error("Error in /api/dj/requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
