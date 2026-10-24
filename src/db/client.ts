// 서버 전용 DB 연결 (수집 스크립트, Route Handler에서 사용)
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL이 없어요. .env.local에 Supabase 연결 주소를 넣어 주세요.");
}

// Supabase 연결 풀러(Transaction 모드)는 prepared statement를 지원하지 않아 prepare: false
const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });
