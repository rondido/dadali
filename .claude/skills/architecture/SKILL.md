---
name: architecture-guidelines
description: 코드 계층 분리 가이드 (도메인 로직 vs 뷰 로직, Repository 패턴, API Client 분리). Use when creating new features, refactoring code, moving logic between files, or when the user mentions architecture, layer separation, domain logic, repository, or refactoring.
---

# 아키텍처 가이드라인

toodoori 프로젝트의 코드 계층 분리 원칙입니다.

## 로직 위치 결정 규칙

새 로직을 작성할 때, 다음 순서로 질문하여 위치를 결정합니다.

### 질문 1: 순수 API 호출인가?

**조건**: fetch/axios로 서버에 요청을 보내고 응답을 받는 함수

**위치**: `src/api/[entity]Api.ts`

**예시**:

```typescript
// src/api/taskApi.ts
export async function moveTask(
  projectId: string,
  taskNumber: number,
  data: MoveTaskRequest
): Promise<MoveTaskResponse> {
  return apiRequest<MoveTaskResponse>(API_ENDPOINTS.TASKS.MOVE(projectId, taskNumber), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
```

**특징**:

- React 의존성 없음
- 캐시 로직 없음
- 순수 HTTP 요청만 수행

### 질문 2: React Query 캐시 관리인가?

**조건**: useQuery, useMutation을 사용하고 캐시 무효화(invalidateQueries)를 수행

**위치**: `src/repositories/[entity]Repository.ts`

**예시**:

```typescript
// src/repositories/taskRepository.ts
export function useTaskMove(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskNumber, moveData }) => moveTask(projectId, taskNumber, moveData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(projectId, variables.taskNumber) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) });
    },
  });
}
```

**특징**:

- API 함수를 import하여 사용
- 캐시 키 관리
- 성공/실패 시 캐시 전략

### 질문 3: 뷰를 바꿔도 이 로직이 필요한가?

**조건**: 칸반 뷰를 리스트 뷰, 캘린더 뷰, 타임라인 뷰로 바꿔도 반드시 존재해야 하는 로직

**위치**: `src/domain/[entity]/[logicName].ts`

**이 조건에 해당하는 로직 예시**:

- WIP 제한 검사 (어떤 뷰든 스테이지에 작업 추가 시 필요)
- 작업 정렬 규칙 (priority, dueDate 등)
- 스테이지 이동 유효성 (같은 스테이지로 이동 불가)
- 우선순위 기본값 처리

**예시**:

```typescript
// src/domain/task/wipChecker.ts
export interface WipCheckResult {
  allowed: boolean;
  warning: boolean;
  exceeded: boolean;
  message?: string;
}

export function checkWipLimit(
  stage: { wipEnabled?: boolean; wipLimit?: number | null; wipMode?: 'soft' | 'hard' },
  currentCount: number
): WipCheckResult {
  if (!stage.wipEnabled || stage.wipLimit === null || stage.wipLimit === undefined) {
    return { allowed: true, warning: false, exceeded: false };
  }
  const exceeded = currentCount >= stage.wipLimit;
  if (exceeded) {
    return {
      allowed: stage.wipMode === 'soft',
      warning: true,
      exceeded: true,
      message: `WIP 제한 ${stage.wipLimit}개를 초과했습니다 (현재: ${currentCount}개)`,
    };
  }
  return { allowed: true, warning: false, exceeded: false };
}
```

**특징**:

- React 의존성 없음 (순수 함수)
- Node.js에서 단독 실행 가능

**필수**: 도메인 로직은 반드시 단위 테스트와 함께 작성해야 합니다. 테스트 작성 방법은 `js-test-guidelines` 스킬을 참조하세요.

### 질문 4: 특정 뷰에서만 의미 있는 로직인가?

**조건**: "칸반", "리스트", "캘린더" 등 특정 뷰의 이름을 알아야 하는 로직

