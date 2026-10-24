---
name: js-test-guidelines
description: JavaScript/TypeScript 테스트 작성 지침. 테스트 코드를 작성하거나 테스트 관련 질문이 있을 때 사용합니다.
---

# JavaScript/TypeScript 테스트 작성 지침

JavaScript 또는 TypeScript로 작성된 코드에 대한 테스트를 작성할 때 다음 지침을 따릅니다.

## 테스트 메시지 작성

1. **언어**: 테스트 메시지는 한국어로 작성합니다.

2. **명확성**: 테스트 메시지는 원인과 예상 결과를 모두 명확하게 설명합니다.
   ```typescript
   // 좋은 예
   it('유효하지 않은 이메일 형식을 입력하면 ValidationError를 반환합니다', ...)

   // 나쁜 예
   it('이메일 검증', ...)
   ```

3. **어조**: "-함"과 같은 단정적인 형태 대신 "-합니다"와 같은 서술적인 어조를 사용합니다.
   ```typescript
   // 좋은 예
   it('빈 배열을 전달하면 0을 반환합니다', ...)

   // 나쁜 예
   it('빈 배열 전달 시 0 반환함', ...)
   ```

## 테스트 구조

4. **파일 위치**: 테스트 파일은 구현 파일과 가까운 곳에 생성합니다.
   ```
   src/
   ├── user/
   │   ├── user.service.ts
   │   └── user.service.test.ts
   ```

5. **그룹화**: 예상 결과가 둘 이상의 조건에 의존하는 경우, `describe`를 사용하여 테스트를 계층적으로 구성합니다.
   ```typescript
   describe('UserService', () => {
     describe('createUser', () => {
       describe('유효한 입력이 주어졌을 때', () => {
         it('새 사용자를 생성합니다', ...)
       })

       describe('중복된 이메일이 주어졌을 때', () => {
         it('DuplicateEmailError를 던집니다', ...)
       })
     })
   })
   ```

6. **beforeEach 문서화**: `beforeEach`를 사용할 때는 역할을 설명하는 주석을 추가하고, 명확성을 높일 수 있다면 함수나 클래스로 추출합니다.
   ```typescript
   // 각 테스트 전에 인메모리 데이터베이스를 초기화하고 기본 사용자를 생성합니다
   beforeEach(async () => {
     await setupTestDatabase()
     defaultUser = await createDefaultUser()
   })
   ```

7. **반복 테스트**: 테스트 케이스 내에서 반복문 대신 `test.each`를 사용합니다.
   ```typescript
   test.each([
     ['apple', true],
     ['', false],
     ['   ', false],
   ])('입력값이 "%s"일 때 isValid는 %s를 반환합니다', (input, expected) => {
     expect(isValid(input)).toBe(expected)
   })
   ```

## 테스트 더블 (Stub/Mock)

8. **명명 규칙**: 스텁이나 목을 구현할 때 변수, 함수, 클래스 이름에 `Stub` 또는 `Mock`을 명시합니다.
   ```typescript
   const userRepositoryStub = { findById: () => defaultUser }
   const emailServiceMock = { send: jest.fn() }
   ```

9. **모킹 최소화**: 반드시 필요한 경우가 아니면 모킹을 피합니다. 모킹이 필수적이라면 그 이유를 주석으로 설명합니다.
   ```typescript
   // 외부 결제 API 호출을 모킹합니다: 실제 결제가 발생하는 것을 방지하고 테스트 속도를 높이기 위함
   const paymentGatewayMock = jest.fn().mockResolvedValue({ success: true })
   ```

## 테스트 원칙

10. **테스트 유형**: 주로 단위 테스트를 작성하되, 필요한 경우 통합 테스트를 작성합니다.

11. **테스트 용이성**: 테스트 대상이 테스트하기에 적합하지 않은 경우, 테스트 가능하도록 리팩터링하는 방법을 제안합니다.

12. **불필요한 데이터 금지**: 테스트에서 사용되지 않는 불필요한 데이터를 생성하지 않습니다.
    ```typescript
    // 좋은 예: 테스트에 필요한 속성만 포함
    const user = { email: 'test@example.com' }

    // 나쁜 예: 사용하지 않는 속성까지 포함
    const user = { id: 1, name: 'Test', email: 'test@example.com', age: 25, ... }
    ```

13. **공개 인터페이스 테스트**: 테스트는 SUT(Subject Under Test)의 내부 구현 변경이 아닌, 공개 인터페이스의 변경에 의해서만 실패하도록 작성합니다.
    ```typescript
    // 좋은 예: 공개 메서드의 결과를 검증
    expect(calculator.add(2, 3)).toBe(5)

    // 나쁜 예: 내부 구현을 검증
    expect(calculator._internalState).toBe(5)
    ```
