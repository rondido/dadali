// 혜택톡톡 DB 스키마 (기획서 8장 데이터 정의서 기준)
// pg_trgm 확장이 필요하다. 처음 만들 때는 supabase/extensions.sql을 먼저 실행한 뒤 npm run db:push
import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  uuid,
  date,
  boolean,
  jsonb,
  timestamp,
  integer,
  uniqueIndex,
  index,
  check,
  customType,
} from "drizzle-orm/pg-core";

// Postgres 전문 검색 색인 타입 (Drizzle에 기본 제공되지 않음)
const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

// 공식 사이트 주소 규칙 (8장 검증 규칙): go.kr · or.kr · 지정 예외 도메인만 저장한다
// 예외(gov.kr 정부24, sbiz24.kr 소상공인24)는 src/domain/notice/officialLink.ts의 OFFICIAL_EXCEPTIONS와 맞춘다
const OFFICIAL_URL = sql.raw(String.raw`'^https?://([a-z0-9-]+\.)*(go\.kr|or\.kr|gov\.kr|sbiz24\.kr)(/|$)'`);

// 공고 출처: 수집 API 또는 운영자 수동 입력
export const sourceEnum = pgEnum("source", ["kstartup", "gov24", "manual"]);

// 수집 시 날짜 해석 결과
export const parseStatusEnum = pgEnum("parse_status", ["ok", "no_date", "check"]);

// 링크 점검 결과
export const linkStatusEnum = pgEnum("link_status", ["ok", "broken"]);

// 해석 사전 단어의 종류와 출처 (5-1장)
export const dictionaryKindEnum = pgEnum("dictionary_kind", ["region", "age", "industry", "topic"]);
export const dictionarySourceEnum = pgEnum("dictionary_source", ["bjd", "ksic", "manual"]); // 법정동코드 · 표준산업분류 · 직접 입력

// 나이대 3개 그룹 (7-1장)
export const AGE_GROUPS = ["youth", "middle", "senior"] as const;

// 업종 묶음 (7-1장, 사업자일 때만)
export const INDUSTRIES = ["mfg", "it", "retail", "agri", "culture", "etc"] as const;

// 관심 주제 9개 (7-1장). 화면의 src/domain/search/conditionValues.ts TOPICS와 같은 값
export const TOPICS = ["facility", "house", "fund", "job", "startup", "export", "edu", "market", "digital"] as const;

// 분류 (C01 개인 혜택 · C02 창업 · C03 기업·소상공인 · C04 공공사업)
export const category = pgTable("category", {
  id: text("id").primaryKey(), // C01
  name: text("name").notNull(),
  colorToken: text("color_token").notNull(), // cat-1
});

// 수집 공고 (핵심 데이터)
export const notice = pgTable(
  "notice",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: sourceEnum("source").notNull(),
    sourceId: text("source_id").notNull(), // 원본 공고 번호
    title: text("title").notNull(),
    org: text("org").notNull(), // 주관기관
    categoryId: text("category_id").notNull().references(() => category.id),
    applyStart: date("apply_start"), // 접수 시작일
    applyEnd: date("apply_end"), // 접수 마감일
    isAlways: boolean("is_always").notNull().default(false), // 상시 접수
    detailUrl: text("detail_url").notNull(), // 원문 공고 주소

    // 검색용 (5-1장 자유 입력 검색)
    summaryText: text("summary_text"), // 지원 내용 300자 요약. 본문 전체는 저장하지 않음
    topics: text("topics").array().notNull().default([]), // 관심 주제 태그 (TOPICS)
    // 공고명 + 기관 + 요약으로 자동 생성. 한국어 형태소 분석기가 없어 띄어쓰기 단위(simple)로 나눈다
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`to_tsvector('simple'::regconfig, coalesce(title, '') || ' ' || coalesce(org, '') || ' ' || coalesce(summary_text, ''))`,
    ),

    // 맞춤 필터 (빈 배열 = 전체 대상)
    ageGroups: text("age_groups").array().notNull().default([]),
    regionCodes: text("region_codes").array().notNull().default([]), // 시·도 코드 (법정동 앞 2자리)
    sigunguCode: text("sigungu_code"), // 예약 필드, 화면 미사용
    industries: text("industries").array().notNull().default([]),

    // 운영
    isHidden: boolean("is_hidden").notNull().default(false),
    isLocked: boolean("is_locked").notNull().default(false), // 수동 수정본, 수집이 덮어쓰지 않음
    parseStatus: parseStatusEnum("parse_status").notNull().default("ok"),
    linkStatus: linkStatusEnum("link_status"),
    rawPayload: jsonb("raw_payload").notNull(), // 원본 API 응답

    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("notice_source_uniq").on(t.source, t.sourceId),
    // 보드는 마감되지 않은 공고만 읽는다 (마감일 기준 조회)
    index("notice_apply_end_idx").on(t.applyEnd),
    // 남은 단어 검색 (F07): 띄어쓰기 단위 전문 검색 + 한국어 부분 일치용 글자 조각(trigram) 검색
    index("notice_search_idx").using("gin", t.searchVector),
    index("notice_title_trgm_idx").using("gin", t.title.op("gin_trgm_ops")),
    check("notice_summary_len", sql`char_length(${t.summaryText}) <= 300`),
  ],
);

