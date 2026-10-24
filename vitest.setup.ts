// 모든 단위 테스트 전에 한 번 실행되는 셋업
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 각 테스트가 끝나면 렌더링한 화면을 지워 다음 테스트에 영향을 주지 않게 합니다
afterEach(() => {
  cleanup();
});
