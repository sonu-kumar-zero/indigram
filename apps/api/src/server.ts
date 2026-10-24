import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url)),
});

import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "@indigram/database";
import { logger } from "./shared/logger.js";
import { ensureMediaBucket } from "./shared/media-storage.js";

await ensureMediaBucket();
const server = app.listen(env.PORT, () => logger.info({ port: env.PORT }, "Indigram API listening"));

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutdown requested");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
