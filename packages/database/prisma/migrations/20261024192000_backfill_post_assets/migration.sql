INSERT INTO "PostAsset" ("id", "postId", "position", "sourceKey", "sourceMimeType", "sourceSize")
SELECT "id" || '-asset-0', "id", 0, "sourceKey", "sourceMimeType", "sourceSize"
FROM "Post"
WHERE NOT EXISTS (
  SELECT 1 FROM "PostAsset" WHERE "PostAsset"."postId" = "Post"."id"
);

UPDATE "MediaVariant" AS variant
SET "assetId" = asset."id"
FROM "PostAsset" AS asset
WHERE variant."postId" = asset."postId"
  AND asset."position" = 0
  AND variant."assetId" IS NULL;

DROP INDEX "MediaVariant_postId_kind_key";
