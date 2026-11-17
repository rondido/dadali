// 사라지는 애니메이션을 보여 준 뒤에 실제로 지우기 위한 도우미.
// 시간은 globals.css의 *-out 애니메이션(약 200ms)과 맞춘다. 움직임 줄이기 설정이면 기다리지 않고 바로 지운다

export const LEAVE_MS = 200;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// 사라지는 시간만큼 기다렸다가 done을 부른다. 취소 함수를 돌려준다
export function afterLeave(done: () => void): () => void {
  if (prefersReducedMotion()) {
    done();
    return () => {};
  }
  const timer = setTimeout(done, LEAVE_MS);
  return () => clearTimeout(timer);
}
