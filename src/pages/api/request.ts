import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../lib/prisma";

type RequestBody = {
  name: string;
  trackId: string;
  trackName: string;
  trackArtists: string;
  album?: string;
  imageUrl?: string;
  spotifyUrl?: string;
  durationMs?: number;
};

type SuccessResponse = { success: true };
type ErrorResponse = { error: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateBody(
  payload: unknown
): { body: RequestBody } | { error: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid input: body must be an object." };
  }

  const candidate = payload as Partial<RequestBody>;

  if (!isNonEmptyString(candidate.name)) {
    return { error: "Invalid input: name is required." };
  }

  if (!isNonEmptyString(candidate.trackId)) {
    return { error: "Invalid input: trackId is required." };
  }

  if (!isNonEmptyString(candidate.trackName)) {
    return { error: "Invalid input: trackName is required." };
  }

  if (!isNonEmptyString(candidate.trackArtists)) {
    return { error: "Invalid input: trackArtists is required." };
  }

  return {
    body: {
      name: candidate.name.trim(),
      trackId: candidate.trackId.trim(),
      trackName: candidate.trackName.trim(),
      trackArtists: candidate.trackArtists.trim(),
      album: typeof candidate.album === "string" ? candidate.album.trim() || undefined : undefined,
      imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl.trim() || undefined : undefined,
      spotifyUrl: typeof candidate.spotifyUrl === "string" ? candidate.spotifyUrl.trim() || undefined : undefined,
      durationMs: typeof candidate.durationMs === "number" ? candidate.durationMs : undefined,
    },
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const rawPayload =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const validationResult = validateBody(rawPayload);

    if ("error" in validationResult) {
      res.status(400).json({ error: validationResult.error });
      return;
    }

    const { body } = validationResult;

    await prisma.songRequest.create({
      data: {
        name: body.name,
        trackId: body.trackId,
        trackName: body.trackName,
        trackArtists: body.trackArtists,
        album: body.album ?? null,
        imageUrl: body.imageUrl ?? null,
        spotifyUrl: body.spotifyUrl ?? null,
        durationMs: body.durationMs ?? null,
        played: false,
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in /api/request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
