import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../../lib/prisma";

type SuccessResponse = { success: true };
type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
): Promise<void> {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id } = req.query;

  if (typeof id !== "string" || !id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const data: { played?: boolean; saved?: boolean } = {};

  if (body?.played === true) data.played = true;
  if (typeof body?.saved === "boolean") data.saved = body.saved;

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  try {
    await prisma.songRequest.update({ where: { id }, data });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in /api/dj/[id]:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
