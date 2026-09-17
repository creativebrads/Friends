-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "nickname" TEXT,
    "photoUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'FRIEND',
    "howWeMet" TEXT,
    "notes" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "jobTitle" TEXT,
    "company" TEXT,
    "favoriteMeals" TEXT,
    "favoriteTreats" TEXT,
    "favoriteDrinks" TEXT,
    "hobbies" TEXT,
    "activeProjects" TEXT
);

-- CreateTable
CREATE TABLE "ImportantDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "date" DATETIME NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ImportantDate_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "personId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredOn" DATETIME NOT NULL,
    "location" TEXT,
    CONSTRAINT "Memory_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memoryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    CONSTRAINT "Photo_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemoryImportantDate" (
    "memoryId" TEXT NOT NULL,
    "importantDateId" TEXT NOT NULL,

    PRIMARY KEY ("memoryId", "importantDateId"),
    CONSTRAINT "MemoryImportantDate_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MemoryImportantDate_importantDateId_fkey" FOREIGN KEY ("importantDateId") REFERENCES "ImportantDate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personId" TEXT NOT NULL,
    "relatedPersonId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    CONSTRAINT "PersonRelationship_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PersonRelationship_relatedPersonId_fkey" FOREIGN KEY ("relatedPersonId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "updatedAt" DATETIME NOT NULL,
    "personId" TEXT NOT NULL,
    "cadenceDays" INTEGER NOT NULL,
    "lastContactAt" DATETIME,
    "nextDueAt" DATETIME NOT NULL,
    CONSTRAINT "CheckIn_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startsAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventInterest" (
    "eventId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    PRIMARY KEY ("eventId", "personId"),
    CONSTRAINT "EventInterest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventInterest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Person_lastName_firstName_idx" ON "Person"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "ImportantDate_personId_idx" ON "ImportantDate"("personId");

-- CreateIndex
CREATE INDEX "ImportantDate_date_idx" ON "ImportantDate"("date");

-- CreateIndex
CREATE INDEX "Memory_personId_idx" ON "Memory"("personId");

-- CreateIndex
CREATE INDEX "Memory_occurredOn_idx" ON "Memory"("occurredOn");

-- CreateIndex
CREATE INDEX "Photo_memoryId_idx" ON "Photo"("memoryId");

-- CreateIndex
CREATE INDEX "MemoryImportantDate_importantDateId_idx" ON "MemoryImportantDate"("importantDateId");

-- CreateIndex
CREATE INDEX "PersonRelationship_relatedPersonId_idx" ON "PersonRelationship"("relatedPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonRelationship_personId_relatedPersonId_key" ON "PersonRelationship"("personId", "relatedPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_personId_key" ON "CheckIn"("personId");

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");

-- CreateIndex
CREATE INDEX "EventInterest_personId_idx" ON "EventInterest"("personId");
