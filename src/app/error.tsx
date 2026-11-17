"use client";

// 페이지를 그리다 서버에서 오류가 났을 때 (DB 접속 실패 등). Next 기본 오류 화면 대신 다시 시도와 처음으로를 준다
// 오류 내용(error.message)은 사용자에게 보여 주지 않는다 (내부 정보가 담길 수 있다)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();

  return (
    <main className="mx-auto flex h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center supports-[height:100dvh]:h-dvh">
      <span aria-hidden="true" className="trim-line bg-primary" />
      <h1 className="text-xl font-bold tracking-tight">지원사업을 불러오지 못했어요</h1>
      <p className="text-[15px] text-ink-2">잠시 뒤 다시 시도해 주세요</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={retrying}
          // 서버에서 다시 받아 온 뒤 오류 화면을 걷어 낸다
          onClick={() =>
            startTransition(() => {
              router.refresh();
              reset();
            })
          }
          className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          {retrying ? "다시 불러오는 중" : "다시 시도"}
        </button>
        <Link href="/" className="flex min-h-11 items-center rounded-md bg-surface px-5 text-ink-2 hover:bg-primary-tint hover:text-primary">
          처음으로
        </Link>
      </div>
    </main>
  );
}
