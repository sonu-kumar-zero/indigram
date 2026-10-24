import { prisma } from "../src/index.js";

async function main(): Promise<void> {
  console.log("No demo users are created by default.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
