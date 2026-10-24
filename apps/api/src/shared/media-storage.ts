import { S3Client, CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

export const mediaBucket = env.S3_BUCKET;
export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
});

export async function ensureMediaBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: mediaBucket }));
  } catch (error) {
    const status = error && typeof error === "object" && "$metadata" in error
      ? (error.$metadata as { httpStatusCode?: number }).httpStatusCode
      : undefined;
    if (status !== 404 && status !== 403) throw error;
    await s3.send(new CreateBucketCommand({ Bucket: mediaBucket }));
  }
}

export function uploadUrl(key: string, contentType: string) {
  return getSignedUrl(s3, new PutObjectCommand({ Bucket: mediaBucket, Key: key, ContentType: contentType }), { expiresIn: 900 });
}

export function downloadUrl(key: string) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: mediaBucket, Key: key }), { expiresIn: 900 });
}
