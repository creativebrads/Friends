-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startsAt" DATETIME NOT NULL,
    "ticketUrl" TEXT,
    "source" TEXT,
    "externalId" TEXT
);
INSERT INTO "new_Event" ("createdAt", "description", "id", "location", "startsAt", "title") SELECT "createdAt", "description", "id", "location", "startsAt", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
CREATE UNIQUE INDEX "Event_source_externalId_key" ON "Event"("source", "externalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
