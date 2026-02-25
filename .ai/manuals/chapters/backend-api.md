## Backend API Guide

### 개요
- API Route는 `src/app/api/` 하위 도메인별로 구성한다.
- 서버 Supabase 클라이언트를 사용하고, 인증 후 로직을 수행한다.

### 표준 처리 흐름
1. 입력값 파싱 및 검증
2. 세션/권한 체크
3. 비즈니스 로직 수행
4. 일관된 응답 반환

### 코드 예시
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
    // TODO: validate body

    const { data, error } = await supabase
      .from("items")
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

### 주의사항
- 인증/권한 체크 누락 금지
- 입력값 검증 없이 DB 작업 금지
- 에러 메시지에 내부 정보 노출 금지

### 자주 하는 실수
- 클라이언트 Supabase를 서버에서 사용
- try/catch 누락으로 500 처리 불가
- RLS 정책을 무시한 접근 설계
