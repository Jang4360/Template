## Auth Flow Guide

### 개요
- Supabase Auth + Google OAuth 흐름을 따른다.
- 세션 관리와 미들웨어 보호가 기본이다.

### 인증 흐름
1. 클라이언트에서 OAuth 로그인 요청
2. `/api/auth/callback`에서 코드 교환
3. 세션 생성 후 보호 라우트 접근
4. RLS 정책과 연동된 데이터 접근

### 코드 예시
```ts
// src/app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/", req.url));

  const supabase = getServerSupabaseClient();
  await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL("/", req.url));
}
```

```ts
// src/middleware.ts (예시)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function middleware(req: NextRequest) {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}
```

### 주의사항
- OAuth 리다이렉트 URL 정확히 설정
- 세션 없는 상태에서 보호 라우트 접근 금지
- RLS 없이 데이터 접근 금지

### 자주 하는 실수
- callback에서 code 누락 처리 미흡
- 클라이언트에서 민감 데이터 노출
- 미들웨어 범위 과도/부족 설정
