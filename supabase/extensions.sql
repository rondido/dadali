-- 혜택톡톡 DB 확장 기능. npm run db:push 전에 Supabase > SQL Editor에서 실행하세요. 여러 번 실행해도 됩니다.
-- pg_trgm: 글자 조각(trigram) 검색. 한국어 부분 일치 검색과 오타에 가까운 단어 제안에 쓴다
-- Supabase는 확장 기능을 extensions 스키마에 두고, 기본 검색 경로에 포함되어 있어 따로 지정하지 않아도 된다
create extension if not exists pg_trgm with schema extensions;
