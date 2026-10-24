-- 다달이 읽기 전용 보안 정책 (기획서 12장)
-- 테이블을 만든 뒤(npm run db:push) Supabase > SQL Editor에서 한 번 실행하세요.
-- 공개 키(anon)는 읽기만, 쓰기는 서비스 키를 쓰는 수집 스크립트만 할 수 있습니다.

alter table category      enable row level security;
alter table site          enable row level security;
alter table region_agency enable row level security;
alter table event         enable row level security;
alter table notice        enable row level security;
alter table sync_log      enable row level security;

create policy "public read" on category      for select to anon using (true);
create policy "public read" on site          for select to anon using (true);
create policy "public read" on region_agency for select to anon using (true);
create policy "public read" on event         for select to anon using (true);
create policy "public read" on sync_log      for select to anon using (true);

-- 숨김 처리했거나 날짜 확인이 필요한 공고는 공개하지 않음
create policy "public read visible" on notice for select to anon
  using (is_hidden = false and parse_status <> 'check');

-- 분류 기본값
insert into category (id, name, color_token) values
  ('C01', '개인 혜택', 'cat-1'),
  ('C02', '창업', 'cat-2'),
  ('C03', '기업·소상공인', 'cat-3'),
  ('C04', '공공사업', 'cat-4')
on conflict (id) do nothing;
