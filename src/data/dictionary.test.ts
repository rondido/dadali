import { describe, expect, it } from "vitest";
import { interpretQuery } from "@/domain/search/interpretQuery";
import { DISTRICTS } from "@/domain/search/districts";
import { DICTIONARY } from "./dictionary";

const read = (text: string) => interpretQuery(text, DICTIONARY);

describe("해석 사전", () => {
  it("시·군·구 이름을 시·도와 시·군·구 조건으로 바꿉니다 (시·군·구를 붙여도, 떼어도)", () => {
    expect(read("수원에서 치킨집").conditions).toMatchObject({ region: "41", district: "수원시", biz: "retail" });
    expect(read("마포구 청년 월세").conditions).toMatchObject({
      region: "11",
      district: "마포구",
      age: "youth",
      topics: ["house"],
    });
    expect(read("서울특별시 마포구").conditions).toMatchObject({ region: "11", district: "마포구" });
    expect(read("망원동 카페").conditions).toMatchObject({ region: "11", district: "마포구" });
    expect(read("서울 청년").conditions.district).toBeNull();
    expect(read("해운대 카페 창업").conditions).toMatchObject({ region: "26", biz: "retail", topics: ["startup"] });
    expect(read("고양시 어르신 일자리").conditions).toMatchObject({ region: "41", age: "senior", topics: ["job"] });
    expect(read("군위군").conditions.region).toBe("27");
  });

  it("여러 시·도에 있는 이름은 첫 번째로 찾고 다른 후보를 띄웁니다", () => {
    const result = read("중구 식당");

    expect(result.conditions.region).toBe("11");
    expect(result.regionChoices).toEqual(["11", "26", "27", "28", "30", "31"]);
    expect(read("강서구").regionChoices).toEqual(["11", "26"]);
  });

  it("시·도를 함께 적으면 그 시·도의 시·군·구로 정합니다 (앞에 적어도, 뒤에 적어도)", () => {
    for (const text of ["부산 중구", "중구 부산"]) {
      const result = read(text);
      expect(result.conditions, text).toMatchObject({ region: "26", district: "중구" });
      expect(result.regionChoices, text).toEqual([]);
    }
  });

  it("지명과 같은 흔한 낱말은 지역으로 보지 않습니다", () => {
    for (const text of ["고양이 좋아요", "이천만원 대출", "연수 프로그램", "고령자 일자리", "공주 옷", "진도 관리"]) {
      expect(read(text).conditions.region, text).toBeNull();
    }
    expect(read("고령자 일자리").conditions).toMatchObject({ age: "senior", topics: ["job"] });
    expect(read("연수 프로그램").conditions.topics).toEqual(["edu"]);
  });

  it("비슷한 말을 같은 조건으로 묶습니다", () => {
    expect(read("빵집 운영").conditions.biz).toBe("retail");
    expect(read("웹툰 작가").conditions.biz).toBe("culture");
    expect(read("스마트팜 귀어").conditions.biz).toBe("agri");
    expect(read("보증금 지원").conditions.topics).toEqual(["house"]);
    expect(read("인건비 채용").conditions.topics).toEqual(["job"]);
    expect(read("박람회 참가").conditions.topics).toEqual(["market"]);
  });

  it("아이·학생을 가리키는 말은 아동·청소년 나이대로 봅니다", () => {
    for (const text of ["청소년 장학금", "초등학생 돌봄", "고등학생 교복", "자녀 교육비", "영유아 보육", "아동수당"]) {
      expect(read(text).conditions.age, text).toBe("child");
    }
  });

  it("아동·청소년 말과 앞부분이 같은 낱말은 나이로 보지 않습니다 (아이디어, 대학생)", () => {
    expect(read("아이디어 창업").conditions.age).toBeNull();
    expect(read("대학생 장학금").conditions.age).toBe("youth");
  });

  it("질문형 문장과 흔한 오타는 못 알아들은 단어로 남기지 않습니다", () => {
    for (const text of ["Q. 어르신들이 받을 수 잇는 혜택은?", "청년이 받을수 있는지 알려주세요"]) {
      const result = read(text);
      expect(result.conditions.age, text).not.toBeNull();
      expect(result.unknownTerms, text).toEqual([]);
    }
  });

  it("더 긴 사전 단어를 먼저 고릅니다 (스마트스토어는 디지털이 아니라 도소매)", () => {
    expect(read("스마트스토어").conditions).toMatchObject({ biz: "retail", topics: [] });
    expect(read("보증금").conditions.topics).toEqual(["house"]);
  });

  it("시·도마다 시·군·구가 빠짐없이 있습니다 (세종 제외)", () => {
    const counts = Object.fromEntries(Object.entries(DISTRICTS).map(([code, names]) => [code, names.length]));

    expect(counts).toEqual({
      "11": 25, "26": 16, "27": 9, "28": 13, "29": 5, "30": 5, "31": 5, "36": 0, "41": 31,
      "51": 18, "43": 11, "44": 15, "52": 14, "46": 22, "47": 22, "48": 18, "50": 2,
    });
  });

  it("한 단어가 서로 다른 종류로 겹치는 것은 귀농뿐입니다 (하는 일 농림어업 + 주제 창업)", () => {
    const kinds = new Map<string, Set<string>>();
    for (const { term, kind } of DICTIONARY) kinds.set(term, (kinds.get(term) ?? new Set()).add(kind));

    expect([...kinds].filter(([, k]) => k.size > 1).map(([term]) => term)).toEqual(["귀농"]);
  });
});


describe("대상(가구 상황) 낱말", () => {
  it.each([
    ["출산", "parent"],
    ["육아휴직", "parent"],
    ["장애인", "disabled"],
    ["기초생활수급자", "lowincome"],
    ["차상위", "lowincome"],
    ["한부모", "singleparent"],
    ["다자녀", "multichild"],
    ["국가유공자", "veteran"],
    ["다문화", "multicultural"],
  ])("%s → %s", (text, target) => {
    expect(interpretQuery(text, DICTIONARY).conditions.target).toBe(target);
  });

  it("다른 조건과 함께 씁니다", () => {
    const { conditions, unknownTerms } = interpretQuery("장애인 월세", DICTIONARY);
    expect(conditions).toMatchObject({ target: "disabled", topics: ["house"] });
    expect(unknownTerms).toEqual([]);
  });

  it("다자녀는 자녀(아동·청소년)로 읽지 않습니다", () => {
    expect(interpretQuery("다자녀", DICTIONARY).conditions.age).toBeNull();
  });
});
