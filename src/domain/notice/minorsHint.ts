// AI 태깅 전 공고에서 대상이 미성년자뿐인지 공고명으로 짐작한다 (태깅된 공고는 AI가 정한 minorsOnly를 쓴다)
// 이렇게 짐작한 공고는 아동·청소년 나이대로 본다: 어른 나이대로 찾을 때 교복·초중고·영유아 공고가 섞이지 않고, 아동·청소년으로 찾을 때 나온다
// Postgres 정규식(~)과 JS 정규식에서 똑같이 동작하는 문법만 쓴다
export const MINORS_TITLE = "초등|중학|고등학|고교|교복|학교 ?밖|청소년|아동|영유아|어린이|유치원|어린이집|유아";
// 어른이 받는 공고임을 드러내는 말이 함께 있으면 미성년자 공고로 보지 않는다 (예: "자립준비청년(보호종료아동)", "청년·청소년")
export const ADULT_TITLE = "청년|성인|어르신|노인|부모|보호자|가구|가정|양육|학부모|교사|교원|종사자|기관|시설|기업";

const minors = new RegExp(MINORS_TITLE);
const adult = new RegExp(ADULT_TITLE);

export function looksMinorsOnly(title: string): boolean {
  return minors.test(title) && !adult.test(title);
}
