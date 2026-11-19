"use client";

// 상세 조건 입력: 포함·제외 단어와 전국 대상 제외. 조건 추가 창의 "자세히" 영역에 들어간다.
// 바꾸는 즉시 onChange로 알린다 (받아 둔 목록에서 거르므로 서버에 묻지 않는다)
import { useState, type FormEvent } from "react";
import { MAX_WORDS, normalizeWords, type DetailFilters } from "@/domain/search/detailFilters";

// 단어 목록 입력: 쓰고 Enter(또는 추가)로 담고, ×로 뺀다. 쉼표로 여러 단어를 한 번에 적어도 나눠 담는다
function WordField({
  id,
  label,
  hint,
  words,
  tone,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  words: string[];
  tone: "include" | "exclude";
  onChange: (words: string[]) => void;
}) {
  const [text, setText] = useState("");
  const full = words.length >= MAX_WORDS;

  const add = (event: FormEvent) => {
    event.preventDefault();
    onChange(normalizeWords([...words, ...text.split(",")]));
    setText("");
  };

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-sm font-semibold text-ink-2">{label}</legend>
      <form onSubmit={add} className="flex gap-2">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={full}
          placeholder={full ? `${MAX_WORDS}개까지 담을 수 있어요` : hint}
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-md bg-ground px-3 text-[15px] placeholder:text-muted focus:outline-2 focus:outline-primary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={full || !text.trim()}
          className="h-10 shrink-0 rounded-md bg-ground px-4 text-sm font-semibold text-ink-2 hover:bg-primary-tint hover:text-primary disabled:opacity-40"
        >
          추가
        </button>
      </form>
      {words.length > 0 && (
        <ul aria-label={`${label} 목록`} className="flex flex-wrap gap-1.5">
          {words.map((word) => (
            <li
              key={word}
              className={`flex items-center gap-1 rounded-md py-0.5 pl-3 text-sm motion-safe:animate-chip-in ${
                tone === "include" ? "bg-primary-tint text-primary" : "bg-ground text-ink-2"
              }`}
            >
              {word}
              <button
                type="button"
                aria-label={`${word} 빼기`}
                onClick={() => onChange(words.filter((w) => w !== word))}
                className="flex size-8 items-center justify-center rounded-md hover:opacity-70"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

export default function DetailFields({ details, onChange }: { details: DetailFilters; onChange: (next: DetailFilters) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <WordField
        id="detail-include"
        label="포함 단어"
        hint="예: 창업"
        words={details.include}
        tone="include"
        onChange={(include) => onChange({ ...details, include })}
      />
      <WordField
        id="detail-exclude"
        label="제외 단어"
        hint="예: 입찰"
        words={details.exclude}
        tone="exclude"
        onChange={(exclude) => onChange({ ...details, exclude })}
      />
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={details.localOnly}
          onChange={(e) => onChange({ ...details, localOnly: e.target.checked })}
          className="mt-0.5 size-5 shrink-0 accent-primary"
        />
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink-2">전국 대상 제외</span>
          <span className="text-[13px] text-muted">지역을 정해 둔 공고만 보여요</span>
        </span>
      </label>
    </div>
  );
}
