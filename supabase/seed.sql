-- 혜택톡톡 기본 데이터. rls.sql 다음에 Supabase > SQL Editor에서 실행하세요. 여러 번 실행해도 되며, 다시 실행하면 아래 값으로 덮어씁니다.

-- 분류 (기획서 4장)
insert into category (id, name, color_token) values
  ('C01', '개인 혜택', 'cat-1'),
  ('C02', '창업', 'cat-2'),
  ('C03', '기업·소상공인', 'cat-3'),
  ('C04', '공공사업', 'cat-4')
on conflict (id) do update set name = excluded.name, color_token = excluded.color_token;

-- 수록 사이트 10곳 (기획서 4장 표)
-- verified_at은 기획서 표를 정리한 날짜다. 오픈 전에 10곳의 접속·주소·운영기관을 다시 확인하고 그 날짜로 바꾼다
-- operator(운영기관)는 기획서 표에 없는 값을 채운 것이라 반드시 확인한다
insert into site (id, name, category_id, summary, target, url, operator, verified_at) values
  ('S01', '정부24 혜택알리미', 'C01', '옛 보조금24. 내 조건에 맞는 중앙·지자체 혜택 조회',     '{개인,가구}',               'https://www.gov.kr',                 '행정안전부',           '2026-10-19'),
  ('S02', '복지로',            'C01', '복지 서비스 검색·모의계산·온라인 신청',                  '{개인,가구}',               'https://www.bokjiro.go.kr',          '보건복지부',           '2026-10-19'),
  ('S03', '온통청년',          'C01', '청년 정책 통합 검색',                                    '{청년}',                    'https://www.youthcenter.go.kr',      '한국고용정보원',       '2026-10-19'),
  ('S04', 'K-Startup',         'C02', '정부·지자체 창업 지원사업 통합 포털',                    '{예비창업자,초기창업자}',   'https://www.k-startup.go.kr',        '창업진흥원',           '2026-10-19'),
  ('S05', '기업마당',          'C03', '중소기업·소상공인 지원사업 공고 허브',                   '{중소기업}',                'https://www.bizinfo.go.kr',          '중소벤처기업부',       '2026-10-19'),
  ('S06', '소상공인24',        'C03', '소상공인 지원사업·정책자금 통합 포털',                   '{소상공인}',                'https://www.sbiz24.kr',              '소상공인시장진흥공단', '2026-10-19'),
  ('S07', '중소벤처24',        'C03', '중기부 지원사업 신청·확인서 발급',                       '{중소기업}',                'https://www.smes.go.kr',             '중소벤처기업부',       '2026-10-19'),
  ('S08', '고용24',            'C01', '취업·직업훈련·고용지원금',                               '{구직자,사업주}',           'https://www.work24.go.kr',           '고용노동부',           '2026-10-19'),
  ('S09', '나라장터',          'C04', '공공기관 입찰·조달 공고',                                '{조달기업}',                'https://www.g2b.go.kr',              '조달청',               '2026-10-19'),
  ('S10', '열린재정',          'C04', '정부 예산·사업별 재정 정보',                             '{연구자,기업}',             'https://www.openfiscaldata.go.kr',   '기획재정부',           '2026-10-19')
on conflict (id) do update set
  name = excluded.name, category_id = excluded.category_id, summary = excluded.summary, target = excluded.target,
  url = excluded.url, operator = excluded.operator, verified_at = excluded.verified_at;
