# 다달이

이번 달 정부지원, 한눈에. 정부·공공 지원사업 공고를 마감일 중심 달력으로 보여주고 공식 공고로 연결하는 웹 서비스입니다.

## 기술 스택

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase(Postgres) · Drizzle ORM · Zod · FullCalendar 6 · date-fns

## 처음 실행하기

필요한 것: Node.js 20 이상

```bash
cd C:\projects\dadali
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 임시 첫 화면이 보입니다.

## 1단계: API 응답 확인

1. `.env.example`을 복사해 `.env.local`로 이름을 바꿉니다.
2. `DATA_GO_KR_KEY`에 공공데이터포털 인증키를 넣습니다.
3. 실행합니다.

```bash
npm run explore
```

터미널에 날짜로 보이는 필드, 빈 값 개수, 상시 모집 건수가 나오고, 원본 응답은 `data/raw/`에 저장됩니다.
호출이 안 되면 Encoding 키와 Decoding 키를 바꿔 넣거나, 데이터 상세 페이지의 요청 주소로 `KSTARTUP_URL`, `GOV24_URL`을 고쳐 보세요.

## 2단계: DB 만들기

1. Supabase 프로젝트를 만들고 Connection string(Transaction pooler)을 `.env.local`의 `DATABASE_URL`에 넣습니다.
2. 테이블을 만듭니다.

```bash
npm run db:push
```

3. Supabase > SQL Editor에서 `supabase/rls.sql`을 실행합니다. 읽기 전용 정책과 분류 기본값이 들어갑니다.

## 폴더 구조

```
src/app/            화면 (메인 달력은 4단계에서 추가)
src/db/schema.ts    DB 스키마: notice, site, region_agency, event, category, sync_log
src/db/client.ts    서버 전용 DB 연결
scripts/            API 확인·수집 스크립트
supabase/rls.sql    읽기 전용 보안 정책
drizzle/            스키마에서 만든 SQL (자동 생성)
```

## 명령어

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run explore` | 공공데이터 API 응답 확인 |
| `npm run db:push` | 스키마를 Supabase에 반영 |
| `npm run db:generate` | 스키마 변경을 SQL 파일로 생성 |
| `npm run db:studio` | DB를 브라우저에서 보기 |

## 개발 순서

1. API 응답 확인 → 변환 규칙 확정
2. Supabase 스키마 + RLS
3. 수집 스크립트 + GitHub Actions (매일 05:00)
4. 메인 달력 화면 (필터 바, 날짜별 목록, 상시 모집 띠)
5. 공고 상세, 모바일, 사이트 소개
6. 출시 준비: 검색 노출, 고지·출처 표시, 배포

정확한 자격과 일정은 각 공식 사이트 공고를 따릅니다. 다달이는 정부 공식 서비스가 아닙니다.