// 수록 사이트 10곳 (4장)
export const site = pgTable(
  "site",
  {
    id: text("id").primaryKey(), // S04
    name: text("name").notNull(),
    categoryId: text("category_id").notNull().references(() => category.id),
    summary: text("summary").notNull(), // 60자 이내
    target: text("target").array().notNull().default([]),
    url: text("url").notNull(), // go.kr · or.kr 검증
    operator: text("operator").notNull(),
    verifiedAt: date("verified_at").notNull(),
  },
  (t) => [
    check("site_summary_len", sql`char_length(${t.summary}) <= 60`),
    check("site_official_url", sql`${t.url} ~* ${OFFICIAL_URL}`),
  ],
);

// 우리 지역 지원기관 (시·도별 1~3곳)
export const regionAgency = pgTable(
  "region_agency",
  {
    id: text("id").primaryKey(), // R11-01
    regionCode: text("region_code").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    verifiedAt: date("verified_at").notNull(),
  },
  (t) => [check("region_agency_official_url", sql`${t.url} ~* ${OFFICIAL_URL}`)],
);

// 연중 주요 시기 (보조 데이터, 5장)
export const event = pgTable(
  "event",
  {
    id: text("id").primaryKey(), // E02
    title: text("title").notNull(),
    type: text("type", { enum: ["period", "point", "always"] }).notNull(),
    startMonth: integer("start_month"),
    endMonth: integer("end_month"),
    siteId: text("site_id").references(() => site.id),
    linkPath: text("link_path"), // 사이트 안 메뉴 경로. 없으면 사이트 메인
    note: text("note"),
    ageGroups: text("age_groups").array().notNull().default([]),
    regionCodes: text("region_codes").array().notNull().default([]),
    sigunguCode: text("sigungu_code"), // 예약 필드, 화면 미사용
    industries: text("industries").array().notNull().default([]),
    verifiedAt: date("verified_at").notNull(),
  },
  (t) => [
    check("event_start_month", sql`${t.startMonth} between 1 and 12`),
    check("event_end_month", sql`${t.endMonth} between 1 and 12`),
  ],
);

// 해석 사전 (5-1장): 문장 속 단어를 조건 값으로 바꾼다. 예: 망원동 → region 11
export const dictionary = pgTable(
  "dictionary",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    term: text("term").notNull(),
    kind: dictionaryKindEnum("kind").notNull(),
    value: text("value").notNull(),
    ambiguousWith: text("ambiguous_with").array().notNull().default([]), // 같은 단어가 가리킬 수 있는 다른 값 (광주 → 41)
    source: dictionarySourceEnum("source").notNull(),
  },
  (t) => [
    uniqueIndex("dictionary_term_kind_uniq").on(t.term, t.kind),
    // 오타에 가까운 단어 제안 ("인태리어" → "인테리어")
    index("dictionary_term_trgm_idx").using("gin", t.term.op("gin_trgm_ops")),
  ],
);

// 못 알아들은 단어 집계 (F14). 문장은 저장하지 않고 단어와 횟수만 쌓는다
export const unknownTerm = pgTable(
  "unknown_term",
  {
    term: text("term").primaryKey(),
    count: integer("count").notNull().default(1),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    isReviewed: boolean("is_reviewed").notNull().default(false),
  },
  (t) => [
    // 2글자 이하와 숫자만 있는 단어는 저장하지 않는다 (사람 이름 거르기는 저장 전 코드에서)
    check("unknown_term_len", sql`char_length(${t.term}) > 2`),
    check("unknown_term_not_number", sql`${t.term} !~ '^[0-9]+$'`),
  ],
);

// 수집 기록 ("최종 갱신" 표시와 운영자 확인용)
export const syncLog = pgTable("sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: sourceEnum("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  fetched: integer("fetched").notNull().default(0),
  inserted: integer("inserted").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  ok: boolean("ok").notNull().default(false),
  error: text("error"), // 운영자 확인용. 공개 키로는 읽을 수 없다 (rls.sql)
});
