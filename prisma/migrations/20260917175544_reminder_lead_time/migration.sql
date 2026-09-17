-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImportantDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "date" DATETIME NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 7,
    CONSTRAINT "ImportantDate_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ImportantDate" ("createdAt", "date", "id", "label", "personId", "recurring", "type") SELECT "createdAt", "date", "id", "label", "personId", "recurring", "type" FROM "ImportantDate";
DROP TABLE "ImportantDate";
ALTER TABLE "new_ImportantDate" RENAME TO "ImportantDate";
CREATE INDEX "ImportantDate_personId_idx" ON "ImportantDate"("personId");
CREATE INDEX "ImportantDate_date_idx" ON "ImportantDate"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
