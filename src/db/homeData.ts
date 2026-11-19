// 메인 화면에 보낼 공고 (서버 전용). 수집한 공고를 DB에서 읽어 화면의 Notice 모양으로 바꾼다
// 상시 혜택은 1만 건이 넘어 한꺼번에 보내지 않는다. 검색 조건이나 남은 단어가 있을 때만 서버에서 걸러 일부를 보낸다
import { SAMPLE_NOTICES, SAMPLE_SYNCED_AT } from "@/data/sampleNotices";
import type { IsoDate, Notice } from "@/domain/notice/notice";
import { sourceInfoOf } from "@/domain/notice/sources";
import { isAgeGroup, isIndustry, isTopic } from "@/domain/search/conditionValues";
import { hasConditions, type SearchConditions } from "@/domain/search/conditions";
import { orgPrefixesOf } from "@/domain/search/districts";

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
  keywords: string[],
  selectedId: string | null,
  today: IsoDate,
): Promise<HomeData> {
  if (isSampleMode()) return { notices: SAMPLE_NOTICES, syncedAt: SAMPLE_SYNCED_AT, alwaysNote: null, isSample: true };

  const { db } = await import("./client");
  const { notice, syncLog } = await import("./schema");
  const { and, arrayContains, arrayOverlaps, asc, count, desc, eq, gte, ilike, inArray, isNull, max, ne, or, sql } = await import(
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
    minorsOnly: notice.minorsOnly,
  };
  type Row = NoticeRow;
  type TargetColumn = typeof notice.regionCodes | typeof notice.ageGroups | typeof notice.industries;

  // 숨김·확인 필요 공고는 보여주지 않는다 (RLS의 공개 규칙과 같다)
  const visible = and(eq(notice.isHidden, false), ne(notice.parseStatus, "check"));
  // 비어 있는 대상 = 전체 대상 (matchNotices와 같은 규칙)
  const allOr = (column: TargetColumn, value: string | null) =>
    value === null ? undefined : or(sql`cardinality(${column}) = 0`, arrayContains(column, [value]));
  // 기관명이 찾는 시·도 안의 시·군·구인지 ("서울특별시 마포구"). matchNotices·orgDistrictOf와 같은 규칙
  const orgSecond = sql`split_part(${notice.org}, ' ', 2)`;
  const inSidoDistrict =
    conditions.region === null
      ? undefined
      : and(inArray(sql`split_part(${notice.org}, ' ', 1)`, orgPrefixesOf(conditions.region)), sql`${orgSecond} ~ '[시군구]$'`);
  const sameDistrict =
    inSidoDistrict && conditions.district !== null ? and(inSidoDistrict, sql`${orgSecond} = ${conditions.district}`) : undefined;
  const matchesConditions = and(
    allOr(notice.regionCodes, conditions.region),
    // 시·군·구를 정하면 같은 시·도의 다른 시·군·구 기관 공고는 뺀다
    inSidoDistrict && conditions.district !== null
      ? sql`not (${inSidoDistrict} and ${orgSecond} <> ${conditions.district})`
      : undefined,
    allOr(notice.ageGroups, conditions.age),
    conditions.age === null ? undefined : eq(notice.minorsOnly, false),
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
  // 조건과 태그로 분명히 맞은 개수 (matchNotices의 strengthOf와 같은 규칙). 상시 혜택은 일부만 보내므로 이 순서로 고른다
  const hit = (column: TargetColumn, value: string | null) =>
    value === null ? sql`0` : sql`(case when ${value} = any(${column}) then 1 else 0 end)`;
  const strength = sql.join(
    [
      hit(notice.regionCodes, conditions.region),
      sameDistrict ? sql`(case when ${sameDistrict} then 1 else 0 end)` : sql`0`,
      hit(notice.ageGroups, conditions.age),
      hit(notice.industries, conditions.biz),
      ...conditions.topics.map((topic) => sql`(case when ${topic} = any(${notice.topics}) then 1 else 0 end)`),
    ],
    sql` + `,
  );
  // 시·도로만 찾을 때 시·군·구 기관 공고는 시·도 전체 공고 뒤로 (matchNotices의 local)
  // 정렬에 상수를 넣으면 Postgres가 열 번호로 읽으므로, 필요할 때만 넣는다
  const localLast =
    inSidoDistrict && conditions.district === null ? [asc(sql`(case when ${inSidoDistrict} then 1 else 0 end)`)] : [];
  // 분명히 맞은 혜택을 먼저, 그다음 시·도 전체 혜택, 지역을 콕 집은 혜택, 이름순
  const alwaysRowsOf = (where: ReturnType<typeof and>) =>
    db
      .select(columns)
      .from(notice)
      .where(where)
      .orderBy(desc(strength), ...localLast, desc(sql`cardinality(${notice.regionCodes})`), asc(notice.title))
      .limit(ALWAYS_LIMIT);
  const countOf = async (where: ReturnType<typeof and>) => (await db.select({ n: count() }).from(notice).where(where))[0].n;

  // 남은 단어가 공고명·요약에 하나라도 든 상시 혜택 (matchNotices의 남은 단어 검색과 같은 규칙)
  // 단어 속 %·_·\는 글자 그대로 찾는다
  const likeOf = (word: string) => `%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const keywordWhere =
    keywords.length > 0
      ? or(...keywords.flatMap((word) => [ilike(notice.title, likeOf(word)), ilike(notice.summaryText, likeOf(word))]))
      : undefined;

  // 상시 혜택 고르기: 남은 단어가 든 혜택이 있으면 그것을, 없으면 조건으로 고른다 (조건도 없으면 보내지 않는다)
  // 단어가 든 혜택이 없을 때 조건으로 고르는 이유: 화면은 어느 공고에도 없는 단어를 무시하고 조건 결과를 보여준다
  const loadAlways = async (): Promise<{ always: Row[]; alwaysTotal: number; picked: boolean }> => {
    if (keywordWhere) {
      const where = and(alwaysWhere, keywordWhere);
      const [always, alwaysTotal] = await Promise.all([alwaysRowsOf(where), countOf(where)]);
      if (always.length > 0) return { always, alwaysTotal, picked: true };
    }
    if (!filtered) return { always: [], alwaysTotal: await countOf(and(visible, eq(notice.isAlways, true))), picked: false };
    const [always, alwaysTotal] = await Promise.all([alwaysRowsOf(alwaysWhere), countOf(alwaysWhere)]);
    return { always, alwaysTotal, picked: true };
  };
  const syncedQuery = db.select({ at: max(syncLog.finishedAt) }).from(syncLog).where(eq(syncLog.ok, true));

  const [dated, { always, alwaysTotal, picked }, [{ at }]] = await Promise.all([datedQuery, loadAlways(), syncedQuery]);
  const rows: Row[] = [...dated, ...always];

  // 링크로 들어온 공고가 위 목록에 없으면(조건 없이 연 상시 혜택 등) 따로 불러 상세 패널이 열리게 한다
  const UUID = /^[0-9a-f-]{36}$/i;
  if (selectedId && UUID.test(selectedId) && !rows.some((r) => r.id === selectedId)) {
    rows.push(...(await db.select(columns).from(notice).where(and(visible, eq(notice.id, selectedId)))));
  }

  let alwaysNote: string | null = null;
  if (!picked && alwaysTotal > 0) {
    alwaysNote = `조건을 넣으면 상시 혜택 ${alwaysTotal.toLocaleString()}건에서 찾아드려요`;
  } else if (picked && alwaysTotal > ALWAYS_LIMIT) {
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
  minorsOnly: boolean;
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
    minorsOnly: row.minorsOnly,
    detailUrl: row.detailUrl,
    sourceName: source.name,
    sourceUrl: source.url,
  };
}
