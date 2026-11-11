// 단어 끝 받침에 맞는 조사를 붙인다 ("복직" → "복직은", "고양이" → "고양이는")
// 한글이 아닌 글자로 끝나면 받침을 알 수 없어 받침 없는 쪽을 쓴다

function hasFinalConsonant(word: string): boolean {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  // 한글 음절(가~힣)은 28개마다 받침 없는 글자가 온다
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

// josa("복직", "은", "는") → "은"
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  return hasFinalConsonant(word) ? withFinal : withoutFinal;
}
