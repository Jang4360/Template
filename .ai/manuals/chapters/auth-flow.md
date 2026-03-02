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

## RLS 구현 실전 가이드

### 테이블별 RLS 정책 작성 순서
1. `profiles` (사용자 기본 정보, owner 기준 정책)
2. `orders` (주문 소유자 기준 정책)
3. `payments` (결제 내역, 일반 사용자 읽기 제한적 허용)
4. 그 외 도메인 테이블 (`subscriptions`, `entitlements`, `billing_logs` 등)

순서를 고정하는 이유:
- 상위 식별 테이블(`profiles`)부터 정책을 안정화하면 하위 테이블 FK 정책 확장이 쉬움
- 결제/주문 계열은 잘못 열리면 직접 금전 손실로 이어지므로 뒤에서 별도 강화

### `auth.uid() IS NOT NULL` 패턴을 항상 쓰는 이유
- `auth.uid()`는 미인증 요청에서 `NULL`이 된다
- 비교식만 쓰면(`auth.uid() = user_id`) 의도치 않은 3값 논리 이슈를 만들기 쉽다
- 항상 아래 패턴으로 명시해 미인증 접근을 선제 차단한다

```sql
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id)
```

### 테이블별 4가지 operation 정책 예시

#### 1) profiles (id = auth user id)
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
```

#### 2) orders (user_id = owner)
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "orders_update_own"
  ON orders FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "orders_delete_own"
  ON orders FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
```

#### 3) payments (user_id = owner, 수정/삭제는 보수적으로 제한)
```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "payments_update_own_restricted"
  ON payments FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND status IN ('PENDING', 'DONE', 'FAILED', 'CANCELLED')
  );

CREATE POLICY "payments_delete_block"
  ON payments FOR DELETE
  USING (false);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
```

## RLS 디버깅 가이드

### RLS가 적용되지 않는 것처럼 보일 때 체크 포인트
- 대상 테이블에 `ENABLE ROW LEVEL SECURITY`가 실제 적용되었는지 확인
- SELECT만 있고 INSERT/UPDATE/DELETE 정책이 누락되지 않았는지 확인
- UPDATE 정책에 `WITH CHECK`가 누락되지 않았는지 확인
- policy 조건 컬럼에 인덱스가 없어 느려서 \"멈춘 것처럼\" 보이는지 확인
- 서버 코드가 `service_role` 클라이언트를 타고 있지 않은지 확인

### service_role 키 사용 여부 확인법
- 코드 검색: `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, `createClient(` 사용 경로 점검
- 클라이언트 번들/클라이언트 컴포넌트(`\"use client\"`)에서 service_role 참조가 있으면 즉시 수정
- Next.js 기준 `NEXT_PUBLIC_` prefix로 service_role이 노출되지 않았는지 확인

예시 점검 명령:
```bash
rg "SUPABASE_SERVICE_ROLE_KEY|service_role|NEXT_PUBLIC_.*SERVICE_ROLE" src .env*
```

### Supabase 대시보드에서 RLS 테스트하는 방법
1. SQL Editor에서 테스트 대상 레코드(본인/타인 user_id)를 준비한다
2. Table Editor 또는 API docs에서 anon/authenticated 시나리오로 조회/수정 시도
3. 기대 동작 확인:
   - 본인 데이터는 허용
   - 타인 데이터는 0 rows 또는 permission error
4. UPDATE 테스트에서 owner 컬럼 변경 시도가 차단되는지 확인 (`WITH CHECK` 검증)
5. 실패 케이스를 재현한 SQL과 policy를 함께 저장해 회귀 테스트 기준으로 사용

## anon key / service_role key 안전한 사용 패턴

### 클라이언트
- `createBrowserClient` + anon key 사용
- 사용자 JWT로 요청되어 RLS가 정상 적용됨

```ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 서버
- `createServerClient` + 사용자 세션(JWT) 기반 요청
- 서버에서도 사용자 컨텍스트라면 RLS가 그대로 적용됨

```ts
import { createServerClient } from "@supabase/ssr";
```

### 관리자 작업
- `service_role`은 서버에서만 사용, 최소 범위 작업(배치/정산/관리자 승인)에 한정
- 일반 API 핸들러 기본 경로는 `service_role`이 아닌 사용자 세션 기반 클라이언트를 우선 사용

### 절대 하면 안 되는 것
- 클라이언트 코드/브라우저 번들에서 `service_role` import
- `NEXT_PUBLIC_` 환경변수로 service_role 노출
- Edge Function/공용 API에서 service_role 클라이언트를 기본값으로 재사용
