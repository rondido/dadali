/**
 * 공고 수집 스크립트 (기획서 13장 데이터 수집 정책)
 *
 * 실행: npm run collect            두 소스 모두
 *       npm run collect -- gov24   한 소스만
 *
 * 하는 일: 공공데이터 API에서 받아 변환(src/domain/collect) → notice에 저장 → sync_log에 기록
 * - source + source_id가 같으면 고치고, 없으면 추가한다. 운영자가 고정한(is_locked) 공고는 건너뛴다
 * - 소스별로 따로 실행해 하나가 실패해도 나머지는 반영한다. 실패하면 기존 데이터는 그대로 둔다
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const DEFAULT_URLS = {
  kstartup: "https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01",
  gov24: "https://api.odcloud.kr/api/gov24/v3/serviceList",
};

type SourceName = keyof typeof DEFAULT_URLS;
type Item = Record<string, unknown>;

interface SourceSpec {
  url: string;
  perPage: number;
  // 모집 중인 공고만 받는다 (K-Startup 전체 3만 건 중 모집 중은 수백 건)
  cond: Record<string, string>;
}

const SOURCES: Record<SourceName, SourceSpec> = {
  kstartup: { url: process.env.KSTARTUP_URL || DEFAULT_URLS.kstartup, perPage: 500, cond: { "rcrt_prgs_yn::EQ": "Y" } },
  gov24: { url: process.env.GOV24_URL || DEFAULT_URLS.gov24, perPage: 1000, cond: {} },
};

const MAX_PAGES = 50; // 응답이 이상해도 끝없이 돌지 않게
const BATCH = 500;

function serviceKey(): string {
  const key = process.env.DATA_GO_KR_KEY ?? "";
  if (!key) throw new Error("DATA_GO_KR_KEY가 없어요. .env.local 또는 GitHub Secrets를 확인하세요.");
  // Encoding 키(이미 %가 들어 있음)는 그대로, Decoding 키는 인코딩해서 붙인다
  return key.includes("%") ? key : encodeURIComponent(key);
}

// 오류 메시지에 인증키가 섞여 기록되지 않게 가린다
function maskKey(text: string): string {
  return text.replace(/serviceKey=[^&\s"<]*/g, "serviceKey=***");
}

async function fetchAll(spec: SourceSpec): Promise<Item[]> {
  const items: Item[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({ page: String(page), perPage: String(spec.perPage), returnType: "json" });
    for (const [k, v] of Object.entries(spec.cond)) params.set(`cond[${k}]`, v);
    const res = await fetch(`${spec.url}?serviceKey=${serviceKey()}&${params}`);
    const body = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${maskKey(body.slice(0, 200))}`);

    const json = JSON.parse(body) as { data?: Item[]; matchCount?: number };
    const data = json.data ?? [];
    items.push(...data);
    if (data.length < spec.perPage || items.length >= (json.matchCount ?? Infinity)) break;
  }
  return items;
}

async function collect(source: SourceName) {
  // dotenv가 환경변수를 넣은 뒤에 DB 연결을 연다
  const { db } = await import("../src/db/client");
  const { notice, syncLog } = await import("../src/db/schema");
  const { fromKstartup } = await import("../src/domain/collect/kstartup");
  const { fromGov24 } = await import("../src/domain/collect/gov24");
  const { eq, sql } = await import("drizzle-orm");

  const [log] = await db.insert(syncLog).values({ source, startedAt: new Date() }).returning({ id: syncLog.id });
  const stats = { fetched: 0, inserted: 0, updated: 0, failed: 0 };

  try {
    const items = await fetchAll(SOURCES[source]);
    stats.fetched = items.length;

    const transform = source === "kstartup" ? fromKstartup : fromGov24;
    const records = items.flatMap((item) => {
      try {
        const record = transform(item);
        if (!record.sourceId || !record.title) throw new Error("번호나 이름이 없음");
        return [record];
      } catch {
        stats.failed += 1;
        return [];
      }
    });

    // 같은 번호가 한 응답에 두 번 오면 한 번에 저장할 수 없으므로 마지막 것만 남긴다
    const byId = new Map(records.map((r) => [r.sourceId, r]));
    const rows = [...byId.values()];

    for (let i = 0; i < rows.length; i += BATCH) {
      const result = await db
        .insert(notice)
        .values(rows.slice(i, i + BATCH))
        .onConflictDoUpdate({
          target: [notice.source, notice.sourceId],
          set: {
            title: sql`excluded.title`,
            org: sql`excluded.org`,
            categoryId: sql`excluded.category_id`,
            applyStart: sql`excluded.apply_start`,
            applyEnd: sql`excluded.apply_end`,
            isAlways: sql`excluded.is_always`,
            parseStatus: sql`excluded.parse_status`,
            detailUrl: sql`excluded.detail_url`,
            summaryText: sql`excluded.summary_text`,
            topics: sql`excluded.topics`,
            ageGroups: sql`excluded.age_groups`,
            regionCodes: sql`excluded.region_codes`,
            industries: sql`excluded.industries`,
            rawPayload: sql`excluded.raw_payload`,
            updatedAt: sql`now()`,
          },
          // 운영자가 손으로 고친 공고는 덮어쓰지 않는다
          setWhere: sql`${notice.isLocked} = false`,
        })
        // 새로 들어간 행은 xmax가 0이다 (고친 행과 구분)
        .returning({ inserted: sql<boolean>`(xmax = 0)` });
      for (const row of result) stats[row.inserted ? "inserted" : "updated"] += 1;
    }

    await db.update(syncLog).set({ ...stats, ok: true, finishedAt: new Date() }).where(eq(syncLog.id, log.id));
    console.log(`✓ ${source}: 받음 ${stats.fetched} · 추가 ${stats.inserted} · 수정 ${stats.updated} · 변환 실패 ${stats.failed}`);
  } catch (err) {
    const message = maskKey((err as Error).message);
    await db.update(syncLog).set({ ...stats, ok: false, error: message, finishedAt: new Date() }).where(eq(syncLog.id, log.id));
    console.error(`✗ ${source}: ${message}`);
    throw err;
  }
}

async function main() {
  const only = process.argv[2] as SourceName | undefined;
  if (only && !(only in SOURCES)) throw new Error(`알 수 없는 소스: ${only} (kstartup, gov24 중 하나)`);

  let failed = false;
  for (const source of only ? [only] : (Object.keys(SOURCES) as SourceName[])) {
    try {
      await collect(source);
    } catch {
      failed = true; // 다음 소스는 계속 수집한다
    }
  }

  const { client } = await import("../src/db/client");
  await client.end({ timeout: 5 });
  // 하나라도 실패하면 GitHub Actions가 실패로 표시해 메일로 알린다
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(maskKey((err as Error).message));
  process.exit(1);
});
