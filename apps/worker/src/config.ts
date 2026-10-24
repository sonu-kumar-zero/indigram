import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url))
});

export const env = z.object({
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().min(1).default("indigram"),
  S3_SECRET_ACCESS_KEY: z.string().min(1).default("indigram_dev_password"),
  S3_BUCKET: z.string().min(1).default("indigram-media")
}).parse(process.env);
