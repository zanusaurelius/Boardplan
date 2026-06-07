-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Caption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "caption" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Caption_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Caption" ("caption", "hashtags", "id", "platform", "postId", "updatedAt") SELECT "caption", "hashtags", "id", "platform", "postId", "updatedAt" FROM "Caption";
DROP TABLE "Caption";
ALTER TABLE "new_Caption" RENAME TO "Caption";
CREATE UNIQUE INDEX "Caption_postId_platform_key" ON "Caption"("postId", "platform");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
