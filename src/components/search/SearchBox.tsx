"use client";

// 자유 입력 검색창 (기획서 F01). 첫 화면에서는 크게, 결과 화면에서는 "다시 찾기"로 작게 쓴다
// 입력창과 버튼을 한 상자에 담아 하나의 동작으로 보이게 하고, 초점이 오면 상자 전체를 파랗게 강조한다
// 어디서든 "/" 키를 누르면 검색창으로 간다 (다른 입력칸에 글을 쓰는 중에는 그대로 "/"를 입력한다)
import { useEffect, useRef, useState, type FormEvent } from "react";

// 글을 쓰는 중인 곳이면 "/"를 가로채지 않는다
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

interface SearchBoxProps {
  size: "large" | "compact";
  onSearch: (text: string) => void;
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.75" />
      <path d="m13.25 13.25 3.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export default function SearchBox({ size, onSearch }: SearchBoxProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const large = size === "large";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim()) onSearch(text);
  };

  const clear = () => {
    setText("");
    inputRef.current?.focus();
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      // 첫 화면에서는 크게, 결과 화면에서는 작게. 같은 검색창이 크기만 바뀌므로 높이·모서리를 부드럽게 바꿔 위로 붙는 움직임과 이어지게 한다
      // 폭은 두 크기 모두 줄(부모) 폭을 따른다 (크기 방식이 다르면 전환 중 폭이 확 줄었다 늘어난다). 초점 링은 안쪽에 그려 화면 끝에서 잘리지 않게 한다
      className={`flex w-full min-w-0 flex-1 items-center bg-surface shadow-sm transition-[border-radius,padding,box-shadow] duration-500 motion-reduce:transition-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-inset ${
        large ? "rounded-lg p-1.5 pl-5 hover:shadow-md" : "rounded-md p-1 pl-3"
      }`}
    >
      <SearchIcon className={`shrink-0 text-muted ${large ? "size-5" : "size-4"}`} />
      <label htmlFor="situation" className="sr-only">
        내 상황
      </label>
      <input
        ref={inputRef}
        id="situation"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="지역, 나이, 하는 일"
        autoComplete="off"
        aria-keyshortcuts="/"
        // 브라우저 기본 지우기 버튼은 숨기고 아래의 버튼으로 통일한다
        className={`min-w-0 flex-1 bg-transparent text-ink transition-all duration-500 placeholder:text-muted focus:outline-none motion-reduce:transition-none [&::-webkit-search-cancel-button]:appearance-none ${
          large ? "h-12 px-3 text-lg" : "h-9 px-2"
        }`}
      />
      {/* 단축키 안내: 비어 있고 초점이 없을 때만, 키보드를 쓰는 넓은 화면에서만 */}
      {!text && !focused && (
        <kbd aria-hidden="true" className="mr-2 hidden shrink-0 rounded-sm bg-ground px-2 py-0.5 font-sans text-xs text-muted md:block">
          /
        </kbd>
      )}
      {text && (
        <button
          type="button"
          aria-label="입력 지우기"
          onClick={clear}
          className={`flex size-9 shrink-0 items-center justify-center text-lg leading-none text-muted hover:bg-ground hover:text-ink ${
            large ? "rounded-md" : "rounded-sm"
          }`}
        >
          ×
        </button>
      )}
      <button
        type="submit"
        className={`ml-1 shrink-0 whitespace-nowrap bg-primary font-semibold text-on-primary transition-all duration-500 hover:bg-primary-hover motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          large ? "h-12 rounded-md px-5 text-base sm:px-7 sm:text-lg" : "h-9 rounded-[6px] px-3 text-sm sm:px-4"
        }`}
      >
        {/* 좁은 화면에서는 "찾기"만 보여 입력창 자리를 넓힌다 */}
        <span className="hidden sm:inline">지원사업 </span>찾기
      </button>
    </form>
  );
}
