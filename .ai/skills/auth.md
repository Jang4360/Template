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

### RLS 심화 가이드

#### JWT와 auth.uid() 원리
- `auth.uid()`는 내부적으로 `current_setting('request.jwt.claim.sub')`를 참조한다
- 이 값은 REST API 요청 시작 시 PostgREST가 자동으로 설정한다
- RLS는 애플리케이션 변수가 아니라 DB 세션 설정값 기반으로 동작한다
- PostgREST는 JWT claim을 `current_setting('request.jwt.claims', true)::json->>...`로 읽는다

#### anon key vs service_role key 경계
- service_role 키는 서버에서만 사용, RLS를 우회하는 강한 권한을 가짐
- 인증된 사용자 요청은 JWT 기반으로 RLS가 적용됨
- 반드시 확인: 브라우저 번들, 클라이언트 컴포넌트, Edge Function에서 service_role이 import되는 경로가 존재하지 않는지 체크
- 클라이언트 코드에서 `SUPABASE_SERVICE_ROLE_KEY`를 참조하면 즉시 보안 위반

#### RLS 정책 작성 필수 규칙
1. 모든 테이블에 RLS를 활성화한다 (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
2. 4가지 operation(SELECT, INSERT, UPDATE, DELETE) 각각에 정책을 명시한다
3. UPDATE 정책에는 반드시 `WITH CHECK` 절을 포함한다
4. 정책 조건에 사용되는 컬럼(예: user_id)에는 반드시 인덱스를 건다
5. `auth.uid()`가 null인 케이스(미인증)를 항상 고려한다
6. Security Definer 함수가 RLS를 우회하지 않도록 함수 설계 규칙을 적용한다

#### 놓치기 쉬운 RLS 취약점 체크리스트
코드 리뷰 시 반드시 확인:

- [ ] UPDATE 정책에 WITH CHECK 누락 여부
  → 누락 시 사용자가 user_id(owner)를 바꿔치기 가능
  → 예: `WITH CHECK (auth.uid() = user_id)` 반드시 포함

- [ ] DELETE 정책 존재 여부
  → 누락 시 개발 중엔 동작하다가 운영에서 삭제 안 되는 장애 발생

- [ ] SELECT만 열고 INSERT/UPDATE가 막힌 케이스
  → 클라이언트에서 쓰기 작업이 갑자기 실패하는 원인

- [ ] role override 범위 확인
  → support 역할이 모든 데이터를 수정 가능하면 안 됨

- [ ] RLS 조건 컬럼 인덱스 존재 여부
  → 인덱스 없으면 정책 조건이 full scan 유발 → 비용/지연/DoS 취약

- [ ] auth.uid() null 케이스 처리
  → 미인증 상태에서 `auth.uid() = user_id`가 null = null로 평가되면서 의도치 않은 결과 발생
  → `auth.uid() IS NOT NULL AND auth.uid() = user_id` 패턴 권장

- [ ] Security Definer 함수 우회 여부
  → security definer 함수 내부에서 RLS를 무시하는 쿼리가 있으면 우회 통로가 됨
  → 함수 내부에서도 `auth.uid()` 기반 필터를 명시적으로 적용

#### RLS 정책 코드 템플릿
```sql
-- 올바른 RLS 정책 예시 (profiles 테이블)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인만
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- INSERT: 본인만 (회원가입 시)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

-- UPDATE: 본인만 + owner 변경 불가
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);
  -- WITH CHECK가 없으면 user가 id를 다른 값으로 바꿔치기 가능!

-- DELETE: 본인만 (또는 비허용)
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- 조건 컬럼 인덱스 (RLS 성능)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
```

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
