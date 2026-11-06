"use client";

// 자유 입력 검색창 (기획서 F01). 첫 화면에서는 크게, 결과 화면에서는 "다시 찾기"로 작게 쓴다
import { useState, type FormEvent } from "react";

interface SearchBoxProps {
  size: "large" | "compact";
  onSearch: (text: string) => void;
}

export default function SearchBox({ size, onSearch }: SearchBoxProps) {
  const [text, setText] = useState("");
  const large = size === "large";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim()) onSearch(text);
  };

  return (
    <form role="search" onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="situation" className="sr-only">
        내 상황
      </label>
      <input
        id="situation"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={large ? "예: 서울에서 카페 하는 32살인데 가게 인테리어 지원 있나요?" : "다른 상황으로 다시 찾기"}
        autoComplete="off"
        className={`min-h-11 flex-1 rounded-lg border border-line-strong bg-surface px-4 text-ink placeholder:text-muted focus:border-ink focus:outline-none ${
          large ? "py-4 text-lg" : "py-2"
        }`}
      />
      <button
        type="submit"
        className={`min-h-11 rounded-lg bg-ink px-5 font-semibold text-surface hover:bg-ink-2 ${large ? "py-4 text-lg" : "py-2"}`}
      >
        {large ? "지원사업 찾기" : "다시 찾기"}
      </button>
    </form>
  );
}
