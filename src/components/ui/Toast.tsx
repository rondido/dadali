"use client";

// 토스트: 방금 한 일을 짧게 알리고, 필요하면 되돌리기 같은 동작 하나를 붙인다.
// 화면 아래 가운데에 하나만 띄우고(새 토스트가 오면 바꾼다) 잠시 뒤 사라진다. 화면 낭독기에는 role="status"로 읽힌다
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const DURATION_MS = 4000;
// 사라지는 애니메이션 시간 (globals.css의 toast-out과 맞춘다)
const LEAVE_MS = 220;

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  message: string;
  action?: ToastAction;
}

interface ToastItem extends ToastOptions {
  id: number;
  leaving: boolean; // 사라지는 중
}

const ToastContext = createContext<(options: ToastOptions) => void>(() => {});

// 토스트를 띄우는 함수. ToastProvider 밖에서 부르면 아무 일도 하지 않는다
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const nextId = useRef(0);

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1;
    setToast({ ...options, id: nextId.current, leaving: false });
  }, []);

  // 바로 지우지 않고 사라지는 애니메이션을 보여 준 뒤 지운다
  const dismiss = useCallback(() => setToast((current) => (current ? { ...current, leaving: true } : current)), []);

  // 띄운 뒤 잠시 지나면 사라지기 시작하고, 사라지는 애니메이션이 끝나면 지운다. 새 토스트가 오면 시간을 다시 잰다
  // (움직임 줄이기 설정이면 애니메이션 없이 같은 시간 뒤에 지운다)
  useEffect(() => {
    if (!toast) return;
    const timer = toast.leaving ? setTimeout(() => setToast(null), LEAVE_MS) : setTimeout(dismiss, DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            className={`pointer-events-auto flex min-h-12 max-w-md items-center gap-4 rounded-lg bg-ink py-2 pl-5 text-[15px] text-white shadow-xl ${
              toast.leaving ? "motion-safe:animate-toast-out" : "motion-safe:animate-toast-in"
            } ${toast.action ? "pr-2" : "pr-5"}`}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss();
                }}
                className="min-h-9 shrink-0 rounded-md px-3 text-sm font-semibold text-[#93b4ff] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
