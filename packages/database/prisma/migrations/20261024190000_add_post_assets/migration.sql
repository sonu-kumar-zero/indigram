CREATE TABLE "PostAsset" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceMimeType" TEXT NOT NULL,
    "sourceSize" INTEGER NOT NULL,

    CONSTRAINT "PostAsset_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MediaVariant" ADD COLUMN "assetId" TEXT;

CREATE UNIQUE INDEX "PostAsset_postId_position_key" ON "PostAsset"("postId", "position");
CREATE INDEX "PostAsset_postId_idx" ON "PostAsset"("postId");
CREATE UNIQUE INDEX "MediaVariant_assetId_kind_key" ON "MediaVariant"("assetId", "kind");

ALTER TABLE "PostAsset" ADD CONSTRAINT "PostAsset_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PostAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
