import { describe, expect, it, test } from "vitest";
import { interpretQuery, type DictionaryEntry } from "./interpretQuery";

// 테스트에 쓰는 단어만 담은 작은 사전입니다
const DICTIONARY: DictionaryEntry[] = [
  { term: "서울", kind: "region", value: "11" },
  { term: "부산", kind: "region", value: "26" },
  { term: "망원동", kind: "region", value: "11" },
  { term: "광주", kind: "region", value: "29", ambiguousWith: ["41"] },
  { term: "광주광역시", kind: "region", value: "29" },
  { term: "청년", kind: "age", value: "youth" },
  { term: "카페", kind: "industry", value: "retail" },
  { term: "귀농", kind: "industry", value: "agri" },
  { term: "귀농", kind: "topic", value: "startup" },
  { term: "창업", kind: "topic", value: "startup" },
  { term: "인테리어", kind: "topic", value: "facility" },
  { term: "대출", kind: "topic", value: "fund" },
];

describe("interpretQuery", () => {
  it("기획서 대표 시나리오 문장에서 지역·나이대·하는 일·관심 주제를 모두 찾습니다", () => {
    const result = interpretQuery("서울에서 카페 하는 32살인데 가게 인테리어 지원 있나요?", DICTIONARY);

    expect(result).toEqual({
      conditions: { region: "11", age: "youth", biz: "retail", topics: ["facility"] },
      regionChoices: [],
      unknownTerms: [],
    });
  });

  it("짧은 문장은 찾은 조건만 채우고 나머지는 비워 둡니다", () => {
    const result = interpretQuery("창업 지원금", DICTIONARY);

    expect(result.conditions).toEqual({ region: null, age: null, biz: null, topics: ["startup"] });
  });

  it("동 이름은 그 동이 속한 시·도로 바꿉니다", () => {
    expect(interpretQuery("망원동 청년", DICTIONARY).conditions.region).toBe("11");
  });

  it("한 단어가 하는 일과 관심 주제 둘 다에 해당하면 둘 다 채웁니다", () => {
    const { conditions } = interpretQuery("귀농 준비", DICTIONARY);

    expect(conditions).toMatchObject({ biz: "agri", topics: ["startup"] });
  });

  it("같은 관심 주제가 여러 번 나와도 한 번만 넣습니다", () => {
    expect(interpretQuery("창업 창업자 대출", DICTIONARY).conditions.topics).toEqual(["startup", "fund"]);
  });

  describe("나이", () => {
    test.each([
      ["32살", "youth"],
      ["45세", "middle"],
      ["70살", "senior"],
      ["40대", "middle"],
      ["20대", "youth"],
    ])('"%s"는 %s 나이대로 바꿉니다', (text, expected) => {
      expect(interpretQuery(text, DICTIONARY).conditions.age).toBe(expected);
    });

    it("숫자로 적은 나이가 나이대 단어보다 먼저입니다", () => {
      expect(interpretQuery("청년인데 45살", DICTIONARY).conditions.age).toBe("middle");
    });
  });

  describe("지역 후보", () => {
    it("뜻이 둘인 지명은 첫 번째 뜻으로 찾고 두 후보를 모두 고를 수 있게 합니다", () => {
      const result = interpretQuery("광주에서 창업", DICTIONARY);

      expect(result.conditions.region).toBe("29");
      expect(result.regionChoices).toEqual(["29", "41"]);
    });

    it("더 긴 사전 단어가 맞으면 그 단어를 써서 후보를 묻지 않습니다", () => {
      const result = interpretQuery("광주광역시 카페", DICTIONARY);

      expect(result.conditions.region).toBe("29");
      expect(result.regionChoices).toEqual([]);
    });

    it("지역이 둘 이상 나오면 첫 번째만 쓰고 나머지는 후보로 둡니다", () => {
      const result = interpretQuery("서울이나 부산", DICTIONARY);

      expect(result.conditions.region).toBe("11");
      expect(result.regionChoices).toEqual(["26"]);
    });
  });

  describe("못 알아들은 단어", () => {
    it("사전에 없는 단어는 조사를 떼고 모읍니다", () => {
      expect(interpretQuery("복직을 준비하는 엄마", DICTIONARY).unknownTerms).toEqual(["복직", "엄마"]);
    });

    test.each([
      ["고양이", "고양이"],
      ["고양이가", "고양이"],
      ["휴가", "휴가"],
    ])('"%s"는 이름 끝 글자를 조사로 잘못 떼지 않고 "%s"로 모읍니다', (word, expected) => {
      expect(interpretQuery(word, DICTIONARY).unknownTerms).toEqual([expected]);
    });

    it("지원·있나요 같은 흔한 말과 한 글자 단어는 모으지 않습니다", () => {
      expect(interpretQuery("지원 있나요 꼭", DICTIONARY).unknownTerms).toEqual([]);
    });
  });
});
