"use client";

// 자유 입력 검색창 (기획서 F01). 첫 화면에서는 크게, 결과 화면에서는 "다시 찾기"로 작게 쓴다
// 입력창과 버튼을 한 상자에 담아 하나의 동작으로 보이게 하고, 초점이 오면 상자 전체를 파랗게 강조한다
import { useRef, useState, type FormEvent } from "react";

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
  const large = size === "large";

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
      // 첫 화면 검색창만 더 둥글게 강조한다 (디자인 시스템 라운드 단계의 예외). 안쪽 버튼은 바깥 20px에서 여백 6px을 뺀 14px로 곡선을 맞춘다
      className={`flex min-w-0 items-center border border-line-strong bg-surface transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 ${
        large ? "w-full rounded-[20px] p-1.5 pl-5 shadow-sm hover:shadow-md" : "flex-1 rounded-lg p-1 pl-3"
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
        placeholder={large ? "지역, 나이, 하는 일을 적어 주세요" : "다른 상황으로 다시 찾기"}
        autoComplete="off"
        // 브라우저 기본 지우기 버튼은 숨기고 아래의 버튼으로 통일한다
        className={`min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:appearance-none ${
          large ? "h-12 px-3 text-lg" : "h-9 px-2"
        }`}
      />
      {text && (
        <button
          type="button"
          aria-label="입력 지우기"
          onClick={clear}
          className={`flex size-9 shrink-0 items-center justify-center text-lg leading-none text-muted hover:bg-ground hover:text-ink ${
            large ? "rounded-full" : "rounded-sm"
          }`}
        >
          ×
        </button>
      )}
      <button
        type="submit"
        className={`ml-1 shrink-0 whitespace-nowrap bg-primary font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          large ? "h-12 rounded-[14px] px-5 text-base sm:px-7 sm:text-lg" : "h-9 rounded-md px-3 text-sm sm:px-4"
        }`}
      >
        {/* 좁은 화면에서는 "찾기"만 보여 입력창 자리를 넓힌다 */}
        <span className="hidden sm:inline">{large ? "지원사업 " : "다시 "}</span>찾기
      </button>
    </form>
  );
}
