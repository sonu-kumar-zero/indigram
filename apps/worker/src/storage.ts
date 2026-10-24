import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./config.js";

export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: true,
  credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
});

export async function download(key: string): Promise<Buffer<ArrayBufferLike>> {
  const result = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  if (!result.Body) throw new Error(`Object ${key} has no body`);
  return Buffer.from(await result.Body.transformToByteArray());
}

export function upload(key: string, body: Buffer<ArrayBufferLike>, contentType: string) {
  return s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
}
