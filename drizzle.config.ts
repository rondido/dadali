import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// 값이 없으면 drizzle-kit이 에러 없이 "Pulling schema..."에서 멈추므로 먼저 막는다
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL이 없어요. .env.local에 Supabase 연결 주소(Session pooler)를 넣어 주세요.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
