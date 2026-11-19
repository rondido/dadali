import HomeView from "@/components/home/HomeView";
import { DICTIONARY } from "@/data/dictionary";
import { loadHomeData } from "@/db/homeData";
import { toSeoulDate } from "@/domain/date/seoulDate";
import { conditionsFromParams } from "@/domain/search/conditions";
import { keywordsFromParams } from "@/domain/search/keywords";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// 공고는 요청마다 DB에서 읽는다. 검색 조건(주소의 region·age 등)과 남은 단어(kw)가 바뀌면 서버가 다시 걸러 보낸다
export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) if (typeof value === "string") params.set(key, value);

  const data = await loadHomeData(
    conditionsFromParams(params),
    keywordsFromParams(params),
    params.get("notice"),
    toSeoulDate(new Date()),
  );

  // 해석 사전은 코드에 둔다 (src/data/dictionary.ts). 자주 바꾸게 되면 DB 테이블로 옮긴다
  return <HomeView {...data} dictionary={DICTIONARY} />;
}
