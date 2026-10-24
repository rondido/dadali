/**
 * 공공데이터 API 응답 확인 스크립트
 *
 * 실행: npm run explore
 * 결과: data/raw/ 폴더에 원본 응답 저장 + 터미널에 요약 출력
 *
 * 확인할 것 (기획서 13장):
 *  1. 접수 시작일·마감일이 어떤 필드에, 어떤 형식으로 오는지
 *  2. 대상(청년 등)·지역이 별도 필드인지, 문장 속에 섞여 있는지
 *  3. 날짜가 비었거나 "상시"인 공고가 얼마나 되는지
 */
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

const KEY = process.env.DATA_GO_KR_KEY ?? "";
const PER_PAGE = 50;

const SOURCES = [
  { name: "kstartup", label: "K-Startup 지원사업 공고", url: process.env.KSTARTUP_URL ?? "" },
  { name: "gov24", label: "행안부 공공서비스(혜택)", url: process.env.GOV24_URL ?? "" },
];

type Json = unknown;
type Item = Record<string, unknown>;

// 인증키: Encoding 키(이미 %가 들어 있음)는 그대로, Decoding 키는 인코딩해서 붙인다
function withKey(base: string): string {
  const key = KEY.includes("%") ? KEY : encodeURIComponent(KEY);
  const params = new URLSearchParams({
    page: "1",
    perPage: String(PER_PAGE),
    pageNo: "1",
    numOfRows: String(PER_PAGE),
    returnType: "json",
    type: "json",
  });
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}serviceKey=${key}&${params.toString()}`;
}

// 응답 안에서 "객체 배열"을 찾아 공고 목록으로 본다 (data, items.item 등 API마다 위치가 다름)
function findItems(node: Json, depth = 0): Item[] | null {
  if (depth > 6 || node === null || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    if (node.length > 0 && typeof node[0] === "object" && node[0] !== null) return node as Item[];
    return null;
  }
  for (const value of Object.values(node as Record<string, Json>)) {
    const found = findItems(value, depth + 1);
    if (found) return found;
  }
  return null;
}

const DATE_LIKE = /^(\d{8}|\d{4}[-.]\d{2}[-.]\d{2})/;
const DATE_KEY = /(dt|date|ymd|period|기간|일자|마감|시작|종료|신청)/i;
const ALWAYS_WORDS = /(상시|수시|예산\s*소진|별도\s*공지)/;

function summarize(items: Item[]) {
  const keys = Object.keys(items[0]);
  const dateKeys = keys.filter(
    (k) => DATE_KEY.test(k) || items.slice(0, 10).some((it) => DATE_LIKE.test(String(it[k] ?? ""))),
  );

  console.log(`  필드 ${keys.length}개: ${keys.join(", ")}`);
  console.log("");
  console.log("  날짜로 보이는 필드:");
  if (dateKeys.length === 0) console.log("    (못 찾음: 위 필드 목록과 저장된 원본을 직접 확인하세요)");
  for (const k of dateKeys) {
    const values = items.map((it) => String(it[k] ?? "").trim());
    const empty = values.filter((v) => v === "").length;
    const always = values.filter((v) => ALWAYS_WORDS.test(v)).length;
    const sample = values.filter(Boolean).slice(0, 3).join(" | ");
    console.log(`    - ${k}: 빈 값 ${empty}/${items.length}, 상시류 ${always}건, 예) ${sample}`);
  }
}

async function explore(src: (typeof SOURCES)[number], outDir: string) {
  console.log(`\n■ ${src.label}`);
  if (!src.url) {
    console.log("  주소가 비어 있어요. .env.local을 확인하세요.");
    return;
  }

  const res = await fetch(withKey(src.url));
  const body = await res.text();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  console.log(`  HTTP ${res.status}`);

  let json: Json;
  try {
    json = JSON.parse(body);
  } catch {
    const file = join(outDir, `${src.name}-${stamp}.txt`);
    writeFileSync(file, body);
    console.log("  JSON이 아닌 응답이에요 (보통 인증키 오류). 앞부분:");
    console.log("  " + body.slice(0, 400).replace(/\s+/g, " "));
    console.log(`  저장: ${file}`);
    return;
  }

  const file = join(outDir, `${src.name}-${stamp}.json`);
  writeFileSync(file, JSON.stringify(json, null, 2));
  console.log(`  저장: ${file}`);

  const items = findItems(json);
  if (!items) {
    console.log("  공고 목록을 찾지 못했어요. 저장된 파일을 열어 구조를 확인하세요.");
    return;
  }
  console.log(`  받은 공고 ${items.length}건`);
  summarize(items);
}

async function main() {
  if (!KEY) {
    console.error("DATA_GO_KR_KEY가 없어요. .env.example을 .env.local로 복사하고 인증키를 넣어 주세요.");
    process.exit(1);
  }
  const outDir = join(process.cwd(), "data", "raw");
  mkdirSync(outDir, { recursive: true });
  for (const src of SOURCES) {
    try {
      await explore(src, outDir);
    } catch (err) {
      console.log(`  호출 실패: ${(err as Error).message}`);
    }
  }
  console.log("\n끝. data/raw 폴더의 원본 파일을 공유해 주시면 변환 규칙을 같이 정할 수 있어요.");
}

main();
