-- Drop old table
DROP TABLE IF EXISTS "SongWish";

-- Create new table
CREATE TABLE "SongRequest" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "trackId"      TEXT NOT NULL,
    "trackName"    TEXT NOT NULL,
    "trackArtists" TEXT NOT NULL,
    "album"        TEXT,
    "imageUrl"     TEXT,
    "spotifyUrl"   TEXT,
    "durationMs"   INTEGER,
    "played"       BOOLEAN NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongRequest_pkey" PRIMARY KEY ("id")
);
