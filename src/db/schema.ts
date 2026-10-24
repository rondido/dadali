// 다달이 DB 스키마 (기획서 8장 데이터 정의서 기준)
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
} from "drizzle-orm/pg-core";

// 공고 출처: 수집 API 또는 운영자 수동 입력
export const sourceEnum = pgEnum("source", ["kstartup", "gov24", "manual"]);

// 수집 시 날짜 해석 결과
export const parseStatusEnum = pgEnum("parse_status", ["ok", "no_date", "check"]);

// 링크 점검 결과
export const linkStatusEnum = pgEnum("link_status", ["ok", "broken"]);

// 나이대 3개 그룹 (7-1장)
export const AGE_GROUPS = ["youth", "middle", "senior"] as const;

// 업종 묶음 (7-1장, 사업자일 때만)
export const INDUSTRIES = ["mfg", "it", "retail", "agri", "culture", "etc"] as const;

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
    isAlways: boolean("is_always").notNull().default(false), // 상시 모집
    detailUrl: text("detail_url").notNull(), // 원문 공고 주소

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
  (t) => [uniqueIndex("notice_source_uniq").on(t.source, t.sourceId)],
);

// 수록 사이트 10곳 (4장)
export const site = pgTable("site", {
  id: text("id").primaryKey(), // S04
  name: text("name").notNull(),
  categoryId: text("category_id").notNull().references(() => category.id),
  summary: text("summary").notNull(), // 60자 이내
  target: text("target").array().notNull().default([]),
  url: text("url").notNull(), // go.kr · or.kr 검증
  operator: text("operator").notNull(),
  verifiedAt: date("verified_at").notNull(),
});

// 우리 지역 지원기관 (시·도별 1~3곳)
export const regionAgency = pgTable("region_agency", {
  id: text("id").primaryKey(), // R11-01
  regionCode: text("region_code").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  verifiedAt: date("verified_at").notNull(),
});

// 연중 주요 시기 (보조 데이터, 5장)
export const event = pgTable("event", {
  id: text("id").primaryKey(), // E02
  title: text("title").notNull(),
  type: text("type", { enum: ["period", "point", "always"] }).notNull(),
  startMonth: integer("start_month"),
  endMonth: integer("end_month"),
  siteId: text("site_id").references(() => site.id),
  note: text("note"),
  ageGroups: text("age_groups").array().notNull().default([]),
  regionCodes: text("region_codes").array().notNull().default([]),
  industries: text("industries").array().notNull().default([]),
  verifiedAt: date("verified_at").notNull(),
});

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
  error: text("error"),
});