**위치**: `src/hooks/[view-name]/[hookName].ts`

**이 조건에 해당하는 로직 예시**:

- 드래그 앤 드롭 처리 (칸반 전용)
- `stage-{id}` 문자열 파싱 (칸반 전용)
- 완료 시 파티클/햅틱 효과 (칸반 전용)
- 컬럼 반응형 레이아웃 (칸반 전용)

**예시**:

```typescript
// src/hooks/kanban/useDragDrop.ts
export function useKanbanDragDrop(projectId: string) {
  const taskMove = useTaskMove(projectId);

  const parseDropTarget = (overId: string): number | null => {
    const match = overId.toString().match(/^stage-(\d+)$/);
    return match ? parseInt(match[1]) : null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const targetStageId = parseDropTarget(event.over?.id);
    // 드래그 종료 처리
  };

  return { handleDragStart, handleDragEnd };
}
```

**특징**:

- 뷰 이름이 폴더/파일명에 포함
- 해당 뷰에서만 import

### 질문 5: 위 조건에 해당하지 않으면?

**위치**: `src/components/` 또는 `src/pages/`

**특징**:

- 순수 렌더링
- 이벤트 핸들러 바인딩 (로직은 훅에 위임)
- Props 전달

## 금지 사항

### 1. Component 내 도메인 로직 작성 금지

다음 로직은 컴포넌트 파일에 직접 작성하면 안 됩니다:

- WIP 제한 검사
- 정렬 로직
- 유효성 검증
- 상태 전이 규칙

**잘못된 예시** (하지 말 것):

```typescript
// src/pages/project-detail/index.tsx 내부
const handleDragEnd = event => {
  // ❌ 50줄의 WIP 검사, 유효성 검증 로직이 여기에 있으면 안 됨
  if (wipEnabled && currentCount >= wipLimit) {
    if (wipMode === 'hard') {
      toast.error('WIP 제한 초과');
      return;
    }
  }
};
```

**올바른 예시**:

```typescript
// src/pages/project-detail/index.tsx
const { handleDragEnd } = useKanbanDragDrop(projectId);
return <DndContext onDragEnd={handleDragEnd}><KanbanBoard /></DndContext>;
```

### 2. API 파일에 캐시 로직 작성 금지

`src/api/` (또는 현재 `src/services/`) 파일에 React Query 로직을 넣으면 안 됩니다.

### 3. Repository에 뷰 로직 작성 금지

파티클 효과, 토스트, 햅틱 등 UI 피드백은 Repository에 넣으면 안 됩니다.

## 현재 코드와 제안 구조 매핑

| 현재 파일                            | 실제 역할                  | 제안 위치                            |
| ------------------------------------ | -------------------------- | ------------------------------------ |
| `src/services/task.ts`               | API 호출                   | `src/api/taskApi.ts`                 |
| `src/hooks/useTaskMove.ts`           | React Query 래핑           | `src/repositories/taskRepository.ts` |
| `src/hooks/useWindowWidth.ts`        | UI 상태                    | `src/hooks/ui/useWindowWidth.ts`     |
| `src/utils/task-sort.ts`             | 도메인 로직                | `src/domain/task/taskSorter.ts`      |
| `ProjectDetailPage 내 handleDragEnd` | 뷰 로직 + 도메인 로직 혼재 | 분리 필요                            |

## 마이그레이션 우선순위

1. **새 코드**: 이 가이드라인 따르기
2. **기존 코드**: 리팩토링 요청 시 점진적으로 이동
3. **import 경로**: tsconfig paths로 하위 호환 유지

## 테스트 요구사항

| 계층            | 테스트 방식                  |
| --------------- | ---------------------------- |
| `domain/`       | 필수 - 순수 함수 단위 테스트 |
| `repositories/` | 선택 - React Query 모킹      |
| `hooks/[view]/` | 선택 - React Testing Library |
| `api/`          | 선택 - MSW 모킹              |
