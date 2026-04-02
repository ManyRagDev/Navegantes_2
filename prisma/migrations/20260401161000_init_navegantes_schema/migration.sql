CREATE SCHEMA IF NOT EXISTS "navegantes";

CREATE TABLE "navegantes"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "activeTripUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "navegantes"."posts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "local" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "navegantes"."comments" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "navegantes"."itineraries" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "theme" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "navegantes"."days" (
    "id" SERIAL NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "itineraryId" INTEGER NOT NULL,

    CONSTRAINT "days_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "navegantes"."stops" (
    "id" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dayId" INTEGER NOT NULL,

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "navegantes"."seals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "navegantes"."favorites" (
    "id" SERIAL NOT NULL,
    "localId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "navegantes"."users"("email");
CREATE INDEX "posts_userId_idx" ON "navegantes"."posts"("userId");
CREATE INDEX "comments_userId_idx" ON "navegantes"."comments"("userId");
CREATE INDEX "comments_postId_idx" ON "navegantes"."comments"("postId");
CREATE INDEX "itineraries_userId_idx" ON "navegantes"."itineraries"("userId");
CREATE UNIQUE INDEX "days_itineraryId_dayNumber_key" ON "navegantes"."days"("itineraryId", "dayNumber");
CREATE INDEX "stops_dayId_idx" ON "navegantes"."stops"("dayId");
CREATE INDEX "seals_userId_idx" ON "navegantes"."seals"("userId");
CREATE UNIQUE INDEX "favorites_userId_localId_key" ON "navegantes"."favorites"("userId", "localId");
CREATE INDEX "favorites_userId_idx" ON "navegantes"."favorites"("userId");

ALTER TABLE "navegantes"."posts"
ADD CONSTRAINT "posts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "navegantes"."users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "navegantes"."comments"
ADD CONSTRAINT "comments_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "navegantes"."users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "navegantes"."comments"
ADD CONSTRAINT "comments_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "navegantes"."posts"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "navegantes"."itineraries"
ADD CONSTRAINT "itineraries_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "navegantes"."users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "navegantes"."days"
ADD CONSTRAINT "days_itineraryId_fkey"
FOREIGN KEY ("itineraryId") REFERENCES "navegantes"."itineraries"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "navegantes"."stops"
ADD CONSTRAINT "stops_dayId_fkey"
FOREIGN KEY ("dayId") REFERENCES "navegantes"."days"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "navegantes"."seals"
ADD CONSTRAINT "seals_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "navegantes"."users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "navegantes"."favorites"
ADD CONSTRAINT "favorites_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "navegantes"."users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
