// Loads .env.local (not .env) so the Prisma CLI shares the same DATABASE_URL as the Next.js app
// (Next.js reads .env.local by convention; see .env.example / README.md).
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
