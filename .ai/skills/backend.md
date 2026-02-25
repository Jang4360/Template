## 1. 활성화 조건
- 키워드: api, route, backend, server, transaction, supabase
- 의도: API Route 구현, 서버 로직 작성
- 작업 위치: `src/app/api/`, `src/lib/supabase/`
- 코드 패턴: 에러 처리, 인증 체크, 응답 포맷 통일

## 2. 필수 패턴
- 모든 API Route는 try/catch + 명확한 상태코드
- 인증 체크 후 비즈니스 로직 실행
- 서버 Supabase 클라이언트 사용

## 3. 보안 체크리스트
- [ ] 세션/권한 검사
- [ ] 입력값 검증
- [ ] 내부 오류 메시지 최소화
- [ ] RLS 정책 준수

## 4. 코드 템플릿
```ts
// src/app/api/example/route.ts
import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = getServerSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    // TODO: validate input

    const { data, error } = await supabase
      .from("table")
      .insert(body)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

```ts
// 트랜잭션 처리 패턴 (의사 코드)
// 1) 검증 2) 여러 테이블 변경 3) 실패 시 전체 롤백
```

## 5. 테스트 체크리스트
- [ ] 인증 실패 시 401
- [ ] 입력값 오류 시 400
- [ ] 성공 응답 포맷 일관성
- [ ] 예외 시 500 반환
