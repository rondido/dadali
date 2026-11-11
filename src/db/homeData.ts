// 메인 화면에 보낼 공고 (서버 전용). 수집한 공고를 DB에서 읽어 화면의 Notice 모양으로 바꾼다
// 상시 혜택은 1만 건이 넘어 한꺼번에 보내지 않는다. 검색 조건이 있을 때만 서버에서 걸러 일부를 보낸다
import { SAMPLE_NOTICES, SAMPLE_SYNCED_AT } from "@/data/sampleNotices";
import type { IsoDate, Notice } from "@/domain/notice/notice";
import { sourceInfoOf } from "@/domain/notice/sources";
import { isAgeGroup, isIndustry, isTopic } from "@/domain/search/conditionValues";
import { hasConditions, type SearchConditions } from "@/domain/search/conditions";

export interface HomeData {
  notices: Notice[];
  syncedAt: string | null; // 마지막으로 수집에 성공한 시각 (ISO). 기록이 없으면 null
  alwaysNote: string | null; // 상시 열에 붙일 안내 (일부만 보여줄 때)
  isSample: boolean;
}

// 조건에 맞는 상시 혜택을 한 번에 보내는 최대 건수
export const ALWAYS_LIMIT = 300;

// e2e 테스트와 DB 없는 개발 환경은 샘플 공고로 화면을 그린다
// 운영에서는 DATABASE_URL이 빠져도 샘플로 넘어가지 않는다. 가짜 공고가 실제 서비스에 나가지 않도록 접속 오류를 그대로 낸다
function isSampleMode(): boolean {
  if (process.env.USE_SAMPLE_DATA === "1") return true;
  return !process.env.DATABASE_URL && process.env.NODE_ENV !== "production";
}

export async function loadHomeData(
  conditions: SearchConditions,
  selectedId: string | null,
  today: IsoDate,
): Promise<HomeData> {
  if (isSampleMode()) return { notices: SAMPLE_NOTICES, syncedAt: SAMPLE_SYNCED_AT, alwaysNote: null, isSample: true };

  const { db } = await import("./client");
  const { notice, syncLog } = await import("./schema");
  const { and, arrayContains, arrayOverlaps, asc, count, desc, eq, gte, isNull, max, ne, or, sql } = await import(
    "drizzle-orm"
  );

  const columns = {
    id: notice.id,
    source: notice.source,
    title: notice.title,
    org: notice.org,
    categoryId: notice.categoryId,
    applyStart: notice.applyStart,
    applyEnd: notice.applyEnd,
    isAlways: notice.isAlways,
    detailUrl: notice.detailUrl,
    summaryText: notice.summaryText,
    topics: notice.topics,
    ageGroups: notice.ageGroups,
    regionCodes: notice.regionCodes,
    industries: notice.industries,
  };
  type Row = NoticeRow;
  type TargetColumn = typeof notice.regionCodes | typeof notice.ageGroups | typeof notice.industries;

  // 숨김·확인 필요 공고는 보여주지 않는다 (RLS의 공개 규칙과 같다)
  const visible = and(eq(notice.isHidden, false), ne(notice.parseStatus, "check"));
  // 비어 있는 대상 = 전체 대상 (matchNotices와 같은 규칙)
  const allOr = (column: TargetColumn, value: string | null) =>
    value === null ? undefined : or(sql`cardinality(${column}) = 0`, arrayContains(column, [value]));
  const matchesConditions = and(
    allOr(notice.regionCodes, conditions.region),
    allOr(notice.ageGroups, conditions.age),
    allOr(notice.industries, conditions.biz),
    conditions.topics.length > 0 ? arrayOverlaps(notice.topics, conditions.topics) : undefined,
  );

  // 날짜 있는 공고: 마감되지 않은 것 전부 (수백 건)
  const datedQuery = db
    .select(columns)
    .from(notice)
    .where(and(visible, eq(notice.isAlways, false), or(isNull(notice.applyEnd), gte(notice.applyEnd, today))));

  const alwaysWhere = and(visible, eq(notice.isAlways, true), matchesConditions);
  const filtered = hasConditions(conditions);
  // 지역을 콕 집은 혜택을 먼저, 그다음 이름순
  const alwaysQuery = filtered
    ? db
        .select(columns)
        .from(notice)
        .where(alwaysWhere)
        .orderBy(desc(sql`cardinality(${notice.regionCodes})`), asc(notice.title))
        .limit(ALWAYS_LIMIT)
    : Promise.resolve([] as Row[]);
  const alwaysCountQuery = db.select({ n: count() }).from(notice).where(filtered ? alwaysWhere : and(visible, eq(notice.isAlways, true)));
  const syncedQuery = db.select({ at: max(syncLog.finishedAt) }).from(syncLog).where(eq(syncLog.ok, true));

  const [dated, always, [{ n: alwaysTotal }], [{ at }]] = await Promise.all([
    datedQuery,
    alwaysQuery,
    alwaysCountQuery,
    syncedQuery,
  ]);
  const rows: Row[] = [...dated, ...always];

  // 링크로 들어온 공고가 위 목록에 없으면(조건 없이 연 상시 혜택 등) 따로 불러 상세 패널이 열리게 한다
  const UUID = /^[0-9a-f-]{36}$/i;
  if (selectedId && UUID.test(selectedId) && !rows.some((r) => r.id === selectedId)) {
    rows.push(...(await db.select(columns).from(notice).where(and(visible, eq(notice.id, selectedId)))));
  }

  let alwaysNote: string | null = null;
  if (!filtered && alwaysTotal > 0) {
    alwaysNote = `조건을 넣으면 상시 혜택 ${alwaysTotal.toLocaleString()}건에서 찾아드려요`;
  } else if (filtered && alwaysTotal > ALWAYS_LIMIT) {
    alwaysNote = `${alwaysTotal.toLocaleString()}건 중 ${ALWAYS_LIMIT}건`;
  }

  return { notices: rows.map(toNotice), syncedAt: at ? new Date(at).toISOString() : null, alwaysNote, isSample: false };
}

interface NoticeRow {
  id: string;
  source: string;
  title: string;
  org: string;
  categoryId: string;
  applyStart: string | null;
  applyEnd: string | null;
  isAlways: boolean;
  detailUrl: string;
  summaryText: string | null;
  topics: string[];
  ageGroups: string[];
  regionCodes: string[];
  industries: string[];
}

function toNotice(row: NoticeRow): Notice {
  const source = sourceInfoOf(row.source);
  return {
    id: row.id,
    title: row.title,
    categoryId: row.categoryId,
    applyStart: row.applyStart,
    applyEnd: row.applyEnd,
    isAlways: row.isAlways,
    org: row.org,
    summary: row.summaryText ?? "",
    ageGroups: row.ageGroups.filter(isAgeGroup),
    regionCodes: row.regionCodes,
    industries: row.industries.filter(isIndustry),
    topics: row.topics.filter(isTopic),
    detailUrl: row.detailUrl,
    sourceName: source.name,
    sourceUrl: source.url,
  };
}
