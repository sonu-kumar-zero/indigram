
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDir, "../../.env") });

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL ?? "",
    },
});
