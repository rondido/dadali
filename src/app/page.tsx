import HomeView from "@/components/home/HomeView";
import { SAMPLE_DICTIONARY } from "@/data/sampleDictionary";
import { loadHomeData } from "@/db/homeData";
import { toSeoulDate } from "@/domain/date/seoulDate";
import { conditionsFromParams } from "@/domain/search/conditions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// 공고는 요청마다 DB에서 읽는다. 검색 조건(주소의 region·age 등)이 바뀌면 서버가 다시 걸러 보낸다
export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) if (typeof value === "string") params.set(key, value);

  const data = await loadHomeData(conditionsFromParams(params), params.get("notice"), toSeoulDate(new Date()));

  // 해석 사전은 아직 샘플이다. 법정동코드·표준산업분류로 Dictionary 테이블을 채우면 DB에서 읽는다
  return <HomeView {...data} dictionary={SAMPLE_DICTIONARY} />;
}
