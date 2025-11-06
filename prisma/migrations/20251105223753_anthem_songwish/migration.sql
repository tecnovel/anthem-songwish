-- CreateTable
CREATE TABLE "SongWish" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "trackArtists" TEXT NOT NULL,
    "album" TEXT,
    "imageUrl" TEXT,
    "spotifyUrl" TEXT,
    "durationMs" INTEGER,
    "slotIndex" INTEGER NOT NULL,
    "channel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongWish_pkey" PRIMARY KEY ("id")
);
