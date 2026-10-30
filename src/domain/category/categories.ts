// 분류 4가지 (기획서 4장 분류 체계). supabase/rls.sql의 category 기본값과 같은 값이다.
// colorToken은 globals.css의 --cat-N-* 색 변수 이름
export const CATEGORIES = [
  { id: "C01", name: "개인 혜택", colorToken: "cat-1" },
  { id: "C02", name: "창업", colorToken: "cat-2" },
  { id: "C03", name: "기업·소상공인", colorToken: "cat-3" },
  { id: "C04", name: "공공사업", colorToken: "cat-4" },
] as const;

export type Category = (typeof CATEGORIES)[number];

// 알 수 없는 분류는 첫 번째 분류 색으로 표시한다
export function colorTokenOf(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.colorToken ?? CATEGORIES[0].colorToken;
}
