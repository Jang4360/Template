## 1. 활성화 조건
- 키워드: frontend, component, UI, form, loading, error, empty
- 의도: 화면 구성, 상태 처리, 폼 처리
- 작업 위치: `src/domains/**/components`, `src/shared/components`, `src/app/`
- 코드 패턴: 서버 컴포넌트, 클라이언트 컴포넌트, Server Actions

## 2. 필수 패턴
- 서버 컴포넌트 우선, 필요 시만 `use client`
- 로딩/에러/빈 상태 명확히 구분
- 폼 처리: Server Actions 또는 API 호출 중 하나로 통일

## 3. 보안 체크리스트
- [ ] 클라이언트에서 민감 데이터 노출 금지
- [ ] 폼 입력값 검증
- [ ] 세션 의존 UI는 서버에서 판단
- [ ] 리다이렉트/쿼리 파라미터 검증

## 4. 코드 템플릿
```tsx
// 서버 컴포넌트 예시
export default async function Page() {
  // TODO: fetch data on server
  return <div>Content</div>;
}
```

```tsx
// 클라이언트 컴포넌트 예시
"use client";

import { useState } from "react";

export function FormClient() {
  const [loading, setLoading] = useState(false);
  return (
    <form>
      <button disabled={loading}>Submit</button>
    </form>
  );
}
```

## 5. 테스트 체크리스트
- [ ] 로딩/에러/빈 상태 렌더링 확인
- [ ] 서버/클라이언트 컴포넌트 분리 확인
- [ ] 폼 제출 성공/실패 처리
- [ ] 접근 권한에 따른 UI 차단
