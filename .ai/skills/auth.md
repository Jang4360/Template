## 1. 활성화 조건
- 키워드: auth, login, logout, session, OAuth, Google, Supabase Auth
- 의도: 로그인/로그아웃/세션/미들웨어 보호 구현
- 작업 위치: `src/domains/auth/`, `src/app/api/auth/`, `src/lib/supabase/`
- 코드 패턴: OAuth callback, 세션 검사, 보호 라우트

## 2. 필수 패턴
- Supabase Auth + Google OAuth 흐름 준수
- 미들웨어로 보호 라우트 접근 제어
- RLS 정책과 연동된 서버 세션 사용

## 3. 보안 체크리스트
- [ ] OAuth 리다이렉트 URL 검증
- [ ] 세션 기반 인증 체크
- [ ] RLS 적용된 테이블만 사용
- [ ] 환경변수에만 키 저장

## 4. 코드 템플릿
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
// src/app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return NextResponse.json({ session: data.session });
}
```

## 5. 테스트 체크리스트
- [ ] 로그인 성공 후 세션 생성
- [ ] 보호 라우트 차단 확인
- [ ] 로그아웃 후 세션 제거
- [ ] RLS 정책으로 접근 제한 확인
