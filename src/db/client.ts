// 서버 전용 DB 연결 (수집 스크립트, 화면의 서버 컴포넌트에서 사용)
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL이 없어요. .env.local에 Supabase 연결 주소를 넣어 주세요.");
}

// 개발 서버는 파일을 고칠 때마다 모듈을 다시 읽어 연결이 계속 늘어난다. 한 번 만든 연결을 다시 쓴다
// 단, .env.local의 주소가 바뀌면 예전 주소로 만든 연결을 버리고 새로 연결한다
const cache = globalThis as unknown as { dbClient?: postgres.Sql; dbUrl?: string };

if (cache.dbClient && cache.dbUrl !== url) {
  void cache.dbClient.end({ timeout: 5 });
  cache.dbClient = undefined;
}

// Supabase 연결 풀러(Transaction 모드)는 prepared statement를 지원하지 않아 prepare: false
export const client = cache.dbClient ?? postgres(url, { prepare: false, max: 5 });
if (process.env.NODE_ENV !== "production") {
  cache.dbClient = client;
  cache.dbUrl = url;
}

export const db = drizzle(client, { schema });
