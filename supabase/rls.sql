-- 혜택톡톡 읽기 전용 보안 정책 (기획서 12장)
-- 테이블을 만든 뒤(npm run db:push) Supabase > SQL Editor에서 실행하세요. 여러 번 실행해도 됩니다.
-- 공개 키(anon)는 읽기만 할 수 있고, 쓰기는 DATABASE_URL로 접속하는 수집 스크립트만 할 수 있습니다.

alter table category      enable row level security;
alter table site          enable row level security;
alter table region_agency enable row level security;
alter table event         enable row level security;
alter table notice        enable row level security;
alter table sync_log      enable row level security;
alter table dictionary    enable row level security;
alter table unknown_term  enable row level security;

-- Supabase는 새 테이블에 공개 키의 쓰기 권한까지 기본으로 준다. RLS가 막지 못하는 TRUNCATE도 있으므로 쓰기 권한을 거둔다
revoke insert, update, delete, truncate, references, trigger
  on category, site, region_agency, event, notice, sync_log, dictionary, unknown_term
  from anon, authenticated;

drop policy if exists "public read" on category;
drop policy if exists "public read" on site;
drop policy if exists "public read" on region_agency;
drop policy if exists "public read" on event;
drop policy if exists "public read" on sync_log;
drop policy if exists "public read visible" on notice;

create policy "public read" on category      for select to anon using (true);
create policy "public read" on site          for select to anon using (true);
create policy "public read" on region_agency for select to anon using (true);
create policy "public read" on event         for select to anon using (true);
create policy "public read" on sync_log      for select to anon using (true);

-- 숨김 처리했거나 날짜 확인이 필요한 공고는 공개하지 않음
create policy "public read visible" on notice for select to anon
  using (is_hidden = false and parse_status <> 'check');

-- 수집 기록은 "최종 갱신" 표시에 필요한 열만 공개한다. 오류 메시지(error)에는 내부 정보가 담길 수 있다
revoke select on sync_log from anon, authenticated;
grant select (id, source, started_at, finished_at, fetched, inserted, updated, failed, ok) on sync_log to anon;

-- 해석 사전(dictionary)과 못 알아들은 단어(unknown_term)는 서버에서만 쓴다. 공개 정책을 두지 않아 공개 키로는 읽을 수 없다
revoke select on dictionary, unknown_term from anon, authenticated;
